import React from 'react';
import { Bell, X, Trash2 } from 'lucide-react';
import { useNotificationStore } from '../../store/notifications';
import { Notification } from '../../types';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationItem: React.FC<{ notification: Notification; onDismiss: (id: string) => void }> = ({ notification, onDismiss }) => {
  return (
    <div className="bg-neutral-700 p-3 rounded-md mb-2 last:mb-0">
      <div className="flex items-start">
        {notification.icon && (
          <img src={notification.icon} alt="icon" className="w-5 h-5 mr-2.5 rounded mt-0.5" />
        )}
        <div className="flex-grow">
          <h5 className="font-medium text-xs text-neutral-200">{notification.title}</h5>
          <p className="text-xs text-neutral-400 mt-0.5">{notification.message}</p>
        </div>
        <button onClick={() => onDismiss(notification.id)} className="ml-2 p-0.5 rounded-full hover:bg-neutral-600 text-neutral-400 hover:text-neutral-200">
          <X size={14} />
        </button>
      </div>
      <div className="text-xxs text-neutral-500 mt-1.5 flex justify-between items-center">
        <span>{new Date(notification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        {notification.actions && notification.actions.length > 0 && (
          <div className="flex space-x-1.5">
            {notification.actions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className="px-2 py-0.5 text-xxs bg-neutral-600 hover:bg-neutral-500 rounded"
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const notificationCenterRef = React.useRef<HTMLDivElement>(null);
  const { notifications, removeNotification, clearAllNotifications, markAllAsRead } = useNotificationStore();

  const unreadCount = notifications.filter(n => !n.read).length;

  React.useEffect(() => {
    if (isOpen) {
      // Mark all as read when opened, with a slight delay to allow animation
      setTimeout(() => {
        markAllAsRead();
      }, 300);
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (notificationCenterRef.current && !notificationCenterRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleMouseLeave = () => {
      onClose(); 
    };

    let leaveTimeout: NodeJS.Timeout;

    const debouncedMouseLeave = () => {
      clearTimeout(leaveTimeout);
      leaveTimeout = setTimeout(handleMouseLeave, 300); // 300ms debounce
    };

    const handleMouseEnter = () => {
      clearTimeout(leaveTimeout); // Clear timeout if mouse re-enters
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      notificationCenterRef.current?.addEventListener('mouseleave', debouncedMouseLeave);
      notificationCenterRef.current?.addEventListener('mouseenter', handleMouseEnter);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      notificationCenterRef.current?.removeEventListener('mouseleave', debouncedMouseLeave);
      notificationCenterRef.current?.removeEventListener('mouseenter', handleMouseEnter);
      clearTimeout(leaveTimeout); // Clear timeout on unmount
    };
  }, [isOpen, onClose, markAllAsRead]);

  return (
    <div
      ref={notificationCenterRef}
      className={`
        fixed top-0 right-0 h-[calc(100%-3rem)] /* Adjusted for a small gap above h-10 taskbar */ 
        bg-neutral-800 bg-opacity-70 backdrop-blur-xl shadow-2xl 
        text-white transition-transform duration-300 ease-in-out z-40
        w-[320px] /* Slightly reduced width */ flex flex-col rounded-l-lg /* Added rounded corners */
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}
    >
      <div className="flex items-center justify-between p-4 border-b border-neutral-700">
        <h3 className="font-semibold text-base">Notifications</h3>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-neutral-700">
          <X size={20} />
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="flex-grow flex flex-col items-center justify-center text-neutral-500 p-4">
          <Bell size={48} className="mb-3" />
          <p className="text-sm">No new notifications</p>
        </div>
      ) : (
        <div className="flex-grow overflow-y-auto p-4 space-y-1">
          {notifications.slice().reverse().map((notification) => (
            <NotificationItem key={notification.id} notification={notification} onDismiss={removeNotification} />
          ))}
        </div>
      )}

      {notifications.length > 0 && (
        <div className="p-3 border-t border-neutral-700">
          <button 
            onClick={clearAllNotifications}
            className="w-full flex items-center justify-center px-3 py-2 text-xs bg-red-700 hover:bg-red-600 rounded text-white transition-colors"
          >
            <Trash2 size={14} className="mr-1.5" /> Clear All Notifications
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;