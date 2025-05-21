// src/Dashboard.jsx

import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042',
  '#8884d8', '#82ca9d', '#ffc658'
];

export default function Dashboard({ parsedData }) {
  // Normalize CSV keys
  const csvMap = {};
  Object.entries(parsedData).forEach(([key, val]) => {
    csvMap[key.toLowerCase()] = val;
  });

  const diaryData   = csvMap['diary']   || [];
  const watchedData = csvMap['watched'] || [];
  const ratingsData = csvMap['ratings'] || [];
  const reviewsData = csvMap['reviews'] || [];
  const likesKey    = Object.keys(parsedData).find(k => /likes[\\/_]films$/i.test(k));
  const likedFilms  = likesKey ? parsedData[likesKey] : [];

  // Dynamic field detection
  const diaryKeys   = diaryData[0]   ? Object.keys(diaryData[0])   : [];
  const filmKey     = diaryKeys.find(k => /film|movie/i.test(k))    || diaryKeys[0] || 'Name';
  const dateKey     = diaryKeys.find(k => /watched.*date/i.test(k)) || diaryKeys.find(k => /date/i.test(k)) || 'Watched Date';
  const rewatchKey  = diaryKeys.find(k => /rewatch/i.test(k));

  const ratingKeys  = ratingsData[0] ? Object.keys(ratingsData[0]) : [];
  const ratingKey   = ratingKeys.find(k => /rating/i.test(k))       || 'Rating';

  // Core stats
  const totalWatched = watchedData.length;

  const rewatchedCount = rewatchKey
    ? new Set(
        diaryData
          .filter(m => m[rewatchKey] && String(m[rewatchKey]).toLowerCase() === 'yes')
          .map(m => m[filmKey])
      ).size
    : 0;

  const lovedCount    = likedFilms.length;

  const validRatings  = ratingsData.filter(r => r[ratingKey]);
  const totalRated    = validRatings.length;
  const averageRating = totalRated
    ? validRatings.reduce((sum, r) => sum + parseFloat(r[ratingKey]), 0) / totalRated
    : 0;

  const reviewsWritten = reviewsData.length;

  // Date range
  const sortedByDate = [...diaryData]
    .filter(m => m[dateKey])
    .sort((a, b) => new Date(a[dateKey]) - new Date(b[dateKey]));

  const firstWatchDate = sortedByDate[0]
    ? new Date(sortedByDate[0][dateKey]).toLocaleDateString()
    : 'N/A';
  const lastWatchDate = sortedByDate.length
    ? new Date(sortedByDate[sortedByDate.length - 1][dateKey]).toLocaleDateString()
    : 'N/A';

  // Monthly Activity (watchedData)
  const monthlyActivity = (() => {
    const counts = {};
    watchedData.forEach(m => {
      const dateValue = m[dateKey] || m.Date;
      const d = new Date(dateValue);
      if (!isNaN(d)) {
        const label = d.toLocaleString('default', { month: 'short', year: 'numeric' });
        counts[label] = (counts[label] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .map(([month, count]) => ({ month, count }));
  })();

  // Average Monthly Rating (diaryData)
  const monthlyRatings = (() => {
    const sums = {}, cnt = {};
    diaryData.forEach(m => {
      const d = new Date(m[dateKey]);
      const r = parseFloat(m[ratingKey]);
      if (!isNaN(d) && !isNaN(r)) {
        const label = d.toLocaleString('default', { month: 'short', year: 'numeric' });
        sums[label] = (sums[label] || 0) + r;
        cnt[label]  = (cnt[label]  || 0) + 1;
      }
    });
    return Object.keys(sums)
      .sort((a, b) => new Date(a) - new Date(b))
      .map(label => ({ label, rating: sums[label] / cnt[label] }));
  })();

  // Rating Distribution (½-star increments)
  const ratingDistribution = (() => {
    const dist = {};
    validRatings.forEach(r => {
      const n = parseFloat(r[ratingKey]);
      if (!isNaN(n)) {
        const key = n.toFixed(1);
        dist[key] = (dist[key] || 0) + 1;
      }
    });
    return Object.entries(dist)
      .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
      .map(([rating, count]) => ({ rating, count }));
  })();

  // Top Countries & Top Years (no API)
  const topCountries = Object.entries(
    watchedData.reduce((map, m) => {
      const country = m['Release Country'] || m.Country || 'Unknown';
      map[country] = (map[country] || 0) + 1;
      return map;
    }, {})
  )
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  const topYears = Object.entries(
    watchedData.reduce((map, m) => {
      const year = String(
        m['Release Year'] || new Date(m.Date || m[dateKey]).getFullYear()
      );
      map[year] = (map[year] || 0) + 1;
      return map;
    }, {})
  )
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  // Tick intervals (~6 labels max)
  const barInterval  = monthlyActivity.length > 6 ? Math.floor(monthlyActivity.length / 6) : 0;
  const lineInterval = monthlyRatings.length  > 6 ? Math.floor(monthlyRatings.length  / 6) : 0;

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
            ['Avg Rating',       `${totalRated ? averageRating.toFixed(2) : '0.00'} ★`]
          ].map(([label, value]) => (
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
                  tickFormatter={str => {
                    const [m, y] = str.split(' ');
                    return `${m} '${y.slice(-2)}`;
                  }}
                  interval={barInterval}
                  tick={{ fontSize: 12 }}
                  height={45}
                  angle={-45}
                  textAnchor="end"
                />
                <YAxis />
                <Tooltip />
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
                  tickFormatter={str => {
                    const [m, y] = str.split(' ');
                    return `${m} '${y.slice(-2)}`;
                  }}
                  interval={lineInterval}
                  tick={{ fontSize: 12 }}
                  height={45}
                  angle={-45}
                  textAnchor="end"
                />
                <YAxis domain={[0,5]} />
                <Tooltip formatter={value => value.toFixed(2)} />
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
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  paddingAngle={3}
                  label={false}
                >
                  {ratingDistribution.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val, name) => [val, `${name}★`]} />
                <Legend verticalAlign="bottom" formatter={v => `${v}★`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Countries & Top Years */}
        <div className="lists-grid">
          {[
            ['Top Countries', topCountries],
            ['Top Years',     topYears]
          ].map(([title, list]) => (
            <div className="list-card" key={title}>
              <h2>{title}</h2>
              <ol>
                {list.map(item => (
                  <li key={item.name}>{item.name} ({item.count})</li>
                ))}
              </ol>
            </div>
          ))}
        </div>

        {/* Date Range */}
        <div className="date-info">
          <div className="first-watch">
            <h3>First Watch</h3>
            <p>{firstWatchDate}</p>
          </div>
          <div className="last-watch">
            <h3>Latest Watch</h3>
            <p>{lastWatchDate}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
