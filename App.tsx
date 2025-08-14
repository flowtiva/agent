
import React, { useEffect, useRef, useState } from 'react';
import { RiMenuLine } from 'react-icons/ri';
import { Altair } from './components/altair/Altair';
import ControlTray from './components/control-tray/ControlTray';
import SidePanel from './components/side-panel/SidePanel';
import { LiveAPIProvider } from './contexts/LiveAPIContext';
import { useLocalStorageState } from './hooks/useLocalStorageState';
import { LiveClientOptions } from './types';

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
  const [mainBackground, setMainBackground] = useLocalStorageState<string>(
    'mainBackground',
    '#111827' // bg-gray-900
  );

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }, [theme]);

  const isVideoHidden = !videoStream || !isVideoVisible;

  return (
    <div className="h-screen w-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden">
      <LiveAPIProvider options={apiOptions}>
        <div className="flex h-full relative">
          <SidePanel open={isPanelOpen} setOpen={setIsPanelOpen} />
          <main 
            style={{ backgroundColor: mainBackground }}
            className="flex-1 flex flex-col relative h-full min-w-0 transition-colors duration-500 ease-in-out"
          >
            <header className="flex items-center px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 flex-shrink-0">
              <button
                className="lg:hidden p-2 -ml-2 mr-2 text-gray-500 dark:text-gray-400"
                onClick={() => setIsPanelOpen(true)}
                aria-label="Open console"
              >
                <RiMenuLine size={24} />
              </button>
              <h1 className="text-lg font-medium flex-grow text-center text-gray-800 dark:text-gray-200">
                Baste
              </h1>
            </header>

            <div className="flex-grow flex justify-center items-center p-4 overflow-auto relative">
              <Altair
                setIsPanelOpen={setIsPanelOpen}
                setIsVideoVisible={setIsVideoVisible}
                setTheme={setTheme}
                setMainBackground={setMainBackground}
              />
               <video
                className={`absolute bottom-32 right-5 w-48 max-w-[30vw] rounded-lg border-2 border-gray-400 dark:border-gray-600 shadow-2xl transition-all duration-300 ease-out z-10 ${isVideoHidden ? 'opacity-0 pointer-events-none translate-x-[calc(100%+40px)]' : 'opacity-100 translate-x-0'}`}
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
            />
          </main>
        </div>
      </LiveAPIProvider>
    </div>
  );
}

export default App;
