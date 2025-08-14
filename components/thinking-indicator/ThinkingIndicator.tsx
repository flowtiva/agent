
import React from 'react';

export default function ThinkingIndicator() {
  return (
    <div className="flex gap-2 items-center justify-center h-full w-full" aria-label="AI is thinking">
      <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '-0.32s' }} />
      <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '-0.16s' }} />
      <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" />
    </div>
  );
}
