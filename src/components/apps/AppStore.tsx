import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/appStore';
import { PWA } from '../../types/appStore';
import Icon from '../ui/Icon';

interface AppStoreProps {
  windowId: string;
}

const AppStore: React.FC<AppStoreProps> = ({ windowId }) => {
  const {
    pwaApps,
    categories,
    searchQuery,
    selectedCategory,
    installPWA,
    uninstallPWA,
    searchApps,
    filterByCategory,
    addCustomPWA, // Added function to add custom PWA
  } = useAppStore();

  const [isLoading, setIsLoading] = useState(false);
  const [installError, setInstallError] = useState<string | null>(null);
  const [showAddPwaModal, setShowAddPwaModal] = useState(false);
  const [customPwaUrl, setCustomPwaUrl] = useState('');
  const [customPwaName, setCustomPwaName] = useState('');
  const [installToDesktop, setInstallToDesktop] = useState(false);

  console.log('AppStore component rendered. showAddPwaModal:', showAddPwaModal);

  // Filter apps based on search and category
  const filteredApps = pwaApps.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || (app.category && app.category.includes(selectedCategory)); // Changed app.categories to app.category
    return matchesSearch && matchesCategory;
  });

  const handleInstall = async (pwa: PWA) => {
    setIsLoading(true);
    setInstallError(null);
    try {
      await installPWA(pwa);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      console.error('Installation failed:', errorMessage, error);
      setInstallError(`Failed to install ${pwa.name}: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUninstall = async (pwaId: string) => {
    setIsLoading(true);
    try {
      await uninstallPWA(pwaId);
    } catch (error) {
      console.error('Uninstallation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCustomPWA = async () => {
    if (!customPwaUrl || !customPwaName) {
      setInstallError('Please enter both a URL and a name for the custom app.');
      return;
    }
    setIsLoading(true);
    setInstallError(null);
    try {
      // Basic validation for URL
      new URL(customPwaUrl);

      const newPwa: PWA = {
        id: `custom-${Date.now()}`,
        name: customPwaName,
        description: `Custom app added by user: ${customPwaName}`,
        icon: '/favicon.svg', // Default icon, consider allowing user to specify or fetching favicon
        category: 'Custom', // Or let user choose/auto-detect
        manifestUrl: '', // Custom PWAs might not have a manifest in the same way
        startUrl: customPwaUrl,
        screenshots: [],
        version: '1.0.0',
        author: 'User',
        rating: 0,
        installCount: 0,
        isInstalled: true, // Automatically mark as installed in the App Store sense
        isCustom: true,
        customUrl: customPwaUrl,
        installedOnDesktop: installToDesktop,
        supportsiFrame: true, // Assume iframe support for simplicity, could be configurable
      };
      await addCustomPWA(newPwa, installToDesktop);
      setShowAddPwaModal(false);
      setCustomPwaUrl('');
      setCustomPwaName('');
      setInstallToDesktop(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred while adding the app.';
      console.error('Failed to add custom PWA:', errorMessage, error);
      setInstallError(`Failed to add ${customPwaName || 'app'}: ${errorMessage.includes('Invalid URL') ? 'Please enter a valid URL (e.g., https://example.com)' : errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */} 
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search apps..."
                className="w-full px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 
                         backdrop-blur-lg border border-gray-200 dark:border-gray-700
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => searchApps(e.target.value)}
              />
              <Icon
                name="search"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
            </div>
          </div>
          <button
            onClick={() => {
              console.log('Plus button clicked. Current showAddPwaModal:', showAddPwaModal);
              setShowAddPwaModal(true);
              console.log('setShowAddPwaModal(true) called. New showAddPwaModal should be true.');
            }}
            className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
            title="Add custom PWA"
          >
            <Icon name="plus" className="w-5 h-5" />
          </button>
        </div>
        {/* Categories */}
        <div className="flex space-x-2 mt-4 overflow-x-auto pb-2">
          <button
            onClick={() => filterByCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
                      ${!selectedCategory ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
          >
            All
          </button>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => filterByCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors
                        ${selectedCategory === category ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* App Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {installError && (
          <div className="mb-4 p-3 rounded-md bg-red-100 border border-red-400 text-red-700 dark:bg-red-900 dark:border-red-700 dark:text-red-300">
            <p>{installError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredApps.map(app => (
            <div
              key={app.id}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg hover:shadow-xl
                       transition-shadow duration-200 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start space-x-4">
                <img
                  src={app.icon}
                  alt={app.name}
                  className="w-16 h-16 rounded-2xl"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{app.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{app.category}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                    {app.description}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex justify-end items-center">
                {app.isInstalled ? (
                  <button
                    onClick={() => handleUninstall(app.id)}
                    disabled={isLoading}
                    className="px-4 py-2 rounded-lg bg-red-500 text-white font-medium
                             hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    Uninstall
                  </button>
                ) : (
                  <button
                    onClick={() => handleInstall(app)}
                    disabled={isLoading}
                    className="px-4 py-2 rounded-lg bg-blue-500 text-white font-medium
                             hover:bg-blue-600 transition-colors disabled:opacity-50"
                  >
                    Install
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* App Details Modal
      {showAppDetails && selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            Modal content will be implemented later
          </div>
        </div>
      )}
      */}

      {/* Add Custom PWA Modal */}
      {showAddPwaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          { console.log('Rendering Add Custom PWA Modal because showAddPwaModal is true.') }
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Add Custom PWA</h2>
            <input
              type="text"
              placeholder="PWA Name"
              value={customPwaName}
              onChange={(e) => setCustomPwaName(e.target.value)}
              className="w-full p-2 mb-3 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <input
              type="url"
              placeholder="PWA URL (e.g., https://example.com)"
              value={customPwaUrl}
              onChange={(e) => setCustomPwaUrl(e.target.value)}
              className="w-full p-2 mb-3 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <label className="flex items-center mb-4 text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={installToDesktop}
                onChange={(e) => setInstallToDesktop(e.target.checked)}
                className="mr-2 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              Install to Desktop & Start Menu
            </label>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setShowAddPwaModal(false)} 
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddCustomPWA} 
                className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
              >
                Add PWA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppStore;