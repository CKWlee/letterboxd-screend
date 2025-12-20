// src/AllStarCastTile.jsx
import React from 'react';
import { ACTOR_PLACEHOLDER } from './constants';

// Simple component to render star icons
const StarRating = ({ rating }) => (
  <span className="star-rating">{rating.toFixed(1)} ★</span>
);

export default function AllStarCastTile({ data, status }) {
  if (status === 'loading') {
    return <div className="list-card"><h2>Your All-Star Cast</h2><p>Calculating your favorite actors...</p></div>;
  }
  if (status === 'error' || !data || data.length === 0) {
    return <div className="list-card"><h2>Your All-Star Cast</h2><p>Not enough rated films to determine an all-star cast.</p></div>;
  }

  return (
    <div className="list-card actor-tile">
      <h2>Your All-Star Cast</h2>
      {/* ** THE FIX IS HERE ** */}
      <p className="tile-subtitle">(Excludes voice roles; min. 3 rated films)</p>
      <ol className="actor-list">
        {data.map((actor, index) => (
          <li key={index} className="actor-list-item">
            <img
              src={actor.profile_path ? `https://image.tmdb.org/t/p/w92${actor.profile_path}` : ACTOR_PLACEHOLDER}
              alt={actor.name}
              className="actor-profile-pic"
            />
            <span className="actor-name">{actor.name}</span>
            <StarRating rating={actor.avgRating} />
          </li>
        ))}
      </ol>
    </div>
  );
}