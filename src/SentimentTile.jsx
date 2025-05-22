// src/SentimentTile.jsx
import React, { useState, useEffect, useMemo } from 'react';
import Sentiment from 'sentiment';

// install once: npm install sentiment
const sentimentAnalyzer = new Sentiment();

export default function SentimentTile({ diary, reviews }) {
  const [sentiment, setSentiment] = useState(null);

  // pick text fields
  const commentKey = useMemo(() => {
    const keys = Object.keys(diary[0] || {});
    return keys.find(k => /comment|entry|notes|text|review/i.test(k));
  }, [diary]);

  const reviewKey = useMemo(() => {
    const keys = Object.keys(reviews[0] || {});
    return keys.find(k => /review|text/i.test(k));
  }, [reviews]);

  useEffect(() => {
    if (!commentKey && !reviewKey) {
      setSentiment(0);
      return;
    }

    const textBlob = [
      diary.map(d => d[commentKey] || '').join(' '),
      reviews.map(r => r[reviewKey] || '').join(' ')
    ].join(' ');

    fetch('https://sentim-api.herokuapp.com/api/v1/', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: textBlob })
    })
      .then(r => r.json())
      .then(data => {
        const p = data.result?.polarity;
        if (typeof p === 'number') setSentiment(p);
        else throw new Error('Bad API response');
      })
      .catch(() => {
        const result = sentimentAnalyzer.analyze(textBlob);
        const norm = Math.max(-1, Math.min(1, result.comparative));
        setSentiment(norm);
      });
  }, [diary, reviews, commentKey, reviewKey]);

  if (sentiment === null) {
    return (
      <div
        className="chart-card"
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', gap: '24px' }}
      >
        <h2 style={{ margin: 0, alignSelf: 'flex-start' }}>Average Mood</h2>
        <p style={{ color: '#666' }}>Analyzing…</p>
      </div>
    );
  }

  // compute values
  const percent = Math.round((sentiment + 1) * 50);
  const radius = 60;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - percent / 100);
  const color = sentiment >= 0 ? '#4caf50' : '#f44336';

  let descriptor;
  if (sentiment > 0.1) descriptor = 'Overall Positive';
  else if (sentiment < -0.1) descriptor = 'Overall Negative';
  else descriptor = 'Overall Neutral';

  return (
    <div
      className="chart-card"
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', gap: '24px' }}
    >
      <h2 style={{ margin: 0, alignSelf: 'flex-start' }}>Average Mood</h2>

      {/* Larger Gauge */}
      <svg width={140} height={140} style={{ marginTop: '8px' }}>
        <circle cx={70} cy={70} r={radius} fill="none" stroke="#eee" strokeWidth={14} />
        <circle
          cx={70}
          cy={70}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={14}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform="rotate(-90 70 70)"
        />
        <text x={70} y={80} textAnchor="middle" fontSize="18" fontWeight="bold" fill={color}>
          {percent}%
        </text>
      </svg>

      {/* Descriptor */}
      <div style={{ fontSize: '1rem', color: '#333' }}>{descriptor}</div>

      {/* Key */}
      <div
        style={{
          fontSize: '0.85rem',
          color: '#555',
          textAlign: 'center',
          lineHeight: 1.6,
          marginBottom: '16px',
          maxWidth: '80%'
        }}
      >
        0% = most negative • 50% = neutral • 100% = most positive
      </div>
    </div>
  );
}
