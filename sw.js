const CACHE = 'ng-v3';
const CORE = ['/netgrup-app/', '/netgrup-app/index.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => clients.claim())
  );
});

self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  const title = data.title || '🔔 Yeni Teklif Talebi!';
  const body = data.body || 'Net Grup sitesinden yeni bir teklif talebi geldi.';
  e.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/netgrup-app/icon.svg',
      badge: '/netgrup-app/icon.svg',
      vibrate: [200, 100, 200],
      tag: 'ng-quote',
      renotify: true,
      data: { url: '/netgrup-app/' }
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data?.url || '/netgrup-app/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.includes('/netgrup-app/') && 'focus' in c) return c.focus();
      }
      return clients.openWindow(url);
    })
  );
});

// App'ten mesaj gelince bildirim göster
self.addEventListener('message', e => {
  if (e.data?.type === 'SHOW_NOTIF') {
    const { title, body } = e.data;
    self.registration.showNotification(title, {
      body,
      icon: '/netgrup-app/icon.svg',
      badge: '/netgrup-app/icon.svg',
      vibrate: [200, 100, 200, 100, 200],
      tag: 'ng-quote-' + Date.now(),
      data: { url: '/netgrup-app/' }
    });
  }
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (!e.request.url.includes('/netgrup-app')) return;
  e.respondWith(
    fetch(e.request).then(r => {
      const clone = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone));
      return r;
    }).catch(() => caches.match(e.request))
  );
});
