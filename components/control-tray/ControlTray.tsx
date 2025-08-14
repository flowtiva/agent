import React, {
  ChangeEvent,
  memo,
  ReactNode,
  RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { useMediaStream } from "../../hooks/useMediaStream";
import AudioPulse from "../audio-pulse/AudioPulse";
import SettingsDialog from "../settings-dialog/SettingsDialog";
import { useLocalStorageState } from "../../hooks/useLocalStorageState";
import { audioRecorder } from "../../services/audioRecorder";

export type ControlTrayProps = {
  videoRef: RefObject<HTMLVideoElement>;
  children?: ReactNode;
  supportsVideo: boolean;
  onVideoStreamChange?: (stream: MediaStream | null) => void;
  enableEditingSettings?: boolean;
};

const MediaStreamButton = memo(
  ({ isStreaming, onIcon, offIcon, onClick, title }: { isStreaming: boolean; onIcon: string; offIcon: string; onClick: () => void; title: string; }) => (
    <button
      className={`w-11 h-11 flex items-center justify-center rounded-full transition-colors duration-200 ${isStreaming ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200'}`}
      onClick={onClick}
      title={title}
      aria-pressed={isStreaming}
    >
      <span className="material-symbols-outlined filled text-2xl">{isStreaming ? onIcon : offIcon}</span>
    </button>
  )
);

function ControlTray({ videoRef, children, onVideoStreamChange = () => {}, supportsVideo, enableEditingSettings }: ControlTrayProps) {
  const [activeStreamType, setActiveStreamType] = useState<'webcam' | 'screen' | null>(null);
  const webcam = useMediaStream('webcam');
  const screenCapture = useMediaStream('screen');
  
  const [muted, setMuted] = useLocalStorageState("microphoneMuted", false);
  const [inVolume, setInVolume] = useState(0);
  
  const renderCanvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [textInput, setTextInput] = useState("");
  const { client, connected, connect, disconnect, volume, setIsThinking } = useLiveAPIContext();

  const handleSubmit = useCallback(() => {
    if (!textInput.trim()) return;
    setIsThinking(true);
    client.send([{ text: textInput }]);
    setTextInput("");
  }, [client, textInput, setIsThinking]);

  useEffect(() => {
    const onData = (base64: string) => { client.sendRealtimeInput([{ mimeType: "audio/pcm;rate=16000", data: base64 }]); };
    if (connected && !muted) {
      audioRecorder.on("data", onData);
      audioRecorder.on("volume", setInVolume);
      audioRecorder.start();
    } else {
      audioRecorder.stop();
    }
    return () => {
      audioRecorder.off("data", onData);
      audioRecorder.off("volume", setInVolume);
    };
  }, [connected, client, muted]);

  const handleStreamChange = useCallback(async (type: 'webcam' | 'screen' | null) => {
    webcam.stop();
    screenCapture.stop();
    
    let stream: MediaStream | null = null;
    if (type === 'webcam') {
        stream = await webcam.start();
    } else if (type === 'screen') {
        stream = await screenCapture.start();
    }
    setActiveStreamType(type);
    onVideoStreamChange?.(stream);
  }, [webcam, screenCapture, onVideoStreamChange]);

  useEffect(() => {
    const activeStream = activeStreamType === 'webcam' ? webcam.stream : activeStreamType === 'screen' ? screenCapture.stream : null;
    if (videoRef.current) {
        videoRef.current.srcObject = activeStream;
    }
  }, [activeStreamType, webcam.stream, screenCapture.stream, videoRef]);

  useEffect(() => {
    let timeoutId: number;
    function sendVideoFrame() {
      const video = videoRef.current;
      const canvas = renderCanvasRef.current;
      if (!video || !canvas || !connected || !activeStreamType) return;
      
      const ctx = canvas.getContext("2d");
      if(!ctx) return;

      canvas.width = video.videoWidth * 0.25;
      canvas.height = video.videoHeight * 0.25;
      if (canvas.width > 0 && canvas.height > 0) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL("image/jpeg", 0.8);
        const data = base64.slice(base64.indexOf(",") + 1);
        client.sendRealtimeInput([{ mimeType: "image/jpeg", data }]);
      }
      timeoutId = window.setTimeout(sendVideoFrame, 1000 / 0.5); // 0.5 fps
    }
    
    sendVideoFrame();
    return () => clearTimeout(timeoutId);
  }, [connected, client, videoRef, activeStreamType]);


  return (
    <section className="bg-gray-100 dark:bg-slate-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex-shrink-0 z-20">
      <canvas style={{ display: "none" }} ref={renderCanvasRef} />
      <div className="w-full max-w-5xl mx-auto flex items-center gap-4 flex-wrap md:flex-nowrap">
        
        <div className="flex items-center gap-3 md:order-1">
          <button
            className={`w-12 h-12 flex items-center justify-center rounded-full transition-colors duration-200 ${muted ? "bg-red-500 text-white hover:bg-red-600" : "bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-slate-600"}`}
            onClick={() => setMuted(!muted)}
            title={muted ? "Unmute microphone" : "Mute microphone"}
            aria-pressed={!muted}
            disabled={!connected}
          >
            <span className="material-symbols-outlined filled text-2xl">{muted ? "mic_off" : "mic"}</span>
          </button>
          {children}
        </div>

        <div className="flex-grow flex items-center relative w-full md:w-auto md:order-2">
          <textarea
            className="w-full bg-gray-200 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-full py-3 pl-5 pr-14 text-base text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            ref={inputRef}
            disabled={!connected}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setTextInput(e.target.value)}
            value={textInput}
            placeholder={connected ? "Type something..." : "Connect to start conversation"}
            rows={1}
          />
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-slate-500 disabled:cursor-not-allowed text-white rounded-full transition-colors"
            onClick={handleSubmit}
            disabled={!connected || !textInput.trim()}
            aria-label="Send message"
          >
            <span className="material-symbols-outlined filled">send</span>
          </button>
        </div>
        
        <div className="flex items-center gap-3 md:order-3">
          <div className="w-11 h-11 flex items-center justify-center border border-gray-300 dark:border-slate-600 rounded-full" title="Output volume">
             <AudioPulse volume={volume} active={connected} />
          </div>
          {supportsVideo && (
            <>
              <MediaStreamButton isStreaming={screenCapture.isStreaming} onClick={() => handleStreamChange(screenCapture.isStreaming ? null : 'screen')} onIcon="stop_screen_share" offIcon="screen_share" title={screenCapture.isStreaming ? "Stop screen share" : "Share screen"} />
              <MediaStreamButton isStreaming={webcam.isStreaming} onClick={() => handleStreamChange(webcam.isStreaming ? null : 'webcam')} onIcon="videocam_off" offIcon="videocam" title={webcam.isStreaming ? "Turn off camera" : "Turn on camera"} />
            </>
          )}
          {enableEditingSettings && <SettingsDialog />}
           <button
             className={`w-12 h-12 flex items-center justify-center rounded-full text-white font-semibold transition-colors duration-200 ${connected ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
             onClick={connected ? disconnect : connect}
             title={connected ? "Disconnect" : "Connect"}
           >
             <span className="material-symbols-outlined filled text-3xl">
               {connected ? "pause" : "play_arrow"}
             </span>
           </button>
        </div>
      </div>
    </section>
  );
}

export default memo(ControlTray);