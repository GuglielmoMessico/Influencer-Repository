import { useState, useEffect, useCallback } from 'react';

interface NotificationPayload {
  title: string;
  body: string;
  url?: string;
}

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check browser support and current permission
  useEffect(() => {
    const checkSupport = async () => {
      const supported = 'Notification' in window && 'serviceWorker' in navigator;
      setIsSupported(supported);
      
      if (supported) {
        setPermission(Notification.permission);
        
        // Register service worker if not already registered
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          setSwRegistration(registration);
          console.log('Service Worker registered successfully');
        } catch (error) {
          console.error('Service Worker registration failed:', error);
        }
      }
      
      setIsLoading(false);
    };

    checkSupport();
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      console.warn('Notifications not supported in this browser');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported]);

  // Send a notification via Service Worker
  const sendNotification = useCallback(async (payload: NotificationPayload): Promise<boolean> => {
    if (!isSupported || permission !== 'granted') {
      console.warn('Cannot send notification: not supported or permission denied');
      return false;
    }

    try {
      // Try to use Service Worker if available
      if (swRegistration?.active) {
        swRegistration.active.postMessage({
          type: 'SHOW_NOTIFICATION',
          ...payload
        });
        return true;
      }

      // Fallback: Use Notification API directly
      const notification = new Notification(payload.title, {
        body: payload.body,
        icon: '/favicon.ico',
        tag: 'quote-notification',
      });

      notification.onclick = () => {
        window.focus();
        if (payload.url) {
          window.location.href = payload.url;
        }
        notification.close();
      };

      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }, [isSupported, permission, swRegistration]);

  // Check if notifications are enabled (permission granted)
  const isEnabled = permission === 'granted';

  // Check if permission was denied
  const isDenied = permission === 'denied';

  return {
    isSupported,
    isEnabled,
    isDenied,
    isLoading,
    permission,
    requestPermission,
    sendNotification,
  };
};

// Helper to trigger notification from anywhere (e.g., Cotizacion page)
export const triggerQuoteNotification = async (brandName: string, platform: string, campaignType: string) => {
  // Check if service worker is available
  if (!('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    if (registration.active) {
      registration.active.postMessage({
        type: 'SHOW_NOTIFICATION',
        title: '📋 Nueva Cotización',
        body: `${brandName} quiere colaborar\nPlataforma: ${platform} - ${campaignType}`,
        url: '/admin?tab=quotes'
      });
    }
  } catch (error) {
    console.error('Error triggering notification:', error);
  }
};
