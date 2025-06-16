// src/LoggingLagTile.jsx
import React from 'react';

export default function LoggingLagTile({ averageLag }) {
  // Format the number to have one decimal place
  const displayLag = averageLag.toFixed(1);

  return (
    <div className="stat-card">
      <h3>Average Logging Delay</h3>
      <div className="lag-value-container">
        <p className="stat-value lag-value">{displayLag}</p>
        <p className="lag-label">Days</p>
      </div>
    </div>
  );
}