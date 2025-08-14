import React, {
  ChangeEvent,
  memo,
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
import { NotificationState } from "../../App";

export type ControlTrayProps = {
  videoRef: RefObject<HTMLVideoElement>;
  supportsVideo: boolean;
  onVideoStreamChange?: (stream: MediaStream | null) => void;
  enableEditingSettings?: boolean;
  theme: 'light' | 'dark';
  setNotification: (notification: NotificationState) => void;
};

const TrayButton = memo(
  ({ isStreaming, onIcon, offIcon, onClick, title, disabled = false }: { isStreaming: boolean; onIcon: string; offIcon: string; onClick: () => void; title: string; disabled?: boolean }) => (
    <button
      className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-200 text-2xl
        ${isStreaming 
          ? 'bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary-hover)]' 
          : 'bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[var(--bg-tertiary)]`}
      onClick={onClick}
      title={title}
      aria-pressed={isStreaming}
      disabled={disabled}
    >
      <span className="material-symbols-outlined filled">{isStreaming ? onIcon : offIcon}</span>
    </button>
  )
);

function ControlTray({ videoRef, onVideoStreamChange = () => {}, supportsVideo, enableEditingSettings, theme, setNotification }: ControlTrayProps) {
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
    const onError = (message: string) => {
        setNotification({ id: Date.now(), message, type: 'error' });
    }

    if (connected && !muted) {
      audioRecorder.on("data", onData).on("volume", setInVolume).on("error", onError).start();
    } else {
      audioRecorder.stop();
    }
    return () => { audioRecorder.off("data", onData).off("volume", setInVolume).off("error", onError); };
  }, [connected, client, muted, setNotification]);

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
      timeoutId = window.setTimeout(sendVideoFrame, 1000 / 2); // 2 fps
    }
    
    sendVideoFrame();
    return () => clearTimeout(timeoutId);
  }, [connected, client, videoRef, activeStreamType]);

  return (
    <section className="absolute bottom-4 md:bottom-6 inset-x-0 z-20 px-4">
      <canvas style={{ display: "none" }} ref={renderCanvasRef} />
      <div className="w-full max-w-4xl mx-auto flex items-center gap-2 md:gap-4 p-2 rounded-2xl bg-[var(--bg-primary)] shadow-2xl border border-[var(--border-primary)]">
        
        <TrayButton
            isStreaming={!muted && connected}
            onClick={() => setMuted(!muted)}
            onIcon="mic"
            offIcon="mic_off"
            title={muted ? "Unmute microphone" : "Mute microphone"}
            disabled={!connected}
          />

        <div className="flex-grow flex items-center relative">
          <textarea
            className="w-full bg-[var(--bg-tertiary)] border-2 border-transparent rounded-full py-3 pl-5 pr-14 text-base text-[var(--text-primary)] placeholder-[var(--text-tertiary)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]"
            ref={inputRef}
            disabled={!connected}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setTextInput(e.target.value)}
            value={textInput}
            placeholder={connected ? "Type or talk..." : "Press play to start"}
            rows={1}
          />
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] disabled:bg-[var(--bg-tertiary)] disabled:text-[var(--text-tertiary)] disabled:cursor-not-allowed text-white rounded-full transition-colors"
            onClick={handleSubmit}
            disabled={!connected || !textInput.trim()}
            aria-label="Send message"
          >
            <span className="material-symbols-outlined filled">send</span>
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          {supportsVideo && (
            <>
              <TrayButton isStreaming={screenCapture.isStreaming} onClick={() => handleStreamChange(screenCapture.isStreaming ? null : 'screen')} onIcon="stop_screen_share" offIcon="screen_share" title={screenCapture.isStreaming ? "Stop screen share" : "Share screen"} disabled={!connected} />
              <TrayButton isStreaming={webcam.isStreaming} onClick={() => handleStreamChange(webcam.isStreaming ? null : 'webcam')} onIcon="videocam_off" offIcon="videocam" title={webcam.isStreaming ? "Turn off camera" : "Turn on camera"} disabled={!connected}/>
            </>
          )}
          {enableEditingSettings && <SettingsDialog theme={theme} />}
           <button
             className={`w-14 h-12 flex items-center justify-center rounded-full text-white font-semibold transition-colors duration-200 ${connected ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
             onClick={connected ? disconnect : connect}
             title={connected ? "Disconnect" : "Connect"}
           >
             <span className="material-symbols-outlined filled text-3xl">
               {connected ? "pause" : "play_arrow"}
             </span>
           </button>
        </div>
      </div>
      <div className="absolute left-1/2 -translate-x-1/2 bottom-[calc(100%+8px)] w-12 h-12 flex items-center justify-center" title="Output volume">
        <AudioPulse volume={volume} active={connected} />
      </div>
    </section>
  );
}

export default memo(ControlTray);