export interface PWA {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  manifestUrl: string;
  startUrl: string;
  screenshots: string[];
  version: string;
  author: string;
  rating: number;
  installCount: number;
  isInstalled?: boolean;
  isPinned?: boolean;
  supportsiFrame: boolean;
  isCustom?: boolean; // Added to identify custom PWAs
  customUrl?: string; // Added to store the custom URL
  installedOnDesktop?: boolean; // Added to track desktop/Start Menu installation
}

export interface AppStoreState {
  pwaApps: PWA[];
  categories: string[];
  featuredApps: string[];
  searchQuery: string;
  selectedCategory: string | null;
  installPWA: (pwa: PWA) => Promise<void>;
  uninstallPWA: (pwaId: string) => Promise<void>;
  pinPWA: (pwaId: string) => void;
  unpinPWA: (pwaId: string) => void;
  searchApps: (query: string) => void;
  filterByCategory: (category: string | null) => void;
  addCustomPWA: (pwa: PWA, installOnDesktop: boolean) => Promise<void>; // Added function signature
}