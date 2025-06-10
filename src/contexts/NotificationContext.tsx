import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { Snackbar, Alert } from '@mui/material';

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  createdAt: Date;
  read: boolean;
  link?: string;
  metadata?: Record<string, any>;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  showNotification: (notification: { message: string; type?: Notification['type']; link?: string; metadata?: Record<string, any> }) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    // Load notifications from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('notifications');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const saveNotifications = useCallback((newNotifications: Notification[]) => {
    setNotifications(newNotifications);
    if (typeof window !== 'undefined') {
      localStorage.setItem('notifications', JSON.stringify(newNotifications));
    }
  }, []);

  const showNotification = useCallback((
    notification: {
      message: string;
      type?: Notification['type'];
      link?: string;
      metadata?: Record<string, any>;
    }
  ) => {
    const newNotification: Notification = {
      id: Date.now().toString(),
      message: notification.message,
      type: notification.type || 'info',
      link: notification.link,
      metadata: notification.metadata,
      createdAt: new Date(),
      read: false,
    };
    
    saveNotifications([newNotification, ...notifications]);
  }, [notifications, saveNotifications]);

  const markAsRead = useCallback((id: string) => {
    const updated = notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    saveNotifications(updated);
  }, [notifications, saveNotifications]);

  const markAllAsRead = useCallback(() => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    saveNotifications(updated);
  }, [notifications, saveNotifications]);

  const removeNotification = useCallback((id: string) => {
    const updated = notifications.filter(n => n.id !== id);
    saveNotifications(updated);
  }, [notifications, saveNotifications]);

  const clearAll = useCallback(() => {
    saveNotifications([]);
  }, [saveNotifications]);

  return (
    <NotificationContext.Provider 
      value={{
        notifications,
        unreadCount,
        showNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationSnackbar: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);
  const { notifications, markAsRead } = useNotifications();

  useEffect(() => {
    const unread = notifications.find(n => !n.read);
    if (unread) {
      setCurrentNotification(unread);
      setOpen(true);
      markAsRead(unread.id);
    }
  }, [notifications, markAsRead]);

  const handleClose = () => {
    setOpen(false);
  };

  if (!currentNotification) return null;

  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert 
        onClose={handleClose} 
        severity={currentNotification.type}
        variant="filled"
        sx={{ width: '100%' }}
      >
        {currentNotification.message}
      </Alert>
    </Snackbar>
  );
};
