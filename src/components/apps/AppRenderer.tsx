import React from 'react';
import FileExplorer from './FileExplorer';
import Terminal from './Terminal';
import Settings from './Settings';
import Browser from './Browser';
import TextEditor from './TextEditor';
import AppStore from './AppStore';
import PwaView from './PwaView'; // Added import for PwaView

interface AppRendererProps {
  appComponent: string;
  windowId: string;
  appProps?: Record<string, any>;
}

const AppRenderer: React.FC<AppRendererProps> = ({ appComponent, windowId, appProps }) => {
  switch (appComponent) {
    case 'FileExplorer':
      return <FileExplorer windowId={windowId} />;
    case 'Terminal':
      return <Terminal windowId={windowId} />;
    case 'Settings':
      return <Settings windowId={windowId} />;
    case 'Browser':
      return <Browser windowId={windowId} initialUrl={appProps?.initialUrl} />;
    case 'TextEditor':
      return <TextEditor windowId={windowId} />;
    case 'AppStore':
      return <AppStore windowId={windowId} />;
    case 'PwaView':
      return <PwaView windowId={windowId} startUrl={appProps?.startUrl} />;
    default:
      return <div>App not found</div>;
  }
};

export default AppRenderer;