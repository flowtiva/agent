
import React from 'react';

export default function ThinkingIndicator() {
  return (
    <div className="flex items-center justify-center h-full w-full" aria-label="AI is thinking">
       <div className="relative flex items-center justify-center w-16 h-16">
        <div className="absolute w-full h-full bg-[var(--text-accent)] rounded-full animate-ping opacity-50"></div>
        <div className="relative w-4 h-4 bg-[var(--text-accent)] rounded-full"></div>
      </div>
    </div>
  );
}