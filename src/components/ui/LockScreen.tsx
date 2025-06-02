import React, { useState, useEffect } from 'react';
import { useSystemStore } from '../../store/system';

// SVG Icons
const UserAvatarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={`w-24 h-24 text-white/70 ${className || ''}`} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
  </svg>
);

const SleepIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={`w-6 h-6 ${className || ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
  </svg>
);

const RestartIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={`w-6 h-6 ${className || ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2.086a8.001 8.001 0 00-15.356-2.086m0 0A8.001 8.001 0 0020 12H4"></path>
  </svg>
);

const PowerIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={`w-6 h-6 ${className || ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.636 5.636a9 9 0 1012.728 0M12 3v9"></path>
  </svg>
);

const LockScreen: React.FC = () => {
  const { unlockScreen } = useSystemStore();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  const handleUnlock = () => {
    setIsExiting(true);
  };

  useEffect(() => {
    if (isExiting) {
      const timer = setTimeout(() => {
        unlockScreen();
      }, 500); // Corresponds to animation duration
      return () => clearTimeout(timer);
    }
  }, [isExiting, unlockScreen]);

  const userName = "Local User";
  const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const formattedDate = currentTime.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div 
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-between pt-12 pb-16 transition-all duration-500 ease-in-out ${isExiting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
      style={{
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
      }}
    >
      {/* Date and Time at the top */}
      <div className="text-center">
        <h1 className="text-5xl font-semibold text-white tracking-tight mb-1">{formattedTime}</h1>
        <p className="text-lg text-white/80">{formattedDate}</p>
      </div>

      {/* Main login content area */}
      <div className="flex flex-col items-center mt-[-4rem]"> {/* Adjusted margin to pull it up slightly after adding time/date */}
        <UserAvatarIcon className="mb-3 shadow-lg" />
        <p className="text-white text-xl font-medium mb-5 tracking-wide">{userName}</p>
        
        <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1 w-64 shadow">
          <input 
            type="password" 
            placeholder="Enter Password" 
            readOnly
            onClick={handleUnlock}
            onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
            className="bg-transparent placeholder-white/60 text-white text-sm py-2 flex-grow focus:outline-none text-center tracking-wider"
          />
        </div>
      </div>

      {/* System Controls at the bottom */}
      <div className="flex justify-center space-x-10">
        <button className="flex flex-col items-center text-white/70 hover:text-white transition-colors">
          <SleepIcon className="mb-1 w-7 h-7" />
          <span className="text-xs">Sleep</span>
        </button>
        <button className="flex flex-col items-center text-white/70 hover:text-white transition-colors">
          <RestartIcon className="mb-1 w-7 h-7" />
          <span className="text-xs">Restart</span>
        </button>
        <button className="flex flex-col items-center text-white/70 hover:text-white transition-colors">
          <PowerIcon className="mb-1 w-7 h-7" />
          <span className="text-xs">Shut Down</span>
        </button>
      </div>
    </div>
  );
};

export default LockScreen;