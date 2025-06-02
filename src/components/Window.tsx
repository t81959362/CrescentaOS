import React, { useRef, ReactNode } from 'react';
import { Rnd } from 'react-rnd';
import { useWindowsStore } from '../store/windows';
import { Position } from '../types';
import Icon from './ui/Icon';
// import { motion, AnimatePresence } from 'framer-motion'; // Temporarily removed

interface WindowProps {
  id: string;
  title: string;
  icon: string;
  position: Position;
  isActive: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  children: ReactNode;
}

const Window: React.FC<WindowProps> = ({
  id,
  title,
  icon,
  position,
  isActive,
  isMinimized,
  isMaximized,
  zIndex,
  children,
}) => {
  const {
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    updateWindowPosition,
    bringToFront,
  } = useWindowsStore();
  
  const rndRef = useRef<Rnd>(null);
  
  const handleActivate = () => {
    if (!isActive) {
      bringToFront(id);
    }
  };
  
  // if (isMinimized) { // Old logic: unmounts the component
  //   return null;
  // }
  
  // Temporarily removed AnimatePresence and motion.div to debug dragging
  return (
        <Rnd
          ref={rndRef}
          position={{ x: position.x, y: position.y }}
          size={{ width: position.width, height: position.height }}
          style={{
            display: isMinimized ? 'none' : 'flex', // New logic: hide instead of unmount
            flexDirection: 'column',
            boxShadow: isActive ? '0 10px 25px -5px rgba(0, 0, 0, 0.2)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            zIndex: zIndex, // Merged zIndex here
            pointerEvents: 'auto', // Added this line
          }}
          disableDragging={isMaximized}
          enableResizing={!isMaximized}
          dragHandleClassName="window-header"
          bounds="parent"
          minWidth={300}
          minHeight={200}
          onMouseDown={handleActivate}
          onDragStart={handleActivate}
          onDragStop={(_e, d) => {
            updateWindowPosition(id, {
              ...position,
              x: d.x,
              y: d.y,
            });
          }}
          onResizeStop={(_e, _direction, ref, _delta, position) => {
            updateWindowPosition(id, {
              x: position.x,
              y: position.y,
              width: parseInt(ref.style.width),
              height: parseInt(ref.style.height),
            });
          }}
          resizeHandleClasses={{
            top: 'resize-handle top',
            right: 'resize-handle right',
            bottom: 'resize-handle bottom',
            left: 'resize-handle left',
            topRight: 'resize-handle top right',
            bottomRight: 'resize-handle bottom right',
            bottomLeft: 'resize-handle bottom left',
            topLeft: 'resize-handle top left',
          }}
        >
          <div
            className={`window-container rounded-lg overflow-hidden glass ${
              isActive ? 'ring-2 ring-primary-500' : ''
            }`}
            style={{ width: '100%', height: '100%' }}
          >
            <div className="window-header h-10 flex items-center justify-between px-3 cursor-move bg-white/10 dark:bg-black/10">
              <div className="flex items-center">
                <div className="w-6 h-6 flex items-center justify-center rounded-full bg-white/20 dark:bg-slate-700/50 mr-2">
                  <Icon name={icon} size={14} className="text-slate-800 dark:text-slate-200" />
                </div>
                <div className="text-sm font-medium truncate">{title}</div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
                  onClick={(e) => {
                    e.stopPropagation();
                    minimizeWindow(id);
                  }}
                >
                  <Icon name="minus" size={14} className="text-slate-800 dark:text-slate-200" />
                </button>
                
                <button
                  className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
                  onClick={(e) => {
                    e.stopPropagation();
                    maximizeWindow(id);
                  }}
                >
                  <Icon
                    name={isMaximized ? 'Minimize2' : 'Maximize2'}
                    size={14}
                    className="text-slate-800 dark:text-slate-200"
                  />
                </button>
                
                <button
                  className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-100 dark:hover:bg-red-900/50"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeWindow(id);
                  }}
                >
                  <Icon name="x" size={14} className="text-slate-800 dark:text-slate-200" />
                </button>
              </div>
            </div>
            
            <div className="window-content flex-1 overflow-auto p-4 h-[calc(100%-2.5rem)]">
              {children}
            </div>
          </div>
        </Rnd>
  // Temporarily removed AnimatePresence and motion.div closing tags
  //   </motion.div>
  // </AnimatePresence>
  );
};

export default Window;