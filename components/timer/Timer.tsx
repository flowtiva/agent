
import React, { useEffect, useRef, useState } from "react";

type TimerProps = {
  duration: number; // in seconds
  title?: string;
  onFinish: () => void;
};

export function Timer({ duration, title, onFinish }: TimerProps) {
  const [remaining, setRemaining] = useState(duration);
  const onFinishRef = useRef(onFinish);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    setRemaining(duration);
  }, [duration]);

  useEffect(() => {
    if (remaining <= 0) {
      onFinishRef.current();
      return;
    }

    const timerId = setTimeout(() => {
      setRemaining(remaining - 1);
    }, 1000);

    return () => clearTimeout(timerId);
  }, [remaining]);

  const progress = ((duration - remaining) / duration) * 100;
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <div className="bg-[var(--bg-secondary)] p-8 rounded-2xl border border-[var(--border-primary)] shadow-2xl flex flex-col items-center gap-6 w-80 max-w-full animate-in fade-in zoom-in-95 duration-300 relative">
      <button
        onClick={onFinish}
        className="absolute top-3 right-3 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
        aria-label="Close timer"
      >
        <span className="material-symbols-outlined">close</span>
      </button>

      {title && <h3 className="text-xl font-semibold text-[var(--text-primary)]">{title}</h3>}
      
      <div className="font-mono text-6xl font-bold text-[var(--text-accent)] tabular-nums">
        {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
      </div>
      
      <div className="w-full h-2.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
        <div 
          className="h-full bg-[var(--accent-primary)] rounded-full transition-all duration-1000 linear" 
          style={{ width: `${progress}%` }} 
        />
      </div>
    </div>
  );
}