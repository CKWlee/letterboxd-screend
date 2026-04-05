// src/InsightsTile.jsx
// Analytical insight summary — surfaces written observations from the
// parsed data so the dashboard reads as analysis, not just visualization.

import React, { useMemo } from 'react';
import { parseYMD } from './utils/dateUtils';

function generateInsights({ diary, watched, ratings, reviews, enrichedData }) {
  const insights = [];

  // ── Key field detection ───────────────────────────────────────────────────
  const diaryKeys     = Object.keys(diary[0] || {});
  const watchedKeys   = Object.keys(watched[0] || {});
  const ratingKeys    = Object.keys(ratings[0] || {});

  const filmKey       = diaryKeys.find(k => /film|movie|title|name/i.test(k)) || 'Name';
  const dateKey       = diaryKeys.find(k => /watched.date/i.test(k)) || 'Watched Date';
  const rewatchKey    = diaryKeys.find(k => /rewatch/i.test(k));
  const yearKey       = watchedKeys.find(k => /^year$/i.test(k) || /release.*year/i.test(k));
  const ratingField   = ratingKeys.find(k => /rating/i.test(k));

  // ── 1. Busiest day of the week ────────────────────────────────────────────
  const dayCounts = diary.reduce((acc, entry) => {
    const d = parseYMD(entry[dateKey]);
    if (d) {
      const day = d.toLocaleDateString('en-US', { weekday: 'long' });
      acc[day] = (acc[day] || 0) + 1;
    }
    return acc;
  }, {});

  if (Object.keys(dayCounts).length > 0) {
    const topDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];
    const total  = diary.length;
    const pct    = Math.round((topDay[1] / total) * 100);
    insights.push(
      `${pct}% of your logged films were watched on a ${topDay[0]} — you clearly have a routine.`
    );
  }

  // ── 2. Rewatch opinion drift ──────────────────────────────────────────────
  if (rewatchKey && ratingField) {
    const ratingByFilm = {};
    diary.forEach(entry => {
      const name   = entry[filmKey];
      const rating = parseFloat(entry[ratingField]);
      const isRew  = entry[rewatchKey]?.toLowerCase() === 'yes';
      if (!name || isNaN(rating)) return;
      if (!ratingByFilm[name]) ratingByFilm[name] = { first: null, rewatches: [] };
      if (!isRew) ratingByFilm[name].first = rating;
      else        ratingByFilm[name].rewatches.push(rating);
    });

    const drifts = Object.values(ratingByFilm).filter(
      f => f.first !== null && f.rewatches.length > 0
    );
    if (drifts.length > 0) {
      const avg = drifts.reduce((sum, f) => {
        const rewAvg = f.rewatches.reduce((s, r) => s + r, 0) / f.rewatches.length;
        return sum + (rewAvg - f.first);
      }, 0) / drifts.length;

      if (Math.abs(avg) >= 0.1) {
        const direction = avg > 0 ? 'higher' : 'lower';
        insights.push(
          `Films you rewatch tend to land ${Math.abs(avg).toFixed(1)}★ ${direction} on second viewing — your taste ${avg > 0 ? 'warms up to things over time' : 'gets more critical with distance'}.`
        );
      }
    }
  }

  // ── 3. Genre you rate vs. watch most ─────────────────────────────────────
  if (enrichedData && ratingField) {
    const genreStats = {};
    enrichedData.forEach(movie => {
      const rating = ratings.find(r => r[filmKey] === movie[filmKey]);
      const ratingVal = rating ? parseFloat(rating[ratingField]) : null;
      (movie.genres || []).forEach(genre => {
        if (!genreStats[genre]) genreStats[genre] = { count: 0, ratingSum: 0, ratingCount: 0 };
        genreStats[genre].count++;
        if (ratingVal && !isNaN(ratingVal)) {
          genreStats[genre].ratingSum += ratingVal;
          genreStats[genre].ratingCount++;
        }
      });
    });

    const genreArr = Object.entries(genreStats)
      .filter(([, v]) => v.count >= 5 && v.ratingCount >= 3)
      .map(([genre, v]) => ({
        genre,
        count: v.count,
        avgRating: v.ratingSum / v.ratingCount,
      }));

    if (genreArr.length >= 2) {
      const mostWatched = genreArr.sort((a, b) => b.count - a.count)[0];
      const highestRated = [...genreArr].sort((a, b) => b.avgRating - a.avgRating)[0];

      if (mostWatched.genre !== highestRated.genre) {
        insights.push(
          `You watch the most ${mostWatched.genre} films (${mostWatched.count} total), but your highest-rated genre is actually ${highestRated.genre} (avg ${highestRated.avgRating.toFixed(2)}★).`
        );
      } else {
        insights.push(
          `${mostWatched.genre} is both your most-watched and highest-rated genre — you know what you like.`
        );
      }
    }
  }

  // ── 4. Rating trend over time ─────────────────────────────────────────────
  if (ratingField && diary.length > 20) {
    const byYear = {};
    diary.forEach(entry => {
      const d = parseYMD(entry[dateKey]);
      const r = parseFloat(entry[ratingField]);
      if (!d || isNaN(r)) return;
      const yr = d.getFullYear();
      if (!byYear[yr]) byYear[yr] = [];
      byYear[yr].push(r);
    });

    const years = Object.keys(byYear).map(Number).sort();
    if (years.length >= 2) {
      const firstYrAvg = byYear[years[0]].reduce((s, r) => s + r, 0) / byYear[years[0]].length;
      const lastYrAvg  = byYear[years[years.length - 1]].reduce((s, r) => s + r, 0) / byYear[years[years.length - 1]].length;
      const delta = lastYrAvg - firstYrAvg;

      if (Math.abs(delta) >= 0.15) {
        const direction = delta > 0 ? 'more generous' : 'more critical';
        insights.push(
          `Your average rating in ${years[years.length - 1]} (${lastYrAvg.toFixed(2)}★) was ${Math.abs(delta).toFixed(2)}★ ${delta > 0 ? 'higher' : 'lower'} than in ${years[0]} (${firstYrAvg.toFixed(2)}★) — you're getting ${direction} over time.`
        );
      }
    }
  }

  // ── 5. Logging lag behaviour ──────────────────────────────────────────────
  const loggedDateKey = diaryKeys.find(k => /^Date$/i.test(k));
  const watchedDateKey = diaryKeys.find(k => /Watched Date/i.test(k));
  if (loggedDateKey && watchedDateKey) {
    const lags = diary
      .map(entry => {
        const logged  = parseYMD(entry[loggedDateKey]);
        const watched = parseYMD(entry[watchedDateKey]);
        if (!logged || !watched) return null;
        const diff = (logged - watched) / (1000 * 60 * 60 * 24);
        return diff >= 0 ? diff : null;
      })
      .filter(l => l !== null);

    if (lags.length > 0) {
      const same    = lags.filter(l => l === 0).length;
      const pctSame = Math.round((same / lags.length) * 100);
      const avgLag  = lags.reduce((s, l) => s + l, 0) / lags.length;

      if (pctSame >= 60) {
        insights.push(
          `You log films the same day you watch them ${pctSame}% of the time — real-time reviewer energy.`
        );
      } else if (avgLag > 3) {
        insights.push(
          `On average you wait ${avgLag.toFixed(1)} days to log a film — you tend to sit with it before committing a rating.`
        );
      }
    }
  }

  // ── 6. Decade preference ─────────────────────────────────────────────────
  if (yearKey && watched.length > 10) {
    const relYears = watched
      .map(m => parseInt(m[yearKey], 10))
      .filter(y => !isNaN(y));
    if (relYears.length > 0) {
      const avgYear  = relYears.reduce((s, y) => s + y, 0) / relYears.length;
      const currentYear = new Date().getFullYear();
      const yearsBack = currentYear - avgYear;

      if (yearsBack > 15) {
        insights.push(
          `Your average film release year is ${Math.round(avgYear)} — you're drawn to older cinema, ${Math.round(yearsBack)} years back on average.`
        );
      } else if (yearsBack < 5) {
        insights.push(
          `With an average release year of ${Math.round(avgYear)}, you're firmly in the contemporary lane — mostly recent releases.`
        );
      }
    }
  }

  return insights.slice(0, 5); // cap at 5 so the tile doesn't get too long
}

export default function InsightsTile({ diary, watched, ratings, reviews, enrichedData }) {
  const insights = useMemo(
    () => generateInsights({ diary, watched, ratings, reviews, enrichedData }),
    [diary, watched, ratings, reviews, enrichedData]
  );

  if (!insights.length) return null;

  return (
    <div className="chart-card insights-tile">
      <h2>What the data says about you</h2>
      <ul className="insights-list">
        {insights.map((insight, i) => (
          <li key={i} className="insight-item">
            <span className="insight-number">{String(i + 1).padStart(2, '0')}</span>
            <span className="insight-text">{insight}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
