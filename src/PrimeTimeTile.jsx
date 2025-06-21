// src/PrimeTimeTile.jsx
import React from 'react';

export default function PrimeTimeTile({ year }) {
  return (
    <div className="stat-card">
      <h3>Your Prime Time</h3>
      <div className="prolific-month-value">
        <p className="stat-value">{year}</p>
        <p className="prolific-month-count">
          Avg. Film Year
        </p>
      </div>
    </div>
  );
}