import React, { useMemo } from 'react';
import { parseYMD } from './utils/dateUtils';

function generateInsights({ diary, watched, ratings, reviews, enrichedData }) {
  const insights = [];

  const diaryKeys   = Object.keys(diary[0]   || {});
  const watchedKeys = Object.keys(watched[0]  || {});
  const ratingKeys  = Object.keys(ratings[0]  || {});

  const filmKey    = diaryKeys.find(k => /film|movie|title|name/i.test(k))    || 'Name';
  const dateKey    = diaryKeys.find(k => /watched.date/i.test(k))             || 'Watched Date';
  const rewatchKey = diaryKeys.find(k => /rewatch/i.test(k));
  const yearKey    = watchedKeys.find(k => /^year$/i.test(k) || /release.*year/i.test(k));
  const ratingField = ratingKeys.find(k => /rating/i.test(k));

  // ratings lookup so we're not looping every time
  const ratingsMap = useMemo
    ? ratings.reduce((m, r) => { m[r[filmKey]] = parseFloat(r[ratingField]); return m; }, {})
    : {};

  // which day do they watch the most
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
    const pct    = Math.round((topDay[1] / diary.length) * 100);
    insights.push({
      emoji: '📅',
      text: `${pct}% of your films were watched on a ${topDay[0]} — you've got a ritual.`,
    });
  }

  // do rewatches get rated higher or lower
  if (rewatchKey && ratingField) {
    const byFilm = {};
    diary.forEach(entry => {
      const name   = entry[filmKey];
      const rating = parseFloat(entry[ratingField]);
      const isRew  = entry[rewatchKey]?.toLowerCase() === 'yes';
      if (!name || isNaN(rating)) return;
      if (!byFilm[name]) byFilm[name] = { first: null, rewatches: [] };
      if (!isRew) byFilm[name].first = rating;
      else        byFilm[name].rewatches.push(rating);
    });

    const drifts = Object.values(byFilm).filter(f => f.first !== null && f.rewatches.length > 0);
    if (drifts.length > 0) {
      const avg = drifts.reduce((sum, f) => {
        const rewAvg = f.rewatches.reduce((s, r) => s + r, 0) / f.rewatches.length;
        return sum + (rewAvg - f.first);
      }, 0) / drifts.length;

      if (Math.abs(avg) >= 0.1) {
        const dir = avg > 0 ? 'higher' : 'lower';
        const why = avg > 0 ? 'things grow on you' : 'distance makes you more critical';
        insights.push({
          emoji: '🔁',
          text: `Rewatches land ${Math.abs(avg).toFixed(1)}★ ${dir} than first viewings — ${why}.`,
        });
      }
    }
  }

  // genre they watch most vs genre they rate highest
  if (enrichedData && ratingField) {
    const genreStats = {};
    enrichedData.forEach(movie => {
      const ratingVal = ratingsMap[movie[filmKey]];
      (movie.genres || []).forEach(genre => {
        if (!genreStats[genre]) genreStats[genre] = { count: 0, ratingSum: 0, ratingCount: 0 };
        genreStats[genre].count++;
        if (ratingVal && !isNaN(ratingVal)) {
          genreStats[genre].ratingSum   += ratingVal;
          genreStats[genre].ratingCount += 1;
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
      const mostWatched  = [...genreArr].sort((a, b) => b.count - a.count)[0];
      const highestRated = [...genreArr].sort((a, b) => b.avgRating - a.avgRating)[0];

      if (mostWatched.genre !== highestRated.genre) {
        insights.push({
          emoji: '🎬',
          text: `You watch the most ${mostWatched.genre} (${mostWatched.count} films), but you rate ${highestRated.genre} highest (avg ${highestRated.avgRating.toFixed(2)}★).`,
        });
      } else {
        insights.push({
          emoji: '🎬',
          text: `${mostWatched.genre} is both your most-watched and highest-rated genre. You know exactly what you like.`,
        });
      }
    }
  }

  // are they getting nicer or meaner over time
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
      const firstAvg = byYear[years[0]].reduce((s, r) => s + r, 0) / byYear[years[0]].length;
      const lastAvg  = byYear[years[years.length - 1]].reduce((s, r) => s + r, 0) / byYear[years[years.length - 1]].length;
      const delta    = lastAvg - firstAvg;

      if (Math.abs(delta) >= 0.15) {
        const dir = delta > 0 ? 'more generous' : 'more critical';
        insights.push({
          emoji: '📈',
          text: `Your average rating in ${years[years.length - 1]} (${lastAvg.toFixed(2)}★) vs ${years[0]} (${firstAvg.toFixed(2)}★) — you've gotten ${dir} over time.`,
        });
      }
    }
  }

  // how long before they log it
  const loggedDateKey  = diaryKeys.find(k => /^Date$/i.test(k));
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
        insights.push({
          emoji: '⚡',
          text: `You log ${pctSame}% of films the same day you watch them. Real-time reviewer behavior.`,
        });
      } else if (avgLag > 3) {
        insights.push({
          emoji: '🕰️',
          text: `On average you wait ${avgLag.toFixed(1)} days before logging — you like to sit with it first.`,
        });
      }
    }
  }

  // old films or new films
  if (yearKey && watched.length > 10) {
    const relYears = watched.map(m => parseInt(m[yearKey], 10)).filter(y => !isNaN(y));
    if (relYears.length > 0) {
      const avgYear   = relYears.reduce((s, y) => s + y, 0) / relYears.length;
      const yearsBack = new Date().getFullYear() - avgYear;

      if (yearsBack > 15) {
        insights.push({
          emoji: '📽️',
          text: `Your average film release year is ${Math.round(avgYear)} — you're drawn to older cinema, ${Math.round(yearsBack)} years back on average.`,
        });
      } else if (yearsBack < 5) {
        insights.push({
          emoji: '🆕',
          text: `Average release year of ${Math.round(avgYear)} — you're mostly watching current stuff.`,
        });
      }
    }
  }

  return insights.slice(0, 5);
}

export default function InsightsTile({ diary, watched, ratings, reviews, enrichedData }) {
  const insights = useMemo(
    () => generateInsights({ diary, watched, ratings, reviews, enrichedData }),
    [diary, watched, ratings, reviews, enrichedData]
  );

  if (!insights || !insights.length) return null;

  return (
    <div className="insights-tile">
      <h2 className="insights-title">what the data says about you</h2>
      <div className="insights-list">
        {insights.map((insight, i) => (
          <div key={i} className="insight-row">
            <span className="insight-emoji">{insight.emoji}</span>
            <span className="insight-text">{insight.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
