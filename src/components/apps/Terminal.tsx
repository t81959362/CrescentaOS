import React, { useState, useRef, useEffect } from 'react';
import { useFileSystemStore } from '../../store/filesystem';

interface TerminalProps {
  windowId: string;
}

interface TerminalHistory {
  command: string;
  output: string;
  isError?: boolean;
}

const Terminal: React.FC<TerminalProps> = ({ windowId }) => {
  const { currentPath, loadDirectory, items, createFile, createDirectory, deleteItem } = useFileSystemStore();
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<TerminalHistory[]>([
    { command: '', output: 'CrescentaOS Terminal v1.0.0\nType "help" to see available commands.' }
  ]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Scroll to bottom when history changes
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);
  
  // Focus the input field when clicking anywhere in the terminal
  const handleTerminalClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      navigateCommandHistory(-1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      navigateCommandHistory(1);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      autocompleteCommand();
    }
  };
  
  const navigateCommandHistory = (direction: number) => {
    if (commandHistory.length === 0) return;
    
    const newIndex = historyIndex + direction;
    
    if (newIndex >= commandHistory.length) {
      setHistoryIndex(-1);
      setInput('');
    } else if (newIndex >= 0) {
      setHistoryIndex(newIndex);
      setInput(commandHistory[newIndex]);
    }
  };
  
  const autocompleteCommand = () => {
    if (!input) return;
    
    const [command, ...args] = input.split(' ');
    
    // Command completion
    if (!args.length) {
      const commands = ['cd', 'ls', 'mkdir', 'touch', 'rm', 'cat', 'echo', 'clear', 'pwd', 'help', 'date', 'whoami', 'hostname'];
      const matchingCommands = commands.filter(cmd => cmd.startsWith(command));
      
      if (matchingCommands.length === 1) {
        setInput(matchingCommands[0]);
      }
      return;
    }
    
    // Path completion for file/directory commands
    if (['cd', 'ls', 'rm', 'cat'].includes(command)) {
      const path = args[args.length - 1];
      
      if (!path) return;
      
      const matchingItems = items.filter(item => 
        item.name.startsWith(path)
      );
      
      if (matchingItems.length === 1) {
        const newArgs = [...args];
        newArgs[newArgs.length - 1] = matchingItems[0].name;
        setInput(`${command} ${newArgs.join(' ')}`);
      }
    }
  };
  
  const executeCommand = () => {
    if (!input.trim()) return;
    
    // Add command to history
    const newCommandHistory = [input, ...commandHistory].slice(0, 20);
    setCommandHistory(newCommandHistory);
    setHistoryIndex(-1);
    
    // Process command
    const [command, ...args] = input.split(' ');
    let output = '';
    let isError = false;
    
    switch (command.toLowerCase()) {
      case 'help':
        output = 'Available commands:\n' +
          '  cd [path] - Change directory\n' +
          '  ls - List files and directories\n' +
          '  pwd - Print working directory\n' +
          '  mkdir [name] - Create a directory\n' +
          '  touch [name] - Create an empty file\n' +
          '  rm [name] - Remove a file or directory\n' +
          '  cat [file] - Display file contents\n' +
          '  echo [text] > [file] - Write text to a file\n' +
          '  clear - Clear the terminal\n' +
          '  date - Display the current date and time\n' +
          '  whoami - Display the current user\n' +
          '  hostname - Display the system hostname';
        break;
        
      case 'cd':
        if (args.length === 0) {
          loadDirectory('/');
        } else {
          const path = args[0];
          
          if (path === '..') {
            // Go up one directory
            if (currentPath !== '/') {
              const parts = currentPath.split('/').filter(Boolean);
              parts.pop();
              const parentPath = parts.length === 0 ? '/' : '/' + parts.join('/');
              loadDirectory(parentPath);
            }
          } else if (path.startsWith('/')) {
            // Absolute path
            loadDirectory(path);
          } else {
            // Relative path
            const targetItem = items.find(
              item => item.type === 'directory' && item.name === path
            );
            
            if (targetItem) {
              loadDirectory(targetItem.path);
            } else {
              output = `cd: ${path}: No such directory`;
              isError = true;
            }
          }
        }
        break;
        
      case 'ls':
        output = items.map(item => {
          if (item.type === 'directory') {
            return `\x1b[34m${item.name}/\x1b[0m`;
          } else {
            return item.name;
          }
        }).join('\n');
        
        if (items.length === 0) {
          output = 'Directory is empty';
        }
        break;
        
      case 'pwd':
        output = currentPath;
        break;
        
      case 'mkdir':
        if (args.length === 0) {
          output = 'mkdir: missing operand';
          isError = true;
        } else {
          try {
            createDirectory(args[0]);
            output = `Directory created: ${args[0]}`;
          } catch (error) {
            output = error instanceof Error ? error.message : 'An error occurred';
            isError = true;
          }
        }
        break;
        
      case 'touch':
        if (args.length === 0) {
          output = 'touch: missing file operand';
          isError = true;
        } else {
          try {
            createFile(args[0]);
            output = `File created: ${args[0]}`;
          } catch (error) {
            output = error instanceof Error ? error.message : 'An error occurred';
            isError = true;
          }
        }
        break;
        
      case 'rm':
        if (args.length === 0) {
          output = 'rm: missing operand';
          isError = true;
        } else {
          const item = items.find(item => item.name === args[0]);
          if (item) {
            try {
              deleteItem(item.id);
              output = `Removed: ${args[0]}`;
            } catch (error) {
              output = error instanceof Error ? error.message : 'An error occurred';
              isError = true;
            }
          } else {
            output = `rm: cannot remove '${args[0]}': No such file or directory`;
            isError = true;
          }
        }
        break;
        
      case 'cat':
        if (args.length === 0) {
          output = 'cat: missing file operand';
          isError = true;
        } else {
          const file = items.find(
            item => item.type === 'file' && item.name === args[0]
          );
          
          if (file) {
            output = file.content || '';
          } else {
            output = `cat: ${args[0]}: No such file`;
            isError = true;
          }
        }
        break;
        
      case 'echo':
        if (args.length >= 3 && args[args.length - 2] === '>') {
          // Write to file
          const fileName = args[args.length - 1];
          const content = args.slice(0, args.length - 2).join(' ');
          const file = items.find(
            item => item.type === 'file' && item.name === fileName
          );
          
          if (file) {
            try {
              // TODO: Update file content
              output = `Content written to ${fileName}`;
            } catch (error) {
              output = error instanceof Error ? error.message : 'An error occurred';
              isError = true;
            }
          } else {
            try {
              createFile(fileName, content);
              output = `File created: ${fileName}`;
            } catch (error) {
              output = error instanceof Error ? error.message : 'An error occurred';
              isError = true;
            }
          }
        } else {
          // Echo to terminal
          output = args.join(' ');
        }
        break;
        
      case 'clear':
        setHistory([]);
        setInput('');
        return;

      case 'date':
        output = new Date().toString();
        break;

      case 'whoami':
        output = 'user'; // Placeholder, can be made dynamic later
        break;

      case 'hostname':
        output = 'CrescentaOS'; // Placeholder, can be made dynamic later
        break;
        
      default:
        output = `${command}: command not found`;
        isError = true;
    }
    
    // Add output to terminal history
    setHistory([...history, { command: input, output, isError }]);
    setInput('');
  };
  
  // Function to format terminal output with ANSI color codes
  const formatOutput = (text: string) => {
    // Convert ANSI color codes to spans with classes
    return text
      .replace(/\x1b\[34m(.*?)\x1b\[0m/g, '<span class="text-blue-500">$1</span>')
      .replace(/\x1b\[31m(.*?)\x1b\[0m/g, '<span class="text-red-500">$1</span>')
      .replace(/\x1b\[32m(.*?)\x1b\[0m/g, '<span class="text-green-500">$1</span>')
      .replace(/\x1b\[33m(.*?)\x1b\[0m/g, '<span class="text-yellow-500">$1</span>');
  };
  
  return (
    <div 
      className="h-full flex flex-col bg-black text-green-400 font-mono text-sm rounded-md overflow-hidden"
      onClick={handleTerminalClick}
    >
      <div 
        ref={terminalRef}
        className="flex-1 p-2 overflow-y-auto"
      >
        {history.map((entry, index) => (
          <div key={index} className="mb-1">
            {entry.command && (
              <div className="flex">
                <span className="text-blue-400 mr-1">crescentaos@user:~{currentPath}$</span>
                <span>{entry.command}</span>
              </div>
            )}
            <div 
              className={`whitespace-pre-wrap ${entry.isError ? 'text-red-400' : ''}`}
              dangerouslySetInnerHTML={{ __html: formatOutput(entry.output) }}
            />
          </div>
        ))}
        
        <div className="flex">
          <span className="text-blue-400 mr-1">crescentaos@user:~{currentPath}$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none"
            autoFocus
          />
        </div>
      </div>
    </div>
  );
};

export default Terminal;