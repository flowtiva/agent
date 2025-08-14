
import { useState, useEffect, useCallback } from "react";
import { UseMediaStreamResult } from "../types";

export function useMediaStream(type: "webcam" | "screen"): UseMediaStreamResult {
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const handleStreamEnded = () => {
      setStream(null);
    };

    const currentStream = stream;
    if (currentStream) {
      const tracks = currentStream.getTracks();
      tracks.forEach((track) => track.addEventListener("ended", handleStreamEnded));
      
      return () => {
        tracks.forEach((track) => track.removeEventListener("ended", handleStreamEnded));
      };
    }
  }, [stream]);

  const start = useCallback(async () => {
    try {
      const mediaStream =
        type === "webcam"
          ? await navigator.mediaDevices.getUserMedia({ video: true })
          : await navigator.mediaDevices.getDisplayMedia({ video: true });

      setStream(mediaStream);
      return mediaStream;
    } catch (err) {
      console.error(`Failed to get ${type} stream:`, err);
      setStream(null);
      return null;
    }
  }, [type]);

  const stop = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);
  
  const result: UseMediaStreamResult = {
    type,
    start,
    stop,
    isStreaming: !!stream,
    stream,
  };

  return result;
}
