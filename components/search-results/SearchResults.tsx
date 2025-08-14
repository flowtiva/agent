
import React from 'react';

type SearchResultsProps = {
  chunks: any[];
  onClose: () => void;
};

export function SearchResults({ chunks, onClose }: SearchResultsProps) {
  const validChunks = chunks.filter(chunk => chunk.web && chunk.web.uri);

  return (
    <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)] shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95 duration-300">
      <header className="p-4 flex items-center justify-between border-b border-[var(--border-primary)] flex-shrink-0">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Search Results</h3>
        <button
          onClick={onClose}
          className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
          aria-label="Close search results"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </header>

      {validChunks.length > 0 ? (
        <ul className="p-2 space-y-1 overflow-y-auto">
          {validChunks.map((chunk, index) => (
            <li key={index}>
              <a
                href={chunk.web.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 rounded-md hover:bg-[var(--bg-tertiary)] transition-colors group"
              >
                <span className="block font-medium text-[var(--text-accent)] group-hover:underline">{chunk.web.title || chunk.web.uri}</span>
                <span className="block text-sm text-[var(--text-tertiary)] whitespace-nowrap overflow-hidden text-ellipsis mt-1">{chunk.web.uri}</span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <div className="p-6 text-center text-[var(--text-tertiary)]">
            No valid search results to display.
        </div>
      )}
    </div>
  );
}