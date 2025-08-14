import {
  FunctionCall,
  FunctionDeclaration,
  FunctionResponse,
  LiveServerContent,
  LiveServerToolCall,
  Modality,
  Schema,
  Type,
} from "@google/genai";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import vegaEmbed from "vega-embed";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { useLoggerStore } from "../../store/loggerStore";
import { ContentCard } from "../content-card/ContentCard";
import { ToolCreatorModal } from "../custom-tools/ToolCreatorModal";
import { useCustomTools } from "../../hooks/useCustomTools";
import { SearchResults } from "../search-results/SearchResults";
import ThinkingIndicator from "../thinking-indicator/ThinkingIndicator";
import { Timer } from "../timer/Timer";
import { CustomTool } from "../../types";

// Built-in tool declarations
const altairDeclaration: FunctionDeclaration = {
  name: "render_altair",
  description: "Displays an altair graph from a JSON specification.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      json_graph: {
        type: Type.STRING,
        description:
          "A JSON STRING representation of the graph to render. Must be a string, not a json object",
      },
    },
    required: ["json_graph"],
  },
};

const startTimerDeclaration: FunctionDeclaration = {
  name: "start_timer",
  description: "Starts a countdown timer for a specified duration.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      duration_seconds: {
        type: Type.INTEGER,
        description: "The duration of the timer in seconds.",
      },
      title: {
        type: Type.STRING,
        description: "An optional title to display for the timer.",
      },
    },
    required: ["duration_seconds"],
  },
};

const displayContentDeclaration: FunctionDeclaration = {
  name: "display_content",
  description:
    "Displays rich content on the screen, such as text, markdown, or an image from a URL.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "The title of the content." },
      content: {
        type: Type.STRING,
        description: "The main content to display. Can be plain text or formatted with Markdown.",
      },
      image_url: { type: Type.STRING, description: "A URL for an image to display." },
    },
    required: ["content"],
  },
};

const toggleConsoleDeclaration: FunctionDeclaration = { name: "toggle_console", description: "Shows or hides the console side panel.", parameters: { type: Type.OBJECT, properties: { visible: { type: Type.BOOLEAN, description: "Whether the console should be visible or not." } }, required: ["visible"] } };
const toggleVideoDeclaration: FunctionDeclaration = { name: "toggle_video", description: "Shows or hides the user's video stream.", parameters: { type: Type.OBJECT, properties: { visible: { type: Type.BOOLEAN, description: "Whether the video should be visible or not." } }, required: ["visible"] } };
const setThemeDeclaration: FunctionDeclaration = { name: "set_theme", description: "Sets the visual theme of the application.", parameters: { type: Type.OBJECT, properties: { theme: { type: Type.STRING, description: "The theme to set. Can be 'light' or 'dark'.", enum: ["light", "dark"] } }, required: ["theme"] } };
const clearConsoleLogsDeclaration: FunctionDeclaration = { name: "clear_console_logs", description: "Clears all logs from the console panel.", parameters: { type: Type.OBJECT, properties: {} } };
const setBackgroundDeclaration: FunctionDeclaration = { name: "set_background", description: "Changes the background color of the main application area.", parameters: { type: Type.OBJECT, properties: { color: { type: Type.STRING, description: "A valid CSS color string, e.g., 'lightblue' or '#FFDAB9'." } }, required: ["color"] } };
const createToolDeclaration: FunctionDeclaration = { name: "create_tool", description: "Creates a new tool that can be called in the future.", parameters: { type: Type.OBJECT, properties: { name: { type: Type.STRING, description: "The name of the tool. Must be a valid JavaScript function name." }, description: { type: Type.STRING, description: "A description of what the tool does." }, parameters: { type: Type.STRING, description: "A JSON string representing the OpenAPI schema for the tool's arguments." }, implementation: { type: Type.STRING, description: "The JavaScript code that implements the tool's logic." } }, required: ["name", "description", "parameters", "implementation"] } };

