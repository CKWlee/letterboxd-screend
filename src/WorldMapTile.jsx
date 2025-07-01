import React, { useState, memo } from 'react';
import { ComposableMap, Geographies, Geography, Sphere, Graticule } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import { Tooltip as ReactTooltip } from 'react-tooltip';

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

const WorldMapTile = ({ data, status, progress }) => {
  const [tooltipContent, setTooltipContent] = useState('');

  if (status === 'loading' || status === 'idle') {
    const message = progress > 0 ? `Enriching data... ${progress}%` : 'Mapping your movie world...';
    return (
      <div className="chart-card">
        <h2>Your Cinematic World Tour</h2>
        <div style={{
          height: '300px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#666',
          fontSize: '16px'
        }}>
          <p>{message}</p>
        </div>
      </div>
    );
  }

  if (status === 'error' || !data || !data.counts) {
    return (
      <div className="chart-card">
        <h2>Your Cinematic World Tour</h2>
        <div style={{
          height: '300px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#666',
          fontSize: '16px'
        }}>
          <p>Could not retrieve country data.</p>
        </div>
      </div>
    );
  }

  const colorScale = scaleLinear()
    .domain([0, data.maxCount])
    .range(['#E6E6FA', '#5E35B1']);

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
      
      <div
        data-tooltip-id="map-tooltip"
        style={{
          width: '100%',
          height: '300px',
          overflow: 'hidden',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          backgroundColor: '#f8f9fa'
        }}
      >
        <ComposableMap
          width={800}
          height={300}
          projectionConfig={{
            rotate: [-10, 0, 0],
            scale: 120
          }}
          style={{
            width: '100%',
            height: '100%'
          }}
        >
          <Sphere stroke="#E4E5E6" strokeWidth={0.5} />
          <Graticule stroke="#E4E5E6" strokeWidth={0.5} />
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map(geo => {
                const countryCode = geo.properties.ISO_A2;
                const d = data.counts[countryCode];
                
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={d ? colorScale(d.count) : '#F5F4F6'}
                    stroke="#FFFFFF"
                    strokeWidth={0.5}
                    onMouseEnter={() => {
                      const name = geo.properties.NAME;
                      const count = d ? d.count : 0;
                      setTooltipContent(`${name} — ${count} film${count !== 1 ? 's' : ''}`);
                    }}
                    onMouseLeave={() => {
                      setTooltipContent('');
                    }}
                    style={{
                      default: { outline: 'none' },
                      hover: {
                        fill: '#C5A3FF',
                        outline: 'none',
                        cursor: 'pointer'
                      },
                      pressed: {
                        fill: '#8A2BE2',
                        outline: 'none'
                      },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>
      </div>
      
      <ReactTooltip
        id="map-tooltip"
        content={tooltipContent}
        place="top"
        style={{
          backgroundColor: '#333',
          color: '#fff',
          borderRadius: '4px',
          padding: '8px 12px',
          fontSize: '12px'
        }}
      />
    </div>
  );
};

export default memo(WorldMapTile);