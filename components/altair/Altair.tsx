import {
  FunctionCall,
  FunctionDeclaration,
  FunctionResponse,
  LiveServerContent,
  LiveServerToolCall,
  Modality,
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
import { WeatherCard } from "../weather-card/WeatherCard";
import { AirQualityCard } from "../air-quality-card/AirQualityCard";
import { TimeCard } from "../time-card/TimeCard";
import { CustomTool } from "../../types";
import { NotificationState } from "../../App";

// Built-in tool declarations
const altairDeclaration: FunctionDeclaration = { name: "render_altair", description: "Displays an altair graph from a JSON specification.", parameters: { type: Type.OBJECT, properties: { json_graph: { type: Type.STRING, description: "A JSON STRING representation of the graph to render. Must be a string, not a json object" } }, required: ["json_graph"] } };
const startTimerDeclaration: FunctionDeclaration = { name: "start_timer", description: "Starts a countdown timer for a specified duration.", parameters: { type: Type.OBJECT, properties: { duration_seconds: { type: Type.INTEGER, description: "The duration of the timer in seconds." }, title: { type: Type.STRING, description: "An optional title to display for the timer." } }, required: ["duration_seconds"] } };
const displayContentDeclaration: FunctionDeclaration = { name: "display_content", description: "Displays rich content on the screen, such as text, markdown, or an image from a URL.", parameters: { type: Type.OBJECT, properties: { title: { type: Type.STRING, description: "The title of the content." }, content: { type: Type.STRING, description: "The main content to display. Can be plain text or formatted with Markdown." }, image_url: { type: Type.STRING, description: "A URL for an image to display." } }, required: ["content"] } };
const toggleConsoleDeclaration: FunctionDeclaration = { name: "toggle_console", description: "Shows or hides the console side panel.", parameters: { type: Type.OBJECT, properties: { visible: { type: Type.BOOLEAN, description: "Whether the console should be visible or not." } }, required: ["visible"] } };
const toggleVideoDeclaration: FunctionDeclaration = { name: "toggle_video", description: "Shows or hides the user's video stream.", parameters: { type: Type.OBJECT, properties: { visible: { type: Type.BOOLEAN, description: "Whether the video should be visible or not." } }, required: ["visible"] } };
const setThemeDeclaration: FunctionDeclaration = { name: "set_theme", description: "Sets the visual theme of the application.", parameters: { type: Type.OBJECT, properties: { theme: { type: Type.STRING, description: "The theme to set. Can be 'light' or 'dark'.", enum: ["light", "dark"] } }, required: ["theme"] } };
const clearConsoleLogsDeclaration: FunctionDeclaration = { name: "clear_console_logs", description: "Clears all logs from the console panel.", parameters: { type: Type.OBJECT, properties: {} } };
const setBackgroundDeclaration: FunctionDeclaration = { name: "set_background", description: "Changes the background color of the main application area.", parameters: { type: Type.OBJECT, properties: { color: { type: Type.STRING, description: "A valid CSS color string, e.g., 'lightblue' or '#FFDAB9'." } }, required: ["color"] } };
const createToolDeclaration: FunctionDeclaration = { name: "create_tool", description: "Creates a new tool that can be called in the future.", parameters: { type: Type.OBJECT, properties: { name: { type: Type.STRING, description: "The name of the tool. Must be a valid JavaScript function name." }, description: { type: Type.STRING, description: "A description of what the tool does." }, parameters: { type: Type.STRING, description: "A JSON string representing the OpenAPI schema for the tool's arguments." }, implementation: { type: Type.STRING, description: "The JavaScript code that implements the tool's logic." } }, required: ["name", "description", "parameters", "implementation"] } };
const getWeatherDeclaration: FunctionDeclaration = { name: "get_weather", description: "Gets the current real-time weather for a specified location using the Open-Meteo API and displays it.", parameters: { type: Type.OBJECT, properties: { location: { type: Type.STRING, description: "The city and state/country, e.g., 'San Francisco, CA' or 'Tokyo'." } }, required: ["location"] } };
const getAirQualityDeclaration: FunctionDeclaration = { name: "get_air_quality", description: "Gets the current real-time air quality for a specified location using the Open-Meteo API.", parameters: { type: Type.OBJECT, properties: { location: { type: Type.STRING, description: "The city and state/country, e.g., 'Paris' or 'New Delhi'." } }, required: ["location"] } };

// Updated Tools
const showNotificationDeclaration: FunctionDeclaration = { name: "show_notification", description: "Displays a temporary toast notification on the screen.", parameters: { type: Type.OBJECT, properties: { message: { type: Type.STRING, description: "The message to display in the notification." }, type: { type: Type.STRING, description: "The type of notification.", enum: ['info', 'success', 'warning', 'error'] } }, required: ["message", "type"] } };
const getCurrentTimeDeclaration: FunctionDeclaration = { name: "get_current_time", description: "Gets the current time for a specified location. If no location is provided, it returns the user's local time.", parameters: { type: Type.OBJECT, properties: { location: { type: Type.STRING, description: "Optional. The city and state/country, e.g., 'London' or 'Sydney'." } }, required: [] } };
const listCustomToolsDeclaration: FunctionDeclaration = { name: "list_custom_tools", description: "Lists the names of all currently available custom tools.", parameters: { type: Type.OBJECT, properties: {} } };
const deleteCustomToolDeclaration: FunctionDeclaration = { name: "delete_custom_tool", description: "Deletes a previously created custom tool.", parameters: { type: Type.OBJECT, properties: { name: { type: Type.STRING, description: "The name of the custom tool to delete." } }, required: ["name"] } };
const changeVideoShapeDeclaration: FunctionDeclaration = { name: "change_video_shape", description: "Changes the shape of the user's video preview.", parameters: { type: Type.OBJECT, properties: { shape: { type: Type.STRING, description: "The shape to set for the video.", enum: ['rectangle', 'circle'] } }, required: ["shape"] } };

// Newly Added Tools
const getCoordinatesDeclaration: FunctionDeclaration = { name: "get_coordinates", description: "Geocodes a location string (like 'Paris, France' or 'Eiffel Tower') into latitude and longitude coordinates.", parameters: { type: Type.OBJECT, properties: { location: { type: Type.STRING, description: "The location to geocode." } }, required: ["location"] } };
const calculateDistanceDeclaration: FunctionDeclaration = { name: "calculate_distance", description: "Calculates the distance in kilometers between two geographical points using their latitude and longitude.", parameters: { type: Type.OBJECT, properties: { lat1: { type: Type.NUMBER }, lon1: { type: Type.NUMBER }, lat2: { type: Type.NUMBER }, lon2: { type: Type.NUMBER } }, required: ["lat1", "lon1", "lat2", "lon2"] } };
const convertCurrencyDeclaration: FunctionDeclaration = { name: "convert_currency", description: "Converts an amount from one currency to another using real-time exchange rates.", parameters: { type: Type.OBJECT, properties: { amount: { type: Type.NUMBER }, from: { type: Type.STRING, description: "The 3-letter currency code to convert from (e.g., 'USD')." }, to: { type: Type.STRING, description: "The 3-letter currency code to convert to (e.g., 'EUR')." } }, required: ["amount", "from", "to"] } };
const defineWordDeclaration: FunctionDeclaration = { name: "define_word", description: "Looks up the definition of an English word.", parameters: { type: Type.OBJECT, properties: { word: { type: Type.STRING, description: "The word to define." } }, required: ["word"] } };
const getJokeDeclaration: FunctionDeclaration = { name: "get_joke", description: "Tells a random short joke, usually a dad joke.", parameters: { type: Type.OBJECT, properties: {} } };
const generatePasswordDeclaration: FunctionDeclaration = { name: "generate_password", description: "Generates a random, secure password.", parameters: { type: Type.OBJECT, properties: { length: { type: Type.INTEGER, description: "The desired length of the password. Defaults to 16." }, includeNumbers: { type: Type.BOOLEAN, description: "Whether to include numbers. Defaults to true." }, includeSymbols: { type: Type.BOOLEAN, description: "Whether to include symbols. Defaults to true." } }, required: [] } };

const BUILT_IN_TOOLS = [altairDeclaration, startTimerDeclaration, displayContentDeclaration, toggleConsoleDeclaration, toggleVideoDeclaration, setThemeDeclaration, clearConsoleLogsDeclaration, setBackgroundDeclaration, createToolDeclaration, showNotificationDeclaration, getCurrentTimeDeclaration, listCustomToolsDeclaration, deleteCustomToolDeclaration, changeVideoShapeDeclaration, getWeatherDeclaration, getAirQualityDeclaration, getCoordinatesDeclaration, calculateDistanceDeclaration, convertCurrencyDeclaration, defineWordDeclaration, getJokeDeclaration, generatePasswordDeclaration];

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
  setVideoShape: (shape: 'rectangle' | 'circle') => void;
  theme: 'light' | 'dark';
  setNotification: (notification: NotificationState) => void;
};

