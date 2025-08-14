
import React from 'react';

type WeatherCardProps = {
  location: string;
  temperature: string;
  condition: string;
  onClose: () => void;
};

// A function to get a representative icon even if the condition isn't an exact match.
const getWeatherIcon = (condition: string) => {
  const lowerCaseCondition = condition.toLowerCase();
  if (lowerCaseCondition.includes('sun') || lowerCaseCondition.includes('clear')) return 'sunny';
  if (lowerCaseCondition.includes('cloud')) return 'cloudy';
  if (lowerCaseCondition.includes('rain') || lowerCaseCondition.includes('shower')) return 'rainy';
  if (lowerCaseCondition.includes('storm')) return 'thunderstorm';
  if (lowerCaseCondition.includes('snow')) return 'ac_unit';
  if (lowerCaseCondition.includes('wind')) return 'air';
  // Default icon
  return 'thermostat';
};

export function WeatherCard({ location, temperature, condition, onClose }: WeatherCardProps) {
  const iconName = getWeatherIcon(condition);

  return (
    <div className="bg-[var(--bg-secondary)] p-8 rounded-2xl border border-[var(--border-primary)] shadow-2xl flex flex-col items-center gap-4 w-80 max-w-full animate-in fade-in zoom-in-95 duration-300 relative">
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
        aria-label="Close weather card"
      >
        <span className="material-symbols-outlined">close</span>
      </button>

      <div className="text-center">
        <h3 className="text-2xl font-bold text-[var(--text-primary)]">{location}</h3>
        <p className="text-lg text-[var(--text-secondary)]">{condition}</p>
      </div>
      
      <div className="my-4">
        <span className="material-symbols-outlined !text-9xl text-[var(--text-accent)]">
          {iconName}
        </span>
      </div>

      <div className="font-mono text-7xl font-bold text-[var(--text-primary)]">
        {temperature}°
      </div>
    </div>
  );
}