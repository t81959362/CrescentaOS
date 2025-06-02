import { create } from 'zustand';
import { App } from '../types';

interface AppsState {
  apps: App[];
  pinnedApps: string[];
  recentApps: string[];
  
  addApp: (app: App) => void;
  removeApp: (id: string) => void;
  pinApp: (id: string) => void;
  unpinApp: (id: string) => void;
  addToRecent: (id: string) => void;
}

const defaultApps: App[] = [
  {
    id: 'file-explorer',
    name: 'Files',
    icon: 'folder',
    component: 'FileExplorer',
  },
  {
    id: 'terminal',
    name: 'Terminal',
    icon: 'terminal',
    component: 'Terminal',
  },
  {
    id: 'settings',
    name: 'Settings',
    icon: 'settings',
    component: 'Settings',
  },
  {
    id: 'browser',
    name: 'Browser',
    icon: 'globe',
    component: 'Browser',
    defaultWidth: 1024, // Added default width
    defaultHeight: 768, // Added default height
  },
  {
    id: 'text-editor',
    name: 'Notes',
    icon: 'file',
    component: 'TextEditor',
  },
  {
    id: 'app-store',
    name: 'App Store',
    icon: 'ShoppingBag', // Changed from 'store' to 'ShoppingBag'
    component: 'AppStore',
  },
];

export const useAppsStore = create<AppsState>((set, get) => ({
  apps: defaultApps,
  pinnedApps: [],
  recentApps: [],

  addApp: (app) => {
    set((state) => {
      // Prevent adding duplicate apps by ID
      if (state.apps.some(existingApp => existingApp.id === app.id)) {
        return state;
      }
      return {
        apps: [...state.apps, app],
      };
    });
  },

  removeApp: (id) => {
    set((state) => ({
      apps: state.apps.filter(app => app.id !== id),
      pinnedApps: state.pinnedApps.filter(appId => appId !== id), // Also unpin if removed
      recentApps: state.recentApps.filter(appId => appId !== id), // Also remove from recent
    }));
  },
  
  pinApp: (id) => {
    set((state) => {
      if (state.pinnedApps.includes(id)) return state;
      
      return {
        pinnedApps: [...state.pinnedApps, id],
      };
    });
  },
  
  unpinApp: (id) => {
    set((state) => ({
      pinnedApps: state.pinnedApps.filter(appId => appId !== id),
    }));
  },
  
  addToRecent: (id) => {
    set((state) => {
      const recentApps = [
        id,
        ...state.recentApps.filter(appId => appId !== id),
      ].slice(0, 5);
      
      return { recentApps };
    });
  },
}));