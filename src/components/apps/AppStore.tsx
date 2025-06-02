import React, { useState } from 'react';
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
    // pinPWA, // Removed unused pinPWA
    // unpinPWA, // Removed unused unpinPWA
    searchApps,
    filterByCategory,
  } = useAppStore();

  const [isLoading, setIsLoading] = useState(false);
  const [installError, setInstallError] = useState<string | null>(null);
  // const [selectedApp, setSelectedApp] = useState<PWA | null>(null); // Removed unused selectedApp
  // const [showAppDetails, setShowAppDetails] = useState(false); // Removed unused setShowAppDetails

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
    </div>
  );
};

export default AppStore;