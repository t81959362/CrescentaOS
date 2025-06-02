import React, { useState, useEffect, useRef } from 'react';
import { useAppsStore } from '../store/apps';
import { useFileSystemStore } from '../store/filesystem'; // Import filesystem store
import { useSystemStore } from '../store/system'; // Added for Night Light
import { useWindowsStore } from '../store/windows';
import { App } from '../types'; // Import App type
import Icon from './ui/Icon';
import { formatDate, formatTime } from '../lib/utils'; // Import formatTime
import { motion, AnimatePresence } from 'framer-motion';
import Calendar from './ui/Calendar';
import ContextMenu from './ui/ContextMenu'; // Import ContextMenu
import TaskbarAppContextMenu from './ui/TaskbarAppContextMenu'; // Import the new context menu
import ChatWindow from './ui/ChatWindow'; // Import ChatWindow
import { Bell } from 'lucide-react'; // Import Bell icon for notifications
import { useNotificationStore } from '../store/notifications'; // Import notification store

interface TaskBarProps {
  toggleNotificationCenter: () => void;
}

interface BatteryManager extends EventTarget {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
  onchargingchange: ((this: BatteryManager, ev: Event) => any) | null;
  onchargingtimechange: ((this: BatteryManager, ev: Event) => any) | null;
  ondischargingtimechange: ((this: BatteryManager, ev: Event) => any) | null;
  onlevelchange: ((this: BatteryManager, ev: Event) => any) | null;
}

