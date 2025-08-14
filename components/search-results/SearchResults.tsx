
import React from 'react';

type SearchResultsProps = {
  chunks: any[];
  onClose: () => void;
};

export function SearchResults({ chunks, onClose }: SearchResultsProps) {
  const validChunks = chunks.filter(chunk => chunk.web && chunk.web.uri);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95 duration-300">
      <header className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Search Results</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          aria-label="Close search results"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </header>

      {validChunks.length > 0 ? (
        <ul className="p-4 space-y-2 overflow-y-auto">
          {validChunks.map((chunk, index) => (
            <li key={index}>
              <a
                href={chunk.web.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              >
                <span className="block font-medium text-blue-600 dark:text-blue-400">{chunk.web.title || chunk.web.uri}</span>
                <span className="block text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap overflow-hidden text-ellipsis">{chunk.web.uri}</span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            No valid search results to display.
        </div>
      )}
    </div>
  );
}
