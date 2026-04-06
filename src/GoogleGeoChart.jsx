import React from 'react';
import { Chart } from 'react-google-charts';

export default function GoogleGeoChart({ data, status, progress }) {
  if (status === 'loading' || status === 'idle') {
    const message = progress > 0 ? `Enriching data... ${progress}%` : 'Mapping your movie world...';
    return (
      <div className="chart-card">
        <h2>your cinematic world tour</h2>
        <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9a8e7f' }}>
          <p>{message}</p>
        </div>
      </div>
    );
  }

  if (status === 'error' || !data || !data.counts) {
    return (
      <div className="chart-card">
        <h2>your cinematic world tour</h2>
        <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9a8e7f' }}>
          <p>Could not retrieve country data.</p>
        </div>
      </div>
    );
  }

  const chartData = [['Country', 'Movies Watched']];
  for (const countryCode in data.counts) {
    chartData.push([countryCode, data.counts[countryCode].count]);
  }

  return (
    <div className="chart-card">
      <h2>your cinematic world tour</h2>
      <p style={{
        margin: '0 0 15px 0',
        fontSize: '14px',
        color: '#9a8e7f',
        fontStyle: 'italic'
      }}>
        countries colored by number of films watched
      </p>
      <Chart
        chartType="GeoChart"
        width="100%"
        height="400px"
        data={chartData}
        options={{
          colorAxis: { colors: ['#2a2318', '#e09f3e'] },
          backgroundColor: '#141210',
          datalessRegionColor: '#1c1916',
          defaultColor: '#1c1916',
          tooltip: {
            textStyle: { color: '#e8e0d4', fontSize: 13 },
          },
        }}
      />
    </div>
  );
}
