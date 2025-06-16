// src/WordCloudD3.jsx
import React, { useState, useEffect, useMemo } from 'react';
import cloud from 'd3-cloud';
import { scaleLinear } from 'd3-scale';

export default function WordCloudD3({ data, width, height }) {
  const [words, setWords] = useState([]);

  useEffect(() => {
    cloud()
      .size([width, height])
      .words(data.map(d => ({ text: d.text, value: d.value })))
      .padding(5)
      .rotate(0)
      .font('Impact')
      .fontSize(d => 12 + Math.log2(d.value) * 8)
      .on('end', laidOut => setWords(laidOut))
      .start();
  }, [data, width, height]);

  const [min, max] = useMemo(() => {
    if (!data || data.length === 0) return [0, 0];
    const vals = data.map(d => d.value);
    return [Math.min(...vals), Math.max(...vals)];
  }, [data]);

  const colorScale = scaleLinear()
    .domain([min, max])
    .range(['#D1C4E9', '#5E35B1']);

  return (
    <svg width={width} height={height} style={{ display:'block', margin:'0 auto' }}>
      <g transform={`translate(${width/2},${height/2})`}>
        {words.map((w,i) => (
          <text
            key={i}
            textAnchor="middle"
            transform={`translate(${w.x},${w.y}) rotate(${w.rotate})`}
            style={{
              fontSize: `${w.size}px`,
              fill: colorScale(w.value),
              fontFamily: 'Impact, sans-serif',
              opacity: 0.9,
              whiteSpace: 'nowrap'
            }}
          >
            {w.text}
          </text>
        ))}
      </g>
    </svg>
  );
}