importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

const CACHE = 'ng-v6';
const CORE = ['/netgrup-app/', '/netgrup-app/index.html'];

// Firebase init (FCM background messages için)
firebase.initializeApp({
  apiKey: 'AIzaSyAeYOc5tufXdy2DVt1Fdxmq3j1PP4-vpeE',
  authDomain: 'clensmedya-a08a5.firebaseapp.com',
  projectId: 'clensmedya-a08a5',
  messagingSenderId: 'SENDER_ID_BURAYA',
  appId: 'APP_ID_BURAYA'
});

const messaging = firebase.messaging();

// Uygulama kapalıyken FCM push gelince bildirim göster
messaging.onBackgroundMessage(payload => {
  const title = payload.notification?.title || '🔔 Yeni Teklif!';
  const body  = payload.notification?.body  || 'Net Grup sitesinden yeni bir teklif talebi geldi.';
  self.registration.showNotification(title, {
    body,
    icon: '/netgrup-app/icon.svg',
    badge: '/netgrup-app/icon.svg',
    vibrate: [200, 100, 200],
    tag: 'ng-quote',
    renotify: true,
    data: { url: '/netgrup-app/' }
  });
});

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

// App'ten mesaj gelince bildirim göster (uygulama açıkken)
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

// Network-first fetch
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (!e.request.url.includes('/netgrup-app')) return;
  e.respondWith(
    fetch(e.request)
      .then(r => {
        if (r && r.status === 200) {
          const clone = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return r;
      })
      .catch(() => caches.match(e.request))
  );
});
