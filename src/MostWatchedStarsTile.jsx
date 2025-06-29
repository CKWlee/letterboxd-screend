import React from 'react';

// A placeholder image for actors without a profile picture
const placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"%3E%3Cpath fill="%23ccc" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/%3E%3C/svg%3E';

export default function MostWatchedStarsTile({ data, status }) {
  if (status === 'loading') {
    return <div className="list-card"><h2>Your Most Watched Stars</h2><p>Analyzing cast lists...</p></div>;
  }
  if (status === 'error' || !data || data.length === 0) {
    return <div className="list-card"><h2>Your Most Watched Stars</h2><p>Could not retrieve actor data.</p></div>;
  }

  return (
    <div className="list-card actor-tile">
      <h2>Your Most Watched Stars</h2>
      <ol className="actor-list">
        {data.map((actor, index) => (
          <li key={index} className="actor-list-item">
            <img
              src={actor.profile_path ? `https://image.tmdb.org/t/p/w92${actor.profile_path}` : placeholder}
              alt={actor.name}
              className="actor-profile-pic"
            />
            <span className="actor-name">{actor.name}</span>
            <span className="actor-count">{actor.count} films</span>
          </li>
        ))}
      </ol>
    </div>
  );
}