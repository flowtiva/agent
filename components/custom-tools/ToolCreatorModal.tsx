
import React from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import { vs2015, atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { CustomTool } from "../../types";

type ToolCreatorModalProps = {
  tool: CustomTool;
  onApprove: () => void;
  onCancel: () => void;
  theme: 'light' | 'dark';
};

export function ToolCreatorModal({ tool, onApprove, onCancel, theme }: ToolCreatorModalProps) {
  const codeStyle = theme === 'dark' ? atomOneDark : vs2015;

  return (
    <div className="fixed inset-0 bg-[var(--bg-overlay)] flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div 
        className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)] shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tool-creator-title"
      >
        <header className="p-6 border-b border-[var(--border-primary)]">
          <h2 id="tool-creator-title" className="text-xl font-semibold text-[var(--text-primary)]">Approve New Tool</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            The AI wants to create a new tool. Review the details below and approve if you trust it.
          </p>
        </header>

        <div className="p-6 overflow-y-auto space-y-6">
          <DetailItem label="Name">
            <code className="px-2 py-1 bg-[var(--bg-tertiary)] rounded text-[var(--text-accent)] text-sm font-mono">{tool.declaration.name}</code>
          </DetailItem>
          <DetailItem label="Description">
            <span className="text-[var(--text-secondary)]">{tool.declaration.description}</span>
          </DetailItem>
          <DetailItem label="Parameters">
            <div className="rounded-md overflow-hidden border border-[var(--border-primary)]">
              <SyntaxHighlighter language="json" style={codeStyle} customStyle={{ margin: 0, padding: '0.75rem' }}>
                {JSON.stringify(tool.declaration.parameters, null, 2)}
              </SyntaxHighlighter>
            </div>
          </DetailItem>
           <DetailItem label="Implementation">
            <div className="border border-[var(--border-primary)] rounded-md max-h-64 overflow-auto">
              <SyntaxHighlighter language="javascript" style={codeStyle} customStyle={{ margin: 0, padding: '0.75rem' }}>
                {tool.implementation}
              </SyntaxHighlighter>
            </div>
          </DetailItem>
        </div>

        <footer className="p-4 border-t border-[var(--border-primary)] flex justify-end gap-3 bg-[var(--bg-primary)] rounded-b-lg">
          <button 
            className="px-4 py-2 rounded-md text-sm font-medium bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--border-primary)] transition-colors"
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
        <strong className="block text-sm font-medium text-[var(--text-secondary)] mb-2">{label}</strong>
        {children}
    </div>
);