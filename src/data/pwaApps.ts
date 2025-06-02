import { PWA } from '../types/appStore';

export const pwaApps: PWA[] = [
  {
    id: 'photopea',
    name: 'Photopea',
    icon: 'https://www.photopea.com/promo/icon512.png', // Updated icon
    manifestUrl: 'https://www.photopea.com/manifest.json', // User provided
    startUrl: 'https://www.photopea.com/',
    description: 'A free online advanced image editor, supporting PSD, XCF, Sketch, XD and CDR formats.',
    categories: ['Photo & Video', 'Creative', 'Productivity'],
    screenshots: [
      'https://www.photopea.com/promo/screenshots/main.jpg',
      'https://www.photopea.com/promo/screenshots/layers.jpg',
      'https://www.photopea.com/promo/screenshots/filters.jpg'
    ],
    themeColor: '#2E85FF', // Photopea blue
    backgroundColor: '#F0F0F0',
    supportsiFrame: true, // Photopea works well in an iframe
  }
];