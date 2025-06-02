import React, { useEffect, useState } from 'react';
import { useSystemStore, initializeSystem } from '../store/system';
import { useFileSystemStore } from '../store/filesystem';
import { useWindowsStore } from '../store/windows'; // Keep if used, else remove
import TaskBar from './TaskBar';
import WindowManager from './WindowManager';
import DesktopIcons from './DesktopIcons';
import ContextMenu from './ui/ContextMenu';

interface DesktopProps {
  toggleNotificationCenter: () => void;
}

const Desktop: React.FC<DesktopProps> = ({ toggleNotificationCenter }) => {
  const { settings } = useSystemStore();
  const { initialize, initialized: fsInitialized } = useFileSystemStore();
  const [isSystemHydrated, setIsSystemHydrated] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'booting' | 'loadingBar' | 'transitioning' | 'desktop'>('booting');

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [selectedApp, setSelectedApp] = useState<string | null>(null);

  useEffect(() => {
    const handleSystemReady = () => {
      initializeSystem();
      initialize();
    };

    let hydrationSubscribed = true;
    let systemReadyCalled = false;

    const attemptSystemReady = () => {
      if (!systemReadyCalled) {
        handleSystemReady();
        systemReadyCalled = true;
      }
    };

    if (useSystemStore.persist.hasHydrated()) {
      setIsSystemHydrated(true);
      attemptSystemReady();
    } else {
      const unsubHydration = useSystemStore.persist.onFinishHydration(() => {
        if (hydrationSubscribed) {
          setIsSystemHydrated(true);
          // attemptSystemReady will be called by the next effect if fsInitialized is also true
        }
      });
      // Consider cleanup for unsubHydration if it's a function
    }

    // Transition from 'booting' to 'loadingBar'
    if (animationPhase === 'booting' && isSystemHydrated && fsInitialized) {
      attemptSystemReady(); // Ensure system ready is called before or during this phase change
      setAnimationPhase('loadingBar');
    }

    return () => {
      hydrationSubscribed = false;
    };
  }, [initialize, animationPhase, isSystemHydrated, fsInitialized]);

  // Effect to move from 'loadingBar' to 'transitioning'
  useEffect(() => {
    if (animationPhase === 'loadingBar') {
      const timer = setTimeout(() => setAnimationPhase('transitioning'), 2000); // Progress bar duration
      return () => clearTimeout(timer);
    }
  }, [animationPhase]);

  // Effect to move from 'transitioning' to 'desktop' (marks end of desktop fade-in)
  useEffect(() => {
    if (animationPhase === 'transitioning') {
      const timer = setTimeout(() => setAnimationPhase('desktop'), 1000); // Desktop fade-in duration
      return () => clearTimeout(timer);
    }
  }, [animationPhase]);

  const handleContextMenuEvent = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleClickEvent = (e: React.MouseEvent) => {
    setContextMenu(null);
    setSelectedApp(null);
  };

  const currentWallpaper = settings.wallpaper || '/img/default-wallpaper.jpg';
  const desktopStyle: React.CSSProperties = {
    background: currentWallpaper === 'default'
      ? 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)'
      : `url(${currentWallpaper}) no-repeat center center / cover`,
  };

  return (
    <>
      {/* Loading Screen */} 
      {(animationPhase === 'booting' || animationPhase === 'loadingBar' || animationPhase === 'transitioning') && (
        <div
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-purple-700/30 backdrop-blur-xl text-white
                      transition-opacity duration-500 ease-in-out 
                      ${animationPhase === 'transitioning' ? 'opacity-0' : 'opacity-100'}`}
          style={{ pointerEvents: animationPhase === 'transitioning' ? 'none' : 'auto' }}
        >
          <svg
            className={`w-24 h-24 mb-6 text-white ${animationPhase === 'transitioning' || animationPhase === 'desktop' ? '' : 'animate-pulse'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
            />
          </svg>
          <h1 className="text-5xl font-bold mb-3">CrescentaOS</h1>
          {animationPhase === 'loadingBar' && (
            <div className="w-1/2 max-w-md h-3 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white/60 animate-progress-bar rounded-full"></div>
            </div>
          )}
        </div>
      )}

      {/* Desktop Content - Rendered once booting is done, opacity controlled by phase */} 
      {(animationPhase === 'loadingBar' || animationPhase === 'transitioning' || animationPhase === 'desktop') && (
        <div
          className={`h-full w-full overflow-hidden relative flex flex-col
                      transition-opacity duration-1000 ease-in-out 
                      ${(animationPhase === 'transitioning' || animationPhase === 'desktop') ? 'opacity-100' : 'opacity-0'}`}
          style={desktopStyle}
          onContextMenu={handleContextMenuEvent}
          onClick={handleClickEvent}
        >
          <div className="flex-grow relative">
            <DesktopIcons selectedApp={selectedApp} setSelectedApp={setSelectedApp} />
            <WindowManager />
            {contextMenu && <ContextMenu x={contextMenu.x} y={contextMenu.y} />}
          </div>
          <TaskBar toggleNotificationCenter={toggleNotificationCenter} />
        </div>
      )}
    </>
  );
};

export default Desktop;