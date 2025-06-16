// src/SentimentTile.jsx
import React, { useState, useEffect, useMemo } from 'react';
import Sentiment from 'sentiment';

// Creates the analyzer instance used by the component
const sentimentAnalyzer = new Sentiment();

export default function SentimentTile({ diary, reviews }) {
  const [sentiment, setSentiment] = useState(null);

  const commentKey = useMemo(() => {
    if (!diary || diary.length === 0) return null;
    const keys = Object.keys(diary[0] || {});
    return keys.find(k => /comment|entry|notes|text|review/i.test(k));
  }, [diary]);

  const reviewKey = useMemo(() => {
    if (!reviews || reviews.length === 0) return null;
    const keys = Object.keys(reviews[0] || {});
    return keys.find(k => /review|text/i.test(k));
  }, [reviews]);

  // This hook performs the final, scaled "Average Intensity" calculation.
  useEffect(() => {
    if (!commentKey && !reviewKey) {
      setSentiment(0);
      return;
    }

    const textBlob = [
      diary.map(d => d[commentKey] || '').join(' '),
      reviews.map(r => r[reviewKey] || '').join(' ')
    ].join(' ');

    const result = sentimentAnalyzer.analyze(textBlob);
    const totalScore = result.score;
    const scoredWordsCount = result.positive.length + result.negative.length;

    // 1. Calculate the "intensity" score. This can be outside the -1 to 1 range.
    let intensityScore = 0;
    if (scoredWordsCount > 0) {
      intensityScore = totalScore / scoredWordsCount;
    }

    // 2. NEW: Scale the score to fit the [-1, 1] range, since the max word score is 5.
    const scaledScore = intensityScore / 5.0;

    // 3. Normalize the scaled score as a final safety check and set the state.
    const normalizedScore = Math.max(-1, Math.min(1, scaledScore));
    setSentiment(normalizedScore);

  }, [diary, reviews, commentKey, reviewKey]);


  // The rendering logic below does not need to change.
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

      <div style={{ fontSize: '1rem', color: '#333' }}>{descriptor}</div>

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