
import React, { memo } from "react";
import {
  StreamingLog,
  ClientContentLog as ClientContentLogType
} from "../../types";
import {
  LiveClientToolResponse,
  LiveServerContent,
  LiveServerToolCall,
  Part,
} from "@google/genai";
import SyntaxHighlighter from "react-syntax-highlighter";
import { vs2015, atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { useLoggerStore } from "../../store/loggerStore";

const formatTime = (d: Date | string) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

const getSourceStyle = (type: string) => {
    if (type.startsWith("client")) return "bg-green-500/10 text-green-400 border-green-500/20";
    if (type.startsWith("server")) return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    return "bg-gray-500/10 text-gray-400 border-gray-500/20";
}

const LogEntry = memo(({ log, MessageComponent, theme }: { log: StreamingLog; MessageComponent: React.FC<{ message: StreamingLog["message"], theme: 'light' | 'dark' }>, theme: 'light' | 'dark' }) => (
  <li className="flex items-start gap-x-3 py-2.5 px-4 text-xs font-mono border-b border-[var(--border-primary)] first:border-t">
    <span className="mt-0.5 text-[var(--text-tertiary)]">{formatTime(log.date)}</span>
    <span className={`mt-0.5 font-semibold px-2 py-0.5 rounded-full text-xs ${getSourceStyle(log.type)}`}>{log.type}</span>
    <div className="flex-1 message text-[var(--text-secondary)] break-words overflow-hidden">
      <MessageComponent message={log.message} theme={theme} />
    </div>
    {log.count && <span className="flex items-center justify-center w-5 h-5 bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] rounded-full text-[10px] font-semibold">{log.count}</span>}
  </li>
));

const PlainTextMessage: React.FC<{ message: any }> = ({ message }) => <span>{message as string}</span>;

const JsonMessage: React.FC<{ message: any, theme: 'light' | 'dark' }> = ({ message, theme }) => (
    <SyntaxHighlighter language="json" style={theme === 'dark' ? atomOneDark : vs2015} customStyle={{ margin: 0, padding: '0.5rem', borderRadius: '4px', backgroundColor: 'var(--bg-primary)' }}>
        {JSON.stringify(message, null, 2)}
    </SyntaxHighlighter>
);

const RenderPart = memo(({ part }: { part: Part }) => {
    if (part.text && part.text.trim().length) {
      return <div className="py-1"><p className="part-text whitespace-pre-wrap">{part.text}</p></div>;
    }
    return null;
});

const ClientContentLog: React.FC<{ message: any }> = memo(({ message }) => {
  const { turns, turnComplete } = message as ClientContentLogType;
  return (
    <div className="space-y-1">
      <strong className="text-[var(--text-primary)]">User Turn (Complete: {String(turnComplete)})</strong>
      {turns.map((part, j) => <RenderPart part={part} key={`client-part-${j}`} />)}
    </div>
  );
});

const ToolCallLog: React.FC<{ message: any, theme: 'light' | 'dark' }> = memo(({ message, theme }) => {
  const { toolCall } = message as { toolCall: LiveServerToolCall };
  return (
    <div className="space-y-1">
        <strong className="text-[var(--text-primary)]">Tool Call</strong>
        {toolCall.functionCalls?.map((fc) => (
            <JsonMessage key={fc.id} message={fc} theme={theme} />
        ))}
    </div>
  );
});

const ToolResponseLog: React.FC<{ message: any, theme: 'light' | 'dark' }> = memo(({ message, theme }) => (
    <div className="space-y-1">
        <strong className="text-[var(--text-primary)]">Tool Response</strong>
        {(message as LiveClientToolResponse).functionResponses?.map((fr) => (
            <JsonMessage key={fr.id} message={fr.response} theme={theme} />
        ))}
    </div>
));

const ModelTurnLog: React.FC<{ message: any, theme: 'light' | 'dark' }> = memo(({ message, theme }) => {
    const serverContent = (message as { serverContent: LiveServerContent }).serverContent;
    const modelTurn = serverContent?.modelTurn;
    const groundingMetadata = (serverContent as any)?.groundingMetadata;
    const modelParts = modelTurn?.parts?.filter(p => !(p.text && p.text.trim() === ''));
    const hasModelContent = modelParts && modelParts.length > 0;
    const hasGrounding = groundingMetadata && Object.keys(groundingMetadata).length > 0;

    if (!hasModelContent && !hasGrounding) return null;

    return (
        <div className="space-y-2">
            {hasModelContent && (
                <div>
                    <strong className="text-[var(--text-primary)]">Model Turn</strong>
                    {modelParts.map((part, j) => <RenderPart part={part} key={`model-part-${j}`} />)}
                </div>
            )}
            {hasGrounding && (
                <div>
                    <strong className="text-[var(--text-primary)]">Grounding Metadata</strong>
                    <JsonMessage message={groundingMetadata} theme={theme} />
                </div>
            )}
        </div>
    );
});

const componentMap: Record<string, React.FC<{ message: any, theme: 'light' | 'dark' }>> = {
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

export default function Logger({ filter = "none", theme }: { filter: LoggerFilterType, theme: 'light' | 'dark' }) {
  const { logs } = useLoggerStore();
  const filterFn = filters[filter];

  const getMessageComponent = (log: StreamingLog): React.FC<{ message: any, theme: 'light' | 'dark' }> => {
    if (typeof log.message === 'string') {
        return PlainTextMessage;
    }
    const Component = componentMap[log.type];
    if (Component) {
      return Component;
    }
    return JsonMessage;
  };

  return (
    <div className="h-full w-full">
      <ul className="pb-2">
        {logs.filter(filterFn).map((log, key) => (
          <LogEntry MessageComponent={getMessageComponent(log)} log={log} key={key} theme={theme}/>
        ))}
      </ul>
    </div>
  );
}