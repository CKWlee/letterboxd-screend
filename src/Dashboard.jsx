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
  'story','characters','plot','dialogue','scene','tone',
  'camera','cinematography','director','acting','performance','cast',
  'visuals','music','soundtrack','score','script','emotional',
  'powerful','beautiful','moving','captivating','riveting','heartfelt',
  'masterpiece','brilliant','amazing','fantastic','incredible','outstanding',
  'excellent','narrative','eccentric','weird','quirky','unique',
  'original','refreshing','engaging','focus','chemistry','audience',
  'screen','different','experience','impressive','intense','thrilling',
  'suspenseful','gripping','entertaining','funny','humor','comedy',
  'drama','action','thriller','animation','fantasy','horror',
  'romance','adventure','sci-fi','documentary','biography','historical',
  'musical','mystery','crime','family','sports','war','western',
  'superhero','comic','adaptation','comedic','sequel','prequel',
  'remake','reboot','franchise','series','trilogy','quadrilogy',
  'cinematic universe','blockbuster','indie','cult','classic','underrated',
  'overrated','hilarious','binge-worthy','must-watch','cinema','film',
  'movie','flick','picture','show','favorite','recommend','watchlist',
  'rewatch','revisit','nostalgia','timeless','evergreen','iconic',
  'love','actor','actress','character','role','casting','ensemble',
  'dynamic','relationship','development','arc','journey','growth',
  'transformation','redemption','conflict','resolution','theme','message',
  'moral','lesson','symbolism','metaphor','allegory','subtext','motif',
  'imagery','visual','aesthetic','style','mood','atmosphere','setting',
  'location','world-building','universe','mythology','lore','backstory',
  'history','context','subculture','sequence','shot','angle','framing',
  'composition','lighting','color','contrast','depth','movement','editing',
  'pacing','rhythm','flow','continuity','cut','transition','montage'
];

// Chart color palettes
const COLORS = ['#0088FE','#00C49F','#FFBB28','#FF8042','#8884d8','#82ca9d','#ffc658'];
const PIE_COLORS = ['#3366CC','#DC3912','#FF9900','#109618','#990099','#3B3EAC','#0099C6','#DD4477','#66AA00'];

