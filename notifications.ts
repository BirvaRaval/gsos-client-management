export interface Notification {
  id: string;
  type: 'client_created' | 'client_deleted' | 'client_edited' | 'pull_recorded' | 'system' | 'warning' | 'info';
  message: string;
  timestamp: Date;
  read: boolean;
}

class NotificationManager {
  private notifications: Notification[] = [];
  private listeners: ((notifications: Notification[]) => void)[] = [];

  constructor() {
    this.loadNotifications();
  }

  private loadNotifications() {
    try {
      const saved = localStorage.getItem('gsos-notifications');
      if (saved) {
        this.notifications = JSON.parse(saved).map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }

  private saveNotifications() {
    try {
      localStorage.setItem('gsos-notifications', JSON.stringify(this.notifications));
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to save notifications:', error);
    }
  }

  addNotification(type: 'client_created' | 'client_deleted' | 'client_edited' | 'pull_recorded' | 'system' | 'warning' | 'info', messageOrClientName: string) {
    let message: string;
    
    if (type === 'client_created') {
      message = `Client "${messageOrClientName}" has been successfully added`;
    } else if (type === 'client_deleted') {
      message = `Client "${messageOrClientName}" has been deleted`;
    } else if (type === 'client_edited') {
      message = `Client "${messageOrClientName}" has been updated`;
    } else if (type === 'pull_recorded') {
      message = `New pull recorded for client "${messageOrClientName}"`;
    } else {
      message = messageOrClientName;
    }

    const notification: Notification = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date(),
      read: false
    };

    this.notifications.unshift(notification);
    
    // Keep only last 50 notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }

    this.saveNotifications();
  }

  getNotifications(): Notification[] {
    return this.notifications;
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  markAsRead(id: string) {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      this.saveNotifications();
    }
  }

  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.saveNotifications();
  }

  clearAll() {
    this.notifications = [];
    this.saveNotifications();
  }

  subscribe(listener: (notifications: Notification[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.notifications));
  }
}

export const notificationManager = new NotificationManager();