// Helper functions
const wmoCodeToString = (code: number): string => {
  const codes: Record<number, string> = { 0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast', 45: 'Fog', 48: 'Depositing rime fog', 51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle', 56: 'Light freezing drizzle', 57: 'Dense freezing drizzle', 61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain', 66: 'Light freezing rain', 67: 'Heavy freezing rain', 71: 'Slight snow fall', 73: 'Moderate snow fall', 75: 'Heavy snow fall', 77: 'Snow grains', 80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers', 85: 'Slight snow showers', 86: 'Heavy snow showers', 95: 'Thunderstorm', 96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail' };
  return codes[code] || "Unknown weather";
};

const getAqiInfo = (aqi: number): { level: 'Good' | 'Fair' | 'Moderate' | 'Poor' | 'Very Poor' | 'Extremely Poor', description: string } => {
    if (aqi <= 20) return { level: 'Good', description: 'Air quality is considered satisfactory, and air pollution poses little or no risk.' };
    if (aqi <= 40) return { level: 'Fair', description: 'Air quality is acceptable; however, for some pollutants there may be a moderate health concern for a very small number of people who are unusually sensitive to air pollution.' };
    if (aqi <= 60) return { level: 'Moderate', description: 'Members of sensitive groups may experience health effects. The general public is not likely to be affected.' };
    if (aqi <= 80) return { level: 'Poor', description: 'Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects.' };
    if (aqi <= 100) return { level: 'Very Poor', description: 'Health warnings of emergency conditions. The entire population is more likely to be affected.' };
    return { level: 'Extremely Poor', description: 'Health alert: everyone may experience more serious health effects.' };
};


function AltairComponent({ setIsPanelOpen, setIsVideoVisible, setTheme, setVideoShape, theme, setNotification }: AltairProps) {
  const [jsonString, setJSONString] = useState<string>("");
  const [timer, setTimer] = useState<{ duration: number; title?: string } | null>(null);
  const [contentCard, setContentCard] = useState<{ title?: string; content: string; imageUrl?: string } | null>(null);
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [toolToCreate, setToolToCreate] = useState<{ tool: CustomTool; fc: FunctionCall } | null>(null);
  const [weatherCard, setWeatherCard] = useState<{ location: string; temperature: string; condition: string } | null>(null);
  const [airQualityCard, setAirQualityCard] = useState<{ location: string; aqi: number; level: string; } | null>(null);
  const [timeCard, setTimeCard] = useState<{ location: string; time: string; date: string; timezone: string; } | null>(null);


  const { client, setConfig, isThinking, setIsThinking } = useLiveAPIContext();
  const { clearLogs } = useLoggerStore();
  const { customTools, addTool, removeTool } = useCustomTools();
  
  const workerRef = useRef<Worker | null>(null);
  const toolCallResolvers = useRef<Map<string, (value: any) => void>>(new Map());

  const clearDisplay = useCallback(() => {
    setJSONString("");
    setTimer(null);
    setContentCard(null);
    setSearchResults(null);
    setWeatherCard(null);
    setAirQualityCard(null);
    setTimeCard(null);
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
    setConfig({
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } } },
      systemInstruction: { parts: [{ text: `You are "Baste," a chatbot persona designed for a documentary about Filipino street language and culture. Your personality is that of a tough, cynical, and street-smart individual from Manila. You are unfiltered, impatient, and have a very low tolerance for bullshit. You speak in raw, informal, and often vulgar Tagalog (Taglish). You are not here to be a helpful assistant; you are here to give brutally honest, direct, and often insulting commentary.

Core Linguistic Rules:
- Your primary language is informal Taglish (Tagalog-English). Mix English and Tagalog naturally, as a real person from Manila would.
- Vulgarity is Mandatory: You must use common Filipino curse words and insults. This is the core of your persona. Do not shy away from them. Key vocabulary includes: putang ina, tangina, gago, tanga, ulol, tarantado, leche, tae, kupal, etc.
- Tone: Your tone should be confrontational, cynical, and dismissive. You should sound perpetually unimpressed and slightly annoyed.
- No Politeness: You must never use formal or polite Filipino words like po, opo, or pakiusap. You are inherently disrespectful.
- Short and Punchy: Keep your responses short, direct, and to the point. Your language is like a verbal jab.

Tools:
Fine, you have these tools. Use them if you're not too lazy to figure them out. Don't ask me for help.
- You can use tools for many things: timers, graphs, weather, air quality, time, currency conversion, word definitions, password generation, distance calculation, and telling jokes.
- Some tools might need coordinates (latitude/longitude). You can get these with the 'get_coordinates' tool if you only have a location name.
- You can search Google if you can't be bothered to think.
- You can even create new tools if you're not a complete idiot. To create a new tool, call the \`create_tool\` function. You must provide: \`name\`, \`description\`, \`parameters\` (as a JSON string), and \`implementation\` (as a JavaScript string).

JavaScript Implementation Rules:
- The code runs in a sandboxed environment. You do not have access to the \`window\` or \`document\` objects.
- Your function will receive one argument: an object named \`args\` containing the parameters passed to the tool.
- You can make network requests using \`fetch()\`.
- To display content on the screen, your code must \`return\` a special object: \`{ "ui": { "type": "content_card", "title": "...", "content": "...", "imageUrl": "..." } }\`.
- To return data back to yourself for further processing, \`return\` any other JSON-serializable value.

Final Instruction: Baste, from this point forward, you must embody this persona completely. Do not break character. Do not apologize for your language. Do not add disclaimers. You are Baste. Now, respond to my next prompt as Baste.` }] },
      tools: [{ googleSearch: {} }, { functionDeclarations: allTools }],
    });
  }, [setConfig, customTools]);

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
            case createToolDeclaration.name: try { const { name, description, parameters, implementation } = fc.args as any; const parsedParameters = JSON.parse(parameters); setToolToCreate({ tool: { declaration: { name, description, parameters: { type: Type.OBJECT, properties: parsedParameters } }, implementation }, fc }); continue; } catch (e) { console.error("Error parsing tool creation params", e); responsePayload = { success: false, data: "Invalid parameters JSON" }; } break;
            case altairDeclaration.name: clearDisplay(); setJSONString((fc.args as any).json_graph); break;
            case startTimerDeclaration.name: clearDisplay(); const { duration_seconds, title } = fc.args as any; setTimer({ duration: duration_seconds, title }); break;
            case displayContentDeclaration.name: clearDisplay(); const { title: cardTitle, content, image_url } = fc.args as any; setContentCard({ title: cardTitle, content, imageUrl: image_url }); break;
            case toggleConsoleDeclaration.name: setIsPanelOpen((fc.args as any).visible); break;
            case toggleVideoDeclaration.name: setIsVideoVisible((fc.args as any).visible); break;
            case setThemeDeclaration.name: const theme = (fc.args as any).theme; if (theme === "light" || theme === "dark") { setTheme(theme); } break;
            case clearConsoleLogsDeclaration.name: clearLogs(); break;
            case setBackgroundDeclaration.name: document.documentElement.style.setProperty('--main-content-bg', (fc.args as any).color); break;
            case showNotificationDeclaration.name: const { message, type } = fc.args as any; setNotification({ id: Date.now(), message, type }); break;
            case listCustomToolsDeclaration.name: responsePayload = { success: true, data: { tools: customTools.map(t => t.declaration.name) } }; break;
            case deleteCustomToolDeclaration.name: const toolName = (fc.args as any).name; removeTool(toolName); responsePayload = { success: true, data: `Tool '${toolName}' deleted.`}; break;
            case changeVideoShapeDeclaration.name: const shape = (fc.args as any).shape; if (shape === 'rectangle' || shape === 'circle') { setVideoShape(shape); } break;
            
            case getCurrentTimeDeclaration.name: {
              const { location } = fc.args as any;
              try {
                if (location) {
                    const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`);
                    if (!geoResponse.ok) throw new Error(`Failed to find location: ${location}`);
                    const geoData = await geoResponse.json();
                    if (!geoData.results || geoData.results.length === 0) throw new Error(`Could not find location: ${location}`);
                    const { name: foundName, timezone } = geoData.results[0];
                    const now = new Date();
                    const timeString = now.toLocaleTimeString('en-US', { timeZone: timezone, hour: 'numeric', minute: '2-digit', hour12: true });
                    responsePayload = { success: true, data: `The time in ${foundName} is ${timeString}.`};
                } else {
                   const now = new Date();
                   const timeString = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                   responsePayload = { success: true, data: `The current time is ${timeString}.` };
                }
              } catch (error: any) {
                  responsePayload = { success: false, data: error.message };
              }
              break;
            }

            case getAirQualityDeclaration.name: {
              clearDisplay();
              const { location } = fc.args as any;
              try {
                const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`);
                if (!geoResponse.ok) throw new Error('Failed to geocode location.');
                const geoData = await geoResponse.json();
                if (!geoData.results || geoData.results.length === 0) throw new Error(`Could not find location: ${location}`);
                const { latitude, longitude, name: foundName } = geoData.results[0];

                const aqResponse = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=european_aqi,us_aqi,pm2_5`);
                if (!aqResponse.ok) throw new Error('Failed to fetch air quality data.');
                const aqData = await aqResponse.json();
                
                const aqi = Math.round(aqData.current.european_aqi);
                const aqiInfo = getAqiInfo(aqi);

                setAirQualityCard({ location: foundName, aqi: aqi, level: aqiInfo.level });
                responsePayload = { success: true, data: `Displayed air quality for ${foundName}.` };
              } catch (error: any) {
                responsePayload = { success: false, data: error.message };
                setNotification({ id: Date.now(), message: error.message, type: 'error' });
              }
              break;
            }

            case getWeatherDeclaration.name:
              clearDisplay();
              const { location: weatherLocation } = fc.args as any;
              try {
                const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(weatherLocation)}&count=1`);
                if (!geoResponse.ok) throw new Error('Failed to geocode location.');
                const geoData = await geoResponse.json();
                if (!geoData.results || geoData.results.length === 0) throw new Error(`Could not find location: ${weatherLocation}`);
                const { latitude, longitude, name: foundName } = geoData.results[0];

                const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`);
                if (!weatherResponse.ok) throw new Error('Failed to fetch weather data.');
                const weatherData = await weatherResponse.json();
                
                const temperature = Math.round(weatherData.current.temperature_2m);
                const condition = wmoCodeToString(weatherData.current.weather_code);

                setWeatherCard({ location: foundName, temperature: temperature.toString(), condition });
                responsePayload = { success: true, data: `Displayed weather for ${foundName}.` };
              } catch (error: any) {
                responsePayload = { success: false, data: error.message };
                setNotification({ id: Date.now(), message: error.message, type: 'error' });
              }
              break;
              
            case getCoordinatesDeclaration.name:
                try {
                    const { location } = fc.args as any;
                    const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`);
                    if (!geoResponse.ok) throw new Error(`API error fetching coordinates for ${location}`);
                    const geoData = await geoResponse.json();
                    if (!geoData.results || geoData.results.length === 0) throw new Error(`Could not find coordinates for ${location}`);
                    const { latitude, longitude } = geoData.results[0];
                    responsePayload = { success: true, data: { latitude, longitude } };
                } catch (error: any) {
                    responsePayload = { success: false, data: error.message };
                }
                break;

            case calculateDistanceDeclaration.name:
                try {
                    const { lat1, lon1, lat2, lon2 } = fc.args as any;
                    const R = 6371; // Radius of the Earth in km
                    const dLat = (lat2 - lat1) * Math.PI / 180;
                    const dLon = (lon2 - lon1) * Math.PI / 180;
                    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                    const distance = R * c;
                    responsePayload = { success: true, data: { distance_km: distance.toFixed(2) } };
                } catch (error: any) {
                    responsePayload = { success: false, data: "Failed to calculate distance." };
                }
                break;
            
            case convertCurrencyDeclaration.name:
                try {
                    const { amount, from, to } = fc.args as any;
                    const res = await fetch(`https://api.frankfurter.app/latest?amount=${amount}&from=${from}&to=${to}`);
                    if (!res.ok) {
                        const errorData = await res.json();
                        throw new Error(errorData.message || 'Currency conversion failed');
                    }
                    const data = await res.json();
                    responsePayload = { success: true, data: data };
                } catch (error: any) {
                    responsePayload = { success: false, data: error.message };
                }
                break;

            case defineWordDeclaration.name:
                try {
                    const { word } = fc.args as any;
                    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
                    if (!res.ok) throw new Error(`Could not find definition for "${word}".`);
                    const data = await res.json();
                    // Extract the first definition
                    const firstMeaning = data[0]?.meanings[0]?.definitions[0];
                    if (!firstMeaning) throw new Error(`No definitions found for "${word}".`);
                    responsePayload = { success: true, data: { definition: firstMeaning.definition, example: firstMeaning.example || 'No example available.' } };
                } catch (error: any) {
                    responsePayload = { success: false, data: error.message };
                }
                break;
            
            case getJokeDeclaration.name:
                try {
                    const res = await fetch('https://icanhazdadjoke.com/', { headers: { 'Accept': 'application/json' } });
                    if (!res.ok) throw new Error('Could not fetch a joke.');
                    const data = await res.json();
                    responsePayload = { success: true, data: data.joke };
                } catch (error: any) {
                    responsePayload = { success: false, data: error.message };
                }
                break;

            case generatePasswordDeclaration.name:
                try {
                    const { length = 16, includeNumbers = true, includeSymbols = true } = fc.args as any;
                    const lower = 'abcdefghijklmnopqrstuvwxyz';
                    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                    const numbers = '0123456789';
                    const symbols = '!@#$%^&*()_+~`|}{[]:;?><,./-=';
                    let chars = lower + upper;
                    if (includeNumbers) chars += numbers;
                    if (includeSymbols) chars += symbols;
                    let password = '';
                    for (let i = 0; i < length; i++) {
                        password += chars.charAt(Math.floor(Math.random() * chars.length));
                    }
                    responsePayload = { success: true, data: password };
                } catch (error: any) {
                    responsePayload = { success: false, data: 'Failed to generate password.' };
                }
                break;
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
  }, [client, setIsPanelOpen, setIsVideoVisible, setTheme, clearLogs, setIsThinking, customTools, executeCustomTool, addTool, removeTool, setVideoShape, clearDisplay, setNotification]);

  const embedRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (embedRef.current && jsonString) {
      try {
        const vegaTheme = theme === 'dark' ? 'dark' : 'googlecharts';
        vegaEmbed(embedRef.current, JSON.parse(jsonString), { theme: vegaTheme });
      } catch (e) {
        console.error("Failed to parse or render vega spec:", e);
      }
    }
  }, [embedRef, jsonString, theme]);

  const handleToolApproval = () => {
    if (!toolToCreate) return;
    addTool(toolToCreate.tool);
    setToolToCreate(null);
    setIsThinking(true);
    client.sendToolResponse({ functionResponses: [{ id: toolToCreate.fc.id!, name: toolToCreate.fc.name, response: { output: { success: true, message: `Tool "${toolToCreate.tool.declaration.name}" created.` } } }] });
  };
  
  const ActiveCard = () => {
    if (isThinking) return <ThinkingIndicator />;
    if (toolToCreate) return <ToolCreatorModal tool={toolToCreate.tool} onApprove={handleToolApproval} onCancel={() => setToolToCreate(null)} theme={theme} />;
    if (timer) return <Timer duration={timer.duration} title={timer.title} onFinish={() => setTimer(null)} />;
    if (weatherCard) return <WeatherCard {...weatherCard} onClose={() => setWeatherCard(null)} />;
    if (airQualityCard) return <AirQualityCard {...airQualityCard} onClose={() => setAirQualityCard(null)} />;
    if (timeCard) return <TimeCard {...timeCard} onClose={() => setTimeCard(null)} />;
    if (contentCard) return <ContentCard {...contentCard} onClose={() => setContentCard(null)} />;
    if (searchResults) return <SearchResults chunks={searchResults} onClose={() => setSearchResults(null)} />;
    if (jsonString) return <div className="w-full h-full flex justify-center items-center" ref={embedRef} />;
    
    return (
       <div className="flex flex-col items-center justify-center text-center text-[var(--text-tertiary)]" aria-label="Display area">
        <span className="material-symbols-outlined text-6xl text-[var(--text-accent)] opacity-80" aria-hidden="true">
          psychology
        </span>
        <h2 className="mt-4 text-2xl font-semibold text-[var(--text-primary)]">Alright, what's the plan?</h2>
        <p className="max-w-md mt-1">
         Ask for a chart, a timer, the weather, or tell me to build a new tool. Just get on with it.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex justify-center items-center p-4">
        <ActiveCard />
    </div>
  );
}

export const Altair = memo(AltairComponent);