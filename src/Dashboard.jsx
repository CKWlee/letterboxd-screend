// src/Dashboard.jsx

import React, { useState, useEffect, useMemo } from 'react';
import cloud from 'd3-cloud';
import { scaleLinear } from 'd3-scale';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';

// Trimmed list: core cinematic roles & popular amateur review terms
const CINEMATIC_TERMS = [
  'story', 'characters', 'plot', 'dialogue', 'scene', 'tone',
  'camera', 'cinematography', 'director', 'acting', 'performance', 'cast',
  'visuals', 'music', 'soundtrack', 'score', 'script', 'emotional',
  'powerful', 'beautiful', 'moving', 'captivating', 'riveting', 'heartfelt',
  'masterpiece', 'brilliant', 'amazing', 'fantastic', 'incredible', 'outstanding',
  'excellent', 'narrative', 'eccentric', 'weird', 'quirky', 'unique',
  'original', 'refreshing', 'engaging', 'focus', 'chemistry', 'audience',
  'screen', 'different', 'experience', 'impressive', 'intense', 'thrilling',
  'suspenseful', 'gripping', 'entertaining', 'funny', 'humor', 'comedy',
  'drama', 'action', 'thriller', 'animation', 'fantasy', 'horror',
  'romance', 'adventure', 'sci-fi', 'documentary', 'biography', 'historical',
  'musical', 'mystery', 'crime', 'family', 'sports', 'war', 'western',
  'superhero', 'comic', 'adaptation', 'comedic', 'sequel', 'prequel',
  'remake', 'reboot', 'franchise', 'series', 'trilogy', 'quadrilogy',
  'cinematic universe', 'blockbuster', 'indie', 'cult', 'classic', 'underrated',
  'overrated', 'hilarious', 'binge-worthy', 'must-watch', 'cinema', 'film',
  'movie', 'flick', 'picture', 'show', 'favorite', 'recommend', 'watchlist',
  'rewatch', 'revisit', 'nostalgia', 'timeless', 'evergreen', 'iconic',
  'love', 'actor', 'actress', 'character', 'role', 'casting', 'ensemble',
  'dynamic', 'relationship', 'development', 'arc', 'journey', 'growth',
  'transformation', 'redemption', 'conflict', 'resolution', 'theme', 'message',
  'moral', 'lesson', 'symbolism', 'metaphor', 'allegory', 'subtext', 'motif',
  'imagery', 'visual', 'aesthetic', 'style', 'mood', 'atmosphere', 'setting',
  'location', 'world-building', 'universe', 'mythology', 'lore', 'backstory',
  'history', 'context', 'subculture', 'sequence', 'shot', 'angle', 'framing',
  'composition', 'lighting', 'color', 'contrast', 'depth', 'movement', 'editing',
  'pacing', 'rhythm', 'flow', 'continuity', 'cut', 'transition', 'montage',
  'juxtaposition', 'parallel', 'cross-cutting', 'flashback', 'flashforward',
  'sound', 'sfx', 'foley', 'voiceover', 'narration', 'sound design', 'mixing',
  'post-production', 'CGI', 'VFX', 'practical effects', 'effects', 'stop-motion',
  'motion capture', 'puppetry', 'miniatures', 'props', 'set design'
];


// Chart color palette
const COLORS = [
  '#0088FE','#00C49F','#FFBB28','#FF8042',
  '#8884d8','#82ca9d','#ffc658'
];

