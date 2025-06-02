import { create } from 'zustand';
import { openDB, IDBPDatabase } from 'idb';
import { FileSystemItem } from '../types';
import { generateId } from '../lib/utils';

interface FileSystemState {
  initialized: boolean;
  currentPath: string;
  items: FileSystemItem[];
  selectedItemId: string | null;
  
  initialize: () => Promise<void>;
  loadDirectory: (path: string) => Promise<void>;
  createFile: (name: string, content?: string) => Promise<FileSystemItem>;
  createDirectory: (name: string) => Promise<FileSystemItem>;
  deleteItem: (id: string) => Promise<void>;
  renameItem: (id: string, newName: string) => Promise<void>;
  updateFileContent: (id: string, content: string) => Promise<void>;
  selectItem: (id: string | null) => void;
}

// Database name and version
const DB_NAME = 'crescentaos-filesystem';
const DB_VERSION = 1;

// Helper to get database connection
const getDb = async (): Promise<IDBPDatabase> => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create stores for files and directories
      if (!db.objectStoreNames.contains('items')) {
        db.createObjectStore('items', { keyPath: 'id' });
      }
    },
  });
};

export const useFileSystemStore = create<FileSystemState>((set, get) => ({
  initialized: false,
  currentPath: '/',
  items: [],
  selectedItemId: null,
  
  initialize: async () => {
    const db = await getDb();
    
    // Check if root directory exists
    let rootDir = await db.get('items', 'root');
    
    if (!rootDir) {
      // Create root directory
      rootDir = {
        id: 'root',
        name: 'Root',
        type: 'directory',
        path: '/',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await db.put('items', rootDir);
      
      // Create some initial directories and files
      const homeDir: FileSystemItem = {
        id: generateId(),
        name: 'Home',
        type: 'directory',
        path: '/Home',
        parentId: 'root',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const documentsDir: FileSystemItem = {
        id: generateId(),
        name: 'Documents',
        type: 'directory',
        path: '/Documents',
        parentId: 'root',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const readmeFile: FileSystemItem = {
        id: generateId(),
        name: 'README.txt',
        type: 'file',
        path: '/README.txt',
        parentId: 'root',
        content: 'Welcome to CrescentaOS!\n\nThis is a browser-based operating system simulation.',
        size: 70,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await db.put('items', homeDir);
      await db.put('items', documentsDir);
      await db.put('items', readmeFile);
    }
    
    // Load root directory contents
    await get().loadDirectory('/');
    
    set({ initialized: true });
  },
  
  loadDirectory: async (path) => {
    const db = await getDb();
    const allItems = await db.getAll('items');
    
    // Filter items for current directory
    let currentDirId = 'root';
    
    if (path !== '/') {
      const pathParts = path.split('/').filter(Boolean);
      let currentPath = '';
      
      for (const part of pathParts) {
        currentPath = currentPath ? `${currentPath}/${part}` : `/${part}`;
        const dir = allItems.find(item => 
          item.type === 'directory' && item.path === currentPath
        );
        
        if (dir) {
          currentDirId = dir.id;
        } else {
          console.error(`Directory not found: ${currentPath}`);
          return;
        }
      }
    }
    
    // Get items in current directory
    const items = allItems.filter(item => item.parentId === currentDirId);
    
    set({
      currentPath: path,
      items,
      selectedItemId: null,
    });
  },
  
  createFile: async (name, content = '') => {
    const { currentPath, items } = get();
    
    // Check if file already exists
    if (items.some(item => item.name === name)) {
      throw new Error(`File "${name}" already exists`);
    }
    
    const db = await getDb();
    
    // Find parent directory
    let parentId = 'root';
    if (currentPath !== '/') {
      const parent = await db.getAll('items').then(items => 
        items.find(item => item.path === currentPath)
      );
      
      if (parent) {
        parentId = parent.id;
      }
    }
    
    const newFile: FileSystemItem = {
      id: generateId(),
      name,
      type: 'file',
      path: currentPath === '/' ? `/${name}` : `${currentPath}/${name}`,
      parentId,
      content,
      size: content.length,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await db.put('items', newFile);
    
    // Reload directory
    await get().loadDirectory(currentPath);
    
    return newFile;
  },
  
  createDirectory: async (name) => {
    const { currentPath, items } = get();
    
    // Check if directory already exists
    if (items.some(item => item.name === name)) {
      throw new Error(`Directory "${name}" already exists`);
    }
    
    const db = await getDb();
    
    // Find parent directory
    let parentId = 'root';
    if (currentPath !== '/') {
      const parent = await db.getAll('items').then(items => 
        items.find(item => item.path === currentPath)
      );
      
      if (parent) {
        parentId = parent.id;
      }
    }
    
    const newDir: FileSystemItem = {
      id: generateId(),
      name,
      type: 'directory',
      path: currentPath === '/' ? `/${name}` : `${currentPath}/${name}`,
      parentId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await db.put('items', newDir);
    
    // Reload directory
    await get().loadDirectory(currentPath);
    
    return newDir;
  },
  
  deleteItem: async (id) => {
    const db = await getDb();
    const { currentPath } = get();
    
    // Get the item to delete
    const item = await db.get('items', id);
    
    if (!item) {
      throw new Error('Item not found');
    }
    
    // If it's a directory, delete all children recursively
    if (item.type === 'directory') {
      const allItems = await db.getAll('items');
      const itemsToDelete = [item];
      
      // Find all items under this directory recursively
      const findChildren = (parentId: string) => {
        const children = allItems.filter(i => i.parentId === parentId);
        
        for (const child of children) {
          itemsToDelete.push(child);
          
          if (child.type === 'directory') {
            findChildren(child.id);
          }
        }
      };
      
      findChildren(id);
      
      // Delete all items
      const tx = db.transaction('items', 'readwrite');
      for (const item of itemsToDelete) {
        await tx.store.delete(item.id);
      }
      await tx.done;
    } else {
      // Delete a single file
      await db.delete('items', id);
    }
    
    // Reload directory
    await get().loadDirectory(currentPath);
  },
  
  renameItem: async (id, newName) => {
    const db = await getDb();
    const { currentPath, items } = get();
    
    // Check if name already exists
    if (items.some(item => item.name === newName && item.id !== id)) {
      throw new Error(`An item named "${newName}" already exists`);
    }
    
    // Get the item to rename
    const item = await db.get('items', id);
    
    if (!item) {
      throw new Error('Item not found');
    }
    
    // Update the path
    const oldPathParts = item.path.split('/');
    oldPathParts.pop();
    const newPath = [...oldPathParts, newName].join('/');
    
    const updatedItem = {
      ...item,
      name: newName,
      path: newPath,
      updatedAt: new Date(),
    };
    
    await db.put('items', updatedItem);
    
    // If it's a directory, update paths of all children
    if (item.type === 'directory') {
      const allItems = await db.getAll('items');
      const itemsToUpdate = [];
      
      for (const childItem of allItems) {
        if (childItem.path.startsWith(item.path + '/')) {
          const newChildPath = childItem.path.replace(item.path, newPath);
          itemsToUpdate.push({
            ...childItem,
            path: newChildPath,
            updatedAt: new Date(),
          });
        }
      }
      
      // Update all affected items
      const tx = db.transaction('items', 'readwrite');
      for (const item of itemsToUpdate) {
        await tx.store.put(item);
      }
      await tx.done;
    }
    
    // Reload directory
    await get().loadDirectory(currentPath);
  },
  
  updateFileContent: async (id, content) => {
    const db = await getDb();
    
    // Get the file
    const file = await db.get('items', id);
    
    if (!file || file.type !== 'file') {
      throw new Error('File not found');
    }
    
    const updatedFile = {
      ...file,
      content,
      size: content.length,
      updatedAt: new Date(),
    };
    
    await db.put('items', updatedFile);
    
    // Update state if the file is in the current view
    set(state => ({
      items: state.items.map(item => 
        item.id === id ? updatedFile : item
      ),
    }));
  },
  
  selectItem: (id) => {
    set({ selectedItemId: id });
  },
}));