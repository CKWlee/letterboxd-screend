// src/GoToRatingTile.jsx
import React from 'react';

export default function GoToRatingTile({ rating, count }) {
  return (
    <div className="stat-card">
      <h3>Your Go-To Rating</h3>
      <div className="prolific-month-value">
        <p className="stat-value">{rating} ★</p>
        <p className="prolific-month-count">Used {count} times</p>
      </div>
    </div>
  );
}