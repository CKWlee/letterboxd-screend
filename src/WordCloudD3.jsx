// src/WordCloudD3.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import cloud from 'd3-cloud';
import { scaleLinear, scaleSqrt } from 'd3-scale';

// Comprehensive stopwords — common English words that add no meaning
const STOPWORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with',
  'by','from','as','is','was','are','were','be','been','being','have','has',
  'had','do','does','did','will','would','could','should','may','might',
  'shall','can','need','dare','ought','used','it','its','this','that','these',
  'those','i','me','my','myself','we','our','ours','ourselves','you','your',
  'yours','yourself','he','him','his','himself','she','her','hers','herself',
  'they','them','their','theirs','themselves','what','which','who','whom',
  'when','where','why','how','all','both','each','few','more','most','other',
  'some','such','no','not','only','same','so','than','too','very','just',
  'because','if','then','else','about','above','after','before','between',
  'into','through','during','while','although','though','even','however',
  'also','still','yet','already','always','never','ever','often','usually',
  'sometimes','here','there','up','down','out','off','over','under','again',
  'further','once','any','every','much','many','really','quite','almost',
  'now','then','like','well','back','good','great','make','made','got','get',
  'going','go','come','came','know','think','see','look','want','give','use',
  'find','tell','ask','seem','feel','try','leave','call','keep','let','put',
  'mean','become','show','hear','play','run','move','live','believe','hold',
  'bring','happen','write','provide','sit','stand','lose','pay','meet',
  'include','continue','set','learn','change','lead','understand','watch',
  'follow','stop','create','speak','read','spend','grow','open','walk','win',
  'offer','remember','love','consider','appear','buy','wait','serve','die',
  'send','expect','build','stay','fall','cut','reach','kill','remain','suggest',
  'raise','pass','sell','require','report','decide','pull','film','movie',
  'films','movies','saw','seen','bit','lot','way','thing','things','time',
  'people','year','years','story','something','nothing','everything','anything',
  'someone','anyone','everyone','pretty','quite','rather','sort','kind',
  'makes','made','feel','felt','looks','looked','seems','seemed','thought',
  'think','know','knew','told','says','said','done','does','went',
]);

export default function WordCloudD3({ data, width: propWidth, height: propHeight }) {
  const containerRef = useRef(null);
  const [dims, setDims]   = useState({ w: propWidth || 500, h: propHeight || 260 });
  const [words, setWords] = useState([]);

  // Responsive sizing
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const w = Math.floor(entry.contentRect.width)  || 500;
        const h = Math.max(220, Math.floor(w * 0.45));
        setDims({ w, h });
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Filter stopwords and normalise
  const cleanData = useMemo(() => {
    if (!data || !data.length) return [];
    return data
      .filter(d => d.text && d.text.length > 2 && !STOPWORDS.has(d.text.toLowerCase()))
      .sort((a, b) => b.value - a.value)
      .slice(0, 60); // cap at 60 words for clean layout
  }, [data]);

  // Font size scale — sqrt gives better visual balance than linear
  const sizeScale = useMemo(() => {
    if (!cleanData.length) return () => 14;
    const vals = cleanData.map(d => d.value);
    return scaleSqrt()
      .domain([Math.min(...vals), Math.max(...vals)])
      .range([12, 48])
      .clamp(true);
  }, [cleanData]);

  // Color scale — letterboxd-ish orange/green palette
  const colorScale = useMemo(() => {
    if (!cleanData.length) return () => '#ff8000';
    const vals = cleanData.map(d => d.value);
    return scaleLinear()
      .domain([Math.min(...vals), Math.max(...vals)])
      .range(['#b0c4b1', '#00b020']);
  }, [cleanData]);

  useEffect(() => {
    if (!cleanData.length) return;
    cloud()
      .size([dims.w, dims.h])
      .words(cleanData.map(d => ({ text: d.text, value: d.value })))
      .padding(4)
      .rotate(() => (Math.random() > 0.8 ? 90 : 0)) // mostly horizontal, occasional vertical
      .font('Inter, system-ui, sans-serif')
      .fontSize(d => sizeScale(d.value))
      .spiral('archimedean')
      .on('end', laid => setWords(laid))
      .start();
  }, [cleanData, dims, sizeScale]);

  if (!cleanData.length) {
    return (
      <div ref={containerRef} style={{ textAlign: 'center', color: '#888', padding: '2rem' }}>
        no review text found — add some diary notes to generate a word cloud
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <svg
        width={dims.w}
        height={dims.h}
        style={{ display: 'block', margin: '0 auto', overflow: 'visible' }}
      >
        <g transform={`translate(${dims.w / 2},${dims.h / 2})`}>
          {words.map((w, i) => (
            <text
              key={i}
              textAnchor="middle"
              transform={`translate(${w.x},${w.y}) rotate(${w.rotate})`}
              style={{
                fontSize:   `${w.size}px`,
                fill:       colorScale(w.value),
                fontFamily: 'Inter, system-ui, sans-serif',
                fontWeight: w.value > (cleanData[0]?.value * 0.5) ? 600 : 400,
                opacity:    0.92,
                cursor:     'default',
                userSelect: 'none',
              }}
            >
              {w.text}
            </text>
          ))}
        </g>
      </svg>
    </div>
  );
}
