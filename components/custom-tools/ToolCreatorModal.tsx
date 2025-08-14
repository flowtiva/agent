
import React from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import { vs2015 } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { CustomTool } from "../../types";

type ToolCreatorModalProps = {
  tool: CustomTool;
  onApprove: () => void;
  onCancel: () => void;
};

export function ToolCreatorModal({ tool, onApprove, onCancel }: ToolCreatorModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div 
        className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tool-creator-title"
      >
        <header className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 id="tool-creator-title" className="text-xl font-semibold text-gray-900 dark:text-white">Approve New Tool</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            The AI wants to create a new tool. Review the details below and approve if you trust it.
          </p>
        </header>

        <div className="p-6 overflow-y-auto space-y-4">
          <DetailItem label="Name">
            <code className="px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded text-pink-600 dark:text-pink-400 text-sm font-mono">{tool.declaration.name}</code>
          </DetailItem>
          <DetailItem label="Description">
            <span className="text-gray-700 dark:text-gray-300">{tool.declaration.description}</span>
          </DetailItem>
          <DetailItem label="Parameters">
            <SyntaxHighlighter language="json" style={vs2015} customStyle={{ margin: 0, padding: '0.75rem', borderRadius: '0.25rem' }}>
              {JSON.stringify(tool.declaration.parameters, null, 2)}
            </SyntaxHighlighter>
          </DetailItem>
           <DetailItem label="Implementation">
            <div className="border border-gray-200 dark:border-gray-700 rounded-md max-h-64 overflow-auto">
              <SyntaxHighlighter language="javascript" style={vs2015} customStyle={{ margin: 0 }}>
                {tool.implementation}
              </SyntaxHighlighter>
            </div>
          </DetailItem>
        </div>

        <footer className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-slate-800/50 rounded-b-lg">
          <button 
            className="px-4 py-2 rounded-md text-sm font-medium bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button 
            className="px-4 py-2 rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
            onClick={onApprove}
          >
            Approve and Create Tool
          </button>
        </footer>
      </div>
    </div>
  );
}

const DetailItem: React.FC<{label: string, children: React.ReactNode}> = ({label, children}) => (
    <div>
        <strong className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</strong>
        {children}
    </div>
);
