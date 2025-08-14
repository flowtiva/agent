
import React, { useEffect, useRef, useState, MouseEvent } from "react";
import { RiSidebarFoldLine } from "react-icons/ri";
import Select from "react-select";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { useLoggerStore } from "../../store/loggerStore";
import Logger, { LoggerFilterType } from "../logger/Logger";
import { useLocalStorageState } from "../../hooks/useLocalStorageState";

const filterOptions = [
  { value: "none", label: "All Logs" },
  { value: "conversations", label: "Conversations" },
  { value: "tools", label: "Tool Use" },
];

type SidePanelProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

export default function SidePanel({ open, setOpen }: SidePanelProps) {
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
      const scrollHeight = el.scrollHeight;
      if (scrollHeight !== loggerLastHeightRef.current) {
        el.scrollTop = scrollHeight;
        loggerLastHeightRef.current = scrollHeight;
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
  
  const customStyles = {
    control: (base: any) => ({ ...base, backgroundColor: '#f3f4f6', borderColor: '#d1d5db', '&:hover': { borderColor: '#9ca3af' }, boxShadow: 'none', minHeight: '38px' }),
    menu: (base: any) => ({ ...base, backgroundColor: 'white', zIndex: 50 }),
    option: (base: any, { isFocused, isSelected }: any) => ({ ...base, backgroundColor: isSelected ? '#3b82f6' : isFocused ? '#f3f4f6' : 'white', color: isSelected ? 'white' : 'black' }),
    singleValue: (base: any) => ({ ...base, color: 'black' }),
  };

  const customStylesDark = {
    control: (base: any) => ({ ...base, backgroundColor: '#374151', borderColor: '#4b5563', '&:hover': { borderColor: '#6b7280' }, boxShadow: 'none', minHeight: '38px' }),
    menu: (base: any) => ({ ...base, backgroundColor: '#1f2937', zIndex: 50 }),
    option: (base: any, { isFocused, isSelected }: any) => ({ ...base, backgroundColor: isSelected ? '#3b82f6' : isFocused ? '#374151' : '#1f2937', color: 'white' }),
    singleValue: (base: any) => ({ ...base, color: 'white' }),
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-30 lg:hidden transition-opacity ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={handleOverlayClick}
      />
      <aside className={`absolute lg:relative w-96 min-w-[384px] h-full bg-gray-50 dark:bg-slate-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-transform duration-300 ease-in-out z-40 ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <header className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-lg font-semibold">Console</h2>
          <button className="p-2 text-gray-500 dark:text-gray-400 lg:hidden" onClick={() => setOpen(false)} aria-label="Close console">
            <RiSidebarFoldLine size={24} />
          </button>
        </header>

        <section className="flex items-center p-3 border-b border-gray-200 dark:border-gray-700 gap-4 flex-shrink-0">
          <Select
            className="flex-grow"
            classNamePrefix="react-select"
            value={selectedOption}
            options={filterOptions}
            onChange={(e) => setSelectedOption(e)}
            aria-label="Log filter"
            menuPortalTarget={document.body}
            styles={document.documentElement.classList.contains('dark') ? customStylesDark : customStyles}
          />
          <div className="flex items-center gap-2 text-sm font-mono whitespace-nowrap">
            <span className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
            <span>{connected ? "Streaming" : "Paused"}</span>
          </div>
        </section>

        <div className="flex-grow overflow-y-auto" ref={loggerRef}>
          <Logger filter={(selectedOption?.value as LoggerFilterType) || "none"} />
        </div>
      </aside>
    </>
  );
}
