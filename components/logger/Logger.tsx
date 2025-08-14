
import React, { memo, ReactNode } from "react";
import {
  ClientContentLog,
  StreamingLog,
} from "../../types";
import {
  Content,
  LiveClientToolResponse,
  LiveServerContent,
  LiveServerToolCall,
  LiveServerToolCallCancellation,
  Part,
} from "@google/genai";
import SyntaxHighlighter from "react-syntax-highlighter";
import { vs2015 } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { useLoggerStore } from "../../store/loggerStore";

const formatTime = (d: Date | string) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

const getSourceColor = (type: string) => {
    if (type.startsWith("client")) return "text-green-400";
    if (type.startsWith("server")) return "text-blue-400";
    return "text-gray-400";
}

const LogEntry = memo(({ log, MessageComponent }: { log: StreamingLog; MessageComponent: React.FC<{ message: StreamingLog["message"] }> }) => (
  <li className="grid grid-cols-[auto_auto_1fr_auto] items-start gap-x-3 py-2 text-xs border-b border-gray-200 dark:border-slate-700 font-mono">
    <span className="text-gray-500 dark:text-gray-400">{formatTime(log.date)}</span>
    <span className={`font-semibold ${getSourceColor(log.type)}`}>{log.type}</span>
    <div className="message text-gray-700 dark:text-gray-300 break-all">
      <MessageComponent message={log.message} />
    </div>
    {log.count && <span className="flex items-center justify-center w-5 h-5 bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-gray-400 rounded-full text-[10px] font-semibold">{log.count}</span>}
  </li>
));

const PlainTextMessage: React.FC<{ message: any }> = ({ message }) => <span>{message as string}</span>;
const AnyMessage: React.FC<{ message: any }> = ({ message }) => <pre className="whitespace-pre-wrap">{JSON.stringify(message, null, 2)}</pre>;

const RenderPart = memo(({ part }: { part: Part }) => {
    if (part.text && part.text.trim().length) {
      return <div className="p-2 border-l-2 border-gray-200 dark:border-slate-600"><p className="part-text whitespace-pre-wrap">{part.text}</p></div>;
    }
    // Other part renderers can be added here if needed
    return null;
});

const ClientContentLog: React.FC<{ message: any }> = memo(({ message }) => {
  const { turns, turnComplete } = message as ClientContentLog;
  return (
    <div className="p-2 rounded-md bg-green-500/10 border border-green-500/20 text-green-300">
      <h4 className="font-bold">User Turn (Complete: {String(turnComplete)})</h4>
      {turns.map((part, j) => <RenderPart part={part} key={`client-part-${j}`} />)}
    </div>
  );
});

const ToolCallLog: React.FC<{ message: any }> = memo(({ message }) => {
  const { toolCall } = message as { toolCall: LiveServerToolCall };
  return (
    <div className="p-2 rounded-md bg-yellow-500/10 border border-yellow-500/20 text-yellow-300">
      <h4 className="font-bold">Tool Call</h4>
      {toolCall.functionCalls?.map((fc) => (
        <SyntaxHighlighter key={fc.id} language="json" style={vs2015} customStyle={{ margin: 0, marginTop: '4px' }}>
          {JSON.stringify(fc, null, 2)}
        </SyntaxHighlighter>
      ))}
    </div>
  );
});

const ToolResponseLog: React.FC<{ message: any }> = memo(({ message }) => (
    <div className="p-2 rounded-md bg-yellow-500/10 border border-yellow-500/20 text-yellow-300">
        <h4 className="font-bold">Tool Response</h4>
        {(message as LiveClientToolResponse).functionResponses?.map((fr) => (
             <SyntaxHighlighter key={fr.id} language="json" style={vs2015} customStyle={{ margin: 0, marginTop: '4px' }}>
                {JSON.stringify(fr.response, null, 2)}
            </SyntaxHighlighter>
        ))}
    </div>
));

const ModelTurnLog: React.FC<{ message: any }> = memo(({ message }) => {
    const serverContent = (message as { serverContent: LiveServerContent })?.serverContent;
    
    // The serverContent object might not have a modelTurn property.
    // This can happen for responses that only contain groundingMetadata or a turnComplete flag.
    const modelTurn = serverContent?.modelTurn as Content | undefined;
    if (!modelTurn) {
        return null;
    }

    const parts = modelTurn.parts?.filter(p => !(p.text && p.text.trim() === ''));
    if (!parts || parts.length === 0) return null;
    return (
        <div className="p-2 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-300">
            <h4 className="font-bold">Model Turn</h4>
            {parts.map((part, j) => <RenderPart part={part} key={`model-part-${j}`} />)}
        </div>
    )
});

const componentMap: Record<string, React.FC<{ message: any }>> = {
  "client.send": ClientContentLog,
  "server.content": ModelTurnLog,
  "server.toolCall": ToolCallLog,
  "client.toolResponse": ToolResponseLog,
};

export type LoggerFilterType = "conversations" | "tools" | "none";

const filters: Record<LoggerFilterType, (log: StreamingLog) => boolean> = {
  tools: (log) => log.type.includes("tool"),
  conversations: (log) => ["client.send", "server.content"].includes(log.type),
  none: () => true,
};

export default function Logger({ filter = "none" }: { filter: LoggerFilterType }) {
  const { logs } = useLoggerStore();
  const filterFn = filters[filter];

  const getMessageComponent = (log: StreamingLog) => {
    if (componentMap[log.type]) {
      return componentMap[log.type];
    }
    if(typeof log.message === 'string') {
        return PlainTextMessage;
    }
    return AnyMessage;
  };

  return (
    <div className="h-full w-full">
      <ul className="px-4 py-2">
        {logs.filter(filterFn).map((log, key) => (
          <LogEntry MessageComponent={getMessageComponent(log)} log={log} key={key} />
        ))}
      </ul>
    </div>
  );
}
