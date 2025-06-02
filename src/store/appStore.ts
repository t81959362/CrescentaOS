import { create } from 'zustand';
import { PWA, AppStoreState } from '../types/appStore';
import { pwaApps as initialPWAs } from '../data/pwaApps';
import { useAppsStore } from './apps'; // Import the main apps store

export const useAppStore = create<AppStoreState>((set, get) => ({
  pwaApps: initialPWAs,
  categories: [
    'Productivity',
    'Entertainment',
    'Social',
    'Development',
    'Utilities',
    'Education'
  ],
  featuredApps: [],
  searchQuery: '',
  selectedCategory: null,

  installPWA: async (pwa: PWA) => {
    try {
      // Fetch the manifest directly
      const manifestResponse = await fetch(pwa.manifestUrl);

      if (!manifestResponse.ok) {
        throw new Error(`Failed to fetch manifest: ${manifestResponse.status} ${manifestResponse.statusText}`);
      }

      const manifest = await manifestResponse.json();

      // Check if manifest is valid and HTTPS
      if (!manifest.start_url || !pwa.manifestUrl.startsWith('https://')) {
        throw new Error('Invalid PWA manifest or non-HTTPS URL');
      }

      // Register service worker if available
      // if ('serviceWorker' in navigator) {
      //   // TODO: Resolve manifest.start_url relative to manifestUrl if it's relative
      //   // TODO: Ensure manifest.start_url is the actual service worker script, or use a dedicated SW script field from manifest
      //   // console.log('Attempting to register service worker:', manifest.start_url);
      //   // await navigator.serviceWorker.register(manifest.start_url);
      //   console.log('Service worker registration temporarily skipped for debugging.');
      // }

      // Update app state
      set((state) => ({
        pwaApps: state.pwaApps.map(app =>
          app.id === pwa.id ? { ...app, isInstalled: true } : app
        )
      }));

      // Add to OS apps list
      useAppsStore.getState().addApp({
        id: pwa.id,
        name: pwa.name,
        icon: pwa.icon,
        component: pwa.supportsiFrame ? 'PwaView' : 'Browser',
        startUrl: pwa.startUrl, // Pass the startUrl
        isPWA: true // Mark as PWA
      });

    } catch (error) {
      console.error('Failed to install PWA:', error);
      throw error;
    }
  },

  uninstallPWA: async (pwaId: string) => {
    try {
      // Unregister service worker
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(registration => registration.unregister()));
      }

      // Update app state
      set((state) => ({
        pwaApps: state.pwaApps.map(app =>
          app.id === pwaId ? { ...app, isInstalled: false, isPinned: false } : app
        )
      }));

      // Remove from OS apps list
      useAppsStore.getState().removeApp(pwaId);

    } catch (error) {
      console.error('Failed to uninstall PWA:', error);
      throw error;
    }
  },

  pinPWA: (pwaId: string) => {
    set((state) => ({
      pwaApps: state.pwaApps.map(app =>
        app.id === pwaId ? { ...app, isPinned: true } : app
      )
    }));
  },

  unpinPWA: (pwaId: string) => {
    set((state) => ({
      pwaApps: state.pwaApps.map(app =>
        app.id === pwaId ? { ...app, isPinned: false } : app
      )
    }));
  },

  searchApps: (query: string) => {
    set({ searchQuery: query });
  },

  filterByCategory: (category: string | null) => {
    set({ selectedCategory: category });
  },
}));