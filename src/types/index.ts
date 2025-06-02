export interface Position {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Window {
  id: string;
  title: string;
  icon: string;
  component: string;
  position: Position;
  isActive: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  appProps?: Record<string, any>; // Added for PWA URLs or other app-specific props
}

export interface App {
  id: string;
  name: string;
  icon: string;
  component: string;
  startUrl?: string; // For PWAs that can be opened in PwaView
  isPWA?: boolean; // To identify if it's a PWA
}

export interface FileSystemItem {
  id: string;
  name: string;
  type: 'file' | 'directory';
  path: string;
  size?: number;
  createdAt: Date;
  updatedAt: Date;
  content?: string;
  parentId?: string;
}

export interface SystemSettings {
  darkMode: boolean;
  nightLight: boolean; // Added for Night Light
  wallpaper: string;
  accent: string;
  sound: boolean;
  notifications: boolean;
  autoLockTimeout?: number; // Optional: timeout in milliseconds
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  icon?: string;
  timestamp: number;
  read: boolean;
  actions?: {
    label: string;
    onClick: () => void;
  }[];
}