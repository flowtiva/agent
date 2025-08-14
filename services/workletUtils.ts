
export type WorkletGraph = {
  node?: AudioWorkletNode;
  handlers: Array<(this: MessagePort, ev: MessageEvent) => any>;
};

// A registry to map attached worklets by their audio-context.
export const registeredWorklets: Map<AudioContext, Record<string, WorkletGraph>> = new Map();

// Creates a blob URL from a worklet source string for use with audioWorklet.addModule.
export const createWorkletFromSrc = (workletName: string, workletSrc: string): string => {
  const script = new Blob(
    [`registerProcessor("${workletName}", ${workletSrc})`],
    { type: "application/javascript" }
  );
  return URL.createObjectURL(script);
};