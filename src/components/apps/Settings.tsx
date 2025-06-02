import React, { useEffect, useState } from 'react';
import { useSystemStore } from '../../store/system';
import Icon from '../ui/Icon';

interface SettingsProps {
  windowId: string;
}

const Settings: React.FC<SettingsProps> = ({ windowId }) => {
  const [browserName, setBrowserName] = useState<string>('Unknown');
  const [osVersion, setOsVersion] = useState<string>('Unknown');

  useEffect(() => {
    // Browser Detection
    const ua = navigator.userAgent;
    let browser = 'Unknown';
    if ((navigator as any).userAgentData && (navigator as any).userAgentData.brands) {
      const brands = (navigator as any).userAgentData.brands;
      // Prefer a non-"Chromium" brand if available
      const significantBrand = brands.find((brand: { brand: string; version: string }) => brand.brand !== 'Chromium' && brand.brand !== 'Google Chrome');
      if (significantBrand) {
        browser = `${significantBrand.brand} ${significantBrand.version}`;
      } else if (brands.length > 0) {
        // Fallback to the first brand (often Chromium or Google Chrome)
        browser = `${brands[0].brand} ${brands[0].version}`;
      }
    } else {
      // Fallback to User Agent string parsing
      if (ua.includes('Firefox/')) {
        browser = `Firefox ${ua.split('Firefox/')[1].split(' ')[0]}`;
      } else if (ua.includes('Edg/')) { // Edge (Chromium-based)
        browser = `Edge ${ua.split('Edg/')[1].split(' ')[0]}`;
      } else if (ua.includes('Chrome/')) {
        browser = `Chrome ${ua.split('Chrome/')[1].split(' ')[0]}`;
      } else if (ua.includes('Safari/')) {
        browser = `Safari ${ua.split('Safari/')[1].split(' ')[0]}`;
      } else if (ua.includes('MSIE ') || ua.includes('Trident/')) { // IE
        browser = 'Internet Explorer';
      }
    }
    setBrowserName(browser);

    // OS Detection
    let os = 'Unknown';
    if ((navigator as any).userAgentData && (navigator as any).userAgentData.platform) {
      os = (navigator as any).userAgentData.platform;
    } else {
      if (ua.includes('Win')) {
        if (ua.includes('Windows NT 10.0')) os = 'Windows 10/11';
        else if (ua.includes('Windows NT 6.3')) os = 'Windows 8.1';
        else if (ua.includes('Windows NT 6.2')) os = 'Windows 8';
        else if (ua.includes('Windows NT 6.1')) os = 'Windows 7';
        else if (ua.includes('Windows NT 6.0')) os = 'Windows Vista';
        else if (ua.includes('Windows NT 5.1') || ua.includes('Windows XP')) os = 'Windows XP';
        else os = 'Windows';
      } else if (ua.includes('Mac')) {
        os = 'MacOS';
      } else if (ua.includes('Linux')) {
        os = 'Linux';
      } else if (ua.includes('Android')) {
        os = 'Android';
      } else if (ua.includes('like Mac')) { // iOS
        os = 'iOS';
      }
    }
    setOsVersion(os);
  }, []);

  const { settings, updateSettings } = useSystemStore();
  
  const wallpapers = [
    {
      id: 'red-moon-desert',
      name: 'Red Moon Desert',
      url: 'https://images6.alphacoders.com/131/1316797.jpg'
    },
    {
      id: 'mountain-range',
      name: 'Mountain Range',
      url: 'https://images.unsplash.com/photo-1665149368357-864968813478?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    },
    {
      id: 'bliss',
      name: 'Bliss',
      url: 'https://images2.alphacoders.com/941/941898.jpg'
    },
    {
      id: 'retro',
      name: 'Retro',
      url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    },
    {
      id: 'transpride',
      name: 'Pride',
      url: 'https://images.unsplash.com/photo-1542358935821-e4e9f3f3c15d?q=80&w=2748&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    },
    {
      id: 'pride-colours',
      name: 'Pride Colours',
      url: 'https://images.pexels.com/photos/1191710/pexels-photo-1191710.jpeg'
    },
    {
      id: 'silhouette-sunrise',
      name: 'silhouette sunrise',
      url: 'https://images.unsplash.com/photo-1744522184450-77b96718b074?q=80&w=2415&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    },
    {
      id: 'leopard',
      name: 'Leopard',
      url: 'https://512pixels.net/downloads/macos-wallpapers/10-5-Server.jpg'
    },
  ];
  
  return (
    <div className="h-full overflow-y-auto">
      <h2 className="text-xl font-semibold mb-4">CrescentaOS Settings</h2>
      
      <div className="grid gap-6">
        <section className="bg-white/50 dark:bg-slate-700/50 rounded-lg p-4">
          <h3 className="text-lg font-medium mb-3">Appearance</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block mb-2">
                <Icon name="image" className="inline-block mr-2" size={18} />
                Wallpaper
              </label>
              
              <div className="grid grid-cols-4 gap-2 h-48 overflow-y-auto">
                {wallpapers.map((wallpaper) => (
                  <div 
                    key={wallpaper.id}
                    className={`relative cursor-pointer rounded-md overflow-hidden h-20 ${
                      settings.wallpaper === wallpaper.url
                        ? 'ring-2 ring-primary-500'
                        : ''
                    }`}
                    onClick={() => updateSettings({ 
                      wallpaper: wallpaper.url 
                    })}
                  >
                    <img 
                      src={wallpaper.url} 
                      alt={wallpaper.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <span className="text-white text-xs font-medium">{wallpaper.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        
        <section className="bg-white/50 dark:bg-slate-700/50 rounded-lg p-4">
          <h3 className="text-lg font-medium mb-3">System</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <Icon name="volume-2" className="mr-2" size={18} />
                <span>Sound</span>
              </label>
              
              <button
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.sound ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-600'
                }`}
                onClick={() => updateSettings({ sound: !settings.sound })}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.sound ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <Icon name="bell" className="mr-2" size={18} />
                <span>Notifications</span>
              </label>
              
              <button
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.notifications ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-600'
                }`}
                onClick={() => updateSettings({ notifications: !settings.notifications })}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.notifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>
        
        <section className="bg-white/50 dark:bg-slate-700/50 rounded-lg p-4">
          <h3 className="text-lg font-medium mb-3">About</h3>
          
          <div className="space-y-2 text-sm">
            <p><strong>CrescentaOS Version:</strong> 1.0.0</p>
            <p><strong>Browser:</strong> {browserName}</p>
            <p><strong>Operating System:</strong> {osVersion}</p>
            <p><strong>Screen Resolution:</strong> {window.innerWidth} x {window.innerHeight}</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;