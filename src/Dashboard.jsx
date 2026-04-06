import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import { COLORS, PIE_COLORS } from './constants';
import { useEnrichment }     from './hooks/useEnrichment';
import { useDashboardStats } from './hooks/useDashboardStats';

import SentimentTile      from './SentimentTile';
import HeatmapTile        from './HeatmapTile';
import FavoritesTile      from './FavoritesTile';
import LoggingLagTile     from './LoggingLagTile';
import RatingChangeTile   from './RatingChangeTile';
import WordCloudD3        from './WordCloudD3';
import DecadeRatingsTile  from './DecadeRatingsTile';
import RewatchAnalysisTile from './RewatchAnalysisTile';
import TopDirectorsTile   from './TopDirectorsTile';
import StreakTile         from './StreakTile';
import BingeWatchTile     from './BingeWatchTile';
import PrimeTimeTile      from './PrimeTimeTile';
import MostWatchedStarsTile from './MostWatchedStarsTile';
import AllStarCastTile    from './AllStarCastTile';
import GoogleGeoChart     from './GoogleGeoChart';
import InsightsTile       from './InsightsTile';

export default function Dashboard({ parsedData }) {
  // make sure they uploaded the right files
  const required = ['diary', 'watched', 'ratings', 'reviews'];
  const provided  = Object.keys(parsedData).map(k => k.toLowerCase());
  const missing   = required.filter(k => !provided.includes(k));

  if (missing.length) {
    return (
      <div className="no-data-warning">
        <h2>Oops—wrong upload!</h2>
        <p>Please include CSVs for: {missing.join(', ')}</p>
        <button onClick={() => window.location.reload()} className="upload-button">
          Re-upload Files
        </button>
      </div>
    );
  }

  // lowercase all the csv names so matching isnt annoying
  const csvMap  = Object.fromEntries(Object.entries(parsedData).map(([k, v]) => [k.toLowerCase(), v]));
  const diary    = csvMap['diary']    || [];
  const watched  = csvMap['watched']  || [];
  const ratings  = csvMap['ratings']  || [];
  const reviews  = csvMap['reviews']  || [];
  const likesKey = Object.keys(parsedData).find(k => /likes[\/_]films$/i.test(k));
  const favorites = likesKey ? parsedData[likesKey] : [];

  // data loading + calculations
  const { enrichedData, enrichmentStatus, enrichmentProgress } = useEnrichment(watched);

  const {
    totalWatched, rewatchedCount, lovedCount,
    totalRated, averageRating, reviewsWritten,
    firstWatch, lastWatch, firstMovie, lastMovie,
    monthlyActivity, monthlyRatings, ratingDistribution,
    favoriteFilmsData, prolificMonth, busiestDay, biggestRatingChange,
    yearsData, decadeRatings, mostRewatched, rewatchRatio,
    topDirectors, mostWatchedStars, allStarCast, countryData,
    longestStreak, bingeWatchCount, primeTimeYear, averageLoggingLag,
    wordCloudData, watchedDates,
  } = useDashboardStats({ diary, watched, ratings, reviews, favorites, enrichedData });

  const allWatchedDates = watched
    .map(row => row[Object.keys(watched[0] || {}).find(k => /date/i.test(k))])
    .filter(Boolean);

  const tickFmt = str => str ? `${str.split(' ')[0]} '${str.split(' ')[1]?.slice(-2)}` : '';

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Cinematic Highlights</h1>
        <p>Your personalized Screend Wrapped summary</p>
      </div>

      <div className="dashboard-content">
        {/* Top Stats */}
        <div className="stats-grid">
          {[
            ['Total Watched', totalWatched],
            ['Rewatched',     rewatchedCount],
            ['Loved',         lovedCount],
            ['Rated',         totalRated],
            ['Reviews',       reviewsWritten],
            ['Avg ★',         averageRating.toFixed(2)],
          ].map(([label, value]) => (
            <div className="stat-card" key={label}>
              <h3>{label}</h3>
              <p className="stat-value">{value}</p>
            </div>
          ))}
        </div>

        {/* Main Charts */}
        <div className="charts-grid">
          <div className="chart-card">
            <h2>Monthly Activity</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyActivity}>
                <XAxis dataKey="month" tickFormatter={tickFmt} interval="preserveStartEnd" tick={{ fill: '#9a8e7f', fontSize: 12 }} axisLine={{ stroke: '#2a2318' }} tickLine={{ stroke: '#2a2318' }} height={45} angle={-45} textAnchor="end" />
                <YAxis tick={{ fill: '#9a8e7f', fontSize: 12 }} axisLine={{ stroke: '#2a2318' }} tickLine={{ stroke: '#2a2318' }} />
                <Tooltip contentStyle={{ background: '#1c1916', border: '1px solid rgba(224,159,62,0.15)', borderRadius: 4, color: '#e8e0d4' }} itemStyle={{ color: '#e8e0d4' }} labelStyle={{ color: '#9a8e7f' }} />
                <Bar dataKey="count" fill={COLORS[0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h2>Avg Monthly Rating</h2>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={monthlyRatings}>
                <XAxis dataKey="label" tickFormatter={tickFmt} interval="preserveStartEnd" tick={{ fill: '#9a8e7f', fontSize: 12 }} axisLine={{ stroke: '#2a2318' }} tickLine={{ stroke: '#2a2318' }} height={45} angle={-45} textAnchor="end" />
                <YAxis domain={[0, 5]} tickFormatter={v => v.toFixed(2)} tick={{ fill: '#9a8e7f', fontSize: 12 }} axisLine={{ stroke: '#2a2318' }} tickLine={{ stroke: '#2a2318' }} />
                <Tooltip formatter={v => v.toFixed(2)} contentStyle={{ background: '#1c1916', border: '1px solid rgba(224,159,62,0.15)', borderRadius: 4, color: '#e8e0d4' }} itemStyle={{ color: '#e8e0d4' }} labelStyle={{ color: '#9a8e7f' }} />
                <Line type="monotone" dataKey="rating" stroke={COLORS[1]} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h2>Rating Distribution</h2>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={ratingDistribution} dataKey="count" nameKey="rating" cx="50%" cy="50%" outerRadius={80} paddingAngle={0} label={false}>
                  {ratingDistribution.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />)}
                </Pie>
                <Tooltip formatter={(v, n) => [v, `${n}★`]} contentStyle={{ background: '#1c1916', border: '1px solid rgba(224,159,62,0.15)', borderRadius: 4, color: '#e8e0d4' }} itemStyle={{ color: '#e8e0d4' }} labelStyle={{ color: '#9a8e7f' }} />
                <Legend layout="horizontal" align="center" verticalAlign="bottom" iconSize={12} formatter={v => `${v}★`} wrapperStyle={{ paddingTop: 10, color: '#9a8e7f' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <SentimentTile diary={diary} reviews={reviews} />
        </div>

        {/* Secondary Stats */}
        <div className="stats-grid secondary-stats">
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

        {/* Date Range */}
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

        {/* Heatmap */}
        <div className="chart-card-full-row">
          <HeatmapTile watchedDates={allWatchedDates} />
        </div>

        {/* Secondary Charts */}
        <div className="charts-grid">
          <div className="chart-card">
            <h2>Films Watched by Year</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={yearsData}>
                <XAxis dataKey="name" tickFormatter={y => parseInt(y, 10) % 10 === 0 ? y : ''} interval={0} tick={{ fill: '#9a8e7f', fontSize: 12 }} axisLine={{ stroke: '#2a2318' }} tickLine={{ stroke: '#2a2318' }} />
                <YAxis allowDecimals={false} tick={{ fill: '#9a8e7f', fontSize: 12 }} axisLine={{ stroke: '#2a2318' }} tickLine={{ stroke: '#2a2318' }} />
                <Tooltip contentStyle={{ background: '#1c1916', border: '1px solid rgba(224,159,62,0.15)', borderRadius: 4, color: '#e8e0d4' }} itemStyle={{ color: '#e8e0d4' }} labelStyle={{ color: '#9a8e7f' }} />
                <Bar dataKey="count" fill={COLORS[0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <DecadeRatingsTile data={decadeRatings} />
          <RewatchAnalysisTile mostRewatched={mostRewatched} rewatchRatio={rewatchRatio} />
        </div>

        {/* Word Cloud & Favorites */}
        <div className="lists-grid">
          <div className="list-card word-cloud-card">
            <h2>Word Cloud</h2>
            <div className="word-cloud-container">
              <WordCloudD3 data={wordCloudData} />
            </div>
            <p className="word-cloud-subtitle">from your diary notes and reviews</p>
          </div>
          <FavoritesTile
            favorites={favoriteFilmsData.favorites}
            stinkers={favoriteFilmsData.stinkers}
            minRating={favoriteFilmsData.minRating}
            maxRating={favoriteFilmsData.maxRating}
          />
        </div>

        {/* World Map */}
        <div className="chart-card-full-row">
          <GoogleGeoChart data={countryData} status={enrichmentStatus} progress={enrichmentProgress} />
        </div>

        {/* Stars & Directors */}
        <div className="lists-grid">
          <MostWatchedStarsTile data={mostWatchedStars} status={enrichmentStatus} />
          <AllStarCastTile      data={allStarCast}       status={enrichmentStatus} />
          <TopDirectorsTile     data={topDirectors}      status={enrichmentStatus} />
        </div>

        {/* Fun Stats */}
        <div className="stats-grid fun-stats">
          <StreakTile      streak={longestStreak}   />
          <BingeWatchTile count={bingeWatchCount}   />
          <PrimeTimeTile  year={primeTimeYear}      />
          <LoggingLagTile averageLag={averageLoggingLag} />
        </div>

        {/* Insights */}
        <InsightsTile
          diary={diary}
          watched={watched}
          ratings={ratings}
          reviews={reviews}
          enrichedData={enrichedData}
        />
      </div>
    </div>
  );
}
