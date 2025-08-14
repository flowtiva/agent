import React, { useEffect, useRef, useState } from 'react';
import { RiMenuLine } from 'react-icons/ri';
import { Altair } from './components/altair/Altair';
import ControlTray from './components/control-tray/ControlTray';
import SidePanel from './components/side-panel/SidePanel';
import { LiveAPIProvider } from './contexts/LiveAPIContext';
import { useLocalStorageState } from './hooks/useLocalStorageState';
import { LiveClientOptions } from './types';
import { Notification } from './components/notification/Notification';

type NotificationType = 'info' | 'success' | 'warning' | 'error';
export type NotificationState = { id: number; message: string; type: NotificationType } | null;


const apiOptions: LiveClientOptions = {
  apiKey: process.env.API_KEY as string,
};

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useLocalStorageState(
    'panelOpen',
    window.innerWidth > 1024
  );
  const [isVideoVisible, setIsVideoVisible] = useLocalStorageState(
    'videoVisible',
    true
  );
  const [theme, setTheme] = useLocalStorageState<'light' | 'dark'>(
    'theme',
    'dark'
  );
  const [videoShape, setVideoShape] = useLocalStorageState<'rectangle' | 'circle'>(
    'videoShape',
    'rectangle'
  );
  const [notification, setNotification] = useState<NotificationState>(null);

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }, [theme]);

  const isVideoHidden = !videoStream || !isVideoVisible;

  return (
    <div className="h-screen w-screen bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden">
      {notification && <Notification {...notification} onClose={() => setNotification(null)} />}
      <LiveAPIProvider options={apiOptions}>
        <div className="flex h-full relative">
          <SidePanel open={isPanelOpen} setOpen={setIsPanelOpen} theme={theme} />
          <main 
            style={{ backgroundColor: 'var(--main-content-bg)' }}
            className="flex-1 flex flex-col relative h-full min-w-0 transition-colors duration-500 ease-in-out"
          >
            <header className="flex items-center px-4 md:px-6 py-3 border-b border-[var(--border-primary)] bg-[var(--bg-primary)] flex-shrink-0 z-20">
              <button
                className="lg:hidden p-2 -ml-2 mr-2 text-[var(--text-secondary)]"
                onClick={() => setIsPanelOpen(true)}
                aria-label="Open console"
              >
                <RiMenuLine size={24} />
              </button>
              <h1 className="text-lg font-bold flex-grow lg:text-center text-left text-[var(--text-primary)]">
                Baste
              </h1>
               <div className="w-10 h-10 lg:hidden" />
            </header>

            <div className="flex-grow flex justify-center items-center p-4 overflow-auto relative">
              <Altair
                setIsPanelOpen={setIsPanelOpen}
                setIsVideoVisible={setIsVideoVisible}
                setTheme={setTheme}
                setVideoShape={setVideoShape}
                theme={theme}
                setNotification={setNotification}
              />
               <video
                className={`absolute bottom-28 right-6 max-w-[25vw] border-2 border-[var(--border-secondary)] shadow-2xl transition-all duration-300 ease-out z-10 bg-black
                  ${isVideoHidden ? 'opacity-0 pointer-events-none translate-x-[calc(100%+40px)]' : 'opacity-100 translate-x-0'} 
                  ${videoShape === 'circle' ? 'w-40 h-40 md:w-48 md:h-48 rounded-full object-cover' : 'w-64 rounded-lg'}`}
                ref={videoRef}
                autoPlay
                playsInline
                muted
              />
            </div>
            
            <ControlTray
              videoRef={videoRef}
              supportsVideo={true}
              onVideoStreamChange={setVideoStream}
              enableEditingSettings={true}
              theme={theme}
              setNotification={setNotification}
            />
          </main>
        </div>
      </LiveAPIProvider>
    </div>
  );
}

export default App;