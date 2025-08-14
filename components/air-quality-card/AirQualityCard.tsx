
import React from 'react';

type AirQualityCardProps = {
  location: string;
  aqi: number;
  level: string;
  onClose: () => void;
};

const getAqiColor = (level: string) => {
    switch(level) {
        case 'Good': return 'text-green-500';
        case 'Fair': return 'text-yellow-500';
        case 'Moderate': return 'text-orange-500';
        case 'Poor': return 'text-red-500';
        case 'Very Poor': return 'text-purple-500';
        case 'Extremely Poor': return 'text-maroon-500'; // No direct tailwind color
        default: return 'text-[var(--text-secondary)]';
    }
}

export function AirQualityCard({ location, aqi, level, onClose }: AirQualityCardProps) {
  const colorClass = getAqiColor(level);

  return (
    <div className="bg-[var(--bg-secondary)] p-8 rounded-2xl border border-[var(--border-primary)] shadow-2xl flex flex-col items-center gap-4 w-80 max-w-full animate-in fade-in zoom-in-95 duration-300 relative">
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
        aria-label="Close air quality card"
      >
        <span className="material-symbols-outlined">close</span>
      </button>

      <div className="text-center">
        <h3 className="text-2xl font-bold text-[var(--text-primary)]">{location}</h3>
        <p className="text-lg text-[var(--text-secondary)]">Air Quality</p>
      </div>
      
      <div className="my-4 flex flex-col items-center">
         <span className={`material-symbols-outlined !text-8xl ${colorClass}`}>
          air
        </span>
        <p className={`text-xl font-bold ${colorClass}`}>{level}</p>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="font-mono text-7xl font-bold text-[var(--text-primary)]">{aqi}</span>
         <span className="font-semibold text-xl text-[var(--text-secondary)]">AQI</span>
      </div>
    </div>
  );
}