// src/TopDirectorsTile.jsx
import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip" style={{ background: 'white', padding: '5px 10px', border: '1px solid #ccc', borderRadius: '6px' }}>
        <p className="label">{`${payload[0].payload.name} : ${payload[0].value} films`}</p>
      </div>
    );
  }
  return null;
};

export default function TopDirectorsTile({ data, status }) {
  const renderContent = () => {
    switch (status) {
      case 'loading':
        return <p>Fetching director data...</p>;
      case 'error':
        return <p style={{color: '#c0392b'}}>Could not fetch director data. Please check your API key or network.</p>;
      case 'success':
        return (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart layout="vertical" data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(206, 191, 255, 0.2)' }} />
              <Legend />
              <Bar dataKey="count" name="Films Watched" fill="#8884d8" barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        );
      default:
        return <p>Preparing to fetch director data...</p>;
    }
  };

  return (
    <div className="chart-card">
      <h2>Top Directors</h2>
      {renderContent()}
    </div>
  );
}