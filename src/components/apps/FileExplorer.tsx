import React, { useState } from 'react';
import { useFileSystemStore } from '../../store/filesystem';
import Icon from '../ui/Icon';

interface FileExplorerProps {
  windowId: string;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ windowId }) => {
  const { 
    currentPath, 
    items, 
    loadDirectory, 
    selectedItemId, 
    selectItem,
    createFile,
    createDirectory,
    deleteItem,
    renameItem,
  } = useFileSystemStore();
  
  const [isCreating, setIsCreating] = useState(false);
  const [creationType, setCreationType] = useState<'file' | 'directory'>('file');
  const [newItemName, setNewItemName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  
  // Get path parts for breadcrumb
  const pathParts = currentPath.split('/').filter(Boolean);
  
  const handleNavigate = (index: number) => {
    if (index < 0) {
      loadDirectory('/');
    } else {
      const path = '/' + pathParts.slice(0, index + 1).join('/');
      loadDirectory(path);
    }
  };
  
  const handleItemClick = (itemId: string) => {
    selectItem(itemId);
  };
  
  const handleItemDoubleClick = (item: any) => {
    if (item.type === 'directory') {
      loadDirectory(item.path);
    }
  };
  
  const handleCreateNew = (type: 'file' | 'directory') => {
    setIsCreating(true);
    setCreationType(type);
    setNewItemName('');
  };
  
  const handleCreateSubmit = async () => {
    if (!newItemName.trim()) return;
    
    try {
      if (creationType === 'file') {
        await createFile(newItemName);
      } else {
        await createDirectory(newItemName);
      }
      
      setIsCreating(false);
      setNewItemName('');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'An error occurred');
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateSubmit();
    } else if (e.key === 'Escape') {
      setIsCreating(false);
    }
  };
  
  const handleStartRename = () => {
    if (!selectedItemId) return;
    
    const selectedItem = items.find(item => item.id === selectedItemId);
    if (selectedItem) {
      setIsRenaming(true);
      setRenameValue(selectedItem.name);
    }
  };
  
  const handleRenameSubmit = async () => {
    if (!selectedItemId || !renameValue.trim()) return;
    
    try {
      await renameItem(selectedItemId, renameValue);
      setIsRenaming(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'An error occurred');
    }
  };
  
  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
      setIsRenaming(false);
    }
  };
  
  const handleDelete = async () => {
    if (!selectedItemId) return;
    
    const confirmed = window.confirm('Are you sure you want to delete this item?');
    if (confirmed) {
      try {
        await deleteItem(selectedItemId);
      } catch (error) {
        alert(error instanceof Error ? error.message : 'An error occurred');
      }
    }
  };
  
  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center mb-4 space-x-2">
        <button
          className="p-1.5 rounded-md hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
          onClick={() => {
            if (currentPath !== '/') {
              const parts = currentPath.split('/').filter(Boolean);
              parts.pop();
              const parentPath = parts.length === 0 ? '/' : '/' + parts.join('/');
              loadDirectory(parentPath);
            }
          }}
        >
          <Icon name="chevron-left" size={16} />
        </button>
        
        <div className="flex-1 flex items-center bg-white/50 dark:bg-slate-700/50 rounded-md px-2 py-1 text-sm">
          <button
            className="mr-1"
            onClick={() => handleNavigate(-1)}
          >
            <Icon name="home" size={14} />
          </button>
          <span>/</span>
          {pathParts.map((part, index) => (
            <React.Fragment key={index}>
              <button 
                className="mx-1 hover:underline"
                onClick={() => handleNavigate(index)}
              >
                {part}
              </button>
              {index < pathParts.length - 1 && <span>/</span>}
            </React.Fragment>
          ))}
        </div>
        
        <button
          className="p-1.5 rounded-md hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
          onClick={() => handleCreateNew('file')}
        >
          <Icon name="file-plus" size={16} />
        </button>
        
        <button
          className="p-1.5 rounded-md hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
          onClick={() => handleCreateNew('directory')}
        >
          <Icon name="folder-plus" size={16} />
        </button>
      </div>
      
      {/* Context menu */}
      {selectedItemId && (
        <div className="flex mb-2 space-x-2">
          <button
            className="text-xs px-2 py-1 rounded bg-slate-200/50 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-600"
            onClick={handleStartRename}
          >
            Rename
          </button>
          
          <button
            className="text-xs px-2 py-1 rounded bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300"
            onClick={handleDelete}
          >
            Delete
          </button>
        </div>
      )}
      
      {/* File list */}
      <div className="flex-1 overflow-auto rounded-md bg-white/50 dark:bg-slate-800/50">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2 p-2">
          {isCreating && (
            <div className="w-full p-2 flex flex-col items-center">
              <div className="w-16 h-16 flex items-center justify-center bg-white dark:bg-slate-700 rounded-lg shadow-sm mb-1">
                <Icon 
                  name={creationType === 'file' ? 'file' : 'folder'} 
                  className="text-primary-500" 
                  size={24} 
                />
              </div>
              <input
                type="text"
                className="w-full mt-1 px-2 py-1 text-xs text-center bg-white dark:bg-slate-700 border border-primary-300 dark:border-primary-700 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder={`New ${creationType}`}
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
              />
            </div>
          )}
          
          {items.map((item) => (
            <div
              key={item.id}
              className={`p-2 flex flex-col items-center rounded-lg cursor-pointer ${
                selectedItemId === item.id 
                  ? 'bg-primary-100/70 dark:bg-primary-900/30' 
                  : 'hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
              }`}
              onClick={() => handleItemClick(item.id)}
              onDoubleClick={() => handleItemDoubleClick(item)}
            >
              <div className="w-16 h-16 flex items-center justify-center bg-white dark:bg-slate-700 rounded-lg shadow-sm mb-1">
                <Icon 
                  name={item.type === 'file' ? 'file' : 'folder'} 
                  className="text-primary-500" 
                  size={24} 
                />
              </div>
              
              {isRenaming && selectedItemId === item.id ? (
                <input
                  type="text"
                  className="w-full px-2 py-1 text-xs text-center bg-white dark:bg-slate-700 border border-primary-300 dark:border-primary-700 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={handleRenameKeyDown}
                  onBlur={handleRenameSubmit}
                  autoFocus
                />
              ) : (
                <span className="text-xs text-center break-all">{item.name}</span>
              )}
              
              {item.type === 'file' && (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {(item.size || 0) > 1024 
                    ? `${Math.round((item.size || 0) / 1024)} KB` 
                    : `${item.size || 0} B`}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FileExplorer;