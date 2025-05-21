// src/GenreDistribution.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';

const PIE_COLORS = [
  '#3366CC', '#DC3912', '#FF9900', '#109618',
  '#990099', '#3B3EAC', '#0099C6', '#DD4477',
  '#66AA00', '#B82E2E'
];

export default function GenreDistribution({ watched }) {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const apiKey = import.meta.env.VITE_TMDB_API_KEY;
    if (!apiKey) {
      setError('Missing VITE_TMDB_API_KEY');
      setLoading(false);
      return;
    }

    // detect whether user supplied a v4 Bearer token or a v3 API key
    const isBearer = apiKey.length > 40;
    const headers = isBearer
      ? { Authorization: `Bearer ${apiKey}` }
      : {};
    const baseParams = isBearer
      ? {}
      : { api_key: apiKey };

    // figure out which field holds your movie title
    const titleKey = Array.isArray(watched) && watched[0]
      ? Object.keys(watched[0]).find((k) => /film|movie|title/i.test(k))
      : 'title';

    async function load() {
      try {
        // 1) fetch the master genre list
        const genreRes = await axios.get(
          'https://api.themoviedb.org/3/genre/movie/list',
          { headers, params: baseParams }
        );
        const genreMap = {};
        genreRes.data.genres.forEach((g) => {
          genreMap[g.id] = g.name;
        });

        // 2) search each watched title & tally genre_ids
        const counts = {};
        for (const item of watched || []) {
          const title = String(item[titleKey] || '').trim();
          if (!title) continue;

          const searchRes = await axios.get(
            'https://api.themoviedb.org/3/search/movie',
            {
              headers,
              params: { ...baseParams, query: title }
            }
          );
          const hit = searchRes.data.results?.[0];
          (hit?.genre_ids || []).forEach((id) => {
            const name = genreMap[id] || 'Unknown';
            counts[name] = (counts[name] || 0) + 1;
          });
        }

        // 3) build Recharts-friendly array
        const data = Object.entries(counts)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value);

        setChartData(data);
      } catch (e) {
        console.error(e);
        setError('Failed to load genres');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [watched]);

  if (loading) {
    return (
      <div className="chart-card">
        <h2>Genre Distribution</h2>
        <p>Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chart-card">
        <h2>Genre Distribution</h2>
        <p style={{ color: 'red' }}>{error}</p>
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div className="chart-card">
        <h2>Genre Distribution</h2>
        <p>No genres found in your list</p>
      </div>
    );
  }

  return (
    <div className="chart-card">
      <h2>Genre Distribution</h2>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => `${v} films`} />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
