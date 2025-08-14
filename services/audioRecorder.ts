import { EventEmitter } from "eventemitter3";
import { audioContext } from "./utils";
import { AudioRecordingWorklet, VolMeterWorklet } from "./worklets";
import { createWorkletFromSrc } from "./workletUtils";

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

interface AudioRecorderEvents {
  data: (base64: string) => void;
  volume: (volume: number) => void;
  error: (message: string) => void;
}

class AudioRecorder {
  private emitter = new EventEmitter<AudioRecorderEvents>();
  private stream?: MediaStream;
  private audioContext?: AudioContext;
  private source?: MediaStreamAudioSourceNode;
  private recordingWorklet?: AudioWorkletNode;
  private vuWorklet?: AudioWorkletNode;
  private _isRecording = false;
  private startingPromise: Promise<void> | null = null;
  public sampleRate: number;

  constructor(sampleRate = 16000) {
    this.sampleRate = sampleRate;
  }

  public on<T extends keyof AudioRecorderEvents>(event: T, listener: AudioRecorderEvents[T]): this {
    this.emitter.on(event, listener as any);
    return this;
  }

  public off<T extends keyof AudioRecorderEvents>(event: T, listener: AudioRecorderEvents[T]): this {
    this.emitter.off(event, listener as any);
    return this;
  }

  private emit<T extends keyof AudioRecorderEvents>(event: T, ...args: Parameters<AudioRecorderEvents[T]>): boolean {
    return (this.emitter.emit as any)(event, ...args);
  }

  public get isRecording(): boolean {
    return this._isRecording;
  }

  async start(): Promise<void> {
    if (this.startingPromise) return this.startingPromise;
    if (this._isRecording) return;
    
    this.startingPromise = (async () => {
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.audioContext = await audioContext({ sampleRate: this.sampleRate });
        this.source = this.audioContext.createMediaStreamSource(this.stream);

        // Recording worklet
        const recorderWorkletName = "audio-recorder-worklet";
        await this.audioContext.audioWorklet.addModule(createWorkletFromSrc(recorderWorkletName, AudioRecordingWorklet));
        this.recordingWorklet = new AudioWorkletNode(this.audioContext, recorderWorkletName);
        this.recordingWorklet.port.onmessage = (ev: MessageEvent) => {
          const arrayBuffer = ev.data.data.int16arrayBuffer;
          if (arrayBuffer) {
            this.emit("data", arrayBufferToBase64(arrayBuffer));
          }
        };
        this.source.connect(this.recordingWorklet);

        // VU meter worklet
        const vuWorkletName = "vu-meter-worklet";
        await this.audioContext.audioWorklet.addModule(createWorkletFromSrc(vuWorkletName, VolMeterWorklet));
        this.vuWorklet = new AudioWorkletNode(this.audioContext, vuWorkletName);
        this.vuWorklet.port.onmessage = (ev: MessageEvent) => {
          this.emit("volume", ev.data.volume);
        };
        this.source.connect(this.vuWorklet);

        this._isRecording = true;
      } catch (error: any) {
        console.error("Error starting audio recording:", error);
        let message = 'Failed to start audio recording. Check connection and browser permissions.';
        if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
            message = 'No microphone found. Please connect a microphone.';
        } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            message = 'Microphone access denied. Please grant permission in browser settings.';
        }
        this.emit("error", message);
        this.stop();
      } finally {
        this.startingPromise = null;
      }
    })();
    return this.startingPromise;
  }

  stop(): void {
    if (this.startingPromise) {
      this.startingPromise.finally(() => this._performStop());
      return;
    }
    this._performStop();
  }
  
  private _performStop(): void {
    this.source?.disconnect();
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = undefined;
    this.recordingWorklet = undefined;
    this.vuWorklet = undefined;
    this._isRecording = false;
  }
}

// Export a singleton instance
export const audioRecorder = new AudioRecorder();