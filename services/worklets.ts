
export const AudioRecordingWorklet = `
class AudioProcessingWorklet extends AudioWorkletProcessor {
  buffer = new Int16Array(2048);
  bufferWriteIndex = 0;

  constructor() {
    super();
  }

  process(inputs) {
    // inputs[0] is the first input, inputs[0][0] is the first channel
    if (inputs[0] && inputs[0][0]) {
      this.processChunk(inputs[0][0]);
    }
    return true; // Keep processor alive
  }

  sendAndClearBuffer() {
    if (this.bufferWriteIndex > 0) {
      this.port.postMessage({
        data: {
          int16arrayBuffer: this.buffer.slice(0, this.bufferWriteIndex).buffer,
        },
      });
      this.bufferWriteIndex = 0;
    }
  }

  processChunk(float32Array) {
    for (let i = 0; i < float32Array.length; i++) {
      // Convert float32 from -1.0 to 1.0 to int16 from -32768 to 32767
      this.buffer[this.bufferWriteIndex++] = Math.max(-32768, Math.min(32767, float32Array[i] * 32768));
      if (this.bufferWriteIndex >= this.buffer.length) {
        this.sendAndClearBuffer();
      }
    }
  }
}
`;

export const VolMeterWorklet = `
class VolMeter extends AudioWorkletProcessor {
  volume = 0;
  // Using smoothing factor for a more responsive feel
  smoothingFactor = 0.95;

  process(inputs) {
    const input = inputs[0];
    if (input && input.length > 0) {
      const samples = input[0];
      if (samples) {
        let sum = 0;
        for (let i = 0; i < samples.length; ++i) {
          sum += samples[i] * samples[i];
        }
        const rms = Math.sqrt(sum / samples.length);
        this.volume = Math.max(rms, this.volume * this.smoothingFactor);
        this.port.postMessage({ volume: this.volume });
      }
    }
    return true;
  }
}
`;
