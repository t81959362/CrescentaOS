import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SystemSettings } from '../types';

interface SystemState {
  settings: SystemSettings;
  isLocked: boolean;
  lastActivityTime: number;
  updateSettings: (settings: Partial<SystemSettings>) => void;
  toggleDarkMode: () => void;
  toggleNightLight: () => void; // Added for Night Light
  lockScreen: () => void;
  unlockScreen: () => void;
  updateActivityTime: () => void;
  setWallpaper: (wallpaperUrl: string) => void; // Added for LockScreen wallpaper
}

const defaultSettings: SystemSettings = {
  darkMode: true, // Changed to true
  nightLight: false, // Added for Night Light
  wallpaper: 'https://images6.alphacoders.com/131/thumb-1920-1316797.jpg', // Default wallpaper path
  accent: 'blue',
  sound: true,
  notifications: true,
  autoLockTimeout: 5 * 60 * 1000, // 5 minutes
};

export const useSystemStore = create<SystemState>()(
  persist(
    (set, get) => ({ // Added get to access current state
      settings: defaultSettings,
      isLocked: false,
      lastActivityTime: Date.now(),
      
      updateSettings: (newSettings) => {
        set((state) => ({
          settings: {
            ...state.settings,
            ...newSettings,
          },
        }));
      },
      
      toggleDarkMode: () => {
        set((state) => {
          const darkMode = !state.settings.darkMode;
          
          // Update document class
          if (darkMode) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          
          return {
            settings: {
              ...state.settings,
              darkMode,
            },
          };
        });
      },
      lockScreen: () => set({ isLocked: true }),
      unlockScreen: () => set({ isLocked: false, lastActivityTime: Date.now() }), // No password check needed now // No password check needed now
      updateActivityTime: () => set({ lastActivityTime: Date.now() }),
      setWallpaper: (wallpaperUrl: string) => {
        set((state) => ({
          settings: {
            ...state.settings,
            wallpaper: wallpaperUrl,
          },
        }));
      },

      toggleNightLight: () => {
        set((state) => {
          const nightLight = !state.settings.nightLight;
          if (nightLight) {
            document.documentElement.classList.add('night-light-active');
          } else {
            document.documentElement.classList.remove('night-light-active');
          }
          return {
            settings: {
              ...state.settings,
              nightLight,
            },
          };
        });
      },
    }),
    {
      name: 'system-settings',
    }
  )
);

// Initialize dark mode from stored settings
const initializeDarkMode = () => {
  const isDarkMode = useSystemStore.getState().settings.darkMode;
  if (isDarkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

// Call this when the app loads
export const initializeSystem = () => {
  initializeDarkMode();
  // Initialize Night Light from stored settings
  const isNightLight = useSystemStore.getState().settings.nightLight;
  if (isNightLight) {
    document.documentElement.classList.add('night-light-active');
  } else {
    document.documentElement.classList.remove('night-light-active');
  }
};