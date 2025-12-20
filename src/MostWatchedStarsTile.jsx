import React from 'react';
import { ACTOR_PLACEHOLDER } from './constants';

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
              src={actor.profile_path ? `https://image.tmdb.org/t/p/w92${actor.profile_path}` : ACTOR_PLACEHOLDER}
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