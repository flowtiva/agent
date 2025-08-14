
import React from 'react';

type ContentCardProps = {
  title?: string;
  content: string;
  imageUrl?: string;
  onClose: () => void;
};

export function ContentCard({
  title,
  content,
  imageUrl,
  onClose,
}: ContentCardProps) {
  return (
    <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)] shadow-2xl max-w-lg w-full overflow-hidden relative flex flex-col animate-in fade-in zoom-in-95 duration-300">
      {imageUrl && (
        <div className="relative">
          <img
            src={imageUrl}
            alt={title || "Displayed content"}
            className="w-full h-56 object-cover"
          />
           <button
            onClick={onClose}
            className="absolute top-3 right-3 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 z-10 transition-colors flex items-center justify-center"
            aria-label="Close content"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
      )}
      <div className="p-6 flex-grow">
        {!imageUrl && (
            <button
            onClick={onClose}
            className="absolute top-3 right-3 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded-full p-1.5 z-10 transition-colors flex items-center justify-center"
            aria-label="Close content"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        )}
        {title && <h2 className="mb-2 text-2xl font-bold text-[var(--text-primary)]">{title}</h2>}
        <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-[var(--text-secondary)] leading-relaxed">
          {content}
        </div>
      </div>
    </div>
  );
}