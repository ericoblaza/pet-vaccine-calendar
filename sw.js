// Service Worker for Pet Vaccine Calendar
const CACHE_NAME = 'pet-vaccine-calendar-v1';
const urlsToCache = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting(); // Activate immediately
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim(); // Take control immediately
});

// Periodic Background Sync - runs when app is CLOSED (Chrome/PWA)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'vaccine-reminders') {
    event.waitUntil(checkRemindersInBackground());
  }
});

// Check reminders from IndexedDB (when app is closed)
async function checkRemindersInBackground() {
  try {
    const db = await openDB();
    if (!db) return;
    
    const reminders = await getAllReminders(db);
    const now = Date.now();
    
    for (const reminder of reminders) {
      if (reminder.reminderTime <= now) {
        const apt = reminder.appointment;
        const isAt = reminder.type === 'at';
        const title = isAt ? '🔔 Appointment Time!' : '🔔 Vaccine Reminder';
        const date = new Date(apt.date);
        const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const body = isAt
          ? `${apt.petName} (${apt.petType})\n${apt.vaccineType} is NOW at ${timeStr}\n📍 ${apt.location}`
          : `${apt.petName} (${apt.petType})\n${apt.vaccineType} at ${timeStr}\n📍 ${apt.location}`;
        
        await self.registration.showNotification(title, {
          body: body,
          icon: './icon-192.png',
          badge: './icon-192.png',
          tag: `reminder-${apt.id}-${reminder.type}`,
          requireInteraction: true,
          silent: false,
          vibrate: [200, 100, 200],
          data: { appointmentId: apt.id, url: './' }
        });
        
        await deleteReminder(db, reminder.id);
      }
    }
    
    if (db) db.close();
  } catch (err) {
    console.error('Background reminder check failed:', err);
  }
}

function openDB() {
  return new Promise((resolve) => {
    const req = indexedDB.open('VaccineCalendarDB', 1);
    req.onerror = () => resolve(null);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('reminders')) {
        db.createObjectStore('reminders', { keyPath: 'id' });
      }
    };
  });
}

function getAllReminders(db) {
  return new Promise((resolve) => {
    if (!db.objectStoreNames.contains('reminders')) {
      resolve([]);
      return;
    }
    const tx = db.transaction(['reminders'], 'readonly');
    const store = tx.objectStore('reminders');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => resolve([]);
  });
}

function deleteReminder(db, id) {
  return new Promise((resolve) => {
    const tx = db.transaction(['reminders'], 'readwrite');
    const store = tx.objectStore('reminders');
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

// Message from main page
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CHECK_REMINDERS_NOW') {
    event.waitUntil(checkRemindersInBackground());
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return self.clients.openWindow(event.notification.data.url || './');
    })
  );
});

