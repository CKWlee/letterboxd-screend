// src/DecadeRatingsTile.jsx
import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

// Custom shape for the bars to have rounded tops
const RoundedBar = (props) => {
  const { x, y, width, height, fill } = props;
  const radius = 6;

  return (
    <g>
      <path d={`M${x},${y + radius} A${radius},${radius},0,0,1,${x + radius},${y} L${x + width - radius},${y} A${radius},${radius},0,0,1,${x + width},${y + radius} L${x + width},${y + height} L${x},${y + height} Z`} fill={fill} />
    </g>
  );
};

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const tooltipStyle = {
      background: 'rgba(255, 255, 255, 0.9)',
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '10px 15px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      fontFamily: "'Montserrat', sans-serif",
    };
    const labelStyle = {
        fontWeight: 'bold',
        marginBottom: '8px',
        color: '#333',
    };
    const pStyle = { margin: '4px 0', color: '#555' };

    return (
      <div style={tooltipStyle}>
        <p style={labelStyle}>{`Decade: ${label}`}</p>
        <p style={pStyle}>{`Avg. Rating: ${data.averageRating.toFixed(2)} ★`}</p>
        <p style={pStyle}>{`Movies Rated: ${data.count}`}</p>
      </div>
    );
  }
  return null;
};


export default function DecadeRatingsTile({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="chart-card">
        <h2>Rating by Decade</h2>
        <p>Not enough rating data to display.</p>
      </div>
    );
  }

  // Colors from your App.css file
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

  return (
    <div className="chart-card">
      <h2>Avg. Rating by Decade</h2>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
          <XAxis dataKey="decade" tick={{ fontFamily: 'Montserrat', fontSize: 12 }} />
          <YAxis domain={[0, 5]} tick={{ fontFamily: 'Montserrat', fontSize: 12 }} />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: 'rgba(206, 191, 255, 0.2)' }}
          />
          <Bar dataKey="averageRating" shape={<RoundedBar />}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}