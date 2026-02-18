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

// Background notification check
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULE_REMINDERS') {
    // Store reminders for background checking
    event.waitUntil(storeReminders(event.data.appointments));
  }
  
  if (event.data && event.data.type === 'CHECK_REMINDERS') {
    event.waitUntil(checkBackgroundReminders());
  }
});

// Store reminders in IndexedDB
async function storeReminders(appointments) {
  // Reminders are stored by main app in IndexedDB
  // Service worker will check them periodically
}

// Check reminders from storage
async function checkBackgroundReminders() {
  try {
    // Request appointments from main app
    const clients = await self.clients.matchAll();
    if (clients.length > 0) {
      clients[0].postMessage({ type: 'GET_APPOINTMENTS_FOR_BACKGROUND' });
    }
  } catch (error) {
    console.error('Error checking reminders:', error);
  }
}

// Show notification from service worker
function showBackgroundNotification(appointment) {
  const date = new Date(appointment.date);
  const timeStr = date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  const title = '🔔 Vaccine Reminder';
  const options = {
    body: `${appointment.petName} (${appointment.petType})\n${appointment.vaccineType} at ${timeStr}\n📍 ${appointment.location}`,
    icon: './icon-192.png',
    badge: './icon-192.png',
    tag: `reminder-${appointment.id}`,
    requireInteraction: true,
    vibrate: [200, 100, 200],
    data: {
      appointmentId: appointment.id,
      url: './'
    }
  };
  
  return self.registration.showNotification(title, options);
}

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

