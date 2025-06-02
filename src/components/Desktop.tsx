import React, { useEffect, useState } from 'react';
import { useSystemStore, initializeSystem } from '../store/system';
import { useFileSystemStore } from '../store/filesystem';
import { useWindowsStore } from '../store/windows';
import TaskBar from './TaskBar';
import WindowManager from './WindowManager';
import DesktopIcons from './DesktopIcons';
import ContextMenu from './ui/ContextMenu';

interface DesktopProps {
  toggleNotificationCenter: () => void;
}

const Desktop: React.FC<DesktopProps> = ({ toggleNotificationCenter }) => {
  const { settings } = useSystemStore();
  const { initialize, initialized: fsInitialized } = useFileSystemStore(); // Renamed for clarity
  const [isSystemHydrated, setIsSystemHydrated] = useState(false);

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  
  useEffect(() => {
    const handleSystemReady = () => {
      initializeSystem(); // Initialize dark mode, night light etc.
      initialize(); // Initialize file system
    };

    if (useSystemStore.persist.hasHydrated()) {
      setIsSystemHydrated(true);
      handleSystemReady();
    } else {
      const unsub = useSystemStore.persist.onFinishHydration(() => {
        setIsSystemHydrated(true);
        handleSystemReady();
        // According to Zustand docs, onFinishHydration listeners are called once.
        // If an unsubscribe function were returned by onFinishHydration, we'd call it here or in cleanup.
      });
      // No explicit unsubscribe function is returned by onFinishHydration itself to be called for cleanup.
    }
  }, [initialize]); // initialize is a stable dependency
  
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };
  
  const handleClick = (e: React.MouseEvent) => {
    setContextMenu(null);
    setSelectedApp(null);
  };
  
  if (!fsInitialized || !isSystemHydrated) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
          <h2 className="text-lg font-medium">Loading CrescentaOS...</h2>
        </div>
      </div>
    );
  }

  // Ensure wallpaper path is valid, fallback to default if necessary
  const currentWallpaper = settings.wallpaper || '/img/default-wallpaper.jpg';
  
  const desktopStyle: React.CSSProperties = {
    background: currentWallpaper === 'default'
      ? 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)'
      : `url(${currentWallpaper}) no-repeat center center / cover`,
  };
  
  return (
    <div 
      className="h-full w-full overflow-hidden relative flex flex-col"
      style={desktopStyle}
      onContextMenu={handleContextMenu}
      onClick={handleClick}
    >
      <div className="flex-grow relative">
        <DesktopIcons selectedApp={selectedApp} setSelectedApp={setSelectedApp} />
        <WindowManager />
        {contextMenu && <ContextMenu x={contextMenu.x} y={contextMenu.y} />}
      </div>
      <TaskBar toggleNotificationCenter={toggleNotificationCenter} />
    </div>
  );
};

export default Desktop;