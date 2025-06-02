import React from 'react';
import { useWindowsStore } from '../store/windows';
import Window from './Window';
import AppRenderer from './apps/AppRenderer';

const WindowManager: React.FC = () => {
  const { windows } = useWindowsStore();
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {windows.map((window) => (
        <Window
          key={window.id}
          id={window.id}
          title={window.title}
          icon={window.icon}
          position={window.position}
          isActive={window.isActive}
          isMinimized={window.isMinimized}
          isMaximized={window.isMaximized}
          zIndex={window.zIndex}
        >
          <AppRenderer appComponent={window.component} windowId={window.id} appProps={window.appProps} />
        </Window>
      ))}
    </div>
  );
};

export default WindowManager;