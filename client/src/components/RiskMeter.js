import React from 'react';
import './RiskMeter.css';

const RiskMeter = ({ score }) => {
  // Ensure score is between 0 and 1
  const normalizedScore = Math.min(Math.max(score, 0), 1);
  
  // Calculate rotation: -90 to 90 degrees (0 is left, 90 is right, -90 is left)
  // We want -135 to +135 for a 270-degree arc
  const rotation = (normalizedScore * 270) - 135;
  
  // Determine color based on risk level
  let color;
  if (normalizedScore < 0.33) {
    color = '#2ed573'; // Green - Low risk
  } else if (normalizedScore < 0.67) {
    color = '#ffa502'; // Orange - Medium risk
  } else {
    color = '#ff4757'; // Red - High risk
  }

  return (
    <div className="risk-meter">
      <div className="meter-container">
        {/* Gauge background */}
        <svg className="gauge" viewBox="0 0 200 120" preserveAspectRatio="xMidYMid meet">
          {/* Background arc */}
          <defs>
            <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2ed573" />
              <stop offset="50%" stopColor="#ffa502" />
              <stop offset="100%" stopColor="#ff4757" />
            </linearGradient>
          </defs>
          
          {/* Main arc with gradient */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="url(#arcGradient)"
            strokeWidth="8"
            strokeLinecap="round"
          />

          {/* Center circle */}
          <circle cx="100" cy="100" r="5" fill="#333" />

          {/* Needle */}
          <line
            x1="100"
            y1="100"
            x2={100 + 70 * Math.cos((rotation * Math.PI) / 180)}
            y2={100 + 70 * Math.sin((rotation * Math.PI) / 180)}
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            style={{ transition: 'all 0.5s ease' }}
          />

          {/* Tick marks */}
          <g className="ticks">
            <line x1="20" y1="100" x2="15" y2="100" stroke="#ddd" strokeWidth="2" />
            <line x1="180" y1="100" x2="185" y2="100" stroke="#ddd" strokeWidth="2" />
            <line
              x1={100 + 80 * Math.cos((-90 * Math.PI) / 180)}
              y1={100 + 80 * Math.sin((-90 * Math.PI) / 180)}
              x2={100 + 85 * Math.cos((-90 * Math.PI) / 180)}
              y2={100 + 85 * Math.sin((-90 * Math.PI) / 180)}
              stroke="#ddd"
              strokeWidth="2"
            />
          </g>

          {/* Labels */}
          <text x="20" y="115" fontSize="11" fill="#666" textAnchor="middle">
            Low
          </text>
          <text x="100" y="20" fontSize="11" fill="#666" textAnchor="middle">
            High
          </text>
          <text x="180" y="115" fontSize="11" fill="#666" textAnchor="middle">
            Critical
          </text>
        </svg>

        {/* Score display */}
        <div className="score-display">
          <p className="score-value">{(normalizedScore * 100).toFixed(1)}%</p>
          <p className="score-label">Risk Score</p>
        </div>
      </div>

      {/* Legend */}
      <div className="legend">
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#2ed573' }}></span>
          <span>Low Risk (0-33%)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#ffa502' }}></span>
          <span>Medium Risk (33-67%)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#ff4757' }}></span>
          <span>High Risk (67-100%)</span>
        </div>
      </div>
    </div>
  );
};

export default RiskMeter;
