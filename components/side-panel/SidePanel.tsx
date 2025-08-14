
import React, { useEffect, useRef, MouseEvent } from "react";
import { RiSidebarFoldLine } from "react-icons/ri";
import Select from "react-select";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { useLoggerStore } from "../../store/loggerStore";
import Logger, { LoggerFilterType } from "../logger/Logger";
import { useLocalStorageState } from "../../hooks/useLocalStorageState";
import { getSelectStyles } from "../settings-dialog/selectStyles";

const filterOptions = [
  { value: "none", label: "All Logs" },
  { value: "conversations", label: "Conversations" },
  { value: "tools", label: "Tool Use" },
];

type SidePanelProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  theme: 'light' | 'dark';
};

export default function SidePanel({ open, setOpen, theme }: SidePanelProps) {
  const { connected, client } = useLiveAPIContext();
  const loggerRef = useRef<HTMLDivElement>(null);
  const loggerLastHeightRef = useRef<number>(-1);
  const { log, logs } = useLoggerStore();
  
  const [selectedOption, setSelectedOption] = useLocalStorageState<{ value: string; label: string; } | null>(
    "loggerFilter",
    filterOptions[0]
  );
  
  // Auto-scroll logger
  useEffect(() => {
    if (loggerRef.current) {
      const el = loggerRef.current;
      // Scroll only if user is near the bottom
      if (el.scrollHeight - el.scrollTop < el.clientHeight + 100) {
        el.scrollTop = el.scrollHeight;
        loggerLastHeightRef.current = el.scrollHeight;
      }
    }
  }, [logs]);

  // Listen for log events
  useEffect(() => {
    client.on("log", log);
    return () => {
      client.off("log", log);
    };
  }, [client, log]);

  // Handle overlay click for closing panel on mobile
  const handleOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest(".react-select__menu")) return;
    setOpen(false);
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-[var(--bg-overlay)] z-30 lg:hidden transition-opacity ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={handleOverlayClick}
        aria-hidden="true"
      />
      <aside className={`absolute lg:relative w-96 min-w-[384px] h-full bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] flex flex-col transition-transform duration-300 ease-in-out z-40 ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <header className="flex justify-between items-center p-4 border-b border-[var(--border-primary)] flex-shrink-0">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Console</h2>
          <button className="p-2 text-[var(--text-secondary)] lg:hidden" onClick={() => setOpen(false)} aria-label="Close console">
            <RiSidebarFoldLine size={24} />
          </button>
        </header>

        <section className="flex items-center p-3 border-b border-[var(--border-primary)] gap-4 flex-shrink-0">
          <Select
            className="flex-grow react-select-container"
            classNamePrefix="react-select"
            value={selectedOption}
            options={filterOptions}
            onChange={(e) => setSelectedOption(e)}
            aria-label="Log filter"
            menuPortalTarget={document.body}
            styles={getSelectStyles(theme === 'dark')}
          />
          <div className="flex items-center gap-2 text-sm font-mono whitespace-nowrap text-[var(--text-secondary)]">
            <span className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className="relative">
              {connected ? "Streaming" : "Paused"}
              {connected && <span className={`w-2.5 h-2.5 rounded-full bg-green-500 absolute -top-1 -right-1 animate-ping`}></span>}
            </span>
          </div>
        </section>

        <div className="flex-grow overflow-y-auto" ref={loggerRef}>
          <Logger filter={(selectedOption?.value as LoggerFilterType) || "none"} theme={theme} />
        </div>
      </aside>
    </>
  );
}