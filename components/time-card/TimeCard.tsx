
import React from 'react';

type TimeCardProps = {
  location: string;
  time: string;
  date: string;
  timezone: string;
  onClose: () => void;
};

export function TimeCard({ location, time, date, timezone, onClose }: TimeCardProps) {
  return (
    <div className="bg-[var(--bg-secondary)] p-8 rounded-2xl border border-[var(--border-primary)] shadow-2xl flex flex-col items-center gap-4 w-96 max-w-full animate-in fade-in zoom-in-95 duration-300 relative">
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
        aria-label="Close time card"
      >
        <span className="material-symbols-outlined">close</span>
      </button>
      
      <div className="text-center">
        <h3 className="text-2xl font-bold text-[var(--text-primary)]">{location}</h3>
        <p className="text-md text-[var(--text-secondary)]">{date}</p>
      </div>
      
      <div className="font-mono text-8xl font-bold text-[var(--text-accent)] tabular-nums my-4">
        {time}
      </div>

      <div className="text-lg text-[var(--text-tertiary)] font-semibold">
          {timezone}
      </div>
    </div>
  );
}