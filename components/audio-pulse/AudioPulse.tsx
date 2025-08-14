
import React, { useEffect, useRef } from "react";

export type AudioPulseProps = {
  active: boolean;
  volume: number;
};

export default function AudioPulse({ active, volume }: AudioPulseProps) {
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lastVolume = useRef(0);

  useEffect(() => {
    const update = () => {
      // Smooth the volume change
      lastVolume.current = lastVolume.current * 0.7 + volume * 0.3;
      
      lineRefs.current.forEach((line, i) => {
        if (line) {
          const height = Math.max(4, Math.min(24, lastVolume.current * 400));
          const scaleMap = [0.8, 1.0, 0.8]; // Middle bar is tallest
          line.style.transform = `scaleY(${height * scaleMap[i] / 24})`;
        }
      });
    };
    
    let animationFrameId: number;
    const animate = () => {
        update();
        animationFrameId = requestAnimationFrame(animate);
    }
    animate();

    return () => cancelAnimationFrame(animationFrameId);
  }, [volume]);

  const baseClasses = "w-1.5 rounded-full transition-transform duration-100 ease-out h-6 origin-center";
  const colorClass = active ? "bg-[var(--text-accent)]" : "bg-[var(--border-secondary)]";

  return (
    <div className="flex items-center justify-center gap-1.5 h-6 w-8">
      {Array(3).fill(null).map((_, i) => (
          <div
            key={i}
            ref={(el) => { lineRefs.current[i] = el; }}
            className={`${baseClasses} ${colorClass}`}
            style={{ transform: 'scaleY(0.1)' }}
          />
        ))}
    </div>
  );
}