
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LiveConnectConfig } from "@google/genai";
import { GenAILiveClient } from "../services/genaiLiveClient";
import { LiveClientOptions } from "../types";
import { AudioStreamer } from "../services/audioStreamer";
import { audioContext } from "../services/utils";
import { VolMeterWorklet } from "../services/worklets";
import { useLocalStorageState } from "./useLocalStorageState";

export type UseLiveAPIResults = {
  client: GenAILiveClient;
  setConfig: (config: LiveConnectConfig) => void;
  config: LiveConnectConfig;
  model: string;
  setModel: (model: string) => void;
  connected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  volume: number;
  isThinking: boolean;
  setIsThinking: (isThinking: boolean) => void;
};

export function useLiveAPI(options: LiveClientOptions): UseLiveAPIResults {
  const client = useMemo(() => new GenAILiveClient(options), [options]);
  const audioStreamerRef = useRef<AudioStreamer | null>(null);
  const [model, setModel] = useState<string>("models/gemini-2.5-flash-preview-native-audio-dialog");
  const [config, setConfig] = useLocalStorageState<LiveConnectConfig>("liveConfig", {});
  const [connected, setConnected] = useState(false);
  const [volume, setVolume] = useState(0);
  const [isThinking, setIsThinking] = useState(false);

  useEffect(() => {
    if (!audioStreamerRef.current) {
      audioContext({ id: "audio-out", sampleRate: 24000 }).then(
        (audioCtx: AudioContext) => {
          const streamer = new AudioStreamer(audioCtx);
          audioStreamerRef.current = streamer;
          streamer.addWorklet("vumeter-out", VolMeterWorklet, (ev: MessageEvent) => {
            setVolume(ev.data.volume);
          });
        }
      );
    }
  }, []);

  useEffect(() => {
    const onOpen = () => setConnected(true);
    const onClose = () => { setConnected(false); setIsThinking(false); };
    const onError = (error: ErrorEvent) => { console.error("error", error); setIsThinking(false); };
    const stopThinking = () => setIsThinking(false);
    const stopAudioStreamer = () => audioStreamerRef.current?.stop();
    const completeAudioStreamer = () => audioStreamerRef.current?.complete();
    const onAudio = (data: ArrayBuffer) => { stopThinking(); audioStreamerRef.current?.addPCM16(new Uint8Array(data)); };
    
    client.on("open", onOpen).on("close", onClose).on("error", onError)
          .on("audio", onAudio).on("interrupted", stopAudioStreamer)
          .on("content", stopThinking).on("toolcall", stopThinking)
          .on("toolcallcancellation", stopThinking).on("turncomplete", completeAudioStreamer);
          
    return () => {
      client.off("open", onOpen).off("close", onClose).off("error", onError)
            .off("audio", onAudio).off("interrupted", stopAudioStreamer)
            .off("content", stopThinking).off("toolcall", stopThinking)
            .off("toolcallcancellation", stopThinking).off("turncomplete", completeAudioStreamer)
            .disconnect();
    };
  }, [client]);

  const connect = useCallback(async () => {
    if (!config) throw new Error("config has not been set");
    await audioStreamerRef.current?.resume();
    client.disconnect();
    await client.connect(model, config);
  }, [client, config, model]);

  const disconnect = useCallback(async () => {
    client.disconnect();
  }, [client]);

  return { client, config, setConfig, model, setModel, connected, connect, disconnect, volume, isThinking, setIsThinking };
}