const TaskBar: React.FC<TaskBarProps> = ({ toggleNotificationCenter }) => {
  const { apps, pinnedApps } = useAppsStore();
  const { initialize: initializeFileSystem, initialized: fileSystemInitialized } = useFileSystemStore(); // Removed unused allFiles, loadDirectory, currentFilePath
  const { windows, openWindow, restoreWindow, bringToFront, minimizeWindow } = useWindowsStore();
  const [time, setTime] = useState(formatDate(new Date()));
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]); // Can be App or FileSystemItem
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false); // New state for Quick Actions
  const [soundMenuOpen, setSoundMenuOpen] = useState(false); // State for Sound menu
  const [volumeLevel, setVolumeLevel] = useState(1); // State for volume level (0 to 1)
  const [batteryMenuOpen, setBatteryMenuOpen] = useState(false); // State for Battery menu
  const [showHiddenIconsOpen, setShowHiddenIconsOpen] = useState(false); // State for Hidden Icons panel
  const [isMediaMuted, setIsMediaMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);
  const [batteryInfo, setBatteryInfo] = useState<BatteryManager | null>(null);
  const [taskbarContextMenu, setTaskbarContextMenu] = useState<{ x: number; y: number } | null>(null); // State for taskbar context menu
  const [appContextMenu, setAppContextMenu] = useState<{ x: number; y: number; windowId: string } | null>(null); // State for app context menu
  const { settings: systemSettings, toggleNightLight, lockScreen } = useSystemStore(); // Added lockScreen
  const { notifications } = useNotificationStore(); // Get notifications for badge count
  const calendarRef = useRef<HTMLDivElement>(null);
  const startMenuRef = useRef<HTMLDivElement>(null);
  const quickActionsRef = useRef<HTMLDivElement>(null); // New ref for Quick Actions menu
  const soundMenuRef = useRef<HTMLDivElement>(null); // Ref for Sound menu
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const batteryMenuRef = useRef<HTMLDivElement>(null); // Ref for Battery menu
  const hiddenIconsRef = useRef<HTMLDivElement>(null); // Ref for Hidden Icons panel
  const taskbarContextMenuRef = useRef<HTMLDivElement>(null); // Ref for taskbar context menu
  const taskbarRef = useRef<HTMLDivElement>(null); // Ref for the main taskbar div to get its height
  const [chatOpen, setChatOpen] = useState(false); // State for Chat window
  const chatWindowRef = useRef<HTMLDivElement>(null); // Ref for Chat window

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(formatDate(new Date()));
    }, 1000);
    
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setCalendarOpen(false);
      }
      if (startMenuRef.current && !startMenuRef.current.contains(event.target as Node)) {
        setStartMenuOpen(false);
      }
      if (quickActionsRef.current && !quickActionsRef.current.contains(event.target as Node)) {
        setQuickActionsOpen(false);
      }
      if (soundMenuRef.current && !soundMenuRef.current.contains(event.target as Node)) {
        setSoundMenuOpen(false);
      }
      if (batteryMenuRef.current && !batteryMenuRef.current.contains(event.target as Node)) {
        setBatteryMenuOpen(false);
      }
      if (hiddenIconsRef.current && !hiddenIconsRef.current.contains(event.target as Node)) {
        setShowHiddenIconsOpen(false);
      }
      if (chatWindowRef.current && !chatWindowRef.current.contains(event.target as Node)) {
        setChatOpen(false);
      }
      // Updated logic for closing taskbar context menu
      if (taskbarContextMenuRef.current && !taskbarContextMenuRef.current.contains(event.target as Node)) {
        // Check if the click was on a taskbar button/element, if so, don't close
        let clickedOnTaskbarElement = false;
        if (taskbarRef.current && taskbarRef.current.contains(event.target as Node)) {
            // Further check if it's an app icon, if so, don't close the app context menu
            const appIconClicked = (event.target as HTMLElement).closest('.taskbar-icon');
            if (!appIconClicked) {
                clickedOnTaskbarElement = true;
            }
        }
        if (!clickedOnTaskbarElement) {
            setTaskbarContextMenu(null);
        }
      }
      // Close app context menu if clicked outside
      if (appContextMenu && !(event.target as HTMLElement).closest('.taskbar-icon') && !(event.target as HTMLElement).closest('[class*="TaskbarAppContextMenu"]')) {
        setAppContextMenu(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);

    // Initialize Web Audio API for volume control
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);
      gainNodeRef.current.gain.value = volumeLevel;
    }

    // Initialize filesystem if not already
    if (!fileSystemInitialized) {
      initializeFileSystem().then(() => {
        // Optionally load a default directory after init if needed
        // loadDirectory('/'); 
      });
    }

    // Battery Status API
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: BatteryManager) => {
        setBatteryInfo(battery);

        battery.onchargingchange = () => setBatteryInfo({ ...battery });
        battery.onlevelchange = () => setBatteryInfo({ ...battery });
        battery.onchargingtimechange = () => setBatteryInfo({ ...battery });
        battery.ondischargingtimechange = () => setBatteryInfo({ ...battery });
      });
    } else {
      console.warn('Battery Status API is not supported in this browser.');
    }

    return () => {
      clearInterval(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };

    return () => {
      clearInterval(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [calendarRef, startMenuRef, quickActionsRef, soundMenuRef, batteryMenuRef, hiddenIconsRef, chatWindowRef, taskbarContextMenuRef, taskbarRef]); // Added chatWindowRef and other relevant refs

  const handleTaskbarContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    // If the click is on an app icon, do not show the generic taskbar context menu
    if ((e.target as HTMLElement).closest('.taskbar-icon')) {
      return;
    }
    const menuHeight = 200; // Approximate height of the context menu, adjust if necessary
    let yPosition = e.clientY - menuHeight;
    if (yPosition < 0) yPosition = 0; // Prevent menu from going off-screen at the top

    setTaskbarContextMenu({ x: e.clientX, y: yPosition });
    // Close other popups
    setStartMenuOpen(false);
    setCalendarOpen(false);
    setQuickActionsOpen(false);
    setSoundMenuOpen(false);
    setBatteryMenuOpen(false);
    setShowHiddenIconsOpen(false);
    setChatOpen(false);
  };

  const handleAppIconContextMenu = (e: React.MouseEvent, windowId: string) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent taskbar context menu from opening
    const menuHeight = 100; // Approximate height of the app context menu
    let yPosition = e.clientY - menuHeight;
    if (yPosition < 0) yPosition = 0;

    setAppContextMenu({ x: e.clientX, y: yPosition, windowId });
    // Close other popups
    setStartMenuOpen(false);
    setCalendarOpen(false);
    setQuickActionsOpen(false);
    setSoundMenuOpen(false);
    setBatteryMenuOpen(false);
    setShowHiddenIconsOpen(false);
    setChatOpen(false);
    setTaskbarContextMenu(null); // Close generic taskbar context menu if open
  };

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(event.target.value);
    setVolumeLevel(newVolume);
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = newVolume;
    }
  };
  // Removed duplicated useEffect and incorrect closing braces for handleTaskbarContextMenu

  const toggleMuteAllMedia = () => {
    const newMutedState = !isMediaMuted;
    setIsMediaMuted(newMutedState);
    const mediaElements = document.querySelectorAll('audio, video');
    mediaElements.forEach((media) => {
      (media as HTMLAudioElement | HTMLVideoElement).muted = newMutedState;
    });
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);
  
  // Get all open windows, not just pinned ones
  // const openApps = windows.map(win => { // Removed unused openApps
  //   const appDetails = apps.find(app => app.component === win.component);
  //   return {
  //     ...win,
  //     icon: appDetails?.icon || 'default-icon', // Fallback icon
  //     name: appDetails?.name || win.title, // Fallback name
  //   };
  // });

  const handleAppClick = (app: App | { id: string; component?: string; name?: string; icon?: string; path?: string; type?: string }) => {
    // Check if it's a full App object or a search result item
    const appId = app.id;
    // Attempt to find the full app details from the apps store, especially if 'app' is a partial object (e.g., from search)
    const fullAppDetails = apps.find(a => a.id === appId);

    const appComponent = 'component' in app ? app.component : fullAppDetails?.component;
    const appName = app.name || fullAppDetails?.name;
    const appIcon = 'icon' in app ? app.icon : fullAppDetails?.icon;
    const appPath = 'path' in app ? app.path : undefined; // Path is usually specific to file/folder items
    const itemType = 'type' in app ? app.type : (fullAppDetails ? 'app' : undefined); // Infer type if fullAppDetails found

    if (itemType === 'file') {
      console.log('Opening file from taskbar/start menu:', appPath);
      if (appName?.endsWith('.txt') && appPath) {
        openWindow(`Notes - ${appName}`, 'file', 'TextEditor', { filePath: appPath });
      } else {
        alert(`No application available to open ${appName}`);
      }
      setStartMenuOpen(false);
      setSearchTerm('');
      setSearchResults([]);
      return;
    } else if (itemType === 'directory' && appPath) {
        openWindow('Files', 'folder', 'FileExplorer', { initialPath: appPath });
        setStartMenuOpen(false);
        setSearchTerm('');
        setSearchResults([]);
        return;
    }

    // Handling for actual applications
    const existingWindow = windows.find(w => w.component === appComponent && w.title === appName);

    if (existingWindow) {
      if (existingWindow.isMinimized) {
        restoreWindow(existingWindow.id);
      } else {
        bringToFront(existingWindow.id);
      }
    } else if (appComponent && appName && appIcon) {
      let appProps: Record<string, any> | undefined = undefined;
      if (appComponent === 'PwaView' && fullAppDetails && fullAppDetails.startUrl) {
        appProps = { startUrl: fullAppDetails.startUrl };
      }
      // Pass appProps to openWindow
      openWindow(appName, appIcon, appComponent, appProps);
    }
    setStartMenuOpen(false);
    setSearchTerm('');
    setSearchResults([]);
  };

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);

    if (term.trim() === '') {
      setSearchResults([]);
      return;
    }

    // Ensure filesystem is loaded before searching files
    if (!fileSystemInitialized) {
      await initializeFileSystem();
    }
    // Make sure allFiles are up-to-date if filesystem might have changed
    // This might require a re-fetch or ensuring 'allFiles' is reactive to DB changes
    const currentAllFiles = useFileSystemStore.getState().items; // Get latest items

    const appResults = apps.filter(app => 
      app.name.toLowerCase().includes(term.toLowerCase())
    );

    const fileResults = currentAllFiles.filter(file => 
      file.name.toLowerCase().includes(term.toLowerCase())
    );

    setSearchResults([...appResults, ...fileResults]);
  };

  // Original handleAppClick for taskbar items, slightly modified
  const handleTaskbarAppClick = (itemId: string, itemComponent?: string, itemName?: string, itemIcon?: string) => {
    const existingWindow = windows.find(w => w.id === itemId); // Changed appId to itemId

    if (existingWindow) {
      if (existingWindow.isMinimized) {
        restoreWindow(existingWindow.id);
        bringToFront(existingWindow.id); // Also bring to front
      } else if (existingWindow.isActive) {
        minimizeWindow(existingWindow.id); // Minimize if active and not minimized
      } else {
        // If window is open, not minimized, and not active, bring to front
        bringToFront(existingWindow.id);
      }
    } else if (itemComponent && itemName && itemIcon) {
      // If window doesn't exist, open it (this case handles pinned apps not yet open)
      const appDetails = apps.find(app => app.component === itemComponent);
      let appProps: Record<string, any> | undefined = undefined;
      if (appDetails && appDetails.startUrl) {
        appProps = { startUrl: appDetails.startUrl };
      }
      openWindow(itemName, itemIcon, itemComponent, appProps);
    }
  };

  // Combine pinned apps and open apps for taskbar display, avoiding duplicates
  const taskbarItems = [
    ...pinnedApps.map(pinnedAppId => {
      const appDetail = apps.find(app => app.id === pinnedAppId);
      const openWindowForPinnedApp = windows.find(win => win.component === appDetail?.component);
      return {
        id: openWindowForPinnedApp ? openWindowForPinnedApp.id : appDetail?.id || pinnedAppId,
        name: appDetail?.name || 'Unknown App',
        icon: appDetail?.icon || 'default-icon',
        component: appDetail?.component,
        isMinimized: openWindowForPinnedApp?.isMinimized || false,
        isActive: openWindowForPinnedApp?.isActive || false,
        isOpen: !!openWindowForPinnedApp,
      };
    }),
    ...windows
      .filter(win => !pinnedApps.some(pinnedAppId => apps.find(app => app.id === pinnedAppId)?.component === win.component))
      .map(win => {
        const appDetails = apps.find(app => app.component === win.component);
        return {
          id: win.id,
          name: appDetails?.name || win.title,
          icon: appDetails?.icon || 'default-icon',
          component: win.component,
          isMinimized: win.isMinimized,
          isActive: win.isActive,
          isOpen: true,
        };
      }),
  ];

  // Remove duplicates by ID, giving preference to items that are open
  const uniqueTaskbarItems = Array.from(new Map(taskbarItems.map(item => [item.id, item])).values())
    .sort((a, b) => {
      // Sort pinned apps first, then by open status
      const isAPinned = pinnedApps.includes(apps.find(app => app.component === a.component)?.id || '');
      const isBPinned = pinnedApps.includes(apps.find(app => app.component === b.component)?.id || '');
      if (isAPinned && !isBPinned) return -1;
      if (!isAPinned && isBPinned) return 1;
      return 0; // Keep original order for items with same pinned status
    });

  
  return (
    <div className="relative">
      {/* Sound Menu */}
      {soundMenuOpen && (
        <motion.div
          ref={soundMenuRef}
          className="absolute bottom-full right-0 mb-2 w-64 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md shadow-lg rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 p-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
        >
          <div className="flex flex-col space-y-2">
            <label htmlFor="volume-slider" className="text-sm text-slate-700 dark:text-slate-300">
              Volume: {Math.round(volumeLevel * 100)}%
            </label>
            <input
              id="volume-slider"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volumeLevel}
              onChange={handleVolumeChange}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
          </div>
        </motion.div>
      )}

      {/* Battery Menu */}
      {batteryMenuOpen && (
        <motion.div
          ref={batteryMenuRef}
          className="absolute bottom-full right-0 mb-2 w-64 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md shadow-lg rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 p-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
        >
          {batteryInfo ? (
            <div className="text-slate-800 dark:text-slate-200">
              <p>Level: {(batteryInfo.level * 100).toFixed(0)}%</p>
              <p>Status: {batteryInfo.charging ? 'Charging' : 'Discharging'}</p>
              {batteryInfo.charging && batteryInfo.chargingTime !== Infinity && (
                <p>Time to full: {formatTime(batteryInfo.chargingTime)}</p>
              )}
              {!batteryInfo.charging && batteryInfo.dischargingTime !== Infinity && (
                <p>Time remaining: {formatTime(batteryInfo.dischargingTime)}</p>
              )}
            </div>
          ) : (
            <p className="text-slate-800 dark:text-slate-200">Battery status not available.</p>
          )}
        </motion.div>
      )}

      {startMenuOpen && (
        <motion.div 
          ref={startMenuRef}
          className="absolute bottom-full left-0 mb-2 w-96 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md shadow-lg rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
        >
          {/* Search Bar */}
          <div className="p-3 border-b border-slate-300/20 dark:border-slate-700/50">
            <input 
              type="text"
              placeholder="Type here to search"
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full p-2.5 bg-slate-100/80 dark:bg-slate-700/80 rounded-md text-sm text-slate-800 dark:text-slate-200 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow duration-150 shadow-sm focus:shadow-md"
            />
          </div>

          {/* Search Results / Pinned & All Apps */}
          <div className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-slate-400/50 dark:scrollbar-thumb-slate-600/50 scrollbar-track-transparent scrollbar-thumb-rounded-full" style={{maxHeight: 'calc(100vh - 200px)' /* Adjust max height as needed */}}>
            {searchTerm.trim() !== '' ? (
              <div className="p-2 space-y-1">
                {searchResults.length > 0 ? (
                  searchResults.map((item, index) => (
                    <button 
                      key={item.id || `search-${index}`}
                      onClick={() => handleAppClick(item)}
                      className="w-full flex items-center p-2.5 rounded-md hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors duration-100 focus:outline-none focus:ring-1 focus:ring-primary-400 text-left"
                    >
                      <Icon name={(item.icon || (item.type === 'directory' ? 'folder' : 'file')) as any} className="w-5 h-5 mr-3 flex-shrink-0 text-slate-600 dark:text-slate-300" />
                      <div className="flex-grow truncate">
                        <span className="text-sm text-slate-800 dark:text-slate-100">{item.name}</span>
                        {item.path && <span className="text-xs text-slate-500 dark:text-slate-400 block truncate">{item.path}</span>}
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 ml-2 flex-shrink-0">{item.component ? 'App' : (item.type === 'directory' ? 'Folder' : 'File')}</span>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">No results found for "{searchTerm}".</p>
                )}
              </div>
            ) : (
              <>
                {/* Pinned Apps */}
                {pinnedApps.length > 0 && (
                  <div className="p-3">
                    <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 px-1">PINNED</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {pinnedApps.map(appId => {
                        const app = apps.find(a => a.id === appId);
                        if (!app) return null;
                        return (
                          <button 
                            key={app.id} 
                            onClick={() => handleAppClick(app)}
                            className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors duration-100 focus:outline-none focus:ring-1 focus:ring-primary-400 aspect-square"
                            title={app.name}
                          >
                            <Icon name={app.icon as any} className="w-7 h-7 mb-1.5 text-slate-700 dark:text-slate-200" />
                            <span className="text-xs text-center truncate w-full text-slate-700 dark:text-slate-200">{app.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* All Apps */}
                <div className={`p-3 ${pinnedApps.length > 0 ? 'pt-2' : ''}`}>
                  {/* <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 px-1">ALL APPS</h3> */}
                  <div className="space-y-1">
                    {apps.map(app => (
                      <button 
                        key={app.id} 
                        onClick={() => handleAppClick(app)}
                        className="w-full flex items-center p-2.5 rounded-md hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors duration-100 focus:outline-none focus:ring-1 focus:ring-primary-400 text-left"
                      >
                        <Icon name={app.icon as any} className="w-5 h-5 mr-3 flex-shrink-0 text-slate-600 dark:text-slate-300" />
                        <span className="text-sm text-slate-800 dark:text-slate-100 truncate">{app.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
      
      <div 
        ref={taskbarRef} // Add ref to the main taskbar div
        className="h-12 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-t border-white/20 dark:border-slate-700/50 flex items-center px-2 shadow-lg z-50"
        onContextMenu={handleTaskbarContextMenu}
      >
        <button
          title="Start Menu"
          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700/50 mr-2"
          onClick={() => setStartMenuOpen(!startMenuOpen)}
        >
          <Icon name="moon" className="text-white" size={20} />
        </button>
        
        <div className="flex-1 flex items-center space-x-1">
          {/* Taskbar Items (Pinned and Open Apps) */}
          {uniqueTaskbarItems.map((item) => (
            <button
              key={item.id} // Use item.id which could be windowId or appId
              className={`taskbar-icon relative flex items-center justify-center w-10 h-10 rounded-md hover:bg-white/20 dark:hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-150 ease-in-out 
                ${item.isOpen && item.isActive ? 'bg-white/30 dark:bg-slate-600/60' : ''}
                ${item.isOpen && !item.isMinimized && !item.isActive ? 'bg-white/10 dark:bg-slate-800/30' : ''}
              `}
              onClick={() => handleTaskbarAppClick(item.id, item.component, item.name, item.icon)}
              onContextMenu={(e) => item.isOpen && handleAppIconContextMenu(e, item.id)} // Only show context menu for open apps
              title={item.name}
            >
              <Icon name={item.icon as any} size={20} /> {/* Cast item.icon to any */} 
              {/* Active/Open/Minimized Indicator */}
              {item.isOpen && (
                <span 
                  className={`absolute bottom-0.5 left-1/2 transform -translate-x-1/2 h-1 rounded-full 
                  ${item.isActive ? 'bg-primary-500 w-4' : 'bg-slate-400 dark:bg-slate-500 w-3'}
                  ${item.isMinimized ? 'w-2 opacity-70' : ''}
                  `}
                />
              )}
            </button>
          ))}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Notification Center Button - Placed before Quick Actions */}
          <button
            onClick={toggleNotificationCenter}
            className="relative p-2 rounded hover:bg-white hover:bg-opacity-20 transition-colors"
            aria-label="Toggle Notification Center"
          >
            <Bell size={18} />
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="absolute top-0 right-0 block h-2 w-2 transform translate-x-1/4 -translate-y-1/4 rounded-full bg-red-500 ring-2 ring-neutral-900" />
            )}
          </button>
          <button
            title="Quick Actions"
            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
            onClick={() => setQuickActionsOpen(!quickActionsOpen)}
          >
            <Icon name="Settings2" size={18} className="text-slate-800 dark:text-slate-200" /> {/* Icon for Quick Actions */}
          </button>
          <button
            title="Chat"
            className={`w-8 h-8 flex items-center justify-center rounded-md ${chatOpen ? 'bg-slate-300/70 dark:bg-slate-600/70' : 'hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}
            onClick={() => setChatOpen(!chatOpen)}
          >
            <Icon name="MessageSquare" size={18} className="text-slate-800 dark:text-slate-200" /> {/* Icon for Chat */}
          </button>
          <button
            title="Show Hidden Icons"
            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
            onClick={() => setShowHiddenIconsOpen(!showHiddenIconsOpen)}
          >
            <Icon name="ChevronUp" size={16} className="text-slate-800 dark:text-slate-200" />
          </button>

          {/* New Icons Start Here */}
          <button
            title="Sound"
            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
            onClick={() => setSoundMenuOpen(!soundMenuOpen)}
          >
            <Icon name="Volume2" size={18} className="text-slate-800 dark:text-slate-200" />
          </button>
          <button
            title="Battery"
            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
            onClick={() => setBatteryMenuOpen(!batteryMenuOpen)}
          >
            {batteryInfo ? (
              <Icon 
                name={
                  batteryInfo.charging 
                    ? 'BatteryCharging' 
                    : batteryInfo.level > 0.75 
                    ? 'BatteryFull' 
                    : batteryInfo.level > 0.5 
                    ? 'BatteryMedium' 
                    : batteryInfo.level > 0.25 
                    ? 'BatteryLow'
                    : 'BatteryWarning'
                }
                size={18} 
                className="text-slate-800 dark:text-slate-200" 
              />
            ) : (
              <Icon name="BatteryFull" size={18} className="text-slate-800 dark:text-slate-200" /> // Fallback icon
            )}
          </button>
          {/* New Icons End Here */}

          <button
            title="Calendar"
            className="px-3 py-1 rounded-md hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
            onClick={() => setCalendarOpen(!calendarOpen)}
          >
            <div className="flex flex-col items-center">
              <span className="text-xs text-slate-800 dark:text-slate-200">{time.timeString}</span>
              <span className="text-xs text-slate-600 dark:text-slate-400">{time.dateString}</span>
            </div>
          </button>
        </div>
      </div>
      
      <AnimatePresence>
        {taskbarContextMenu && (
          <div ref={taskbarContextMenuRef}> {/* Wrap ContextMenu with a div for the ref */} 
            <ContextMenu x={taskbarContextMenu.x} y={taskbarContextMenu.y} />
          </div>
        )}
        {appContextMenu && (
          <TaskbarAppContextMenu 
            x={appContextMenu.x} 
            y={appContextMenu.y} 
            windowId={appContextMenu.windowId} 
            onClose={() => setAppContextMenu(null)} 
          />
        )}
        {quickActionsOpen && ( // Display Quick Actions menu
          <motion.div
            ref={quickActionsRef}
            className="absolute bottom-full right-20 mb-2 w-72 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md shadow-lg rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 p-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <div className="grid grid-cols-3 gap-2">
              {/* Night Light Button */}
              <button 
                className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors space-y-1 ${systemSettings.nightLight ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-500' : 'bg-slate-200/50 dark:bg-slate-700/50 hover:bg-slate-300/70 dark:hover:bg-slate-600/70 text-slate-700 dark:text-slate-300'}`}
                onClick={toggleNightLight}
                title={systemSettings.nightLight ? "Disable Night Light" : "Enable Night Light"}
              >
                <Icon name={systemSettings.nightLight ? "Sun" : "Moon"} size={20} />
                <span className="text-xs">Night Light</span>
              </button>
              {/* Mute All Media Button */}
              <button 
                className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors space-y-1 ${isMediaMuted ? 'bg-primary-500/20 hover:bg-primary-500/30 text-primary-500' : 'bg-slate-200/50 dark:bg-slate-700/50 hover:bg-slate-300/70 dark:hover:bg-slate-600/70 text-slate-700 dark:text-slate-300'}`}
                onClick={toggleMuteAllMedia}
                title={isMediaMuted ? "Unmute All Media" : "Mute All Media"}
              >
                <Icon name={isMediaMuted ? "VolumeX" : "Volume2"} size={20} />
                <span className="text-xs">{isMediaMuted ? "Unmute" : "Mute All"}</span>
              </button>

              {/* Toggle Fullscreen Button */}
              <button
                className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors space-y-1 ${isFullscreen ? 'bg-primary-500/20 hover:bg-primary-500/30 text-primary-500' : 'bg-slate-200/50 dark:bg-slate-700/50 hover:bg-slate-300/70 dark:hover:bg-slate-600/70 text-slate-700 dark:text-slate-300'}`}
                onClick={toggleFullScreen}
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                <Icon name={isFullscreen ? "Minimize" : "Maximize"} size={20} />
                <span className="text-xs">Fullscreen</span>
              </button>

              {/* Lock Screen Button */}
              <button 
                className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors space-y-1 bg-slate-200/50 dark:bg-slate-700/50 hover:bg-slate-300/70 dark:hover:bg-slate-600/70 text-slate-700 dark:text-slate-300'}`}
                onClick={() => {
                  lockScreen();
                  setQuickActionsOpen(false); // Close quick actions menu
                }}
                title="Lock Screen"
              >
                <Icon name="Lock" size={20} />
                <span className="text-xs">Lock Screen</span>
              </button>

              {/* Reload App */}
              <button
                onClick={() => window.location.reload()}
                className="flex flex-col items-center justify-center p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors w-full"
                title="Reload App"
              >
                <Icon name="RefreshCw" size={20} />
                <span className="text-xs mt-1">Reload</span>
              </button>

              {/* Placeholder for more buttons */}
              {/* <button className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-200/50 dark:bg-slate-700/50 hover:bg-slate-300/70 dark:hover:bg-slate-600/70 text-slate-700 dark:text-slate-300 space-y-1">
                <Icon name="Settings" size={20} />
                <span className="text-xs">More...</span>
              </button> */}

              {/* Placeholder for future buttons - can be removed or replaced */}
              {/* <button className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-200/50 dark:bg-slate-700/50 hover:bg-slate-300/70 dark:hover:bg-slate-600/70 text-slate-700 dark:text-slate-300 space-y-1">
                <Icon name="Settings" size={20} />
                <span className="text-xs">Settings</span>
              </button> */}
            </div>
          </motion.div>
        )}
        {calendarOpen && (
          <motion.div
            ref={calendarRef}
            className="absolute bottom-full right-2 mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <Calendar />
          </motion.div>
        )}
        {showHiddenIconsOpen && (
          <motion.div
            ref={hiddenIconsRef}
            className="absolute bottom-full right-10 mb-2 p-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md shadow-lg rounded-lg border border-slate-200 dark:border-slate-700 flex space-x-1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            {/* Placeholder for hidden icons. Add actual icons as needed. */}
            <p className="text-xs text-slate-500 dark:text-slate-400 p-2">No hidden icons</p>
            {/* Add more hidden icons here as needed */}
          </motion.div>
        )}
        <ChatWindow isOpen={chatOpen} onClose={() => setChatOpen(false)} />
      </AnimatePresence>
    </div>
  );
};

export default TaskBar;