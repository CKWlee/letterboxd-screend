// src/BingeWatchTile.jsx
import React from 'react';

export default function BingeWatchTile({ count }) {
  return (
    <div className="stat-card">
      <h3>Top Binge</h3>
      <div className="prolific-month-value">
        <p className="stat-value">{count}</p>
        <p className="prolific-month-count">
          {count === 1 ? 'Film in a Day' : 'Films in a Day'}
        </p>
      </div>
    </div>
  );
}
