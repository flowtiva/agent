
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { StreamingLog } from "../types";
import { isEqual } from "lodash";

interface StoreLoggerState {
  maxLogs: number;
  logs: StreamingLog[];
  log: (streamingLog: StreamingLog) => void;
  clearLogs: () => void;
}

export const useLoggerStore = create<StoreLoggerState>()(
  persist(
    (set, get) => ({
      maxLogs: 100,
      logs: [],
      log: (newLog: StreamingLog) => {
        set((state) => {
          const prevLog = state.logs[state.logs.length - 1];
          // Coalesce identical consecutive logs
          if (
            prevLog &&
            prevLog.type === newLog.type &&
            (typeof prevLog.message === 'string' 
              ? prevLog.message === newLog.message
              : isEqual(prevLog.message, newLog.message))
          ) {
            prevLog.count = (prevLog.count || 1) + 1;
            prevLog.date = newLog.date;
            return { logs: [...state.logs] };
          }
          
          const newLogs = [...state.logs, newLog];
          if (newLogs.length > get().maxLogs) {
              newLogs.shift();
          }

          return { logs: newLogs };
        });
      },
      clearLogs: () => {
        set({ logs: [] });
      },
    }),
    {
      name: "gemini-live-console-logs",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
