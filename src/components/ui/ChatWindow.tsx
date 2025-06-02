import React, { useState, useRef, useEffect, useCallback } from 'react';
import nlp from 'compromise';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from './Icon'; // Assuming Icon component is in the same directory or adjust path
import { useAppsStore } from '../../store/apps';
import { useWindowsStore } from '../../store/windows';
import { useFileSystemStore } from '../../store/filesystem';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type?: 'text' | 'tool_call' | 'tool_response';
  toolCallInfo?: {
    toolName: string;
    args: Record<string, any>;
    status?: 'pending' | 'success' | 'error';
    result?: any;
  };
}

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
}

const initialMessage: Message = {
  id: 'initial-ai-message',
  text: "Hello. I'm Oria, your personal assistant.  How can I assist you today?",
  sender: 'ai',
  timestamp: new Date(),
  type: 'text',
};

const ChatWindow: React.FC<ChatWindowProps> = ({ isOpen, onClose }) => {
  const prevIsOpenRef = useRef<boolean>();
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [inputText, setInputText] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    // Only reset if the window was open and is now closing
    if (prevIsOpenRef.current === true && isOpen === false) {
      setMessages([{
        ...initialMessage,
        timestamp: new Date() // Update timestamp for the new initial message
      }]);
      setInputText('');
    }
    // Update the ref to the current isOpen state for the next render
    prevIsOpenRef.current = isOpen;
  }, [isOpen]); // Rerun when isOpen changes

  const processUserMessage = useCallback(async (userMessageText: string) => {
    setIsAiTyping(true);
    // Simulate network delay and AI processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    let aiResponseText = "I'm not sure how to respond to that yet. Could you try rephrasing?";
    let toolCallInfo: Message['toolCallInfo'] | undefined = undefined;

    const doc = nlp(userMessageText);

    // Enhanced command parsing with compromise
    const openVerb = doc.verbs().if('open');
    if (openVerb.found) {
      // Try to find a noun phrase following "open"
      let appName = '';
      const potentialAppName = openVerb.parent().matchAfter('#Noun+ (#Noun+)?').nouns().out('text');
      
      if (potentialAppName) {
        appName = potentialAppName.trim();
      } else {
        // Fallback: if no clear noun phrase after 'open', check nouns in the whole sentence
        const nounsInSentence = doc.match('#Noun+').nouns().out('array') as string[];
        // A simple heuristic: pick the first noun that isn't 'app' or 'application' if 'open' is present
        // This is very basic and can be improved significantly
        if (nounsInSentence.length > 0) {
          const filteredNouns = nounsInSentence.filter(n => n.toLowerCase() !== 'app' && n.toLowerCase() !== 'application');
          if (filteredNouns.length > 0) {
            // Attempt to join compound nouns like 'text editor'
            const openIndex = userMessageText.toLowerCase().indexOf('open');
            if (openIndex !== -1) {
                const textAfterOpen = userMessageText.substring(openIndex + 'open'.length).trim();
                const appNameMatch = nlp(textAfterOpen).match('#Noun+ (#Noun+)?').first().out('text');
                if (appNameMatch) appName = appNameMatch;
            }
            if (!appName && filteredNouns.length > 0) appName = filteredNouns[0]; // Default to first if specific match fails
          }
        }
      }

      if (appName) {
        const { apps } = useAppsStore.getState();
        const appToOpen = apps.find(app => 
          app.name.toLowerCase() === appName.toLowerCase() || 
          app.id.toLowerCase() === appName.toLowerCase()
        );

        if (appToOpen) {
          useWindowsStore.getState().openWindow(appToOpen.name, appToOpen.icon, appToOpen.component);
          aiResponseText = `Opening ${appToOpen.name}...`;
          toolCallInfo = { toolName: 'openApp', args: { appName: appToOpen.name }, status: 'success' };
        } else {
          aiResponseText = `Sorry, I couldn't find an app called "${appName}". You can ask me to open apps like Files, Terminal, Settings, Browser, or Text Editor.`;
          // No tool call if app not found, or mark as error
          toolCallInfo = { toolName: 'openApp', args: { appName }, status: 'error', result: 'App not found' };
        }
      } else {
        aiResponseText = "It looks like you want to open something, but I couldn't figure out what. Please specify the application name.";
      }
    } else if (doc.has('(hello|hi|hey|greetings)')) {
      aiResponseText = "Hello there! How can I help you today?";
    } else if (doc.has('(how are you|how\'s it going)')) {
      aiResponseText = "I'm doing well, thank you for asking! Ready to assist.";
    } else if (doc.has('(help|what can you do|commands|capabilities)')) {
      aiResponseText = `I can help you with several things! Try asking me to:
- Open applications (e.g., "Open Text Editor", "Launch Browser")
- Tell you a joke (e.g., "Tell me a joke")
- Get the current date and time (e.g., "What time is it?")
- Perform basic calculations (e.g., "What is 5 plus 3?")
- Manage windows (e.g., "Minimize Text Editor", "Close Browser", "Minimize all windows")
- Interact with the file system (e.g., "List files", "Create file mydoc.txt", "Create folder Projects")
- Get the weather forecast (e.g., "What's the weather in London?")
- Look up word definitions (e.g., "Define ubiquitous", "What does ephemeral mean?")
- Get country information (e.g., "Info on France", "Tell me about Brazil")
- Or just chat! (e.g., "Hello", "How are you?")`;
    } else if (doc.has('(date|time|current time|today)')) {
      aiResponseText = `The current date and time is: ${new Date().toLocaleString()}`;
    } else if (doc.has('#Value #Verb #Value') || doc.has('#Value (plus|minus|times|divided by|add|subtract|multiply|divide) #Value')) {
      // Basic calculation: look for "number operation number" patterns
      // This is a very simplified approach and can be significantly improved
      const terms = doc.terms().out('array') as string[];
      let result: number | string = 'Could not calculate.';
      if (terms.length >= 3) {
        const num1 = parseFloat(terms[0]);
        const operator = terms[1].toLowerCase();
        const num2 = parseFloat(terms[2]);

        if (!isNaN(num1) && !isNaN(num2)) {
          switch (operator) {
            case 'plus':
            case '+':
            case 'add':
              result = num1 + num2;
              break;
            case 'minus':
            case '-':
            case 'subtract':
              result = num1 - num2;
              break;
            case 'times':
            case '*':
            case 'multiply':
              result = num1 * num2;
              break;
            case 'divided by':
            case '/':
            case 'divide':
              result = num2 !== 0 ? num1 / num2 : 'Cannot divide by zero.';
              break;
            default:
              // Check if the verb itself is an operator if compromise parsed it as such
              const verbAsOp = doc.verbs().first().text().toLowerCase();
              if (['add', 'subtract', 'multiply', 'divide'].includes(verbAsOp)) {
                 // This part needs more robust parsing to extract numbers around the verb
                 // For now, we'll assume the initial parsing was better if it got here.
              }
              break;
          }
        }
      }
      aiResponseText = `The result is: ${result}`;
    } else if (doc.has('(weather|forecast) (in|for) #Noun+')) {
      const locationName = doc.match('(in|for) #Noun+').nouns().out('text');
      if (locationName) {
        try {
          // Geocode location to get latitude and longitude
          const geocodeUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationName)}&format=json&limit=1`;
          const geoResponse = await fetch(geocodeUrl);
          const geoData = await geoResponse.json();

          if (geoData && geoData.length > 0) {
            const { lat, lon } = geoData[0];
            
            // Fetch weather data from Open-Meteo
            const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,apparent_temperature,precipitation_probability,weathercode,windspeed_10m&daily=weathercode,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum,precipitation_probability_max&timezone=auto`;
            const weatherResponse = await fetch(weatherUrl);
            const weatherData = await weatherResponse.json();

            if (weatherData && weatherData.current_weather) {
              const temp = weatherData.current_weather.temperature;
              const wind = weatherData.current_weather.windspeed;
              // A simple interpretation of weather codes (can be expanded)
              const weatherDesc = weatherData.current_weather.weathercode <= 3 ? 'Clear to partly cloudy' : 'Cloudy or rainy'; 
              aiResponseText = `The current weather in ${locationName} is ${temp}°C, with winds at ${wind} km/h. Conditions: ${weatherDesc}.`;
            } else {
              aiResponseText = `Sorry, I couldn't fetch the weather for ${locationName}.`;
            }
          } else {
            aiResponseText = `Sorry, I couldn't find coordinates for ${locationName}.`;
          }
        } catch (error) {
          console.error("Weather API error:", error);
          aiResponseText = "Sorry, I encountered an error trying to get the weather.";
        }
      }
    } else if (
      doc.has('^define') ||
      doc.has('^definition of') ||
      doc.has('^thesaurus for') ||
      doc.has('^what does') || 
      doc.has('^what is (a|an)')
    ) {
      let wordToDefine = '';
      const text = doc.text(); // Get the full text of the user's message

      let match;
      // Order of matching matters: more specific or complex patterns first.
      // Regexes now handle optional trailing question marks.
      if ((match = text.match(/^what is\s+(?:a|an)\s+([^?]+)\??$/i))) { // e.g., "what is a cat?", "what is an apple"
        wordToDefine = match[1].trim();
      } else if ((match = text.match(/^what does\s+(.+?)\s+mean\??$/i))) { // e.g., "what does cat mean?", "what does eloquent mean"
        wordToDefine = match[1].trim();
      } else if ((match = text.match(/^define\s+(.+)\??$/i))) { // e.g., "define cat?", "define awesome"
        wordToDefine = match[1].trim();
      } else if ((match = text.match(/^definition of\s+(.+)\??$/i))) { // e.g., "definition of cat?"
        wordToDefine = match[1].trim();
      } else if ((match = text.match(/^thesaurus for\s+(.+)\??$/i))) { // e.g., "thesaurus for cat?"
        wordToDefine = match[1].trim();
      }

      if (wordToDefine) {
        // Step 1: Remove "the word " if it's at the beginning. Case-insensitive.
        if (wordToDefine.toLowerCase().startsWith('the word ')) {
          wordToDefine = wordToDefine.substring(9).trim(); // "the word ".length is 9
        }
        // Step 2: Remove common leading articles/possessives IF FOLLOWED BY A SPACE.
        // This helps avoid stripping parts of the word if the word itself is an article (e.g. defining "a")
        wordToDefine = wordToDefine.replace(/^(the|a|an|my|your|his|her|its|our|their)\s+/i, '').trim();
      }
      if (wordToDefine) {
        try {
          const dictionaryUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${wordToDefine}`;
          const response = await fetch(dictionaryUrl);
          const data = await response.json();

          if (response.ok && data && data.length > 0 && data[0].meanings && data[0].meanings.length > 0) {
            const firstMeaning = data[0].meanings[0];
            const partOfSpeech = firstMeaning.partOfSpeech;
            const definition = firstMeaning.definitions[0]?.definition || 'No definition found.';
            let synonyms = '';
            if (firstMeaning.synonyms && firstMeaning.synonyms.length > 0) {
              synonyms = ` Synonyms: ${firstMeaning.synonyms.slice(0, 3).join(', ')}.`;
            }
            aiResponseText = `Definition of ${wordToDefine} (${partOfSpeech}): ${definition}${synonyms}`;
          } else if (data.title === "No Definitions Found") {
            aiResponseText = `Sorry, I couldn't find a definition for "${wordToDefine}". Please check the spelling or try another word.`;
          } else {
            aiResponseText = `Sorry, I couldn't fetch the definition for "${wordToDefine}".`;
          }
        } catch (error) {
          console.error("Dictionary API error:", error);
          aiResponseText = "Sorry, I encountered an error trying to get the definition.";
        }
      } else {
        aiResponseText = "Please specify a word to define.";
      }
    } else if (doc.has('(what is|what\'s) the capital of #Place')) {
      const countryNameForCapital = doc.match('capital of #Place+').places().out('text');
      if (countryNameForCapital) {
        try {
          const countryUrl = `https://restcountries.com/v3.1/name/${encodeURIComponent(countryNameForCapital)}?fields=name,capital&fullText=true`;
          const response = await fetch(countryUrl);
          const data = await response.json();
          if (response.ok && data && data.length > 0 && data[0].capital) {
            aiResponseText = `The capital of ${data[0].name.common} is ${data[0].capital[0]}.`;
          } else {
            aiResponseText = `Sorry, I couldn't find the capital for "${countryNameForCapital}".`;
          }
        } catch (error) {
          console.error("Country API error (capital lookup):", error);
          aiResponseText = "Sorry, I encountered an error trying to find the capital.";
        }
      } else {
        aiResponseText = "Please specify a country to find its capital.";
      }
    } else if (doc.has('(info on|information about|tell me about) #Place')) {
      // More specific match for country information, using #Place
      const countryName = doc.match('(info on|information about|tell me about) #Place+').places().out('text');
      if (countryName) {
        try {
          const countryUrl = `https://restcountries.com/v3.1/name/${encodeURIComponent(countryName)}?fullText=true`;
          const response = await fetch(countryUrl);
          const data = await response.json();

          if (response.ok && data && data.length > 0) {
            const country = data[0];
            const name = country.name.common;
            const capital = country.capital ? country.capital[0] : 'N/A';
            const region = country.region;
            const population = country.population ? country.population.toLocaleString() : 'N/A';
            const languages = country.languages ? Object.values(country.languages).join(', ') : 'N/A';
            aiResponseText = `Here's some information about ${name}:\nCapital: ${capital}\nRegion: ${region}\nPopulation: ${population}\nLanguages: ${languages}`;
          } else {
            aiResponseText = `Sorry, I couldn't find information for "${countryName}". Please check the name or try another country.`;
          }
        } catch (error) {
          console.error("Country API error:", error);
          aiResponseText = "Sorry, I encountered an error trying to get country information.";
        }
      } else {
        aiResponseText = "Please specify a country to get information about.";
      }
    } else if (doc.has('(list files|show files|ls)')) {
      const { currentDirectory, listDirectory } = useFileSystemStore.getState();
      try {
        const items = await listDirectory(currentDirectory);
        if (items.length === 0) {
          aiResponseText = `The directory "${currentDirectory}" is empty.`;
        } else {
          aiResponseText = `Files and folders in "${currentDirectory}":\n${items.map(item => `- ${item.name}${item.isDirectory ? '/' : ''}`).join('\n')}`;
        }
        toolCallInfo = { toolName: 'listFiles', args: { path: currentDirectory }, status: 'success' };
      } catch (error: any) {
        aiResponseText = `Error listing files: ${error.message || 'Unknown error'}`;
        toolCallInfo = { toolName: 'listFiles', args: { path: currentDirectory }, status: 'error', result: error.message };
      }
    } else if (doc.has('(minimize|close) #Noun+')) {
      const action = doc.verbs().first().text();
      const windowName = doc.matchAfter(action).nouns().out('text');
      const { windows, minimizeWindow, closeWindow, activateWindow } = useWindowsStore.getState();
      const targetWindow = windows.find(w => w.title.toLowerCase() === windowName.toLowerCase());

      if (targetWindow) {
        if (action === 'minimize') {
          minimizeWindow(targetWindow.id);
          aiResponseText = `Minimizing ${targetWindow.title}.`;
          toolCallInfo = { toolName: 'minimizeWindow', args: { windowName: targetWindow.title }, status: 'success' };
        } else if (action === 'close') {
          closeWindow(targetWindow.id);
          aiResponseText = `Closing ${targetWindow.title}.`;
          toolCallInfo = { toolName: 'closeWindow', args: { windowName: targetWindow.title }, status: 'success' };
        }
      } else {
        aiResponseText = `Sorry, I couldn't find a window named "${windowName}" to ${action}.`;
        toolCallInfo = { toolName: action === 'minimize' ? 'minimizeWindow' : 'closeWindow', args: { windowName }, status: 'error', result: 'Window not found' };
      }
    } else if (doc.has('(minimize|close) all windows')) {
        const action = doc.verbs().first().text();
        const { minimizeAllWindows, windows, closeWindow } = useWindowsStore.getState();
        if (action === 'minimize') {
            minimizeAllWindows();
            aiResponseText = 'Minimizing all windows.';
            toolCallInfo = { toolName: 'minimizeAllWindows', args: {}, status: 'success' };
        } else if (action === 'close') {
            windows.forEach(w => closeWindow(w.id));
            aiResponseText = 'Closing all windows.';
            toolCallInfo = { toolName: 'closeAllWindows', args: {}, status: 'success' };
        }
    } else if (doc.has('(list files|list directory|show files|ls)')) {
      const { items, currentPath } = useFileSystemStore.getState();
      if (items.length > 0) {
        const fileList = items.map(item => `${item.name}${item.type === 'directory' ? '/' : ''}`).join('\n');
        aiResponseText = `Contents of ${currentPath}:\n${fileList}`;
      } else {
        aiResponseText = `The directory ${currentPath} is empty.`;
      }
      toolCallInfo = { toolName: 'listFiles', args: { path: currentPath }, status: 'success' };
    } else if (doc.has('(create file|new file|touch) #Noun+')) {
      const fileName = doc.matchAfter('(create file|new file|touch)').nouns().out('text');
      if (fileName) {
        try {
          await useFileSystemStore.getState().createFile(fileName);
          aiResponseText = `File "${fileName}" created in ${useFileSystemStore.getState().currentPath}.`;
          toolCallInfo = { toolName: 'createFile', args: { fileName }, status: 'success' };
        } catch (error: any) {
          aiResponseText = `Error creating file: ${error.message}`;
          toolCallInfo = { toolName: 'createFile', args: { fileName }, status: 'error', result: error.message };
        }
      } else {
        aiResponseText = "Please specify a name for the file.";
      }
    } else if (doc.has('(create directory|new folder|mkdir) #Noun+')) {
      const dirName = doc.matchAfter('(create directory|new folder|mkdir)').nouns().out('text');
      if (dirName) {
        try {
          await useFileSystemStore.getState().createDirectory(dirName);
          aiResponseText = `Directory "${dirName}" created in ${useFileSystemStore.getState().currentPath}.`;
          toolCallInfo = { toolName: 'createDirectory', args: { dirName }, status: 'success' };
        } catch (error: any) {
          aiResponseText = `Error creating directory: ${error.message}`;
          toolCallInfo = { toolName: 'createDirectory', args: { dirName }, status: 'error', result: error.message };
        }
      } else {
        aiResponseText = "Please specify a name for the directory.";
      }
    } else if (doc.has('(tell me a joke|joke)')) {
      const jokes = [
        "Why don't scientists trust atoms? Because they make up everything!",
        "Why did the scarecrow win an award? Because he was outstanding in his field!",
        "What do you call fake spaghetti? An impasta!"
      ];
      aiResponseText = jokes[Math.floor(Math.random() * jokes.length)];
    }

    const aiMessage: Message = {
      id: `ai-${Date.now()}`,
      text: aiResponseText,
      sender: 'ai',
      timestamp: new Date(),
      type: toolCallInfo ? 'tool_response' : 'text',
      toolCallInfo,
    };

    setMessages((prevMessages) => [...prevMessages, aiMessage]);
    setIsAiTyping(false);
  }, []);

  const handleSendMessage = useCallback(() => {
    if (inputText.trim() === '') return;

    const newUserMessage: Message = {
      id: `user-${Date.now()}`,
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
      type: 'text',
    };
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setInputText('');
    processUserMessage(inputText);
  }, [inputText, processUserMessage]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="fixed bottom-16 right-4 w-96 h-[500px] bg-white/10 dark:bg-slate-800/10 backdrop-blur-xl shadow-2xl rounded-xl flex flex-col overflow-hidden border border-white/20 dark:border-slate-700/20 z-50"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-white/10 dark:border-slate-700/10 bg-white/5 dark:bg-slate-900/5">
            <div className="flex items-center">
              <Icon name="Sparkles" size={20} className="mr-2 text-primary-500" />
              <h2 className="text-md font-semibold text-slate-800 dark:text-slate-200">Oria</h2>
            </div>
            <button
              onClick={onClose} // useEffect now handles state reset
              className="p-1 rounded-full hover:bg-slate-200/20 dark:hover:bg-slate-600/20 text-slate-600 dark:text-slate-400"
              title="Close Chat"
            >
              <Icon name="X" size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-grow p-4 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-slate-400 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] p-2.5 rounded-lg shadow ${msg.sender === 'user'
                      ? 'bg-primary-500 text-white rounded-br-none'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none'
                    }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                  {msg.toolCallInfo && (
                    <div className="mt-1.5 pt-1.5 border-t border-slate-300/50 dark:border-slate-600/50 text-xs">
                      <p><strong>Tool:</strong> {msg.toolCallInfo.toolName}</p>
                      <p><strong>Status:</strong> <span className={msg.toolCallInfo.status === 'success' ? 'text-green-400' : 'text-yellow-400'}>{msg.toolCallInfo.status}</span></p>
                    </div>
                  )}
                  <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-primary-200 text-right' : 'text-slate-500 dark:text-slate-400 text-left'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {isAiTyping && (
                <div className="flex justify-start">
                    <div className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 p-2.5 rounded-lg shadow rounded-bl-none max-w-[75%]">
                        <div className="flex items-center space-x-1.5">
                            <div className="w-1.5 h-1.5 bg-slate-500 dark:bg-slate-400 rounded-full animate-pulse delay-0"></div>
                            <div className="w-1.5 h-1.5 bg-slate-500 dark:bg-slate-400 rounded-full animate-pulse delay-200"></div>
                            <div className="w-1.5 h-1.5 bg-slate-500 dark:bg-slate-400 rounded-full animate-pulse delay-400"></div>
                        </div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-white/10 dark:border-slate-700/10 bg-white/5 dark:bg-slate-900/5">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isAiTyping && handleSendMessage()}
                placeholder={isAiTyping ? "AI is typing..." : "Type your message..."}
                className="flex-grow p-2.5 border border-slate-300/30 dark:border-slate-600/30 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                disabled={isAiTyping}
              />
              <button
                onClick={handleSendMessage}
                className="p-2.5 bg-primary-500/80 text-white rounded-lg hover:bg-primary-600/80 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!inputText.trim() || isAiTyping}
                title="Send Message"
              >
                <Icon name="Send" size={20} />
              </button>
              <button
                className="p-2.5 bg-slate-200/50 dark:bg-slate-600/50 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300/50 dark:hover:bg-slate-500/50 focus:ring-2 focus:ring-slate-400 focus:ring-opacity-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Use Microphone (coming soon)"
                disabled // Speech input not implemented yet
              >
                <Icon name="Mic" size={20} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatWindow;