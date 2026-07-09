/* global importScripts, firebase, self, clients */
// FCM background handler — shows notifications when the app is closed or in
// a background tab. Only public web config lives here (ENVIRONMENTS §5).
importScripts('https://www.gstatic.com/firebasejs/12.15.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.15.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyDLhIdTfviZJcLZ0kMDJLXBNCvTsIRaVOk',
  authDomain: 'swish-game-dev.firebaseapp.com',
  projectId: 'swish-game-dev',
  storageBucket: 'swish-game-dev.firebasestorage.app',
  messagingSenderId: '413172422969',
  appId: '1:413172422969:web:14c94ddc36c8af563470e8',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  const isCall = data.kind === 'call';
  self.registration.showNotification(data.title || 'Swish & Game', {
    body: data.body || '',
    tag: isCall ? 'incoming-call' : data.kind || 'general',
    renotify: isCall,
    requireInteraction: isCall,
    vibrate: isCall ? [400, 200, 400, 200, 400] : [200],
    data: { url: data.url || '/' },
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      for (const win of wins) {
        if ('focus' in win) {
          win.navigate(url);
          return win.focus();
        }
      }
      return clients.openWindow(url);
    }),
  );
});
