// src/RatingChangeTile.jsx
import React from 'react';

export default function RatingChangeTile({ changeInfo }) {
  // Destructure the data with default values to prevent errors
  const {
    name = 'N/A',
    oldRating = 0,
    newRating = 0,
    change = 0
  } = changeInfo || {};

  // Don't render the tile if no significant change was found
  if (change === 0) {
    return (
      <div className="stat-card">
        <h3>Biggest Opinion Change</h3>
        <p className="no-change-text">No significant rating changes found on rewatches.</p>
      </div>
    );
  }

  return (
    <div className="stat-card">
      <h3>Biggest Opinion Change</h3>
      <div className="rating-change-content">
        <p className="rating-change-film-title">{name}</p>
        <div className="rating-change-values">
          <span className="rating-value">{oldRating.toFixed(1)}★</span>
          <span className="rating-arrow">→</span>
          <span className="rating-value">{newRating.toFixed(1)}★</span>
        </div>
      </div>
    </div>
  );
}