// src/utils/tmdb.js

const please_dont_copy_this = 'a68e2fa8912aacee771329a6e327b7b3';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const SHORT_FILM_RUNTIME_THRESHOLD = 40; // Runtime in minutes

async function fetchTMDBId(title, year) {
  const url = `${TMDB_BASE_URL}/search/movie?api_key=${please_dont_copy_this}&query=${encodeURIComponent(title)}&year=${year}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`TMDB search failed for "${title}": ${res.status} ${res.statusText}`);
    return null;
  }
  const data = await res.json();
  if (data.results && data.results.length > 0) {
    return data.results[0].id;
  }
  return null;
}

async function fetchMovieDetails(tmdbId) {
  const url = `${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${please_dont_copy_this}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`TMDB details fetch failed for ID "${tmdbId}": ${res.status} ${res.statusText}`);
    return {};
  }
  return await res.json();
}

async function fetchMovieCredits(tmdbId) {
  const url = `${TMDB_BASE_URL}/movie/${tmdbId}/credits?api_key=${please_dont_copy_this}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`TMDB credits fetch failed for ID "${tmdbId}": ${res.status} ${res.statusText}`);
    return {};
  }
  return await res.json();
}

export async function enrichMoviesWithTMDB(movies, onProgress, filmKey, yearKey) {
  const enriched = [];
  const BATCH_SIZE = 40;

  for (let i = 0; i < movies.length; i += BATCH_SIZE) {
    const batch = movies.slice(i, i + BATCH_SIZE);
    
    const promises = batch.map(async (movie) => {
      try {
        const title = movie[filmKey];
        const year = movie[yearKey];

        if (!title || !year) {
            return null;
        }

        const tmdbId = await fetchTMDBId(title, year);
        if (!tmdbId) {
          return null;
        }
        
        const [details, credits] = await Promise.all([
          fetchMovieDetails(tmdbId),
          fetchMovieCredits(tmdbId)
        ]);

        // ** THE FIX IS HERE **
        // If the runtime is below the threshold, exclude it from the results.
        if (details.runtime && details.runtime < SHORT_FILM_RUNTIME_THRESHOLD) {
          console.log(`Excluding short film: ${title} (${details.runtime} mins)`);
          return null;
        }
        
        const director = credits.crew?.find(p => p.job === 'Director')?.name || 'Unknown';
        const genres = details.genres?.map(g => g.name) || [];
        
        const cast = credits.cast
          ?.filter(actor => 
            actor.known_for_department === 'Acting' && 
            !actor.character.toLowerCase().includes('(voice)')
          )
          .map(a => ({ name: a.name, profile_path: a.profile_path })) || [];

        const countries = details.production_countries?.map(c => c.iso_3166_1) || [];

        return { ...movie, director, genres, cast, countries };
      } catch (err) {
        console.error(`Failed to enrich movie: ${movie[filmKey]}. Reason:`, err);
        return null; // Exclude movies that cause an error
      }
    });

    const batchResults = await Promise.all(promises);
    enriched.push(...batchResults);
    
    const progress = Math.round(((i + batch.length) / movies.length) * 100);
    onProgress(progress);

    if (i + BATCH_SIZE < movies.length) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  // Filter out any null values (short films or errors) from the final array
  return enriched.filter(Boolean);
}