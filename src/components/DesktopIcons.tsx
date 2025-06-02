import React, { useEffect, useState } from 'react';
import { useAppsStore } from '../store/apps';
import type { App } from '../types'; // Changed this line
import { useWindowsStore } from '../store/windows';
import Icon from './ui/Icon';

interface DesktopIconsProps {
  selectedApp: string | null;
  setSelectedApp: (appId: string | null) => void;
}

const DesktopIcons: React.FC<DesktopIconsProps> = ({ selectedApp, setSelectedApp }) => {
  const { apps } = useAppsStore();
  const { openWindow } = useWindowsStore();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // Example breakpoint for mobile
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Modified handleClick to accept the full App object, select the app, and open the window
  const handleClick = (app: App) => {
    setSelectedApp(app.id);
    if (app.isPWA) {
      if (app.component === 'PwaView' && app.startUrl) {
        openWindow(app.name, app.icon, app.component, { startUrl: app.startUrl });
      } else if (app.startUrl) { // Fallback to Browser for PWAs not using PwaView or if startUrl is somehow missing for PwaView
        openWindow(app.name, app.icon, 'Browser', { initialUrl: app.startUrl });
      } else {
        // Handle case where PWA is missing startUrl, maybe open App Store or show error
        console.warn(`PWA ${app.name} is missing a startUrl.`);
        openWindow(app.name, app.icon, app.component); // Open with default component if any
      }
    } else {
      openWindow(app.name, app.icon, app.component);
    }
  };

  // The handleDoubleClick function has been removed as its functionality
  // is now handled by the single-click handleClick function.
  
return (
  <div className={`absolute top-4 left-4 grid gap-4 z-10 ${isMobile ? 'grid-cols-4 gap-2' : 'grid-cols-1 gap-4'}`}>
      {apps.map((app: App) => {
        const iconContainerBaseClasses = 'flex flex-col items-center justify-center rounded-lg hover:bg-black/10 cursor-pointer transition-all';
        const iconSizeClasses = isMobile ? 'w-16 h-16' : 'w-20 h-20';
        const selectedClasses = selectedApp === app.id ? (isMobile ? 'bg-black/30' : 'bg-black/20') : '';
        const iconClassName = `${iconContainerBaseClasses} ${iconSizeClasses} ${selectedClasses}`;

        const iconComponentSize = isMobile ? 20 : 24;
        const textSizeClasses = isMobile ? 'text-[10px] leading-tight' : 'text-xs';

        return (
          <div
            key={app.id}
            className={iconClassName}
            onClick={() => handleClick(app)} // Changed to call the modified handleClick with the full app object
            // onDoubleClick handler removed
          >
            <Icon name={app.icon} className="text-white mb-1" size={iconComponentSize} />
            <span className={`${textSizeClasses} text-white font-medium text-center px-1 [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]`}>
              {app.name}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default DesktopIcons;