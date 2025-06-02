import React from 'react';

interface PwaViewProps {
  windowId: string;
  // We'll need to pass the startUrl of the PWA to this component.
  // This will likely come from the App definition in the store when the window is opened.
  startUrl: string; 
}

const PwaView: React.FC<PwaViewProps> = ({ windowId, startUrl }) => {
  if (!startUrl) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800">
        <p className="text-red-500">Error: PWA start URL is missing.</p>
      </div>
    );
  }

  // Basic security check for the URL (HTTPS)
  if (!startUrl.startsWith('https://')) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800">
        <p className="text-red-500">Error: PWA URL must be HTTPS.</p>
      </div>
    );
  }

  return (
    <iframe
      src={startUrl}
      title={`PWA-${windowId}`}
      className="w-full h-full border-none"
      sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"
      // allow="fullscreen; camera; microphone"
      // referrerPolicy="strict-origin-when-cross-origin"
    />
  );
};

export default PwaView;