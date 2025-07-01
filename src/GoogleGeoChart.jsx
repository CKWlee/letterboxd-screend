// src/GoogleGeoChart.jsx
import React from 'react';
import { Chart } from 'react-google-charts';

export default function GoogleGeoChart({ data, status, progress }) {
  if (status === 'loading' || status === 'idle') {
    const message = progress > 0 ? `Enriching data... ${progress}%` : 'Mapping your movie world...';
    return (
      <div className="chart-card">
        <h2>Your Cinematic World Tour</h2>
        <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
          <p>{message}</p>
        </div>
      </div>
    );
  }

  if (status === 'error' || !data || !data.counts) {
    return (
      <div className="chart-card">
        <h2>Your Cinematic World Tour</h2>
        <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
          <p>Could not retrieve country data.</p>
        </div>
      </div>
    );
  }

  // Transform the data for Google GeoChart
  const chartData = [['Country', 'Movies Watched']];
  for (const countryCode in data.counts) {
    chartData.push([countryCode, data.counts[countryCode].count]);
  }

  return (
    <div className="chart-card">
      <h2>Your Cinematic World Tour</h2>
      <p style={{
        margin: '0 0 15px 0',
        fontSize: '14px',
        color: '#666',
        fontStyle: 'italic'
      }}>
        Countries colored by number of films watched
      </p>
      <Chart
        chartType="GeoChart"
        width="100%"
        height="400px"
        data={chartData}
        options={{
          colorAxis: { colors: ['#E6E6FA', '#5E35B1'] }, // Light to dark purple
          backgroundColor: '#f8f9fa',
          datalessRegionColor: '#e0e0e0',
          defaultColor: '#f5f5f5',
        }}
      />
    </div>
  );
}