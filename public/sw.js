// Service Worker para notificaciones push
// Este archivo corre en segundo plano y maneja las notificaciones

// Evento cuando se recibe una notificación push
self.addEventListener('push', function(event) {
  if (!event.data) return;

  try {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'Nueva solicitud de cotización recibida',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [100, 50, 100],
      data: { 
        url: data.url || '/admin?tab=quotes',
        dateOfArrival: Date.now()
      },
      actions: [
        { action: 'view', title: 'Ver detalles' },
        { action: 'close', title: 'Cerrar' }
      ],
      tag: 'quote-notification',
      renotify: true
    };

    event.waitUntil(
      self.registration.showNotification(data.title || '📋 Nueva Cotización', options)
    );
  } catch (error) {
    console.error('Error parsing push notification:', error);
  }
});

// Evento cuando el usuario hace clic en la notificación
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/admin?tab=quotes';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Si ya hay una ventana abierta, enfócala
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes('/admin') && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no hay ventana abierta, abre una nueva
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Evento de instalación del Service Worker
self.addEventListener('install', function(event) {
  console.log('Service Worker installed');
  self.skipWaiting();
});

// Evento de activación
self.addEventListener('activate', function(event) {
  console.log('Service Worker activated');
  event.waitUntil(clients.claim());
});

// Escuchar mensajes del frontend para mostrar notificaciones
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, url } = event.data;
    
    self.registration.showNotification(title || '📋 Nueva Cotización', {
      body: body || 'Nueva solicitud de cotización recibida',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [100, 50, 100],
      data: { url: url || '/admin?tab=quotes' },
      tag: 'quote-notification',
      renotify: true
    });
  }
});