// WordCloudD3 component
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
    .range(['#D1C4E9', '#5E35B1']); // light lavender → deep purple

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
  // Check for required CSVs
  const required = ['diary','watched','ratings','reviews'];
  const provided = Object.keys(parsedData).map(k => k.toLowerCase());
  const missing  = required.filter(k => !provided.includes(k));

  if (missing.length) {
    return (
      <div className="no-data-warning">
        <h2>Oops—wrong upload!</h2>
        <p>Please include CSVs for: {missing.join(', ')}</p>
        <button
          onClick={() => window.location.reload()}
          className="upload-button"
        >
          Re-upload Files
        </button>
      </div>
    );
  }

  // Normalize and extract data
  const csvMap = {};
  Object.entries(parsedData).forEach(([k,v]) => {
    csvMap[k.toLowerCase()] = v;
  });
  const diary     = csvMap['diary'];
  const watched   = csvMap['watched'];
  const ratings   = csvMap['ratings'];
  const reviews   = csvMap['reviews'];
  const likesKey  = Object.keys(parsedData).find(k => /likes[\\/_]films$/i.test(k));
  const favorites = likesKey ? parsedData[likesKey] : [];

  // Detect columns
  const diaryKeys  = Object.keys(diary[0]);
  const filmKey    = diaryKeys.find(k=>/film|movie/i.test(k)) || diaryKeys[0];
  const dateKey    = diaryKeys.find(k=>/watched.*date/i.test(k)) || diaryKeys.find(k=>/date/i.test(k));
  const rewatchKey = diaryKeys.find(k=>/rewatch/i.test(k));

  // Core stats
  const totalWatched   = watched.length;
  const rewatchedCount = rewatchKey
    ? new Set(diary.filter(d=>d[rewatchKey]?.toLowerCase()==='yes').map(d=>d[filmKey])).size
    : 0;
  const lovedCount     = favorites.length;

  // Ratings & reviews
  const ratingField    = Object.keys(ratings[0]).find(k=>/rating/i.test(k));
  const validRatings   = ratings.filter(r=>r[ratingField]);
  const totalRated     = validRatings.length;
  const averageRating  = totalRated
    ? validRatings.reduce((s,r)=>s+parseFloat(r[ratingField]),0)/totalRated
    : 0;
  const reviewsWritten = reviews.length;

  // Date range
  const sorted = [...diary]
    .filter(d=>d[dateKey])
    .sort((a,b)=>new Date(a[dateKey]) - new Date(b[dateKey]));
  const firstWatch = new Date(sorted[0][dateKey]).toLocaleDateString();
  const lastWatch  = new Date(sorted[sorted.length-1][dateKey]).toLocaleDateString();

  // Monthly activity
  const monthlyActivity = useMemo(() => {
    const counts = {};
    watched.forEach(m => {
      const dt = new Date(m[dateKey]||m.Date);
      if (!isNaN(dt)) {
        const lbl = dt.toLocaleString('default',{month:'short',year:'numeric'});
        counts[lbl] = (counts[lbl]||0) + 1;
      }
    });
    return Object.entries(counts)
      .sort((a,b)=>new Date(a[0]) - new Date(b[0]))
      .map(([month,count])=>({ month, count }));
  }, [watched]);

  // Monthly ratings
  const monthlyRatings = useMemo(()=>{
    const sums={}, cnt={};
    diary.forEach(d=>{
      const dt = new Date(d[dateKey]);
      const rk = Object.keys(d).find(k=>/rating/i.test(k));
      const rv = parseFloat(d[rk]);
      if (!isNaN(dt) && !isNaN(rv)) {
        const lbl = dt.toLocaleString('default',{month:'short',year:'numeric'});
        sums[lbl] = (sums[lbl]||0) + rv;
        cnt[lbl]  = (cnt[lbl]||0) + 1;
      }
    });
    return Object.keys(sums)
      .sort((a,b)=>new Date(a)-new Date(b))
      .map(lbl=>({ label: lbl, rating: sums[lbl]/cnt[lbl] }));
  }, [diary]);

  // Rating distribution
  const ratingDistribution = useMemo(()=>{
    const dist={};
    validRatings.forEach(r=>{
      const n = parseFloat(r[ratingField]);
      const key = n.toFixed(1);
      dist[key] = (dist[key]||0) + 1;
    });
    return Object.entries(dist)
      .sort((a,b)=>parseFloat(a[0]) - parseFloat(b[0]))
      .map(([rating,count])=>({ rating, count }));
  }, [validRatings]);

  // Films by year
  const yearKey = Object.keys(watched[0]).find(k=>/^year$/i.test(k)||/release.*year/i.test(k));
  const yearsData = useMemo(()=>{
    const counts = watched.reduce((m,mv)=>{
      const y = parseInt(mv[yearKey],10);
      if (!isNaN(y)) m[y] = (m[y]||0) + 1;
      return m;
    }, {});
    const yrs = Object.keys(counts).map(y=>parseInt(y,10));
    const minY = Math.min(...yrs), maxY = Math.max(...yrs);
    return Array.from({length:maxY-minY+1},(_,i)=>({
      name: String(minY+i),
      count: counts[minY+i]||0
    }));
  }, [watched, yearKey]);

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
            ['Total Watched', totalWatched],
            ['Rewatched',    rewatchedCount],
            ['Loved',        lovedCount],
            ['Rated',        totalRated],
            ['Reviews',      reviewsWritten],
            ['Avg ★',        averageRating.toFixed(2)]
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
                  interval={Math.floor(monthlyActivity.length/6)}
                  tick={{fontSize:12}}
                  height={45} angle={-45} textAnchor="end"
                />
                <YAxis /><Tooltip/>
                <Bar dataKey="count" fill={COLORS[0]} />
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
                  interval={Math.floor(monthlyRatings.length/6)}
                  tick={{fontSize:12}} height={45} angle={-45} textAnchor="end"
                />
                <YAxis domain={[0,5]}/><Tooltip/>
                <Line type="monotone" dataKey="rating" stroke={COLORS[1]} />
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
                  cx="50%" cy="50%"
                  outerRadius={80}
                  paddingAngle={0}
                  label={false}
                >
                  {ratingDistribution.map((_,i)=>(
                    <Cell key={i} fill={PIE_COLORS[i]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip formatter={(v,n)=>[v,`${n}★`]} />
                <Legend
                  layout="horizontal" align="center" verticalAlign="bottom"
                  iconSize={12} formatter={v=>`${v}★`}
                  wrapperStyle={{paddingTop:10}}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Word Cloud & Films by Year */}
        <div className="lists-grid">
          <div className="list-card">
            <h2>Word Cloud</h2>
            <WordCloudD3
              data={(() => {
                const commentKey = diaryKeys.find(k=>/comment|entry|notes|text/i.test(k));
                const reviewKey  = Object.keys(reviews[0]).find(k=>/review|text/i.test(k));
                const texts = [
                  ...diary.map(d=>d[commentKey]||''),
                  ...reviews.map(r=>r[reviewKey]||'')
                ].join(' ')
                  .toLowerCase()
                  .replace(/[^a-z\s]/g,' ')
                  .split(/\s+/)
                  .filter(Boolean);
                const freq = texts.reduce((m,w)=>{ m[w]=(m[w]||0)+1; return m; }, {});
                let data = CINEMATIC_TERMS.filter(t=>freq[t]).map(t=>({ text:t, value:freq[t] }));
                if (!data.length) {
                  data = Object.entries(freq)
                    .filter(([w])=>w.length>3)
                    .sort(([,a],[,b])=>b-a)
                    .slice(0,30)
                    .map(([text,value])=>({ text, value }));
                }
                return data;
              })()}
              width={400} height={220}
            />
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

          <div className="chart-card">
            <h2>Films Watched by Year</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={yearsData}>
                <XAxis
                  dataKey="name"
                  tickFormatter={year=> (parseInt(year,10)%10===0 ? year : '')}
                  interval={0} tick={{fontSize:12}}
                />
                <YAxis allowDecimals={false}/>
                <Tooltip/>
                <Bar dataKey="count" fill={COLORS[2]}/>
              </BarChart>
            </ResponsiveContainer>
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
