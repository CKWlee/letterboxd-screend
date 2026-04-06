import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
const COLORS = ['#e09f3e', '#c97b6b'];

export default function RewatchAnalysisTile({ mostRewatched, rewatchRatio }) {
  const data = [
    { name: 'New', value: rewatchRatio.new },
    { name: 'Rewatch', value: rewatchRatio.rewatches },
  ];

  return (
    <div className="chart-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h2 style={{ alignSelf: 'flex-start' }}>Rewatch Stats</h2>

      {/* Most Rewatched Film Section */}
      <div style={{ textAlign: 'center', margin: '15px 0' }}>
        <p style={{ margin: 0, color: '#9a8e7f', fontSize: '0.9rem' }}>You Couldn't Get Enough Of</p>
        <p style={{ margin: '5px 0', fontWeight: 'bold', fontSize: '1.2rem', color: '#e8e0d4' }}>
          {mostRewatched.name || 'N/A'}
        </p>
        <p style={{ margin: 0, color: '#6b6156', fontSize: '0.85rem' }}>
          (Watched {mostRewatched.count} times)
        </p>
      </div>

      {/* Pie Chart Section */}
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={60}
            fill="#8884d8"
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Legend iconSize={10} wrapperStyle={{ fontSize: '0.9rem' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}