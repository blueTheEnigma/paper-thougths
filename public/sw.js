// Paper Thoughts Web Push Service Worker
self.addEventListener('push', function(event) {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || 'Paper Thoughts';
    const options = {
      body: data.body || 'New community update available.',
      icon: '/apple-icon',
      badge: '/icon',
      data: { url: data.link || 'https://www.paperthoughts.org/village' }
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (err) {
    console.error('Push notification error:', err);
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const targetUrl = event.notification.data?.url || 'https://www.paperthoughts.org/village';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
