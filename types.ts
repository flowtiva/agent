
import {
  FunctionDeclaration,
  GoogleGenAIOptions,
  LiveClientToolResponse,
  LiveServerMessage,
  Part,
} from "@google/genai";

/**
 * The options to initiate the client, ensure apiKey is required.
 */
export type LiveClientOptions = GoogleGenAIOptions & { apiKey: string };

/**
 * Represents a log entry in the console.
 */
export type StreamingLog = {
  date: Date | string;
  type: string;
  count?: number;
  message:
    | string
    | ClientContentLog
    | Omit<LiveServerMessage, "text" | "data">
    | LiveClientToolResponse;
};

/**
 * Represents the content log from the client side.
 */
export type ClientContentLog = {
  turns: Part[];
  turnComplete: boolean;
};

/**
 * Represents a custom tool with its declaration and implementation.
 */
export interface CustomTool {
  declaration: FunctionDeclaration;
  implementation: string;
}

/**
 * The result from a media stream hook.
 */
export type UseMediaStreamResult = {
  type: "webcam" | "screen";
  start: () => Promise<MediaStream | null>;
  stop: () => void;
  isStreaming: boolean;
  stream: MediaStream | null;
};