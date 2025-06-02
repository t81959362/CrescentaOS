import { create } from 'zustand';
import { Window, Position } from '../types';
import { generateId, getCenteredPosition } from '../lib/utils';

interface WindowsState {
  windows: Window[];
  activeWindowId: string | null;
  nextZIndex: number;
  
  openWindow: (title: string, icon: string, component: string, appProps?: Record<string, any>) => string;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  activateWindow: (id: string) => void;
  updateWindowPosition: (id: string, position: Position) => void;
  bringToFront: (id: string) => void;
  minimizeAllWindows: () => void;
}

export const useWindowsStore = create<WindowsState>((set, get) => ({
  windows: [],
  activeWindowId: null,
  nextZIndex: 20, // Increased initial z-index to be higher than desktop icons
  
  openWindow: (title, icon, component, appProps) => {
    const id = generateId();
    let position = getCenteredPosition(window.innerWidth, window.innerHeight);
    let isMaximized = false; // Default to not maximized
    
    // Set larger size for App Store or maximize PwaView
    if (component === 'AppStore') {
      position = {
        x: Math.max(0, (window.innerWidth - 1200) / 2),
        y: Math.max(0, (window.innerHeight - 800) / 2),
        width: Math.min(1200, window.innerWidth),
        height: Math.min(800, window.innerHeight)
      };
    } else if (component === 'PwaView') {
      isMaximized = true; // Maximize PWA views
      // Position will be handled by maximization logic, but set initial centered for non-maximized state if needed
      position = {
        x: 0, // Full screen when maximized
        y: 0,
        width: window.innerWidth,
        height: window.innerHeight
      };
    }
    
    const zIndex = get().nextZIndex;
    
    set((state) => ({
      windows: [
        ...state.windows.map(w => ({ ...w, isActive: false })),
        {
          id,
          title,
          icon,
          component,
          position, // This will be overridden by maximization if isMaximized is true
          isActive: true,
          isMinimized: false,
          isMaximized, // Set based on component type
          zIndex,
          appProps,
        },
      ],
      activeWindowId: id,
      nextZIndex: state.nextZIndex + 1,
    }));
    
    return id;
  },
  
  closeWindow: (id) => {
    set((state) => {
      const windows = state.windows.filter(w => w.id !== id);
      const activeWindowId = state.activeWindowId === id
        ? windows.length > 0
          ? windows[windows.length - 1].id
          : null
        : state.activeWindowId;
        
      if (activeWindowId) {
        const updatedWindows = windows.map(w => ({
          ...w,
          isActive: w.id === activeWindowId,
        }));
        
        return { windows: updatedWindows, activeWindowId };
      }
      
      return { windows, activeWindowId };
    });
  },
  
  minimizeWindow: (id) => {
    set((state) => {
      const windows = state.windows.map(w =>
        w.id === id
          ? { ...w, isMinimized: true, isActive: false }
          : w
      );
      
      const activeWindow = windows
        .filter(w => !w.isMinimized)
        .sort((a, b) => b.zIndex - a.zIndex)[0];
        
      return {
        windows,
        activeWindowId: activeWindow ? activeWindow.id : null,
      };
    });
  },
  
  maximizeWindow: (id) => {
    set((state) => ({
      windows: state.windows.map(w =>
        w.id === id
          ? { ...w, isMaximized: !w.isMaximized, isActive: true }
          : { ...w, isActive: false }
      ),
      activeWindowId: id,
    }));
  },
  
  restoreWindow: (id) => {
    set((state) => ({
      windows: state.windows.map(w =>
        w.id === id
          ? { ...w, isMinimized: false, isActive: true }
          : { ...w, isActive: false }
      ),
      activeWindowId: id,
    }));
  },
  
  activateWindow: (id) => {
    set((state) => {
      if (state.activeWindowId === id) return state;
      
      return {
        windows: state.windows.map(w => ({
          ...w,
          isActive: w.id === id,
        })),
        activeWindowId: id,
      };
    });
  },
  
  updateWindowPosition: (id, position) => {
    set((state) => ({
      windows: state.windows.map(w =>
        w.id === id ? { ...w, position } : w
      ),
    }));
  },
  
  bringToFront: (id) => {
    set((state) => {
      const windowToFront = state.windows.find(w => w.id === id);
      let zIndex = state.nextZIndex;

      if (windowToFront?.isMaximized) {
        zIndex = 9999; // Assign a very high z-index for maximized windows
      } else {
        // For non-maximized windows, ensure the new zIndex is higher than current max, or use nextZIndex
        const maxCurrentZIndex = Math.max(0, ...state.windows.filter(w => w.id !== id && !w.isMaximized).map(w => w.zIndex));
        zIndex = Math.max(state.nextZIndex, maxCurrentZIndex + 1);
      }
      
      const newNextZIndex = windowToFront?.isMaximized ? state.nextZIndex : zIndex + 1;

      return {
        windows: state.windows.map(w =>
          w.id === id
            ? { ...w, zIndex, isActive: true }
            : { ...w, isActive: false }
        ),
        activeWindowId: id,
        nextZIndex: newNextZIndex,
      };
    });
  },

  minimizeAllWindows: () => {
    set((state) => ({
      windows: state.windows.map(w => ({ ...w, isMinimized: true, isActive: false })),
      activeWindowId: null,
    }));
  },
}));