import { useEffect, useState } from 'react';
import Desktop from './components/Desktop';
import LockScreen from './components/ui/LockScreen'; // Import LockScreen
import { useSystemStore, initializeSystem } from './store/system'; // Import system store and initializer
import NotificationBanner from './components/notifications/NotificationBanner';
import NotificationCenter from './components/notifications/NotificationCenter';
import { useNotificationStore } from './store/notifications';

function App() {
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const notifications = useNotificationStore((state) => state.notifications);
  const { isLocked, lastActivityTime, lockScreen, updateActivityTime, settings } = useSystemStore();

  useEffect(() => {
    initializeSystem(); // Initialize system settings like dark mode
  }, []);

  useEffect(() => {
    const activityEvents = ['mousemove', 'keydown', 'mousedown', 'touchstart'];
    const resetTimer = () => {
      updateActivityTime();
    };

    activityEvents.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    const interval = setInterval(() => {
      if (!isLocked && settings.autoLockTimeout) {
        const timeSinceLastActivity = Date.now() - lastActivityTime;
        if (timeSinceLastActivity > settings.autoLockTimeout) {
          lockScreen();
        }
      }
    }, 60000); // Check every minute

    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
      clearInterval(interval);
    };
  }, [isLocked, lastActivityTime, lockScreen, updateActivityTime, settings.autoLockTimeout]);

  // Exposed function to toggle notification center, will be passed to Taskbar
  const toggleNotificationCenter = () => {
    setIsNotificationCenterOpen(prev => !prev);
  };

  return (
    <>
      {/* Pass toggleNotificationCenter to Desktop, which will pass it to Taskbar */}
      <Desktop toggleNotificationCenter={toggleNotificationCenter} /> 
      {isLocked && <LockScreen />}
      <div className="fixed top-16 right-4 z-50 flex flex-col space-y-2">
        {notifications.slice(0, 3).map((notification) => (
          <NotificationBanner key={notification.id} notification={notification} />
        ))}
      </div>
      <NotificationCenter isOpen={isNotificationCenterOpen} onClose={() => setIsNotificationCenterOpen(false)} />
    </>
  );
}

export default App;