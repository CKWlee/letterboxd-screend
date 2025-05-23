import React from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import './HeatmapTile.css';

const HeatmapTile = ({ watchedDates }) => {
  // 1. Count how many times each date appears
  const countsByDate = watchedDates.reduce((acc, date) => {
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});
  const values = Object.entries(countsByDate).map(([date, count]) => ({ date, count }));

  // 2. Define your 1-year range
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setFullYear(startDate.getFullYear() - 1);

  // 3. Map counts to CSS classes
  const classForValue = value => {
    if (!value || value.count === 0) return 'color-empty';
    if (value.count < 2) return 'color-scale-1';
    if (value.count < 4) return 'color-scale-2';
    if (value.count < 6) return 'color-scale-3';
    return 'color-scale-4';
  };

  // 4. Legend buckets
  const legendItems = [
    { label: '0',      className: 'color-empty'   },
    { label: '1',      className: 'color-scale-1' },
    { label: '2–3',    className: 'color-scale-2' },
    { label: '4–5',    className: 'color-scale-3' },
    { label: '6+',     className: 'color-scale-4' },
  ];

  return (
    <div className="heatmap-tile">
      <h3>Activity Heatmap</h3>

      <CalendarHeatmap
        startDate={startDate}
        endDate={endDate}
        values={values}
        classForValue={classForValue}
        tooltipDataAttrs={value => ({
          'data-tip': value.date
            ? `${value.count} watches on ${value.date}`
            : 'No activity'
        })}
        showWeekdayLabels
      />

      <div className="heatmap-legend">
        {legendItems.map((item, i) => (
          <div key={i} className="legend-item">
            <span className={`legend-color ${item.className}`} />
            <span className="legend-label">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HeatmapTile;
