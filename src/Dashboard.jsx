// src/Dashboard.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { enrichMoviesWithTMDB } from './utils/tmdb';
import SentimentTile from './SentimentTile';
import HeatmapTile from './HeatmapTile';
import FavoritesTile from './FavoritesTile';
import LoggingLagTile from './LoggingLagTile';
import RatingChangeTile from './RatingChangeTile';
import WordCloudD3 from './WordCloudD3';
import DecadeRatingsTile from './DecadeRatingsTile';
import GoToRatingTile from './GoToRatingTile';
import RewatchAnalysisTile from './RewatchAnalysisTile';
import TopDirectorsTile from './TopDirectorsTile';
import StreakTile from './StreakTile';
import BingeWatchTile from './BingeWatchTile';
import PrimeTimeTile from './PrimeTimeTile';
import MostWatchedStarsTile from './MostWatchedStarsTile';
import AllStarCastTile from './AllStarCastTile';
import GoogleGeoChart from './GoogleGeoChart';

const parseYMD = s => {
  if (!s || typeof s !== 'string') return null;
  const parts = String(s).split('-').map(n => parseInt(n, 10));
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  const [y, m, d] = parts;
  return new Date(y, m - 1, d);
};

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

const COLORS = ['#0088FE','#00C49F','#FFBB28','#FF8042','#8884d8','#82ca9d','#ffc658'];
const PIE_COLORS = ['#3366CC','#DC3912','#FF9900','#109618','#990099','#3B3EAC','#0099C6','#DD4477','#66AA00'];

