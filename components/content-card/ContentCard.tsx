
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
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xl max-w-md w-full overflow-hidden relative flex flex-col animate-in fade-in zoom-in-95 duration-300">
      <button
        onClick={onClose}
        className="absolute top-2 right-2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1 z-10 transition-colors"
        aria-label="Close content"
      >
        <span className="material-symbols-outlined text-lg">close</span>
      </button>
      {imageUrl && (
        <img
          src={imageUrl}
          alt={title || "Displayed content"}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-6">
        {title && <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>}
        <p className="whitespace-pre-wrap text-gray-600 dark:text-gray-300 leading-relaxed">
          {content}
        </p>
      </div>
    </div>
  );
}