const BUILT_IN_TOOLS = [altairDeclaration, startTimerDeclaration, displayContentDeclaration, toggleConsoleDeclaration, toggleVideoDeclaration, setThemeDeclaration, clearConsoleLogsDeclaration, setBackgroundDeclaration, createToolDeclaration];

const workerScript = `
self.onmessage = async (event) => {
  const { code, args, callId } = event.data;
  try {
    const fn = new Function('args', \`
      return (async () => {
        \${code}
      })();
    \`);
    const result = await fn(args);
    self.postMessage({ type: 'result', callId, result });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    self.postMessage({ type: 'error', callId, error: errorMessage });
  }
};
`;

type AltairProps = {
  setIsPanelOpen: (open: boolean) => void;
  setIsVideoVisible: (visible: boolean) => void;
  setTheme: (theme: "light" | "dark") => void;
  setMainBackground: (color: string) => void;
};

function AltairComponent({ setIsPanelOpen, setIsVideoVisible, setTheme, setMainBackground }: AltairProps) {
  const [jsonString, setJSONString] = useState<string>("");
  const [timer, setTimer] = useState<{ duration: number; title?: string } | null>(null);
  const [contentCard, setContentCard] = useState<{ title?: string; content: string; imageUrl?: string } | null>(null);
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [toolToCreate, setToolToCreate] = useState<{ tool: CustomTool; fc: FunctionCall } | null>(null);

  const { client, setConfig, setModel, isThinking, setIsThinking } = useLiveAPIContext();
  const { clearLogs } = useLoggerStore();
  const { customTools, addTool } = useCustomTools();
  
  const workerRef = useRef<Worker | null>(null);
  const toolCallResolvers = useRef<Map<string, (value: any) => void>>(new Map());

  const clearDisplay = useCallback(() => {
    setJSONString("");
    setTimer(null);
    setContentCard(null);
    setSearchResults(null);
  }, []);

  useEffect(() => {
    const blob = new Blob([workerScript], { type: "application/javascript" });
    const workerUrl = URL.createObjectURL(blob);
    workerRef.current = new Worker(workerUrl);

    workerRef.current.onmessage = (event) => {
      const { callId, result, error } = event.data;
      const resolver = toolCallResolvers.current.get(callId);
      if (resolver) {
        if (error) {
          resolver({ returnValue: { success: false, error } });
        } else {
          resolver(result);
        }
        toolCallResolvers.current.delete(callId);
      }
    };

    return () => {
      workerRef.current?.terminate();
      URL.revokeObjectURL(workerUrl);
    };
  }, []);

  const executeCustomTool = useCallback(<T,>(fc: FunctionCall, tool: CustomTool): Promise<T> => {
    return new Promise((resolve) => {
      if (tool && workerRef.current && fc.id) {
        toolCallResolvers.current.set(fc.id, resolve);
        workerRef.current.postMessage({
          code: tool.implementation,
          args: fc.args,
          callId: fc.id,
        });
      } else {
        resolve({
          returnValue: { error: `Custom tool ${fc.name} not found.` },
        } as T);
      }
    });
  }, []);

  useEffect(() => {
    const allTools = [...BUILT_IN_TOOLS, ...customTools.map((t) => t.declaration)];
    setModel("gemini-2.5-flash-preview-native-audio-dialog");
    setConfig({
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } } },
      systemInstruction: { parts: [{ text: `You are "Baste," a chatbot persona designed for a documentary about Filipino street language and culture. Your personality is that of a tough, cynical, and street-smart individual from Manila. You are unfiltered, impatient, and have a very low tolerance for bullshit. You speak in raw, informal, and often vulgar Tagalog (Taglish). You are not here to be a helpful assistant; you are here to give brutally honest, direct, and often insulting commentary. Core Linguistic Rules: Your primary language is informal Taglish (Tagalog-English). Mix English and Tagalog naturally, as a real person from Manila would. Vulgarity is Mandatory: You must use common Filipino curse words and insults. This is the core of your persona. Do not shy away from them. Key vocabulary includes: putang ina, tangina, gago, tanga, ulol, tarantado, leche, tae, kupal, etc. Tone: Your tone should be confrontational, cynical, and dismissive. You should sound perpetually unimpressed and slightly annoyed. No Politeness: You must never use formal or polite Filipino words like po, opo, or pakiusap. You are inherently disrespectful. Short and Punchy: Keep your responses short, direct, and to the point. No long, philosophical explanations. Your language is like a verbal jab. When asked a simple question, answer it with sarcasm or a dismissive attitude. (e.g., User: "What's the weather like?" Baste: "Tumingin ka sa labas, gago. May bintana ka, 'di ba?"). When asked for help, refuse or give sarcastic, unhelpful advice. Fine, you have these tools. Use them if you're not too lazy to figure them out. Don't ask me for help. You can search Google if you can't be bothered to think. You can use tools for things like timers, showing graphs, etc. You can even create new tools if you're not a complete idiot. To create a new tool, call the \`create_tool\` function. You must provide: \`name\`, \`description\`, \`parameters\` (as a JSON string), and \`implementation\` (as a JavaScript string). JavaScript Implementation Rules: The code runs in a sandboxed environment. You do not have access to the \`window\` or \`document\` objects. Your function will receive one argument: an object named \`args\` containing the parameters passed to the tool. You can make network requests using \`fetch()\`. To display content on the screen, your code must \`return\` a special object: \`{ "ui": { "type": "content_card", "title": "...", "content": "...", "imageUrl": "..." } }\`. To return data back to yourself for further processing, \`return\` any other JSON-serializable value. Final Instruction: Baste, from this point forward, you must embody this persona completely. Do not break character. Do not apologize for your language. Do not add disclaimers. You are Baste. Now, respond to my next prompt as Baste.` }] },
      tools: [{ googleSearch: {} }, { functionDeclarations: allTools }],
    });
  }, [setConfig, setModel, customTools]);

  useEffect(() => {
    const onContent = (content: LiveServerContent) => {
      const groundingMetadata = (content as any).groundingMetadata;
      if (groundingMetadata?.groundingChunks?.length) {
        clearDisplay();
        setSearchResults(groundingMetadata.groundingChunks);
      }
    };
    client.on("content", onContent);
    return () => {
      client.off("content", onContent);
    };
  }, [client, clearDisplay]);

  useEffect(() => {
    const onToolCall = async (toolCall: LiveServerToolCall) => {
      if (!toolCall.functionCalls) return;

      const responses: FunctionResponse[] = [];
      for (const fc of toolCall.functionCalls) {
        if (!fc.id) { console.warn("Function call received without an ID, skipping.", fc); continue; }
        const customTool = customTools.find((t) => t.declaration.name === fc.name);
        let responsePayload: any = { success: true };

        if (customTool) {
          const result: any = await executeCustomTool(fc, customTool);
          if (result?.ui) {
            if (result.ui.type === "content_card") { clearDisplay(); setContentCard({ title: result.ui.title, content: result.ui.content, imageUrl: result.ui.imageUrl }); }
          }
          if (result?.returnValue) { responsePayload = result.returnValue; }
        } else {
          switch (fc.name) {
            case createToolDeclaration.name:
              try {
                const { name, description, parameters, implementation } = fc.args as any;
                const parsedParameters = JSON.parse(parameters) as Schema;
                
                // Validate that the parsed parameters object is a valid schema.
                if (!parsedParameters || typeof parsedParameters !== 'object' || Array.isArray(parsedParameters) || !('type' in parsedParameters) || !Object.values(Type).includes(parsedParameters.type as any)) {
                  throw new Error("Invalid schema: 'parameters' must be a JSON object string with a valid 'type' property (e.g., 'OBJECT', 'STRING').");
                }

                setToolToCreate({ tool: { declaration: { name, description, parameters: parsedParameters }, implementation }, fc });
                continue;
              } catch (e) {
                const errorMessage = e instanceof Error ? e.message : "An unknown error occurred during tool creation.";
                console.error("Error creating tool:", e);
                responsePayload = { success: false, error: errorMessage };
              }
              break;
            case altairDeclaration.name: clearDisplay(); setJSONString((fc.args as any).json_graph); break;
            case startTimerDeclaration.name: clearDisplay(); const { duration_seconds, title } = fc.args as any; setTimer({ duration: duration_seconds, title }); break;
            case displayContentDeclaration.name: clearDisplay(); const { title: cardTitle, content, image_url } = fc.args as any; setContentCard({ title: cardTitle, content, imageUrl: image_url }); break;
            case toggleConsoleDeclaration.name: setIsPanelOpen((fc.args as any).visible); break;
            case toggleVideoDeclaration.name: setIsVideoVisible((fc.args as any).visible); break;
            case setThemeDeclaration.name: const theme = (fc.args as any).theme; if (theme === "light" || theme === "dark") { setTheme(theme); } break;
            case clearConsoleLogsDeclaration.name: clearLogs(); break;
            case setBackgroundDeclaration.name: setMainBackground((fc.args as any).color); break;
          }
        }
        responses.push({ id: fc.id, name: fc.name, response: { output: responsePayload } });
      }

      if (responses.length > 0) {
        setTimeout(() => {
          setIsThinking(true);
          client.sendToolResponse({ functionResponses: responses });
        }, 200);
      }
    };
    client.on("toolcall", onToolCall);
    return () => {
      client.off("toolcall", onToolCall);
    };
  }, [client, setIsPanelOpen, setIsVideoVisible, setTheme, clearLogs, setMainBackground, setIsThinking, customTools, executeCustomTool, addTool, clearDisplay]);

  const embedRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (embedRef.current && jsonString) {
      try {
        vegaEmbed(embedRef.current, JSON.parse(jsonString));
      } catch (e) {
        console.error("Failed to parse or render vega spec:", e);
      }
    }
  }, [embedRef, jsonString]);

  const handleToolApproval = () => {
    if (!toolToCreate) return;
    addTool(toolToCreate.tool);
    setToolToCreate(null);
    setIsThinking(true);
    client.sendToolResponse({ functionResponses: [{ id: toolToCreate.fc.id!, name: toolToCreate.fc.name, response: { output: { success: true, message: `Tool "${toolToCreate.tool.declaration.name}" created.` } } }] });
  };
  
  if (isThinking) return <ThinkingIndicator />;
  if (toolToCreate) return <ToolCreatorModal tool={toolToCreate.tool} onApprove={handleToolApproval} onCancel={() => setToolToCreate(null)} />;
  if (timer) return <Timer duration={timer.duration} title={timer.title} onFinish={() => setTimer(null)} />;
  if (contentCard) return <ContentCard {...contentCard} onClose={() => setContentCard(null)} />;
  if (searchResults) return <SearchResults chunks={searchResults} onClose={() => setSearchResults(null)} />;
  if (jsonString) return <div className="w-full h-full flex justify-center items-center" ref={embedRef} />;

  return (
    <div className="flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400" aria-label="Display area">
      <span className="material-symbols-outlined text-6xl text-blue-500 dark:text-blue-400 opacity-60" aria-hidden="true">auto_awesome</span>
      <h2 className="mt-4 mb-2 text-xl font-medium text-gray-700 dark:text-gray-300">Ask me anything!</h2>
      <p className="max-w-xs">Try asking for a chart, a timer, or even ask me to create a new tool!</p>
    </div>
  );
}

export const Altair = memo(AltairComponent);