export default function Dashboard({ parsedData }) {
  const required = ['diary','watched','ratings','reviews'];
  const provided = Object.keys(parsedData).map(k => k.toLowerCase());
  const missing  = required.filter(k => !provided.includes(k));
  const [enrichedData, setEnrichedData] = useState(null);
  const [enrichmentStatus, setEnrichmentStatus] = useState('idle');
  const [enrichmentProgress, setEnrichmentProgress] = useState(0);

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

  const diaryKeys  = Object.keys(diary[0] || {});
  const filmKey = diaryKeys.find(k => /film|movie|title|name/i.test(k)) || 'Name';
  const yearKey = diaryKeys.find(k=>/^year$/i.test(k)||/release.*year/i.test(k)) || 'Year';
  const rewatchKey = diaryKeys.find(k=>/rewatch/i.test(k));
  const watchedDateKey = diaryKeys.find(k => /date/i.test(k)) || 'Watched Date';
  const watchedDates = watched.map(row => row[watchedDateKey]).filter(Boolean);

  const totalWatched   = watched.length;
  const rewatchedCount = rewatchKey
    ? new Set(diary.filter(d=>d[rewatchKey]?.toLowerCase()==='yes').map(d=>d[filmKey])).size
    : 0;
  const lovedCount     = favorites.length;

  const ratingField    = Object.keys(ratings[0] || {}).find(k=>/rating/i.test(k));
  const validRatings   = ratingField ? ratings.filter(r=>r[ratingField]) : [];
  const totalRated     = validRatings.length;
  const averageRating  = totalRated
    ? validRatings.reduce((s,r)=>s+parseFloat(r[ratingField]),0)/totalRated
    : 0;
  const reviewsWritten = reviews.length;

  const sorted = [...diary]
    .filter(d=>d[watchedDateKey] && parseYMD(d[watchedDateKey]))
    .sort((a,b)=>parseYMD(a[watchedDateKey]) - parseYMD(b[watchedDateKey]));
  const firstWatch = sorted.length ? parseYMD(sorted[0][watchedDateKey]).toLocaleDateString() : '';
  const lastWatch  = sorted.length ? parseYMD(sorted[sorted.length-1][watchedDateKey]).toLocaleDateString() : '';
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
  }, [ratings, ratingField, filmKey]);

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
    const localRatingField = diaryKeys.find(k=>/rating/i.test(k));
    diary.forEach(d=>{
      const dt = parseYMD(d[watchedDateKey]);
      const rv = localRatingField ? parseFloat(d[localRatingField]) : NaN;
      if (dt && !isNaN(rv)) {
        const lbl = dt.toLocaleString('default',{month:'short',year:'numeric'});
        sums[lbl] = (sums[lbl]||0) + rv;
        cnt[lbl]  = (cnt[lbl]||0) + 1;
      }
    });
    const sortedEntries = Object.entries(sums).sort((a,b) => new Date(a[0]) - new Date(b[0]));
    return sortedEntries.map(([lbl, sum]) => ({ label: lbl, rating: sum/cnt[lbl] }));
  }, [diary, watchedDateKey]);

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
    const loggedDateKey = diaryKeys.find(k => /^Date$/i.test(k));
    const localWatchedDateKey = diaryKeys.find(k => /Watched Date/i.test(k));

    if (!diary || diary.length === 0 || !loggedDateKey || !localWatchedDateKey) {
      return 0;
    }

    const lags = diary
      .map(entry => {
        const loggedDate = parseYMD(entry[loggedDateKey]);
        const watchedDate = parseYMD(entry[localWatchedDateKey]);

        if (!loggedDate || !watchedDate) {
          return null;
        }

        const differenceMs = loggedDate.getTime() - watchedDate.getTime();
        return differenceMs >= 0 ? differenceMs / (1000 * 60 * 60 * 24) : null;
      })
      .filter(lag => lag !== null);

    if (lags.length === 0) {
      return 0;
    }

    const sumOfLags = lags.reduce((acc, lag) => acc + lag, 0);
    return sumOfLags / lags.length;
  }, [diary, diaryKeys]);


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
        const localWatchedDate = parseYMD(entry[watchedDateKey]);
        if (localWatchedDate) {
            const day = localWatchedDate.toLocaleDateString('en-US', { weekday: 'long' });
            acc[day] = (acc[day] || 0) + 1;
        }
        return acc;
    }, {});
    if (Object.keys(dayCounts).length === 0) return { day: 'N/A', count: 0 };
    const topDay = Object.entries(dayCounts).reduce((max, current) => current[1] > max[1] ? current : max);
    return { day: topDay[0], count: topDay[1] };
  }, [diary, watchedDateKey]);
  
  const biggestRatingChange = useMemo(() => {
    const ratingKey = diaryKeys.find(k => /rating/i.test(k));
    const dateKey = diaryKeys.find(k => /^Date$/i.test(k));
    if (!diary || diary.length === 0 || !ratingKey || !dateKey) return null;

    const filmRatings = diary.reduce((acc, entry) => {
      const name = entry[filmKey];
      const rating = parseFloat(entry[ratingKey]);
      const date = parseYMD(entry[dateKey]);

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
          maxChange = { name, oldRating: oldEntry.rating, newRating: newEntry.rating, change };
        }
      }
    }
    return maxChange.change > 0 ? maxChange : null;
  }, [diary, filmKey, diaryKeys]);

  const yearsData = useMemo(()=>{
    const watchedYearKey = Object.keys(watched[0] || {}).find(k=>/^year$/i.test(k)||/release.*year/i.test(k));
    if (!watchedYearKey) return [];
    const counts = watched.reduce((m,mv)=>{
      const y = parseInt(mv[watchedYearKey],10);
      if (!isNaN(y)) m[y] = (m[y]||0) + 1;
      return m;
    }, {});
    const yrs = Object.keys(counts).map(y=>parseInt(y,10));
    if (yrs.length === 0) return [];
    const minY = Math.min(...yrs);
    const maxY = Math.max(...yrs);
    return Array.from({length:maxY-minY+1},(_,i)=>({ name: String(minY+i), count: counts[minY+i]||0 }));
  }, [watched]);

  const decadeRatings = useMemo(() => {
    if (!ratings || ratings.length === 0 || !yearKey || !ratingField) return [];

    const ratingsByDecade = ratings.reduce((acc, film) => {
      const year = parseInt(film[yearKey], 10);
      const ratingVal = parseFloat(film[ratingField]);
      if (isNaN(year) || isNaN(ratingVal)) return acc;

      const decade = Math.floor(year / 10) * 10;
      if (!acc[decade]) {
        acc[decade] = { ratings: [], total: 0 };
      }
      acc[decade].ratings.push(ratingVal);
      acc[decade].total += ratingVal;
      return acc;
    }, {});

    return Object.entries(ratingsByDecade)
      .map(([decade, data]) => ({
        decade: `${decade}s`,
        averageRating: data.total / data.ratings.length,
        count: data.ratings.length,
      }))
      .sort((a, b) => a.decade.localeCompare(b.decade));
  }, [ratings, yearKey, ratingField]);

  const goToRating = useMemo(() => {
    if (!validRatings || validRatings.length === 0) return { rating: 'N/A', count: 0 };
    const ratingCounts = validRatings.reduce((acc, r) => {
      const key = parseFloat(r[ratingField]).toFixed(1);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    if (Object.keys(ratingCounts).length === 0) return { rating: 'N/A', count: 0 };
    const topRating = Object.entries(ratingCounts).reduce((max, current) => current[1] > max[1] ? current : max);
    return { rating: topRating[0], count: topRating[1] };
  }, [validRatings, ratingField]);

  const mostRewatched = useMemo(() => {
    if (!diary || diary.length === 0 || !rewatchKey) return { name: 'No rewatches yet!', count: 1 };
    const rewatches = diary.filter(d => d[rewatchKey]?.toLowerCase() === 'yes');
    if (rewatches.length === 0) return { name: 'No rewatches yet!', count: 1 };

    const counts = rewatches.reduce((acc, film) => {
      acc[film[filmKey]] = (acc[film[filmKey]] || 1) + 1;
      return acc;
    }, {});

    const topFilm = Object.entries(counts).reduce((max, current) => current[1] > max[1] ? current : max, [null, 0]);
    return { name: topFilm[0], count: topFilm[1] };
  }, [diary, rewatchKey, filmKey]);

  const rewatchRatio = useMemo(() => {
    const total = diary.length;
    if (total === 0) return { rewatches: 0, new: 0 };
    const rewatchCount = rewatchKey ? diary.filter(d => d[rewatchKey]?.toLowerCase() === 'yes').length : 0;
    return { rewatches: rewatchCount, new: total - rewatchCount };
  }, [diary, rewatchKey]);

  const topDirectors = useMemo(() => {
    if (!enrichedData) return [];
    const directorCounts = enrichedData.reduce((acc, movie) => {
      if (movie.director && movie.director !== 'Unknown') {
        acc[movie.director] = (acc[movie.director] || 0) + 1;
      }
      return acc;
    }, {});
    return Object.entries(directorCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [enrichedData]);

  const longestStreak = useMemo(() => {
    if (!diary || diary.length === 0) return 0;
    const uniqueDates = [...new Set(diary.map(d => d[watchedDateKey]))]
      .map(s => parseYMD(s))
      .filter(d => d && !isNaN(d.getTime()))
      .sort((a, b) => a - b);
    if (uniqueDates.length < 2) return uniqueDates.length;
    let maxStreak = 1;
    let currentStreak = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
      const diff = (uniqueDates[i] - uniqueDates[i - 1]) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        currentStreak++;
      } else {
        maxStreak = Math.max(maxStreak, currentStreak);
        currentStreak = 1;
      }
    }
    maxStreak = Math.max(maxStreak, currentStreak);
    return maxStreak;
  }, [diary, watchedDateKey]);

  const bingeWatchCount = useMemo(() => {
    if (!diary || diary.length === 0) return 0;
    const countsByDate = diary.reduce((acc, entry) => {
      const date = entry[watchedDateKey];
      if (date) {
        acc[date] = (acc[date] || 0) + 1;
      }
      return acc;
    }, {});
    const maxCount = Math.max(0, ...Object.values(countsByDate));
    return maxCount;
  }, [diary, watchedDateKey]);

  const primeTimeYear = useMemo(() => {
    if (!diary || diary.length === 0 || !yearKey) return 'N/A';
    const years = diary.map(film => parseInt(film[yearKey], 10)).filter(year => !isNaN(year));
    if (years.length === 0) return 'N/A';
    const average = years.reduce((sum, year) => sum + year, 0) / years.length;
    return Math.round(average);
  }, [diary, yearKey]);

  const mostWatchedStars = useMemo(() => {
    if (!enrichedData) return [];
    const actorCounts = enrichedData.reduce((acc, movie) => {
      if (movie.cast) {
        movie.cast.forEach(actor => {
          if (!acc[actor.name]) {
            acc[actor.name] = { count: 0, profile_path: actor.profile_path };
          }
          acc[actor.name].count++;
        });
      }
      return acc;
    }, {});
    return Object.entries(actorCounts)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [enrichedData]);

  const allStarCast = useMemo(() => {
    if (!enrichedData || !ratings || ratings.length === 0 || !ratingField) return [];
    const ratingsMap = ratings.reduce((acc, rating) => {
      acc[rating[filmKey]] = parseFloat(rating[ratingField]);
      return acc;
    }, {});
    const actorRatings = enrichedData.reduce((acc, movie) => {
      const movieRating = ratingsMap[movie[filmKey]];
      if (movie.cast && movieRating) {
        movie.cast.forEach(actor => {
          if (!acc[actor.name]) {
            acc[actor.name] = { ratings: [], profile_path: actor.profile_path };
          }
          acc[actor.name].ratings.push(movieRating);
        });
      }
      return acc;
    }, {});
    const MIN_FILM_COUNT = 3;
    return Object.entries(actorRatings)
      .filter(([, data]) => data.ratings.length >= MIN_FILM_COUNT)
      .map(([name, data]) => ({
        name,
        profile_path: data.profile_path,
        avgRating: data.ratings.reduce((sum, r) => sum + r, 0) / data.ratings.length,
        filmCount: data.ratings.length,
      }))
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, 5);
  }, [enrichedData, ratings, ratingField, filmKey]);

  const countryData = useMemo(() => {
    if (!enrichedData) return null;

    const counts = enrichedData.reduce((acc, movie) => {
      if (movie.countries && Array.isArray(movie.countries)) {
        movie.countries.forEach(countryCode => {
          acc[countryCode] = (acc[countryCode] || 0) + 1;
        });
      }
      return acc;
    }, {});
    
    const formattedCounts = {};
    for (const [key, value] of Object.entries(counts)) {
      formattedCounts[key] = { count: value };
    }
    
    return { counts: formattedCounts };
  }, [enrichedData]);

  // ** THE FIX IS HERE **
  useEffect(() => {
    const fetchEnrichedData = async () => {
      const watchedKeys = Object.keys(watched[0] || {});
      const enrichmentFilmKey = watchedKeys.find(k => /film|movie|title|name/i.test(k)) || 'Name';
      const enrichmentYearKey = watchedKeys.find(k => /^year$/i.test(k) || /release.*year/i.test(k)) || 'Year';

      if (watched.length > 0 && enrichmentStatus === 'idle') {
        setEnrichmentStatus('loading');
        try {
          const enriched = await enrichMoviesWithTMDB(watched, setEnrichmentProgress, enrichmentFilmKey, enrichmentYearKey);
          // Ensure the final data is set correctly after filtering in the util
          setEnrichedData(enriched);
          setEnrichmentStatus('success');
        } catch (error) {
          console.error("TMDB enrichment failed:", error);
          setEnrichmentStatus('error');
        }
      }
    };

    fetchEnrichedData();
  }, [watched, enrichmentStatus]);

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
        <div className="chart-card-full-row">
            <GoogleGeoChart data={countryData} status={enrichmentStatus} progress={enrichmentProgress} />
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
        <div className="lists-grid">
            <MostWatchedStarsTile data={mostWatchedStars} status={enrichmentStatus} />
            <AllStarCastTile data={allStarCast} status={enrichmentStatus} />
        </div>
        <div className="lists-grid">
            <DecadeRatingsTile data={decadeRatings} />
            <RewatchAnalysisTile mostRewatched={mostRewatched} rewatchRatio={rewatchRatio} />
            <TopDirectorsTile data={topDirectors} status={enrichmentStatus} />
        </div>
        <div className="lists-grid">
          <GoToRatingTile rating={goToRating.rating} count={goToRating.count} />
          <StreakTile streak={longestStreak} />
          <BingeWatchTile count={bingeWatchCount} />
          <PrimeTimeTile year={primeTimeYear} />
        </div>
        <div className="chart-card">
          <HeatmapTile watchedDates={watchedDates} />
        </div>
      </div>
    </div>
  );
}