// WordCloudD3: lays out words horizontally with d3-cloud
function WordCloudD3({ data, width, height }) {
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

export default function Dashboard({ parsedData }) {
  const csvMap = {};
  Object.entries(parsedData).forEach(([k,v]) => {
    csvMap[k.toLowerCase()] = v;
  });

  const diary     = csvMap['diary']   || [];
  const watched   = csvMap['watched'] || [];
  const ratings   = csvMap['ratings'] || [];
  const reviews   = csvMap['reviews'] || [];
  const likesKey  = Object.keys(parsedData).find(k=>/likes[\\/_]films$/i.test(k));
  const favorites = likesKey ? parsedData[likesKey] : [];

  const diaryKeys  = diary[0] ? Object.keys(diary[0]) : [];
  const filmKey    = diaryKeys.find(k=>/film|movie/i.test(k))    || diaryKeys[0] || 'Name';
  const dateKey    = diaryKeys.find(k=>/watched.*date/i.test(k)) || diaryKeys.find(k=>/date/i.test(k)) || 'Watched Date';
  const rewatchKey = diaryKeys.find(k=>/rewatch/i.test(k));

  const totalWatched   = watched.length;
  const rewatchedCount = rewatchKey
    ? new Set(diary.filter(d=>d[rewatchKey]?.toLowerCase()==='yes').map(d=>d[filmKey])).size
    : 0;
  const lovedCount     = favorites.length;

  const ratingField    = Object.keys(ratings[0]||{}).find(k=>/rating/i.test(k));
  const validRatings   = ratings.filter(r=>r[ratingField]);
  const totalRated     = validRatings.length;
  const averageRating  = totalRated
    ? validRatings.reduce((s,r)=>s+parseFloat(r[ratingField]),0)/totalRated
    : 0;

  const reviewsWritten = reviews.length;

  const sorted = [...diary]
    .filter(d=>d[dateKey])
    .sort((a,b)=>new Date(a[dateKey]) - new Date(b[dateKey]));
  const firstWatch = sorted[0]
    ? new Date(sorted[0][dateKey]).toLocaleDateString()
    : 'N/A';
  const lastWatch = sorted.length
    ? new Date(sorted[sorted.length-1][dateKey]).toLocaleDateString()
    : 'N/A';

  const monthlyActivity = useMemo(() => {
    const counts = {};
    watched.forEach(m => {
      const dt = new Date(m[dateKey]||m.Date);
      if(!isNaN(dt)){
        const lbl = dt.toLocaleString('default',{month:'short',year:'numeric'});
        counts[lbl] = (counts[lbl]||0) + 1;
      }
    });
    return Object.entries(counts)
      .sort((a,b)=>new Date(a[0]) - new Date(b[0]))
      .map(([month,count])=>({ month, count }));
  },[watched]);

  const monthlyRatings = useMemo(()=>{
    const sums={},cnt={};
    diary.forEach(d=>{
      const dt = new Date(d[dateKey]);
      const rk = Object.keys(d).find(k=>/rating/i.test(k));
      const rv = parseFloat(d[rk]);
      if(!isNaN(dt)&&!isNaN(rv)){
        const lbl = dt.toLocaleString('default',{month:'short',year:'numeric'});
        sums[lbl]=(sums[lbl]||0)+rv;
        cnt[lbl]  =(cnt[lbl]||0)+1;
      }
    });
    return Object.keys(sums)
      .sort((a,b)=>new Date(a)-new Date(b))
      .map(lbl=>({ label: lbl, rating: sums[lbl]/cnt[lbl] }));
  },[diary]);

  const ratingDistribution = useMemo(()=>{
    const dist={};
    validRatings.forEach(r=>{
      const n = parseFloat(r[ratingField]);
      if(!isNaN(n)){
        const k = n.toFixed(1);
        dist[k]=(dist[k]||0)+1;
      }
    });
    return Object.entries(dist)
      .sort((a,b)=>parseFloat(a[0]) - parseFloat(b[0]))
      .map(([rating,count])=>({ rating, count }));
  },[validRatings]);

  const yearKey = Object.keys(watched[0]||{}).find(k=>/^year$/i.test(k)||/release.*year/i.test(k));
  const topYears = yearKey
    ? Object.entries(
        watched.reduce((m,mv)=>{
          const y=mv[yearKey];
          if(y)m[y]=(m[y]||0)+1;
          return m;
        },{})
      )
        .sort(([,a],[,b])=>b-a)
        .slice(0,10)
        .map(([name,count])=>({ name, count }))
    : [];

  const commentKey    = diaryKeys.find(k=>/comment|entry|notes|text/i.test(k));
  const reviewTextKey = Object.keys(reviews[0]||{}).find(k=>/review|text/i.test(k));
  const corpus = [
    ...diary.map(d=>d[commentKey]||''),
    ...reviews.map(r=>r[reviewTextKey]||'')
  ].join(' ')
    .toLowerCase()
    .replace(/[^a-z\s]/g,' ')
    .split(/\s+/)
    .filter(Boolean);

  const freq = {};
  corpus.forEach(w=>{ freq[w]=(freq[w]||0)+1 });

  let cloudData = CINEMATIC_TERMS
    .filter(t=>freq[t])
    .map(t=>({ text: t, value: freq[t] }));

  if(!cloudData.length){
    cloudData = Object.entries(freq)
      .filter(([w])=>w.length>3)
      .sort(([,a],[,b])=>b-a)
      .slice(0,30)
      .map(([text,value])=>({ text, value }));
  }

  const barInterval  = monthlyActivity.length>6?Math.floor(monthlyActivity.length/6):0;
  const lineInterval = monthlyRatings.length>6?Math.floor(monthlyRatings.length/6):0;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Cinematic Highlights</h1>
        <p>Your personalized Screend Wrapped summary</p>
      </div>

      <div className="dashboard-content">
        {/* Stats */}
        <div className="stats-grid">
          {[
            ['Total Watched',    totalWatched],
            ['Rewatched Movies', rewatchedCount],
            ['Loved Movies',     lovedCount],
            ['Movies Rated',     totalRated],
            ['Reviews Written',  reviewsWritten],
            ['Avg Rating',       `${totalRated?averageRating.toFixed(2):'0.00'} ★`]
          ].map(([label,value])=>(
            <div className="stat-card" key={label}>
              <h3>{label}</h3>
              <p className="stat-value">{value}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="charts-grid">
          <div className="chart-card">
            <h2>Monthly Activity</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyActivity}>
                <XAxis
                  dataKey="month"
                  tickFormatter={str=>{
                    const [m,y]=str.split(' ');
                    return `${m} '${y.slice(-2)}`;
                  }}
                  interval={barInterval}
                  tick={{fontSize:12}}
                  height={45}
                  angle={-45}
                  textAnchor="end"
                />
                <YAxis/>
                <Tooltip/>
                <Bar dataKey="count" fill={COLORS[0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h2>Avg Monthly Rating</h2>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={monthlyRatings}>
                <XAxis
                  dataKey="label"
                  tickFormatter={str=>{
                    const [m,y]=str.split(' ');
                    return `${m} '${y.slice(-2)}`;  
                  }}
                  interval={lineInterval}
                  tick={{fontSize:12}}
                  height={45}
                  angle={-45}
                  textAnchor="end"
                />
                <YAxis domain={[0,5]}/>
                <Tooltip formatter={val=>val.toFixed(2)}/>
                <Line type="monotone" dataKey="rating" stroke={COLORS[1]}/>
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h2>Rating Distribution</h2>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={ratingDistribution}
                  dataKey="count"
                  nameKey="rating"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  paddingAngle={3}
                  label={false}
                >
                  {ratingDistribution.map((_,i)=>(
                    <Cell key={i} fill={COLORS[i%COLORS.length]}/>
                  ))}
                </Pie>
                <Tooltip formatter={(val,name)=>[val,`${name}★`]}/>
                <Legend verticalAlign="bottom" formatter={v=>`${v}★`}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Word Cloud & Top Years */}  
        <div className="lists-grid">
          <div className="list-card">
            <h2>Word Cloud</h2>
            <WordCloudD3 data={cloudData} width={400} height={220}/>
            <div style={{
              textAlign:'center',
              marginTop:'8px',
              fontStyle:'italic',
              fontSize:'0.9rem',
              color:'#5E35B1'
            }}>
              • Font size & color darkness ∝ term frequency
            </div>
          </div>

          <div className="list-card">
            <h2>Top Years</h2>
            <ol>
              {topYears.map(item=>(
                <li key={item.name}>{item.name} ({item.count})</li>
              ))}
            </ol>
          </div>
        </div>

        {/* Date Range */}
        <div className="date-info">
          <div className="first-watch">
            <h3>First Watch</h3>
            <p>{firstWatch}</p>
          </div>
          <div className="last-watch">
            <h3>Latest Watch</h3>
            <p>{lastWatch}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
