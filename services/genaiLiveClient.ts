import {
  Content,
  GoogleGenAI,
  LiveCallbacks,
  LiveClientToolResponse,
  LiveConnectConfig,
  LiveServerContent,
  LiveServerMessage,
  LiveServerToolCall,
  LiveServerToolCallCancellation,
  Part,
  Session,
} from "@google/genai";
import { EventEmitter } from "eventemitter3";
import { LiveClientOptions, StreamingLog } from "../types";
import { base64ToArrayBuffer } from "./utils";

export interface LiveClientEventTypes {
  audio: (data: ArrayBuffer) => void;
  close: (event: CloseEvent) => void;
  content: (data: LiveServerContent) => void;
  error: (error: ErrorEvent) => void;
  interrupted: () => void;
  log: (log: StreamingLog) => void;
  open: () => void;
  setupcomplete: () => void;
  toolcall: (toolCall: LiveServerToolCall) => void;
  toolcallcancellation: (toolcallCancellation: LiveServerToolCallCancellation) => void;
  turncomplete: () => void;
}

export class GenAILiveClient {
  protected client: GoogleGenAI;
  private _session: Session | null = null;
  private _status: "connected" | "disconnected" | "connecting" = "disconnected";
  private emitter = new EventEmitter<LiveClientEventTypes>();

  public on = this.emitter.on.bind(this.emitter);
  public off = this.emitter.off.bind(this.emitter);

  constructor(options: LiveClientOptions) {
    this.client = new GoogleGenAI(options);
  }

  public get status() {
    return this._status;
  }

  private log(type: string, message: StreamingLog["message"]) {
    this.emitter.emit("log", { date: new Date(), type, message });
  }

  async connect(model: string, config: LiveConnectConfig): Promise<boolean> {
    if (this._status !== "disconnected") return false;
    this._status = "connecting";

    const callbacks: LiveCallbacks = {
      onopen: () => {
        this._status = "connected";
        this.log("client.open", "Connected");
        this.emitter.emit("open");
      },
      onmessage: (message: LiveServerMessage) => this.onMessage(message),
      onerror: (e: ErrorEvent) => {
        this.log("server.error", e.message);
        this.emitter.emit("error", e);
      },
      onclose: (e: CloseEvent) => {
        this._status = "disconnected";
        this.log("server.close", `Disconnected: ${e.reason || 'No reason given'}`);
        this.emitter.emit("close", e);
      },
    };

    try {
      this._session = await this.client.live.connect({ model, config, callbacks });
      return true;
    } catch (e) {
      console.error("Error connecting to GenAI Live:", e);
      this._status = "disconnected";
      return false;
    }
  }

  public disconnect() {
    if (!this._session) return false;
    this._session.close();
    this._session = null;
    this._status = "disconnected";
    this.log("client.close", `Disconnected`);
    return true;
  }

  private onMessage(message: LiveServerMessage) {
    if (message.setupComplete) {
        this.log("server.setupComplete", message);
        this.emitter.emit("setupcomplete");
    } else if (message.toolCall) {
        this.log("server.toolCall", { toolCall: message.toolCall });
        this.emitter.emit("toolcall", message.toolCall);
    } else if (message.toolCallCancellation) {
        this.log("server.toolCallCancellation", { toolCallCancellation: message.toolCallCancellation });
        this.emitter.emit("toolcallcancellation", message.toolCallCancellation);
    } else if (message.serverContent) {
        this.handleServerContent(message.serverContent);
    } else {
        console.log("received unmatched message", message);
        this.log("server.unknown", message);
    }
  }

  private handleServerContent(serverContent: LiveServerContent) {
    if ("interrupted" in serverContent) {
        this.log("server.content", "interrupted");
        this.emitter.emit("interrupted");
        return;
    }
    if ("turnComplete" in serverContent) {
        this.log("server.content", "turnComplete");
        this.emitter.emit("turncomplete");
    }

    if ("modelTurn" in serverContent && serverContent.modelTurn) {
        const { parts = [], ...restOfModelTurn } = serverContent.modelTurn;
        const audioParts = parts.filter(p => p.inlineData?.mimeType?.startsWith("audio/"));
        const otherParts = parts.filter(p => !p.inlineData?.mimeType?.startsWith("audio/"));

        audioParts.forEach(p => {
            if (p.inlineData?.data) {
                const data = base64ToArrayBuffer(p.inlineData.data);
                this.emitter.emit("audio", data);
                this.log("server.audio", `buffer (${data.byteLength})`);
            }
        });

        if (otherParts.length > 0 || (serverContent as any).groundingMetadata) {
            const contentToEmit: LiveServerContent = {
                modelTurn: { ...restOfModelTurn, parts: otherParts },
            };
            if ((serverContent as any).groundingMetadata) {
                (contentToEmit as any).groundingMetadata = (serverContent as any).groundingMetadata;
            }
            this.emitter.emit("content", contentToEmit);
            this.log("server.content", { serverContent: contentToEmit });
        }
    } else if ((serverContent as any).groundingMetadata) {
        this.emitter.emit("content", serverContent);
        this.log("server.content", { serverContent });
    }
  }
  
  sendRealtimeInput(media: Array<{ mimeType: string; data: string }>) {
    if (this._status !== "connected") return;
    const parts = media.map(m => ({
        inlineData: { mimeType: m.mimeType, data: m.data }
    }));
    this._session?.sendRealtimeInput({ parts });
    this.log("client.realtimeInput", media.map(m => m.mimeType).join(', '));
  }

  sendToolResponse(toolResponse: LiveClientToolResponse) {
    if (this._status !== "connected" || !toolResponse.functionResponses) return;
    this._session?.sendToolResponse({ functionResponses: toolResponse.functionResponses });
    this.log("client.toolResponse", toolResponse);
  }

  send(parts: Part | Part[], turnComplete: boolean = true) {
    if (this._status !== "connected") return;
    const turns = Array.isArray(parts) ? parts : [parts];
    this._session?.sendClientContent({ turns: [{ parts: turns }], turnComplete });
    this.log("client.send", { turns, turnComplete });
  }
}