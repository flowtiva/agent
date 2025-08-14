
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
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xl flex flex-col items-center gap-4 w-72 max-w-full animate-in fade-in zoom-in-95 duration-300 relative">
      <button
        onClick={onFinish}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        aria-label="Close timer"
      >
        <span className="material-symbols-outlined">close</span>
      </button>

      {title && <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>}
      
      <div className="font-mono text-5xl font-bold text-blue-600 dark:text-blue-400">
        {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
      </div>
      
      <div className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div 
          className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-1000 linear" 
          style={{ width: `${progress}%` }} 
        />
      </div>
    </div>
  );
}
