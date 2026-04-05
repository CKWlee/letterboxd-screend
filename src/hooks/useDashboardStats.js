// src/hooks/useDashboardStats.js
// All the heavy useMemo stat calculations extracted from Dashboard.jsx
import { useMemo } from 'react';
import { parseYMD } from '../utils/dateUtils';

export function useDashboardStats({ diary, watched, ratings, reviews, favorites, enrichedData }) {
  // ── Field key detection ─────────────────────────────────────────────────
  const diaryKeys      = Object.keys(diary[0]   || {});
  const watchedObjKeys = Object.keys(watched[0] || {});
  const ratingObjKeys  = Object.keys(ratings[0] || {});

  const filmKey        = diaryKeys.find(k => /film|movie|title|name/i.test(k))       || 'Name';
  const watchedDateKey = diaryKeys.find(k => /date/i.test(k))                        || 'Watched Date';
  const rewatchKey     = diaryKeys.find(k => /rewatch/i.test(k));
  const yearKey        = diaryKeys.find(k => /^year$/i.test(k) || /release.*year/i.test(k));
  const ratingField    = ratingObjKeys.find(k => /rating/i.test(k));
  const watchedYearKey = watchedObjKeys.find(k => /^year$/i.test(k) || /release.*year/i.test(k));

  // ── Summary counts ──────────────────────────────────────────────────────
  const totalWatched   = watched.length;
  const rewatchedCount = rewatchKey
    ? new Set(diary.filter(d => d[rewatchKey]?.toLowerCase() === 'yes').map(d => d[filmKey])).size
    : 0;
  const lovedCount     = favorites.length;

  const validRatings   = ratingField ? ratings.filter(r => r[ratingField]) : [];
  const totalRated     = validRatings.length;
  const averageRating  = totalRated
    ? validRatings.reduce((s, r) => s + parseFloat(r[ratingField]), 0) / totalRated
    : 0;
  const reviewsWritten = reviews.length;

  // ── First / last watch ──────────────────────────────────────────────────
  const { firstWatch, lastWatch, firstMovie, lastMovie } = useMemo(() => {
    const sorted = [...diary]
      .filter(d => d[watchedDateKey] && parseYMD(d[watchedDateKey]))
      .sort((a, b) => parseYMD(a[watchedDateKey]) - parseYMD(b[watchedDateKey]));
    return {
      firstWatch: sorted.length ? parseYMD(sorted[0][watchedDateKey]).toLocaleDateString()                        : '',
      lastWatch:  sorted.length ? parseYMD(sorted[sorted.length - 1][watchedDateKey]).toLocaleDateString()        : '',
      firstMovie: sorted.length ? sorted[0][filmKey]                                                              : '',
      lastMovie:  sorted.length ? sorted[sorted.length - 1][filmKey]                                              : '',
    };
  }, [diary, watchedDateKey, filmKey]);

  // ── Monthly activity ────────────────────────────────────────────────────
  const monthlyActivity = useMemo(() => {
    const counts = {};
    watched.forEach(m => {
      const dt = parseYMD(m[watchedDateKey]);
      if (dt) {
        const lbl = dt.toLocaleString('default', { month: 'short', year: 'numeric' });
        counts[lbl] = (counts[lbl] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .map(([month, count]) => ({ month, count }));
  }, [watched, watchedDateKey]);

  // ── Monthly ratings ─────────────────────────────────────────────────────
  const monthlyRatings = useMemo(() => {
    const localRatingField = diaryKeys.find(k => /rating/i.test(k));
    const sums = {}, cnt = {};
    diary.forEach(d => {
      const dt = parseYMD(d[watchedDateKey]);
      const rv = localRatingField ? parseFloat(d[localRatingField]) : NaN;
      if (dt && !isNaN(rv)) {
        const lbl = dt.toLocaleString('default', { month: 'short', year: 'numeric' });
        sums[lbl] = (sums[lbl] || 0) + rv;
        cnt[lbl]  = (cnt[lbl]  || 0) + 1;
      }
    });
    return Object.entries(sums)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .map(([lbl, sum]) => ({ label: lbl, rating: sum / cnt[lbl] }));
  }, [diary, watchedDateKey, diaryKeys]);

  // ── Rating distribution ─────────────────────────────────────────────────
  const ratingDistribution = useMemo(() => {
    const dist = {};
    validRatings.forEach(r => {
      const n = parseFloat(r[ratingField]);
      if (!isNaN(n)) { const k = n.toFixed(1); dist[k] = (dist[k] || 0) + 1; }
    });
    return Object.entries(dist)
      .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
      .map(([rating, count]) => ({ rating, count }));
  }, [validRatings, ratingField]);

  // ── Favorite / stinker films ────────────────────────────────────────────
  const favoriteFilmsData = useMemo(() => {
    if (!ratings.length || !ratingField) return { favorites: [], stinkers: [], minRating: 0, maxRating: 0 };
    const nums = ratings.map(r => parseFloat(r[ratingField])).filter(n => !isNaN(n));
    if (!nums.length) return { favorites: [], stinkers: [], minRating: 0, maxRating: 0 };
    const minRating = Math.min(...nums);
    const maxRating = Math.max(...nums);
    return {
      favorites:  ratings.filter(r => parseFloat(r[ratingField]) === maxRating),
      stinkers:   ratings.filter(r => parseFloat(r[ratingField]) === minRating),
      minRating,
      maxRating,
    };
  }, [ratings, ratingField]);

  // ── Prolific month ──────────────────────────────────────────────────────
  const prolificMonth = useMemo(() =>
    monthlyActivity.length
      ? monthlyActivity.reduce((max, c) => c.count > max.count ? c : max, { month: 'N/A', count: 0 })
      : { month: 'N/A', count: 0 },
    [monthlyActivity]
  );

  // ── Busiest day ─────────────────────────────────────────────────────────
  const busiestDay = useMemo(() => {
    if (!diary.length) return { day: 'N/A', count: 0 };
    const dayCounts = {};
    diary.forEach(entry => {
      const dt = parseYMD(entry[watchedDateKey]);
      if (dt) { const day = dt.toLocaleDateString('en-US', { weekday: 'long' }); dayCounts[day] = (dayCounts[day] || 0) + 1; }
    });
    if (!Object.keys(dayCounts).length) return { day: 'N/A', count: 0 };
    const top = Object.entries(dayCounts).reduce((max, cur) => cur[1] > max[1] ? cur : max);
    return { day: top[0], count: top[1] };
  }, [diary, watchedDateKey]);

  // ── Biggest rating change ───────────────────────────────────────────────
  const biggestRatingChange = useMemo(() => {
    const ratingKey = diaryKeys.find(k => /rating/i.test(k));
    const dateKey   = diaryKeys.find(k => /^Date$/i.test(k));
    if (!diary.length || !ratingKey || !dateKey) return null;
    const byFilm = {};
    diary.forEach(entry => {
      const name   = entry[filmKey];
      const rating = parseFloat(entry[ratingKey]);
      const date   = parseYMD(entry[dateKey]);
      if (name && !isNaN(rating) && date) {
        if (!byFilm[name]) byFilm[name] = [];
        byFilm[name].push({ rating, date });
      }
    });
    let maxChange = { name: null, oldRating: 0, newRating: 0, change: 0 };
    for (const name in byFilm) {
      if (byFilm[name].length > 1) {
        byFilm[name].sort((a, b) => a.date - b.date);
        const old = byFilm[name][0];
        const neu = byFilm[name][byFilm[name].length - 1];
        const change = Math.abs(neu.rating - old.rating);
        if (change > maxChange.change) maxChange = { name, oldRating: old.rating, newRating: neu.rating, change };
      }
    }
    return maxChange.change > 0 ? maxChange : null;
  }, [diary, filmKey, diaryKeys]);

  // ── Release years bar chart data ────────────────────────────────────────
  const yearsData = useMemo(() => {
    if (!watchedYearKey) return [];
    const counts = {};
    watched.forEach(mv => { const y = parseInt(mv[watchedYearKey], 10); if (!isNaN(y)) counts[y] = (counts[y] || 0) + 1; });
    const yrs = Object.keys(counts).map(Number);
    if (!yrs.length) return [];
    const [minY, maxY] = [Math.min(...yrs), Math.max(...yrs)];
    return Array.from({ length: maxY - minY + 1 }, (_, i) => ({ name: String(minY + i), count: counts[minY + i] || 0 }));
  }, [watched, watchedYearKey]);

  // ── Decade ratings ──────────────────────────────────────────────────────
  const decadeRatings = useMemo(() => {
    if (!ratings.length || !yearKey || !ratingField) return [];
    const byDecade = {};
    ratings.forEach(film => {
      const year = parseInt(film[yearKey], 10);
      const val  = parseFloat(film[ratingField]);
      if (isNaN(year) || isNaN(val)) return;
      const d = Math.floor(year / 10) * 10;
      if (!byDecade[d]) byDecade[d] = { ratings: [], total: 0 };
      byDecade[d].ratings.push(val);
      byDecade[d].total += val;
    });
    return Object.entries(byDecade)
      .map(([d, data]) => ({ decade: `${d}s`, averageRating: data.total / data.ratings.length, count: data.ratings.length }))
      .sort((a, b) => a.decade.localeCompare(b.decade));
  }, [ratings, yearKey, ratingField]);

  // ── Rewatch data ────────────────────────────────────────────────────────
  const mostRewatched = useMemo(() => {
    if (!diary.length || !rewatchKey) return { name: 'No rewatches yet!', count: 1 };
    const rewatches = diary.filter(d => d[rewatchKey]?.toLowerCase() === 'yes');
    if (!rewatches.length) return { name: 'No rewatches yet!', count: 1 };
    const counts = rewatches.reduce((acc, f) => { acc[f[filmKey]] = (acc[f[filmKey]] || 1) + 1; return acc; }, {});
    const top = Object.entries(counts).reduce((max, cur) => cur[1] > max[1] ? cur : max, [null, 0]);
    return { name: top[0], count: top[1] };
  }, [diary, rewatchKey, filmKey]);

  const rewatchRatio = useMemo(() => {
    const total = diary.length;
    if (!total) return { rewatches: 0, new: 0 };
    const rc = rewatchKey ? diary.filter(d => d[rewatchKey]?.toLowerCase() === 'yes').length : 0;
    return { rewatches: rc, new: total - rc };
  }, [diary, rewatchKey]);

  // ── TMDB-dependent: directors, stars, all-star cast ────────────────────
  const topDirectors = useMemo(() => {
    if (!enrichedData) return [];
    const counts = {};
    enrichedData.forEach(m => { if (m.director && m.director !== 'Unknown') counts[m.director] = (counts[m.director] || 0) + 1; });
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [enrichedData]);

  const mostWatchedStars = useMemo(() => {
    if (!enrichedData) return [];
    const actorCounts = {};
    enrichedData.forEach(m => {
      (m.cast || []).forEach(actor => {
        if (!actorCounts[actor.name]) actorCounts[actor.name] = { count: 0, profile_path: actor.profile_path };
        actorCounts[actor.name].count++;
      });
    });
    return Object.entries(actorCounts)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count).slice(0, 10);
  }, [enrichedData]);

  const allStarCast = useMemo(() => {
    if (!enrichedData || !ratings.length || !ratingField) return [];
    const ratingsMap = ratings.reduce((m, r) => { m[r[filmKey]] = parseFloat(r[ratingField]); return m; }, {});
    const actorRatings = {};
    enrichedData.forEach(m => {
      const mr = ratingsMap[m[filmKey]];
      if (m.cast && mr) m.cast.forEach(actor => {
        if (!actorRatings[actor.name]) actorRatings[actor.name] = { ratings: [], profile_path: actor.profile_path };
        actorRatings[actor.name].ratings.push(mr);
      });
    });
    return Object.entries(actorRatings)
      .filter(([, d]) => d.ratings.length >= 3)
      .map(([name, d]) => ({ name, profile_path: d.profile_path, avgRating: d.ratings.reduce((s, r) => s + r, 0) / d.ratings.length, filmCount: d.ratings.length }))
      .sort((a, b) => b.avgRating - a.avgRating).slice(0, 5);
  }, [enrichedData, ratings, ratingField, filmKey]);

  const countryData = useMemo(() => {
    if (!enrichedData) return null;
    const counts = {};
    enrichedData.forEach(m => (m.countries || []).forEach(c => { counts[c] = (counts[c] || 0) + 1; }));
    return { counts: Object.fromEntries(Object.entries(counts).map(([k, v]) => [k, { count: v }])) };
  }, [enrichedData]);

  // ── Misc stats ──────────────────────────────────────────────────────────
  const longestStreak = useMemo(() => {
    const dates = [...new Set(diary.map(d => d[watchedDateKey]))]
      .map(s => parseYMD(s)).filter(d => d && !isNaN(d)).sort((a, b) => a - b);
    if (dates.length < 2) return dates.length;
    let max = 1, cur = 1;
    for (let i = 1; i < dates.length; i++) {
      const diff = (dates[i] - dates[i - 1]) / 86400000;
      if (diff === 1) cur++; else { max = Math.max(max, cur); cur = 1; }
    }
    return Math.max(max, cur);
  }, [diary, watchedDateKey]);

  const bingeWatchCount = useMemo(() => {
    const counts = diary.reduce((acc, e) => { const d = e[watchedDateKey]; if (d) acc[d] = (acc[d] || 0) + 1; return acc; }, {});
    return Math.max(0, ...Object.values(counts));
  }, [diary, watchedDateKey]);

  const primeTimeYear = useMemo(() => {
    if (!diary.length || !yearKey) return 'N/A';
    const years = diary.map(f => parseInt(f[yearKey], 10)).filter(y => !isNaN(y));
    if (!years.length) return 'N/A';
    return Math.round(years.reduce((s, y) => s + y, 0) / years.length);
  }, [diary, yearKey]);

  const averageLoggingLag = useMemo(() => {
    const loggedKey  = diaryKeys.find(k => /^Date$/i.test(k));
    const watchedKey = diaryKeys.find(k => /Watched Date/i.test(k));
    if (!loggedKey || !watchedKey) return 0;
    const lags = diary
      .map(e => { const l = parseYMD(e[loggedKey]); const w = parseYMD(e[watchedKey]); if (!l || !w) return null; const d = (l - w) / 86400000; return d >= 0 ? d : null; })
      .filter(l => l !== null);
    return lags.length ? lags.reduce((s, l) => s + l, 0) / lags.length : 0;
  }, [diary, diaryKeys]);

  // ── Word cloud data ─────────────────────────────────────────────────────
  const wordCloudData = useMemo(() => {
    const commentKey = diaryKeys.find(k => /comment|entry|notes|text/i.test(k));
    const reviewKey  = Object.keys(reviews[0] || {}).find(k => /review|text/i.test(k));
    const texts = [
      ...diary.map(d => (commentKey && d[commentKey]) || ''),
      ...reviews.map(r => (reviewKey && r[reviewKey]) || ''),
    ].join(' ')
      .toLowerCase()
      .replace(/[^a-z\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);

    const freq = texts.reduce((m, w) => { m[w] = (m[w] || 0) + 1; return m; }, {});

    // Return ALL words with frequency — WordCloudD3 handles stopword filtering
    return Object.entries(freq)
      .filter(([w]) => w.length > 2)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 150)
      .map(([text, value]) => ({ text, value }));
  }, [diary, reviews, diaryKeys]);

  return {
    // field keys
    filmKey, watchedDateKey, rewatchKey, yearKey, ratingField,
    // counts
    totalWatched, rewatchedCount, lovedCount, totalRated, averageRating, reviewsWritten,
    // timeline
    firstWatch, lastWatch, firstMovie, lastMovie,
    // chart data
    monthlyActivity, monthlyRatings, ratingDistribution, favoriteFilmsData,
    prolificMonth, busiestDay, biggestRatingChange, yearsData, decadeRatings,
    mostRewatched, rewatchRatio,
    // TMDB-dependent
    topDirectors, mostWatchedStars, allStarCast, countryData,
    // misc
    longestStreak, bingeWatchCount, primeTimeYear, averageLoggingLag,
    wordCloudData,
  };
}
