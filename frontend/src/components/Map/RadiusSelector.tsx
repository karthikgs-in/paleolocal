import React from 'react';
import './RadiusSelector.css';

interface RadiusSelectorProps {
  selectedRadius: number;
  onRadiusChange: (radius: number) => void;
  className?: string;
}

const RADIUS_OPTIONS = [
  { value: 25, label: '25km' },
  { value: 50, label: '50km' },
  { value: 100, label: '100km' },
  { value: 200, label: '200km' },
  { value: 1000, label: '1,000km' },
  { value: 10000, label: '10,000km' }
];

export const RadiusSelector: React.FC<RadiusSelectorProps> = ({
  selectedRadius,
  onRadiusChange,
  className = ''
}) => {
  return (
    <div className={`radius-selector ${className}`}>
      <label className="radius-label">Search Radius:</label>
      <div className="radius-options">
        {RADIUS_OPTIONS.map(option => (
          <button
            key={option.value}
            className={`radius-option ${selectedRadius === option.value ? 'active' : ''}`}
            onClick={() => onRadiusChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};