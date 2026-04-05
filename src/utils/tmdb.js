// src/utils/tmdb.js
// Routes TMDB enrichment through the FastAPI backend so the API key
// never touches the client bundle.

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function enrichMoviesWithTMDB(movies, onProgress, filmKey, yearKey) {
  const enriched = [];
  const BATCH_SIZE = 40;

  for (let i = 0; i < movies.length; i += BATCH_SIZE) {
    const batch = movies.slice(i, i + BATCH_SIZE);

    const promises = batch.map(async (movie) => {
      try {
        const title = movie[filmKey];
        const year  = movie[yearKey];
        if (!title) return null;

        const params = new URLSearchParams({ title });
        if (year) params.set('year', year);

        const res = await fetch(`${API_BASE}/enrich?${params}`);

        // 404 = not found, 422 = short film — both are expected non-errors
        if (res.status === 404 || res.status === 422) return null;
        if (!res.ok) {
          console.error(`Enrichment failed for "${title}": ${res.status}`);
          return null;
        }

        const data = await res.json();
        return { ...movie, ...data };
      } catch (err) {
        console.error(`Failed to enrich "${movie[filmKey]}":`, err);
        return null;
      }
    });

    const batchResults = await Promise.all(promises);
    enriched.push(...batchResults);

    const progress = Math.round(((i + batch.length) / movies.length) * 100);
    onProgress(progress);

    if (i + BATCH_SIZE < movies.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return enriched.filter(Boolean);
}
