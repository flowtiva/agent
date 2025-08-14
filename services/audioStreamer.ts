import { createWorkletFromSrc, registeredWorklets } from "./workletUtils";

export class AudioStreamer {
  private audioQueue: Float32Array[] = [];
  private isPlaying: boolean = false;
  private scheduledTime: number = 0;
  private gainNode: GainNode;
  private initialBufferTime: number = 0.1; // 100ms

  constructor(public context: AudioContext) {
    this.gainNode = this.context.createGain();
    this.gainNode.connect(this.context.destination);
  }

  async addWorklet<T extends (d: any) => void>(workletName: string, workletSrc: string, handler: T): Promise<this> {
    let workletsRecord = registeredWorklets.get(this.context);
    if (!workletsRecord) {
        workletsRecord = {};
        registeredWorklets.set(this.context, workletsRecord);
    }

    if (workletsRecord[workletName]) {
      workletsRecord[workletName].handlers.push(handler);
      return this;
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
    if (chunk.length === 0) return;

    const float32Chunk = this._processPCM16Chunk(chunk);
    this.audioQueue.push(float32Chunk);

    if (!this.isPlaying) {
      this.isPlaying = true;
      this.scheduledTime = this.context.currentTime + this.initialBufferTime;
      this.scheduleNextBuffer();
    }
  }

  private createAudioBuffer(audioData: Float32Array): AudioBuffer {
    const audioBuffer = this.context.createBuffer(1, audioData.length, this.context.sampleRate);
    audioBuffer.getChannelData(0).set(audioData);
    return audioBuffer;
  }

  private scheduleNextBuffer() {
    if (!this.isPlaying) return;

    const SCHEDULE_AHEAD_TIME = 0.2;

    while (this.audioQueue.length > 0 && this.scheduledTime < this.context.currentTime + SCHEDULE_AHEAD_TIME) {
      const audioData = this.audioQueue.shift()!;
      const audioBuffer = this.createAudioBuffer(audioData);
      const source = this.context.createBufferSource();
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

      const startTime = Math.max(this.scheduledTime, this.context.currentTime);
      source.start(startTime);
      this.scheduledTime = startTime + audioBuffer.duration;
    }

    if (this.audioQueue.length > 0) {
        const nextCheckTime = (this.scheduledTime - this.context.currentTime) * 1000 - 100;
        setTimeout(() => this.scheduleNextBuffer(), Math.max(50, nextCheckTime));
    } else {
        // queue is empty, isPlaying will be false until more data arrives
        this.isPlaying = false;
    }
  }

  async resume() {
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }
  }

  stop() {
    this.audioQueue = [];
    this.isPlaying = false;
    try {
      // Perform a quick fade-out to prevent clicks.
      this.gainNode.gain.cancelScheduledValues(this.context.currentTime);
      this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, this.context.currentTime);
      this.gainNode.gain.linearRampToValueAtTime(0, this.context.currentTime + 0.05);
      // Reset gain for the next playback.
      this.gainNode.gain.setValueAtTime(1, this.context.currentTime + 0.06);
    } catch (e) {
        console.error("Error during audio streamer stop, re-creating gain node.", e);
        // Fallback for when context is in a bad state
        this.gainNode.disconnect();
        this.gainNode = this.context.createGain();
        this.gainNode.connect(this.context.destination);
    }
  }
}
