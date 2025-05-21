const TMDB_API_KEY = 'a68e2fa8912aacee771329a6e327b7b3';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

async function fetchTMDBId(title, year) {
  const url = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&year=${year}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.results && data.results.length > 0) {
    return data.results[0].id;
  }
  return null;
}

async function fetchMovieDetails(tmdbId) {
  const url = `${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}`;
  const res = await fetch(url);
  return await res.json();
}

async function fetchMovieCredits(tmdbId) {
  const url = `${TMDB_BASE_URL}/movie/${tmdbId}/credits?api_key=${TMDB_API_KEY}`;
  const res = await fetch(url);
  return await res.json();
}

export async function enrichMoviesWithTMDB(movies) {
  const enriched = [];
  for (const movie of movies) {
    try {
      const tmdbId = await fetchTMDBId(movie.Name, movie.Year);
      if (!tmdbId) {
        enriched.push({ ...movie, director: 'Unknown', genres: [] });
        continue;
      }
      const [details, credits] = await Promise.all([
        fetchMovieDetails(tmdbId),
        fetchMovieCredits(tmdbId)
      ]);
      const director = credits.crew?.find(person => person.job === 'Director')?.name || 'Unknown';
      const genres = details.genres?.map(g => g.name) || [];
      enriched.push({ ...movie, director, genres });
    } catch (err) {
      enriched.push({ ...movie, director: 'Unknown', genres: [] });
    }
    // Respect TMDB rate limits
    await new Promise(r => setTimeout(r, 250));
  }
  return enriched;
}
