// src/StreakTile.jsx
import React from 'react';

export default function StreakTile({ streak }) {
  return (
    <div className="stat-card">
      <h3>Longest Streak</h3>
      <div className="prolific-month-value">
        <p className="stat-value">{streak}</p>
        <p className="prolific-month-count">
          {streak === 1 ? 'Day' : 'Consecutive Days'}
        </p>
      </div>
    </div>
  );
}