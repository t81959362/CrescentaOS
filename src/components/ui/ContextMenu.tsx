import React from 'react';
import { motion } from 'framer-motion';
import Icon from './Icon';
import { useWindowsStore } from '../../store/windows';
import { useAppsStore } from '../../store/apps';

interface ContextMenuProps {
  x: number;
  y: number;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y }) => {
  const { minimizeAllWindows, openWindow } = useWindowsStore();
  const { apps } = useAppsStore();
  
  const menuItems = [
    { icon: 'refresh-cw', label: 'Refresh' },
    { icon: 'folder-plus', label: 'New Folder' },
    { icon: 'file-plus', label: 'New File' },
    { icon: 'layout-grid', label: 'View' },
    { icon: 'minimize-2', label: 'Show Desktop', onClick: minimizeAllWindows },
    { 
      icon: 'settings', 
      label: 'Display Settings', 
      onClick: () => {
        const settingsApp = apps.find(app => app.id === 'settings');
        if (settingsApp) {
          openWindow(settingsApp.name, settingsApp.icon, settingsApp.component);
        }
      }
    },
  ];
  
  return (
    <motion.div
      className="fixed z-50 w-48 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md shadow-lg rounded-lg border border-slate-200 dark:border-slate-700 py-1"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{ top: y, left: x }}
    >
      {menuItems.map((item, index) => (
        <button
          key={index}
          className="w-full px-3 py-2 text-left flex items-center hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
          onClick={item.onClick}
        >
          <Icon name={item.icon} size={16} className="mr-2" />
          <span className="text-sm">{item.label}</span>
        </button>
      ))}
    </motion.div>
  );
};

export default ContextMenu;