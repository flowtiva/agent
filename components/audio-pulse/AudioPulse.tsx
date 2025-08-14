
import React, { useEffect, useRef } from "react";

export type AudioPulseProps = {
  active: boolean;
  volume: number;
};

export default function AudioPulse({ active, volume }: AudioPulseProps) {
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const update = () => {
      lineRefs.current.forEach((line, i) => {
        if (line) {
          const height = Math.min(24, 4 + volume * (i === 1 ? 400 : 200));
          line.style.height = `${height}px`;
        }
      });
    };
    
    // Using rAF for smoother animations tied to browser rendering cycle
    let animationFrameId: number;
    const animate = () => {
        update();
        animationFrameId = requestAnimationFrame(animate);
    }
    animate();

    return () => cancelAnimationFrame(animationFrameId);
  }, [volume]);

  const baseClasses = "w-1 rounded-full transition-all duration-100 ease-out";
  const colorClass = active ? "bg-blue-500" : "bg-gray-400 dark:bg-gray-500";

  return (
    <div className="flex items-center justify-center gap-1 h-6 w-6">
      {Array(3).fill(null).map((_, i) => (
          <div
            key={i}
            ref={(el) => { lineRefs.current[i] = el; }}
            className={`${baseClasses} ${colorClass}`}
            style={{ height: '4px' }}
          />
        ))}
    </div>
  );
}
