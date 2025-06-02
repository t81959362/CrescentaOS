import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Notification } from '../../types';
import { useNotificationStore } from '../../store/notifications';

interface NotificationBannerProps {
  notification: Notification;
}

const NotificationBanner: React.FC<NotificationBannerProps> = ({ notification }) => {
  const [isVisible, setIsVisible] = useState(true);
  const removeNotification = useNotificationStore((state) => state.removeNotification);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => removeNotification(notification.id), 300); // Remove after fade out
    }, 5000); // Auto-dismiss after 5 seconds

    return () => clearTimeout(timer);
  }, [notification.id, removeNotification]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => removeNotification(notification.id), 300); // Remove after fade out
  };

  return (
    <div
      className={`
        bg-neutral-800 bg-opacity-80 backdrop-blur-md text-white p-4 rounded-lg shadow-lg 
        w-80 fixed top-16 right-4 z-50 transition-all duration-300 ease-in-out
        ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}
      `}
    >
      <div className="flex items-start">
        {notification.icon && (
          <img src={notification.icon} alt="icon" className="w-6 h-6 mr-3 rounded" />
        )}
        <div className="flex-grow">
          <h4 className="font-semibold text-sm">{notification.title}</h4>
          <p className="text-xs mt-1">{notification.message}</p>
        </div>
        <button onClick={handleDismiss} className="ml-2 p-1 rounded-full hover:bg-neutral-700">
          <X size={16} />
        </button>
      </div>
      {notification.actions && notification.actions.length > 0 && (
        <div className="mt-3 pt-2 border-t border-neutral-700 flex justify-end space-x-2">
          {notification.actions.map((action, index) => (
            <button
              key={index}
              onClick={() => {
                action.onClick();
                handleDismiss();
              }}
              className="px-3 py-1 text-xs bg-neutral-700 hover:bg-neutral-600 rounded"
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationBanner;