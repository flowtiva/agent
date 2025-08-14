
import { createWorkletFromSrc, registeredWorklets } from "./workletUtils";

export class AudioStreamer {
  private sampleRate: number;
  private bufferSize: number = 7680;
  private audioQueue: Float32Array[] = [];
  private isPlaying: boolean = false;
  private isStreamComplete: boolean = false;
  private scheduledTime: number = 0;
  private initialBufferTime: number = 0.1;
  private gainNode: GainNode;
  private source: AudioBufferSourceNode;
  private endOfQueueAudioSource: AudioBufferSourceNode | null = null;
  private scheduleTimeout: number | null = null;
  public onComplete = () => {};

  constructor(public context: AudioContext) {
    this.sampleRate = context.sampleRate;
    this.gainNode = this.context.createGain();
    this.source = this.context.createBufferSource();
    this.gainNode.connect(this.context.destination);
    this.addPCM16 = this.addPCM16.bind(this);
  }

  async addWorklet<T extends (d: any) => void>(
    workletName: string,
    workletSrc: string,
    handler: T
  ): Promise<this> {
    let workletsRecord = registeredWorklets.get(this.context);
    if (workletsRecord && workletsRecord[workletName]) {
      workletsRecord[workletName].handlers.push(handler);
      return this;
    }
    if (!workletsRecord) {
      workletsRecord = {};
      registeredWorklets.set(this.context, workletsRecord);
    }
    workletsRecord[workletName] = { handlers: [handler] };
    const src = createWorkletFromSrc(workletName, workletSrc);
    await this.context.audioWorklet.addModule(src);
    const worklet = new AudioWorkletNode(this.context, workletName);
    workletsRecord[workletName].node = worklet;
    return this;
  }
  
  private _processPCM16Chunk(chunk: Uint8Array): Float32Array {
    const float32Array = new Float32Array(chunk.length / 2);
    const dataView = new DataView(chunk.buffer);
    for (let i = 0; i < float32Array.length; i++) {
      const int16 = dataView.getInt16(i * 2, true);
      float32Array[i] = int16 / 32768;
    }
    return float32Array;
  }

  addPCM16(chunk: Uint8Array) {
    this.isStreamComplete = false;
    const queueWasEmpty = this.audioQueue.length === 0;
    let processingBuffer = this._processPCM16Chunk(chunk);
    while (processingBuffer.length >= this.bufferSize) {
      this.audioQueue.push(processingBuffer.slice(0, this.bufferSize));
      processingBuffer = processingBuffer.slice(this.bufferSize);
    }
    if (processingBuffer.length > 0) {
      this.audioQueue.push(processingBuffer);
    }
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.scheduledTime = this.context.currentTime + this.initialBufferTime;
      this.scheduleNextBuffer();
    } else if (queueWasEmpty) {
      this.scheduleNextBuffer();
    }
  }
  
  private createAudioBuffer(audioData: Float32Array): AudioBuffer {
    const audioBuffer = this.context.createBuffer(1, audioData.length, this.sampleRate);
    audioBuffer.getChannelData(0).set(audioData);
    return audioBuffer;
  }

  private scheduleNextBuffer() {
    const SCHEDULE_AHEAD_TIME = 0.2;
    if (this.scheduledTime < this.context.currentTime) {
      this.scheduledTime = this.context.currentTime;
    }
    while (this.audioQueue.length > 0 && this.scheduledTime < this.context.currentTime + SCHEDULE_AHEAD_TIME) {
      const audioData = this.audioQueue.shift()!;
      const audioBuffer = this.createAudioBuffer(audioData);
      const source = this.context.createBufferSource();
      if (this.audioQueue.length === 0) {
        if (this.endOfQueueAudioSource) {
          this.endOfQueueAudioSource.onended = null;
        }
        this.endOfQueueAudioSource = source;
        source.onended = () => {
          if (!this.audioQueue.length && this.endOfQueueAudioSource === source) {
            this.endOfQueueAudioSource = null;
            if (this.isStreamComplete) {
              this.onComplete();
            }
          }
        };
      }
      source.buffer = audioBuffer;
      source.connect(this.gainNode);
      const worklets = registeredWorklets.get(this.context);
      if (worklets) {
        Object.values(worklets).forEach(({ node, handlers }) => {
          if (node) {
            source.connect(node);
            node.port.onmessage = (ev) => handlers.forEach(h => h.call(node.port, ev));
            node.connect(this.context.destination);
          }
        });
      }
      source.start(this.scheduledTime);
      this.scheduledTime += audioBuffer.duration;
    }
    if (this.scheduleTimeout) {
      clearTimeout(this.scheduleTimeout);
      this.scheduleTimeout = null;
    }
    if (this.audioQueue.length > 0) {
      const nextCheckTime = (this.scheduledTime - this.context.currentTime) * 1000;
      this.scheduleTimeout = window.setTimeout(() => this.scheduleNextBuffer(), Math.max(0, nextCheckTime - 50));
    } else if (this.isStreamComplete) {
      this.isPlaying = false;
    }
  }
  
  stop() {
    this.isPlaying = false;
    this.isStreamComplete = true;
    this.audioQueue = [];
    this.scheduledTime = this.context.currentTime;
    if (this.scheduleTimeout) {
      clearTimeout(this.scheduleTimeout);
      this.scheduleTimeout = null;
    }
    this.gainNode.gain.linearRampToValueAtTime(0, this.context.currentTime + 0.1);
    setTimeout(() => {
      this.gainNode.disconnect();
      this.gainNode = this.context.createGain();
      this.gainNode.connect(this.context.destination);
    }, 200);
  }

  async resume() {
    if (this.context.state === "suspended") {
      await this.context.resume();
    }
    this.isStreamComplete = false;
    this.scheduledTime = this.context.currentTime + this.initialBufferTime;
    this.gainNode.gain.setValueAtTime(1, this.context.currentTime);
  }

  complete() {
    this.isStreamComplete = true;
    if (this.audioQueue.length === 0) {
      this.onComplete();
    }
  }
}