import React, { useState, useEffect } from 'react';
import { useFileSystemStore } from '../../store/filesystem';
import Icon from '../ui/Icon';

interface TextEditorProps {
  windowId: string;
}

interface TabInfo {
  id: string;
  name: string;
  content: string; // Current content in editor
  originalContent?: string; // Content as it was when loaded/saved or empty for new files
  isEdited: boolean;
  filePath?: string; // Original path for saved files
  fileId?: string; // Filesystem ID for saved files
}

const TextEditor: React.FC<TextEditorProps> = ({ windowId }) => {
  const initialTabId = `tab-${Date.now()}`;
  const [openTabs, setOpenTabs] = useState<TabInfo[]>([
    { id: initialTabId, name: 'Untitled.txt', content: '', originalContent: '', isEdited: false },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>(initialTabId);

  // Derived state for the active tab
  const activeTab = openTabs.find(tab => tab.id === activeTabId);
  const content = activeTab?.content || '';
  const fileName = activeTab?.name || 'Untitled.txt';
  const isEdited = activeTab?.isEdited || false;
  const currentFileId = activeTab?.fileId || null; // Using fileId from tab

  const [showFileList, setShowFileList] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  
  const { 
    items, 
    updateFileContent, 
    createFile,
    loadDirectory,
    currentPath 
  } = useFileSystemStore();
  
  // Filter only text files
  const textFiles = items.filter(item => 
    item.type === 'file' && 
    (item.name.endsWith('.txt') || 
     item.name.endsWith('.md') || 
     item.name.endsWith('.js') || 
     item.name.endsWith('.ts') || 
     item.name.endsWith('.json') || 
     item.name.endsWith('.html') || 
     item.name.endsWith('.css'))
  );
  
  // useEffect(() => {
  //   // If there are text files and none is selected, select the first one
  //   if (textFiles.length > 0 && !currentFileId) {
  //     openFile(textFiles[0].id);
  //   }
  // }, [textFiles, currentFileId]);
  
  useEffect(() => {
    // Calculate word and character count
    const words = content.split(/\s+/).filter(Boolean);
    setWordCount(words.length === 1 && words[0] === '' ? 0 : words.length);
    setCharCount(content.length);
  }, [content]);

  const openFile = async (fileId: string) => {
    const fileToOpen = items.find(item => item.id === fileId);
    if (!fileToOpen) return;

    const proceedOpening = () => {
      // Check if file is already open in a tab
      const existingTab = openTabs.find(tab => tab.fileId === fileToOpen.id);
      if (existingTab) {
        setActiveTabId(existingTab.id);
      } else {
        const newTabId = `tab-${Date.now()}`;
        const newTab: TabInfo = {
          id: newTabId,
          name: fileToOpen.name,
          content: fileToOpen.content || '',
          originalContent: fileToOpen.content || '', // Store original content
          isEdited: false,
          filePath: fileToOpen.path, // Assuming file object has path
          fileId: fileToOpen.id,
        };
        setOpenTabs(prevTabs => [...prevTabs, newTab]);
        setActiveTabId(newTabId);
      }
      setShowFileList(false);
    };

    if (activeTab && activeTab.isEdited) {
      const confirmed = window.confirm(
        `File "${activeTab.name}" has unsaved changes. Do you want to save before opening another file?`
      );
      if (confirmed) {
        saveFile().then(() => {
          proceedOpening();
        });
        return; // Wait for save then proceed
      } else {
        const discardConfirmed = window.confirm(
          'Are you sure you want to discard unsaved changes and open another file?'
        );
        if (!discardConfirmed) return; // User cancelled opening file
      }
    }
    proceedOpening();
  };
  
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!activeTabId) return;
    const newContent = e.target.value;
    setOpenTabs(prevTabs =>
      prevTabs.map(tab => {
        if (tab.id === activeTabId) {
          const edited = newContent !== (tab.originalContent ?? '');
          return { ...tab, content: newContent, isEdited: edited };
        }
        return tab;
      })
    );
  };
  
  const saveFile = async () => {
    if (!activeTab) return;
    try {
      if (activeTab.fileId) {
        // Update existing file
        await updateFileContent(activeTab.fileId, activeTab.content);
        setOpenTabs(prevTabs =>
          prevTabs.map(tab =>
            tab.id === activeTabId ? { ...tab, isEdited: false, name: activeTab.name, originalContent: tab.content } : tab
          )
        );
      } else {
        // Create new file
        const newFile = await createFile(activeTab.name, activeTab.content);
        setOpenTabs(prevTabs =>
          prevTabs.map(tab =>
            tab.id === activeTabId
              ? { ...tab, fileId: newFile.id, name: newFile.name, isEdited: false, filePath: newFile.path, originalContent: tab.content }
              : tab
          )
        );
      }
    } catch (error) {
      console.error('Error saving file:', error);
      // Optionally, show an error message to the user
    }
  };
  
  const createNewFile = () => {
    // Proceed to create new file directly without checking for unsaved changes in the current tab.
    // The unsaved changes prompt is handled when closing a tab or opening another file.
    const newTabId = `tab-${Date.now()}`;
    const newTab: TabInfo = {
      id: newTabId,
      name: 'Untitled.txt',
      content: '',
      originalContent: '', // For new files, original is empty
      isEdited: false,
    };
    setOpenTabs(prevTabs => [...prevTabs, newTab]);
    setActiveTabId(newTabId);
    setShowFileList(false); // Close file list if open
  };
  
  const handleFileNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeTabId) return;
    setOpenTabs(prevTabs =>
      prevTabs.map(tab =>
        tab.id === activeTabId
          ? { ...tab, name: e.target.value, isEdited: true }
          : tab
      )
    );
  };

  const toggleFindReplace = () => {
    setShowFindReplace(!showFindReplace);
  };

  const handleFind = () => {
    if (!searchTerm) return;
    // Basic find logic (highlights first occurrence or moves cursor)
    // This is a placeholder for more advanced find functionality
    const textarea = document.querySelector(`textarea`); // Consider a more specific selector if multiple textareas exist
    if (textarea) {
      const index = content.indexOf(searchTerm);
      if (index !== -1) {
        textarea.focus();
        textarea.setSelectionRange(index, index + searchTerm.length);
      } else {
        alert('Search term not found.');
      }
    }
  };

  const handleReplace = () => {
    if (!searchTerm || !activeTab) return;
    const currentContent = activeTab.content;
    const index = currentContent.indexOf(searchTerm);
    if (index !== -1) {
      const newContent = currentContent.substring(0, index) + replaceTerm + currentContent.substring(index + searchTerm.length);
      setOpenTabs(prevTabs =>
        prevTabs.map(tab =>
          tab.id === activeTabId
            ? { ...tab, content: newContent, isEdited: newContent !== (tab.originalContent ?? '') }
            : tab
        )
      );
    } else {
      alert('Search term not found for replacement.');
    }
  };

  const handleReplaceAll = () => {
    if (!searchTerm || !activeTab) return;
    const currentContent = activeTab.content;
    if (currentContent.includes(searchTerm)) {
      const newContent = currentContent.split(searchTerm).join(replaceTerm);
      setOpenTabs(prevTabs =>
        prevTabs.map(tab =>
          tab.id === activeTabId
            ? { ...tab, content: newContent, isEdited: newContent !== (tab.originalContent ?? '') }
            : tab
        )
      );
    } else {
      alert('Search term not found for replacement.');
    }
  };

  const handleTabClick = (tabId: string) => {
    setActiveTabId(tabId);
  };

  const handleCloseTab = (tabIdToClose: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent click from bubbling to tab selection
    const tabToClose = openTabs.find(tab => tab.id === tabIdToClose);

    if (tabToClose && tabToClose.isEdited) {
      const confirmed = window.confirm(
        `File "${tabToClose.name}" has unsaved changes. Do you want to save before closing?`
      );
      if (confirmed) {
        // Temporarily set active tab to the one being closed to save it correctly
        const originalActiveTabId = activeTabId;
        setActiveTabId(tabIdToClose);
        saveFile().then(() => {
          // Restore original active tab if it wasn't the one closed, then close
          if (originalActiveTabId !== tabIdToClose) {
            setActiveTabId(originalActiveTabId);
          }
          closeTabLogic(tabIdToClose);
        });
        return; // Wait for save then close
      } else {
        const discardConfirmed = window.confirm(
          'Are you sure you want to discard unsaved changes and close this tab?'
        );
        if (!discardConfirmed) return; // User cancelled closing tab
      }
    }
    closeTabLogic(tabIdToClose);
  };

  const closeTabLogic = (tabIdToClose: string) => {
    setOpenTabs(prevTabs => {
      const newTabs = prevTabs.filter(tab => tab.id !== tabIdToClose);
      if (newTabs.length === 0) {
        const newUntitledTabId = `tab-${Date.now()}`;
        setActiveTabId(newUntitledTabId);
        return [{ id: newUntitledTabId, name: 'Untitled.txt', content: '', isEdited: false }];
      }
      if (activeTabId === tabIdToClose) {
        setActiveTabId(newTabs[0].id); // Activate the first available tab
      }
      return newTabs;
    });
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-800 rounded-xl overflow-hidden">
      {/* Tab Bar - Glassmorphism Enhanced */}
      <div className="flex items-end bg-transparent border-b border-slate-200/70 dark:border-slate-700/50 overflow-hidden">
        {openTabs.map(tab => (
          <div
            key={tab.id}
            className={`flex items-center pl-3 pr-2 py-2 mr-px rounded-t-lg cursor-pointer whitespace-nowrap transition-colors duration-150 ${ 
              activeTabId === tab.id 
                ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-md -mb-px border-x border-t border-slate-200 dark:border-slate-700'
                : 'bg-slate-100 dark:bg-slate-750 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
            onClick={() => handleTabClick(tab.id)}
            title={tab.name}
          >
            <Icon 
              name={tab.fileId ? "file-text" : "file"} 
              size={16} 
              className={`mr-2 ${activeTabId === tab.id ? 'text-primary-600 dark:text-primary-400' : 'text-slate-500 dark:text-slate-400'}`}
            />
            <span className="text-sm font-medium truncate max-w-[150px]">{tab.name}</span>
            {tab.isEdited && <span className="text-xs ml-2 text-amber-500 dark:text-amber-400">*</span>}
            <button 
              onClick={(e) => handleCloseTab(tab.id, e)}
              className="p-1 rounded-full hover:bg-slate-300/50 dark:hover:bg-slate-600/50 ml-2.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors duration-150"
              title="Close Tab"
            >
              <Icon name="x" size={14} />
            </button>
          </div>
        ))}
        {/* Add new tab button */}
        <button 
          onClick={createNewFile}
          className="ml-2 p-2 rounded-full hover:bg-slate-200/70 dark:hover:bg-slate-700/70 text-slate-600 dark:text-slate-300 flex items-center justify-center h-[38px] w-[38px] focus:outline-none transition-colors duration-150"
          title="New Tab"
        >
          <Icon name="plus" size={20} />
        </button>
      </div>
      {/* Toolbar - Glassmorphism Enhanced */}
      <div className="flex items-center py-2 px-3 space-x-3 bg-transparent border-b border-slate-200/70 dark:border-slate-700/50">
        <button
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-150 text-slate-600 dark:text-slate-300"
          onClick={createNewFile}
          title="New File (Ctrl+N)"
        >
          <Icon name="file-plus" size={18} />
        </button>
        
        <button
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-150 text-slate-600 dark:text-slate-300"
          onClick={() => setShowFileList(!showFileList)}
          title="Open File (Ctrl+O)"
        >
          <Icon name="folder-open" size={18} />
        </button>
        
        <button
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-150 text-slate-600 dark:text-slate-300"
          onClick={saveFile}
          title="Save File (Ctrl+S)"
        >
          <Icon name="save" size={18} />
        </button>

        <button
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-150 text-slate-600 dark:text-slate-300"
          onClick={toggleFindReplace}
          title="Find and Replace (Ctrl+F)"
        >
          <Icon name="search" size={18} />
        </button>
        
        <div className="flex-1 flex items-center">
          <input
            type="text"
            value={fileName}
            onChange={handleFileNameChange}
            className="ml-3 px-3 py-1.5 bg-slate-50 dark:bg-slate-750 border border-slate-300 dark:border-slate-600 rounded-xl text-sm flex-1 outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-150"
            placeholder="Enter filename..."
          />
          
          {/* {isEdited && (
            <span className="ml-3 text-xs font-medium text-amber-600 dark:text-amber-400">
              UNSAVED
            </span>
          )} */}
        </div>
      </div>
      
      {/* Find and Replace UI - Modernized */}
      {showFindReplace && (
        <div className="p-3 space-y-3 bg-transparent border-b border-slate-200/70 dark:border-slate-700/50 shadow-sm">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Find"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm flex-1 outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all duration-150"
            />
            <button onClick={handleFind} className="px-4 py-1.5 text-sm bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors duration-150">Find Next</button>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Replace with"
              value={replaceTerm}
              onChange={(e) => setReplaceTerm(e.target.value)}
              className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm flex-1 outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all duration-150"
            />
            <button onClick={handleReplace} className="px-4 py-1.5 text-sm bg-slate-500 hover:bg-slate-600 text-white rounded-lg transition-colors duration-150">Replace</button>
            <button onClick={handleReplaceAll} className="px-4 py-1.5 text-sm bg-slate-500 hover:bg-slate-600 text-white rounded-lg transition-colors duration-150">Replace All</button>
          </div>
        </div>
      )}

      {/* File List Overlay - Modernized */}
      {showFileList && (
        <div className="absolute z-20 top-14 left-4 w-72 max-h-80 bg-white/95 dark:bg-slate-800/95 backdrop-blur-lg rounded-lg shadow-xl overflow-y-auto border border-slate-300 dark:border-slate-700 ring-1 ring-black ring-opacity-5">
          <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Open File</span>
            <button
              className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors duration-150 text-slate-500 dark:text-slate-400"
              onClick={() => setShowFileList(false)}
              title="Close"
            >
              <Icon name="x" size={16} />
            </button>
          </div>
          
          <div className="p-2 space-y-1">
            {textFiles.length > 0 ? (
              textFiles.map((file) => (
                <button
                  key={file.id}
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors duration-150 flex items-center ${
                    currentFileId === file.id
                      ? 'bg-primary-500 text-white'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                  onClick={() => openFile(file.id)}
                >
                  <Icon 
                    name="file-text" 
                    size={16} 
                    className={`mr-2.5 ${currentFileId === file.id ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`} 
                  />
                  <span className="truncate">{file.name}</span>
                </button>
              ))
            ) : (
              <div className="p-2 text-sm text-slate-500 dark:text-slate-400">
                No text files found in this directory
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <textarea
          value={content}
          onChange={handleContentChange}
          className="w-full h-full p-4 bg-white dark:bg-slate-800 outline-none resize-none font-mono text-sm rounded-xl"
          placeholder="Type your text here..."
          spellCheck={true}
        ></textarea>
      </div>
      {/* Status Bar */}
      <div className="p-1.5 px-3 text-xs text-slate-500 dark:text-slate-400 bg-transparent border-t border-slate-200/70 dark:border-slate-700/50 flex justify-end space-x-5">
        <span>Words: {wordCount}</span>
        <span>Characters: {charCount}</span>
      </div>
    </div>
  );
};

export default TextEditor;