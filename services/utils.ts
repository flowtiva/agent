
export type GetAudioContextOptions = AudioContextOptions & { id?: string };

const audioContextMap: Map<string, AudioContext> = new Map();

// Function to create or get an existing AudioContext.
// It handles browser policies that require user interaction to start audio.
export const audioContext = (() => {
  let hasInteracted = false;
  const onInteraction = () => {
    hasInteracted = true;
    window.removeEventListener("pointerdown", onInteraction, true);
    window.removeEventListener("keydown", onInteraction, true);
  };
  window.addEventListener("pointerdown", onInteraction, true);
  window.addEventListener("keydown", onInteraction, true);
  
  const createCtx = (opts?: GetAudioContextOptions) => {
    const ctx = new AudioContext(opts);
    if (opts?.id) {
      audioContextMap.set(opts.id, ctx);
    }
    return ctx;
  };
  
  return async (options?: GetAudioContextOptions): Promise<AudioContext> => {
    if (options?.id && audioContextMap.has(options.id)) {
      const existingCtx = audioContextMap.get(options.id)!;
      if (existingCtx.state === 'suspended') {
        await existingCtx.resume();
      }
      return existingCtx;
    }
    
    if (hasInteracted) {
      return createCtx(options);
    }
    
    // Attempt to play a silent sound to unlock the audio context
    try {
      const a = new Audio();
      a.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
      await a.play();
      return createCtx(options);
    } catch (e) {
      // If it fails, wait for a real user interaction
      return new Promise((resolve) => {
        const awaitInteraction = () => {
          resolve(createCtx(options));
          window.removeEventListener("pointerdown", awaitInteraction, true);
          window.removeEventListener("keydown", awaitInteraction, true);
        };
        window.addEventListener("pointerdown", awaitInteraction, true);
        window.addEventListener("keydown", awaitInteraction, true);
      });
    }
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