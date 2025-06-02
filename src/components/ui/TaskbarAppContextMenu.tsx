import React from 'react';
import { motion } from 'framer-motion';
import Icon from './Icon';
import { useWindowsStore } from '../../store/windows';
import { Window } from '../../types'; // Assuming Window type is in types

interface TaskbarAppContextMenuProps {
  x: number;
  y: number;
  windowId: string;
  onClose: () => void; // Function to close the context menu itself
}

const TaskbarAppContextMenu: React.FC<TaskbarAppContextMenuProps> = ({ x, y, windowId, onClose }) => {
  const { closeWindow, restoreWindow, minimizeWindow, windows, bringToFront } = useWindowsStore();
  const window = windows.find(w => w.id === windowId);

  const menuItems: { icon: string; label: string; onClick: () => void; disabled?: boolean }[] = [];

  if (window) {
    if (window.isMinimized) {
      menuItems.push({
        icon: 'arrow-up-right-square',
        label: 'Restore',
        onClick: () => {
          restoreWindow(windowId);
          bringToFront(windowId); // Also bring to front on restore
          onClose();
        },
      });
    } else {
      menuItems.push({
        icon: 'arrow-down-left-square',
        label: 'Minimize',
        onClick: () => {
          minimizeWindow(windowId);
          onClose();
        },
      });
    }
    // TODO: Add 'Maximize' if not maximized, 'Restore Down' if maximized

    menuItems.push({
      icon: 'x-square',
      label: 'Close',
      onClick: () => {
        closeWindow(windowId);
        onClose();
      },
    });
  }

  if (!menuItems.length) return null;

  return (
    <motion.div
      className="fixed z-[10000] w-48 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md shadow-lg rounded-lg border border-slate-200 dark:border-slate-700 py-1"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{ top: y, left: x }}
      onClick={(e) => e.stopPropagation()} // Prevent clicks inside from closing due to global listeners
      onContextMenu={(e) => e.preventDefault()} // Prevent browser context menu on this menu
    >
      {menuItems.map((item, index) => (
        <button
          key={index}
          className="w-full px-3 py-2 text-left flex items-center hover:bg-slate-200/50 dark:hover:bg-slate-700/50 text-slate-800 dark:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={item.onClick}
          disabled={item.disabled}
        >
          <Icon name={item.icon as any} size={16} className="mr-2 flex-shrink-0" />
          <span className="text-sm truncate">{item.label}</span>
        </button>
      ))}
    </motion.div>
  );
};

export default TaskbarAppContextMenu;