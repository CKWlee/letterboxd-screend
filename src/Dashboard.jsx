import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import SentimentTile from './SentimentTile';
import HeatmapTile from './HeatmapTile';
import FavoritesTile from './FavoritesTile';
import LoggingLagTile from './LoggingLagTile';
import RatingChangeTile from './RatingChangeTile'; // Import the new tile
import WordCloudD3 from './WordCloudD3';

// ── Parse “YYYY-MM-DD” as a local date (no off-by-one) ──
const parseYMD = s => {
  if (!s || typeof s !== 'string') return null;
  const parts = String(s).split('-').map(n => parseInt(n, 10));
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  const [y, m, d] = parts;
  return new Date(y, m - 1, d);
};

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
  const diary     = csvMap['diary'] || [];
  const watched   = csvMap['watched'] || [];
  const ratings   = csvMap['ratings'] || [];
  const reviews   = csvMap['reviews'] || [];
  const likesKey  = Object.keys(parsedData).find(k => /likes[\\/_]films$/i.test(k));
  const favorites = likesKey ? parsedData[likesKey] : [];

  // Detect columns
  const diaryKeys  = Object.keys(diary[0] || {});
  const filmKey = diaryKeys.find(k => /film|movie|title|name/i.test(k)) || 'Name';
  const rewatchKey = diaryKeys.find(k=>/rewatch/i.test(k));
  const watchedDateKey = Object.keys(watched[0] || {}).find(k => /date/i.test(k)) || 'Date';
  const watchedDates = watched.map(row => row[watchedDateKey]).filter(Boolean);

  // Core stats
  const totalWatched   = watched.length;
  const rewatchedCount = rewatchKey
    ? new Set(diary.filter(d=>d[rewatchKey]?.toLowerCase()==='yes').map(d=>d[filmKey])).size
    : 0;
  const lovedCount     = favorites.length;

  // Ratings & reviews
  const ratingField    = Object.keys(ratings[0] || {}).find(k=>/rating/i.test(k));
  const validRatings   = ratingField ? ratings.filter(r=>r[ratingField]) : [];
  const totalRated     = validRatings.length;
  const averageRating  = totalRated
    ? validRatings.reduce((s,r)=>s+parseFloat(r[ratingField]),0)/totalRated
    : 0;
  const reviewsWritten = reviews.length;

  // Date range + first/last movie
  const sorted = [...diary]
    .filter(d=>d['Watched Date'] && parseYMD(d['Watched Date']))
    .sort((a,b)=>parseYMD(a['Watched Date']) - parseYMD(b['Watched Date']));
  const firstWatch = sorted.length ? parseYMD(sorted[0]['Watched Date']).toLocaleDateString() : '';
  const lastWatch  = sorted.length ? parseYMD(sorted[sorted.length-1]['Watched Date']).toLocaleDateString() : '';
  const firstMovie = sorted.length ? sorted[0][filmKey] : '';
  const lastMovie  = sorted.length ? sorted[sorted.length-1][filmKey] : '';

  const favoriteFilmsData = useMemo(() => {
    if (!ratings || ratings.length === 0 || !ratingField) {
      return { favorites: [], stinkers: [], minRating: 0, maxRating: 0 };
    }
    const numericRatings = ratings.map(r => parseFloat(r[ratingField])).filter(r => !isNaN(r));
    if (numericRatings.length === 0) {
        return { favorites: [], stinkers: [], minRating: 0, maxRating: 0 };
    }
    const minRating = Math.min(...numericRatings);
    const maxRating = Math.max(...numericRatings);
    const favorites = ratings.filter(r => parseFloat(r[ratingField]) === maxRating);
    const stinkers = ratings.filter(r => parseFloat(r[ratingField]) === minRating);
    return { favorites, stinkers, minRating, maxRating };
  }, [ratings, ratingField]);

  const monthlyActivity = useMemo(() => {
    const counts = {};
    watched.forEach(m => {
      const dt = parseYMD(m[watchedDateKey]);
      if (dt) {
        const lbl = dt.toLocaleString('default',{month:'short',year:'numeric'});
        counts[lbl] = (counts[lbl]||0) + 1;
      }
    });
    const sortedEntries = Object.entries(counts).sort((a,b)=>{
        return new Date(a[0]) - new Date(b[0]);
    });
    return sortedEntries.map(([month,count])=>({ month, count }));
  }, [watched, watchedDateKey]);

  const monthlyRatings = useMemo(()=>{
    const sums={}, cnt={};
    const localRatingField = Object.keys(diary[0] || {}).find(k=>/rating/i.test(k));
    diary.forEach(d=>{
      const dt = parseYMD(d['Watched Date']);
      const rv = localRatingField ? parseFloat(d[localRatingField]) : NaN;
      if (dt && !isNaN(rv)) {
        const lbl = dt.toLocaleString('default',{month:'short',year:'numeric'});
        sums[lbl] = (sums[lbl]||0) + rv;
        cnt[lbl]  = (cnt[lbl]||0) + 1;
      }
    });
    const sortedEntries = Object.entries(sums).sort((a,b) => new Date(a[0]) - new Date(b[0]));
    return sortedEntries.map(([lbl, sum]) => ({ label: lbl, rating: sum/cnt[lbl] }));
  }, [diary]);

  const ratingDistribution = useMemo(()=>{
    const dist={};
    validRatings.forEach(r=>{
      const n = parseFloat(r[ratingField]);
      if (!isNaN(n)) {
        const key = n.toFixed(1);
        dist[key] = (dist[key]||0) + 1;
      }
    });
    return Object.entries(dist)
      .sort((a,b)=>parseFloat(a[0]) - parseFloat(b[0]))
      .map(([rating,count])=>({ rating, count }));
  }, [validRatings, ratingField]);
    
  const averageLoggingLag = useMemo(() => {
    if (!diary || diary.length === 0) return 0;
    const lags = diary
      .map(entry => {
        if (!entry['Date'] || !entry['Watched Date']) return null;
        const loggedDate = parseYMD(entry['Date']);
        const watchedDate = parseYMD(entry['Watched Date']);
        if (!loggedDate || !watchedDate) return null;
        const differenceMs = loggedDate.getTime() - watchedDate.getTime();
        return differenceMs / (1000 * 60 * 60 * 24);
      })
      .filter(lag => lag !== null && lag >= 0);
    if (lags.length === 0) return 0;
    const sumOfLags = lags.reduce((acc, lag) => acc + lag, 0);
    return sumOfLags / lags.length;
  }, [diary]);

  const prolificMonth = useMemo(() => {
    if (!monthlyActivity || monthlyActivity.length === 0) {
      return { month: 'N/A', count: 0 };
    }
    return monthlyActivity.reduce((max, current) => {
      return current.count > max.count ? current : max;
    }, { month: '', count: 0 });
  }, [monthlyActivity]);

  const busiestDay = useMemo(() => {
    if (!diary || diary.length === 0) return { day: 'N/A', count: 0 };
    const dayCounts = diary.reduce((acc, entry) => {
        const watchedDate = parseYMD(entry['Watched Date']);
        if (watchedDate) {
            const day = watchedDate.toLocaleDateString('en-US', { weekday: 'long' });
            acc[day] = (acc[day] || 0) + 1;
        }
        return acc;
    }, {});
    if (Object.keys(dayCounts).length === 0) return { day: 'N/A', count: 0 };
    const topDay = Object.entries(dayCounts).reduce((max, current) => current[1] > max[1] ? current : max);
    return { day: topDay[0], count: topDay[1] };
  }, [diary]);
  
  const biggestRatingChange = useMemo(() => {
    if (!diary || diary.length === 0) return null;

    const filmRatings = diary.reduce((acc, entry) => {
      const name = entry[filmKey];
      const rating = parseFloat(entry['Rating']);
      const date = parseYMD(entry['Date']);

      if (name && !isNaN(rating) && date) {
        if (!acc[name]) {
          acc[name] = [];
        }
        acc[name].push({ rating, date });
      }
      return acc;
    }, {});

    let maxChange = { name: null, oldRating: 0, newRating: 0, change: 0 };

    for (const name in filmRatings) {
      if (filmRatings[name].length > 1) {
        filmRatings[name].sort((a, b) => a.date - b.date);
        
        const oldEntry = filmRatings[name][0];
        const newEntry = filmRatings[name][filmRatings[name].length - 1];
        const change = Math.abs(newEntry.rating - oldEntry.rating);

        if (change > maxChange.change) {
          maxChange = {
            name,
            oldRating: oldEntry.rating,
            newRating: newEntry.rating,
            change,
          };
        }
      }
    }
    return maxChange.change > 0 ? maxChange : null;
  }, [diary, filmKey]);

  const yearKey = Object.keys(watched[0] || {}).find(k=>/^year$/i.test(k)||/release.*year/i.test(k));
  const yearsData = useMemo(()=>{
    if (!yearKey) return [];
    const counts = watched.reduce((m,mv)=>{
      const y = parseInt(mv[yearKey],10);
      if (!isNaN(y)) m[y] = (m[y]||0) + 1;
      return m;
    }, {});
    const yrs = Object.keys(counts).map(y=>parseInt(y,10));
    if (yrs.length === 0) return [];
    const minY = Math.min(...yrs);
    const maxY = Math.max(...yrs);
    return Array.from({length:maxY-minY+1},(_,i)=>({ name: String(minY+i), count: counts[minY+i]||0 }));
  }, [watched, yearKey]);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Cinematic Highlights</h1>
        <p>Your personalized Screend Wrapped summary</p>
      </div>

      <div className="dashboard-content">
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

        <div className="charts-grid">
          <div className="chart-card">
            <h2>Monthly Activity</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyActivity}>
                <XAxis dataKey="month" tickFormatter={str => str ? `${str.split(' ')[0]} '${str.split(' ')[1]?.slice(-2)}` : ''} interval="preserveStartEnd" tick={{fontSize:12}} height={45} angle={-45} textAnchor="end"/>
                <YAxis /><Tooltip />
                <Bar dataKey="count" fill={COLORS[0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-card">
            <h2>Avg Monthly Rating</h2>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={monthlyRatings}>
                <XAxis dataKey="label" tickFormatter={str => str ? `${str.split(' ')[0]} '${str.split(' ')[1]?.slice(-2)}` : ''} interval="preserveStartEnd" tick={{fontSize:12}} height={45} angle={-45} textAnchor="end"/>
                <YAxis domain={[0,5]} tickFormatter={val=>val.toFixed(2)}/>
                <Tooltip formatter={val=>val.toFixed(2)}/>
                <Line type="monotone" dataKey="rating" stroke={COLORS[1]}/>                
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-card">
            <h2>Rating Distribution</h2>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={ratingDistribution} dataKey="count" nameKey="rating" cx="50%" cy="50%" outerRadius={80} paddingAngle={0} label={false}>
                  {ratingDistribution.map((_,i)=>(<Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />))}
                </Pie>
                <Tooltip formatter={(v,n)=>[v,`${n}★`]}/>
                <Legend layout="horizontal" align="center" verticalAlign="bottom" iconSize={12} formatter={v=>`${v}★`} wrapperStyle={{paddingTop:10}}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <SentimentTile diary={diary} reviews={reviews} />
        </div>

        <div className="stats-grid">
            <LoggingLagTile averageLag={averageLoggingLag} />
            <div className="stat-card">
              <h3>Most Prolific Month</h3>
              <div className="prolific-month-value">
                <p className="stat-value">{prolificMonth.month}</p>
                <p className="prolific-month-count">{prolificMonth.count} films</p>
              </div>
            </div>
            <div className="stat-card">
              <h3>Your Busiest Day</h3>
              <div className="prolific-month-value">
                <p className="stat-value">{busiestDay.day}</p>
                <p className="prolific-month-count">{busiestDay.count} films watched</p>
              </div>
            </div>
            <RatingChangeTile changeInfo={biggestRatingChange} />
        </div>

        <div className="date-info">
          <div>
            <h3>First Watched</h3>
            <p>{`${firstWatch} — ${firstMovie}`}</p>
          </div>
          <div>
            <h3>Latest Watched</h3>
            <p>{`${lastWatch} — ${lastMovie}`}</p>
          </div>
        </div>

        <div className="lists-grid">
          <div className="list-card">
            <h2>Word Cloud</h2>
            <WordCloudD3
              data={(() => {
                const commentKey = diaryKeys.find(k=>/comment|entry|notes|text/i.test(k));
                const reviewKey  = Object.keys(reviews[0] || {}).find(k=>/review|text/i.test(k));
                const texts = [
                  ...(diary.map(d=>(commentKey && d[commentKey])||'')),
                  ...(reviews.map(r=>(reviewKey && r[reviewKey])||''))
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
            <div style={{ textAlign:'center', marginTop:'8px', fontStyle:'italic', fontSize:'0.9rem', color:'#5E35B1' }}>
              • Font size & color darkness ∝ term frequency
            </div>
          </div>
          <FavoritesTile
              favorites={favoriteFilmsData.favorites}
              stinkers={favoriteFilmsData.stinkers}
              minRating={favoriteFilmsData.minRating}
              maxRating={favoriteFilmsData.maxRating}
            />
          <div className="chart-card">
            <h2>Films Watched by Year</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={yearsData}>
                <XAxis dataKey="name" tickFormatter={year=> (parseInt(year,10)%10===0 ? year : '')} interval={0} tick={{fontSize:12}} />
                <YAxis allowDecimals={false}/>
                <Tooltip/>
                <Bar dataKey="count" fill={COLORS[2]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="chart-card">
          <HeatmapTile watchedDates={watchedDates} />
        </div>
      </div>
    </div>
  );
}
