import React, { useState, useRef, useEffect } from 'react';
import Icon from '../ui/Icon';

interface BrowserProps {
  windowId: string;
  initialUrl?: string;
}

interface Bookmark {
  id: string;
  url: string;
  title: string;
}

interface Tab {
  id: string;
  url: string;
  history: string[];
  currentHistoryIndex: number;
  isLoading: boolean;
  error: string | null;
  // title?: string; // Future enhancement
}

const createNewTab = (initialUrl: string = 'https://www.phind.com'): Tab => ({
  id: Date.now().toString() + Math.random().toString(36).substring(2),
  url: initialUrl,
  history: [initialUrl],
  currentHistoryIndex: 0,
  isLoading: false,
  error: null,
});

const Browser: React.FC<BrowserProps> = ({ windowId, initialUrl }) => {
  const [tabs, setTabs] = useState<Tab[]>([createNewTab(initialUrl)]);
  const [activeTabId, setActiveTabId] = useState<string>(tabs[0].id);
  const [inputValue, setInputValue] = useState<string>(''); 
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    const savedBookmarks = localStorage.getItem('browserBookmarks');
    return savedBookmarks ? JSON.parse(savedBookmarks) : [];
  });
  const [showBookmarksDropdown, setShowBookmarksDropdown] = useState<boolean>(false);
  const bookmarksButtonRef = useRef<HTMLButtonElement>(null);

  const activeTab = tabs.find(tab => tab.id === activeTabId);

  useEffect(() => {
    localStorage.setItem('browserBookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    if (activeTab) {
      setInputValue(activeTab.url);
    }
  }, [activeTab?.url, activeTabId]); // Update input value when active tab or its URL changes

  const addBookmark = () => {
    if (activeTab && activeTab.url) {
      const existingBookmark = bookmarks.find(bm => bm.url === activeTab.url);
      if (existingBookmark) return; // Already bookmarked

      const newBookmark: Bookmark = {
        id: Date.now().toString(),
        url: activeTab.url,
        title: activeTab.url.replace(/^https?:\/\//, '').split('/')[0] || 'New Bookmark',
      };
      setBookmarks([...bookmarks, newBookmark]);
    }
  };

  const removeBookmark = (bookmarkId: string) => {
    setBookmarks(bookmarks.filter(bm => bm.id !== bookmarkId));
  };

  const toggleBookmarksDropdown = () => {
    setShowBookmarksDropdown(!showBookmarksDropdown);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bookmarksButtonRef.current && !bookmarksButtonRef.current.contains(event.target as Node) &&
          !document.getElementById('bookmarks-dropdown')?.contains(event.target as Node)) {
        setShowBookmarksDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleAddNewTab = () => {
    const newTab = createNewTab();
    setTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);
    // Focus the URL bar for the new tab, if possible (might need a ref to input)
  };

  const handleCloseTab = (tabIdToClose: string) => {
    setTabs(prevTabs => {
      const remainingTabs = prevTabs.filter(tab => tab.id !== tabIdToClose);
      if (remainingTabs.length === 0) {
        // If all tabs are closed, create a new default tab
        const newDefaultTab = createNewTab();
        setActiveTabId(newDefaultTab.id);
        return [newDefaultTab];
      }
      if (activeTabId === tabIdToClose) {
        // If closing the active tab, switch to the last tab or the first if last was closed
        setActiveTabId(remainingTabs[remainingTabs.length - 1].id);
      }
      return remainingTabs;
    });
  };

  const updateActiveTab = (updates: Partial<Tab>) => {
    setTabs(prevTabs => 
      prevTabs.map(tab => 
        tab.id === activeTabId ? { ...tab, ...updates } : tab
      )
    );
  };
  
  const navigate = (targetUrl: string, tabIdToNavigate: string = activeTabId!) => {
    let newUrl = targetUrl;
    if (!newUrl.startsWith('http://') && !newUrl.startsWith('https://')) {
      newUrl = 'https://' + newUrl;
    }

    setTabs(prevTabs => prevTabs.map(tab => {
      if (tab.id === tabIdToNavigate) {
        const newHistoryBase = tab.currentHistoryIndex < tab.history.length - 1 
          ? tab.history.slice(0, tab.currentHistoryIndex + 1) 
          : tab.history;
        
        const newHistory = [...newHistoryBase, newUrl];
        
        // Simulate loading
        setTimeout(() => {
          setTabs(prev => prev.map(t => t.id === tabIdToNavigate ? { ...t, isLoading: false } : t));
        }, 1000);

        return {
          ...tab,
          url: newUrl,
          isLoading: true,
          error: null,
          history: newHistory,
          currentHistoryIndex: newHistory.length - 1,
        };
      }
      return tab;
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab && inputValue.trim() !== '') {
      navigate(inputValue.trim(), activeTab.id);
    }
  };
  
  const goBack = () => {
    if (activeTab && activeTab.currentHistoryIndex > 0) {
      const newIndex = activeTab.currentHistoryIndex - 1;
      updateActiveTab({
        url: activeTab.history[newIndex],
        currentHistoryIndex: newIndex,
        isLoading: true,
      });
      setTimeout(() => updateActiveTab({ isLoading: false }), 500);
    }
  };
  
  const goForward = () => {
    if (activeTab && activeTab.currentHistoryIndex < activeTab.history.length - 1) {
      const newIndex = activeTab.currentHistoryIndex + 1;
      updateActiveTab({
        url: activeTab.history[newIndex],
        currentHistoryIndex: newIndex,
        isLoading: true,
      });
      setTimeout(() => updateActiveTab({ isLoading: false }), 500);
    }
  };
  
  const refresh = () => {
    if (activeTab) {
      updateActiveTab({ isLoading: true });
      // To re-trigger iframe load, we might need to briefly change the src
      // For now, just simulate loading
      const currentUrl = activeTab.url;
      if (iframeRef.current) {
        iframeRef.current.src = 'about:blank'; // Force a blank load first
        setTimeout(() => {
          if (iframeRef.current) iframeRef.current.src = currentUrl; // Then reload the actual URL
          updateActiveTab({ isLoading: false });
        }, 50); // Short delay
      } else {
         setTimeout(() => updateActiveTab({ isLoading: false }), 500);
      }
    }
  };
  
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value); // Update inputValue instead of activeTab.url directly
  };
  
  // List of allowed domains for iframes - many sites block embedding
  const allowedDomains = [
    'example.com',
    'wikipedia.org',
    'stackblitz.com',
    'github.com',
    'duckduckgo.com',
  ];
  
  // Check if the URL is in an allowed domain
  const isAllowedDomain = (urlToCheck: string | undefined) => {
    if (!urlToCheck) return false;
    try {
      const domain = new URL(urlToCheck).hostname;
      return allowedDomains.some(allowed => domain.includes(allowed));
    } catch (e) {
      return false;
    }
  };
  
  return (
    <div className="h-full flex flex-col">
      {/* Tab Bar */}
      <div className="flex items-end bg-transparent pt-1 px-1 space-x-1 rounded-t-lg overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent scroll-smooth">
        {tabs.map(tab => (
          <div
            key={tab.id}
            onClick={() => setActiveTabId(tab.id)}
            className={`flex items-center justify-between py-2 px-3 rounded-t-md cursor-pointer min-w-[120px] max-w-[200px] transition-all duration-200 ease-in-out
                        ${activeTabId === tab.id 
                          ? 'bg-transparent text-slate-800 dark:text-slate-100'
                          : 'bg-transparent hover:bg-slate-300/30 dark:hover:bg-slate-700/30 text-slate-600 dark:text-slate-300'}`}
          >
            <span className="truncate text-xs mr-2">
              {tab.url.replace(/^https?:\/\//, '').split('/')[0] || 'New Tab'}
            </span>
            {tabs.length > 0 && ( // Show close button only if there's at least one tab (always true with current logic)
              <button 
                onClick={(e) => { e.stopPropagation(); handleCloseTab(tab.id); }}
                className={`p-0.5 rounded-full hover:bg-slate-400/50 dark:hover:bg-slate-500/50 
                            ${activeTabId === tab.id ? 'text-slate-600 dark:text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}
              >
                <Icon name="x" size={12} />
              </button>
            )}
          </div>
        ))}
        <button 
          onClick={handleAddNewTab}
          className="p-2 rounded-t-md hover:bg-slate-300/80 dark:hover:bg-slate-600/80 text-slate-600 dark:text-slate-300 flex-shrink-0 transition-colors duration-150"
          title="New Tab"
        >
          <Icon name="plus" size={14} />
        </button>
      </div>

      <div className="flex items-center p-2 space-x-2 bg-transparent">

        <button
          className="p-1.5 rounded-md hover:bg-slate-200/50 dark:hover:bg-slate-700/50 disabled:opacity-50"
          onClick={goBack}
          disabled={!activeTab || activeTab.currentHistoryIndex <= 0}
        >
          <Icon name="chevron-left" size={16} />
        </button>
        
        <button
          className="p-1.5 rounded-md hover:bg-slate-200/50 dark:hover:bg-slate-700/50 disabled:opacity-50"
          onClick={goForward}
          disabled={!activeTab || activeTab.currentHistoryIndex >= activeTab.history.length - 1}
        >
          <Icon name="chevron-right" size={16} />
        </button>
        
        <button
          className="p-1.5 rounded-md hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
          onClick={refresh}
        >
          <Icon name={activeTab?.isLoading ? 'x' : 'refresh-cw'} size={16} />
        </button>
        
        <div className="relative">
          <button
            ref={bookmarksButtonRef}
            className="p-1.5 rounded-md hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
            onClick={toggleBookmarksDropdown}
            title="Bookmarks"
          >
            <Icon name="bookmark" size={16} />
          </button>
          {showBookmarksDropdown && (
            <div 
              id="bookmarks-dropdown"
              className={`absolute top-full left-0 mt-1 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg z-10 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent scroll-smooth transition-opacity duration-300 ease-in-out ${showBookmarksDropdown ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
              {bookmarks.length === 0 ? null : (
                bookmarks.map(bookmark => (
                  <div key={bookmark.id} className="flex items-center justify-between p-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer group">
                    <span 
                      onClick={() => { activeTab && navigate(bookmark.url, activeTab.id); setShowBookmarksDropdown(false); }}
                      className="text-sm text-slate-700 dark:text-slate-200 truncate flex-1"
                      title={bookmark.url}
                    >
                      {bookmark.title}
                    </span>
                    <button 
                      onClick={() => removeBookmark(bookmark.id)}
                      className="p-0.5 rounded-full hover:bg-red-500/20 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all duration-150 ease-in-out group-hover:scale-110 ml-2"
                      title="Remove bookmark"
                    >
                      <Icon name="x" size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex-1">
          <div className="flex items-center bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md px-2">
            <Icon name="globe" size={14} className="text-slate-400 mr-1" />
            <input
              type="text"
              value={inputValue} // Bind to inputValue
              onChange={handleUrlChange}
              className="flex-1 py-1 px-1 bg-transparent outline-none text-sm"
              placeholder="Enter URL"
            />
            <button 
              type="button"
              onClick={addBookmark}
              className={`p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 mr-1 ${bookmarks.some(bm => bm.url === activeTab?.url) ? 'text-yellow-500' : 'text-slate-400 dark:text-slate-500'}`}
              title="Add to bookmarks"
              disabled={!activeTab || !activeTab.url}
            >
              <Icon name="star" size={14} />
            </button>
            <button type="submit">
              <Icon name="arrow-right" size={14} className="text-slate-400" />
            </button>
          </div>
        </form>
      </div>
      
      {/* Browser content - Render all iframes, hide inactive ones */}
      <div className="flex-1 bg-white dark:bg-slate-700 overflow-hidden rounded-b-lg relative">
        {tabs.map(tab => {
          const isActive = tab.id === activeTabId;
          return (
            <div key={tab.id} className={`w-full h-full ${isActive ? '' : 'hidden'}`}>
              {tab.isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent"></div>
                </div>
              ) : tab.error ? (
                <div className="h-full flex items-center justify-center text-center p-4">
                  <div>
                    <Icon name="alert-triangle" size={48} className="text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Unable to Load Page</h3>
                    <p className="text-slate-600 dark:text-slate-300">{tab.error}</p>
                  </div>
                </div>
              ) : (
                <iframe
                  // Use a unique ref for each iframe if direct manipulation is needed per tab
                  // For now, we rely on the src attribute and display toggling
                  src={tab.url || 'about:blank'}
                  className="w-full h-full border-0"
                  title={`Browser Frame - ${tab.id}`}
                  style={{ display: isActive ? 'block' : 'none' }} // Explicitly control display
                ></iframe>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Browser;