
import React, { ChangeEvent, useCallback, useMemo, useState } from "react";
import { LiveConnectConfig, Tool } from "@google/genai";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import VoiceSelector from "./VoiceSelector";
import ResponseModalitySelector from "./ResponseModalitySelector";
import { useCustomTools } from "../../hooks/useCustomTools";

type SettingsDialogProps = {
  theme: 'light' | 'dark';
};

export default function SettingsDialog({ theme }: SettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const { config, setConfig, connected } = useLiveAPIContext();
  const { customTools, removeTool } = useCustomTools();

  const systemInstruction = useMemo(() => {
    if (!config.systemInstruction) return "";
    if (typeof config.systemInstruction === "string") return config.systemInstruction;
    if ("parts" in config.systemInstruction) {
        return config.systemInstruction.parts?.map(p => p.text).join("\n") || "";
    }
    return "";
  }, [config]);

  const updateSystemInstruction = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
      const newConfig: LiveConnectConfig = { ...config, systemInstruction: { parts: [{ text: event.target.value }] } };
      setConfig(newConfig);
    }, [config, setConfig]);

  return (
    <div className="relative">
      <button 
        className="w-12 h-12 flex items-center justify-center rounded-full transition-all duration-200 bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]" 
        onClick={() => setOpen(!open)} 
        aria-haspopup="dialog" 
        aria-expanded={open}>
        <span className="material-symbols-outlined text-2xl">settings</span>
      </button>

      {open && (
        <div 
          role="dialog" 
          aria-modal="true"
          className="absolute bottom-16 right-0 w-[500px] max-w-[90vw] bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
        >
          <header className="p-4 border-b border-[var(--border-primary)]">
            <h2 className="font-semibold text-[var(--text-primary)]">Settings</h2>
          </header>
          <div className={`relative ${connected ? "opacity-50 pointer-events-none" : ""}`}>
            {connected && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-center p-4 z-10 rounded-b-lg">
                <p className="font-semibold text-white backdrop-blur-sm p-2 rounded-md">Settings are disabled while connected.</p>
              </div>
            )}
            <div className="p-4 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <ResponseModalitySelector theme={theme}/>
                <VoiceSelector theme={theme}/>
              </div>

              <div>
                <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-2">System Instructions</h3>
                <textarea className="w-full h-32 p-2 text-sm bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-md focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none" onChange={updateSystemInstruction} value={systemInstruction} />
              </div>

              <div>
                <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-2">Custom Tools</h3>
                <div className="border border-[var(--border-secondary)] rounded-md p-2 max-h-40 overflow-y-auto bg-[var(--bg-tertiary)]">
                  {customTools.length > 0 ? (
                    <div className="space-y-2">
                      {customTools.map((tool) => (
                        <div key={tool.declaration.name} className="flex items-center justify-between text-sm p-2 bg-[var(--bg-secondary)] rounded border border-[var(--border-primary)]">
                          <span className="font-mono font-medium text-[var(--text-accent)]">{tool.declaration.name}</span>
                          <button className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500 transition-colors" onClick={() => removeTool(tool.declaration.name!)} aria-label={`Delete ${tool.declaration.name} tool`}>
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-center text-[var(--text-tertiary)] py-4">No custom tools created.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}