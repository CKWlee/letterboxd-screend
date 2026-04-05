// tmdb enrichment stuff
import { useState, useEffect } from 'react';
import { enrichMoviesWithTMDB } from '../utils/tmdb';

export function useEnrichment(watched) {
  const [enrichedData,       setEnrichedData]       = useState(null);
  const [enrichmentStatus,   setEnrichmentStatus]   = useState('idle');
  const [enrichmentProgress, setEnrichmentProgress] = useState(0);

  useEffect(() => {
    if (!watched || watched.length === 0 || enrichmentStatus !== 'idle') return;

    const watchedKeys       = Object.keys(watched[0] || {});
    const enrichmentFilmKey = watchedKeys.find(k => /film|movie|title|name/i.test(k)) || 'Name';
    const enrichmentYearKey = watchedKeys.find(k => /^year$/i.test(k) || /release.*year/i.test(k)) || 'Year';

    setEnrichmentStatus('loading');

    enrichMoviesWithTMDB(watched, setEnrichmentProgress, enrichmentFilmKey, enrichmentYearKey)
      .then(enriched => {
        setEnrichedData(enriched);
        setEnrichmentStatus('success');
      })
      .catch(err => {
        console.error('TMDB enrichment failed:', err);
        setEnrichmentStatus('error');
      });
  }, [watched]); // eslint-disable-line react-hooks/exhaustive-deps
  // intentionally omit enrichmentStatus from deps — we only want this to run once per watched array

  return { enrichedData, enrichmentStatus, enrichmentProgress };
}
