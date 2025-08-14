export type GetAudioContextOptions = AudioContextOptions & { id?: string };

const audioContextMap: Map<string, AudioContext> = new Map();

// Function to create or get an existing AudioContext.
// It handles browser policies that require user interaction to start audio.
export const audioContext: (options?: GetAudioContextOptions) => Promise<AudioContext> = (() => {
  const didInteract = new Promise<void>((res) => {
    const handler = () => res();
    window.addEventListener("pointerdown", handler, { once: true });
    window.addEventListener("keydown", handler, { once: true });
  });

  const getOrCreateContext = (options?: GetAudioContextOptions) => {
      if (options?.id && audioContextMap.has(options.id)) {
        const ctx = audioContextMap.get(options.id);
        if (ctx) {
          return ctx;
        }
      }
      const ctx = new AudioContext(options);
      if (options?.id) {
        audioContextMap.set(options.id, ctx);
      }
      return ctx;
  };

  return async (options?: GetAudioContextOptions) => {
    try {
      // This is a trick to unlock the audio context on some browsers without an explicit user gesture.
      const a = new Audio();
      a.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
      await a.play();
    } catch (e) {
      // If that fails, it's likely we need a user gesture. Wait for it.
      await didInteract;
    }
    const ctx = getOrCreateContext(options);
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    return ctx;
  };
})();

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}
