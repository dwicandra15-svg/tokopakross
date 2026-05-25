// ═══════════════════════════════════════════════════
// SERVICE WORKER — Toko Pak Ross
// Handles background push notifications
// Developed by D.D Candra © 2026
// ═══════════════════════════════════════════════════

var CACHE_NAME = 'pakross-sw-v1';

// ── Install ──────────────────────────────────────────
self.addEventListener('install', function(e){
  console.log('[SW] Installed');
  self.skipWaiting(); // Langsung aktif tanpa tunggu tab lama ditutup
});

// ── Activate ─────────────────────────────────────────
self.addEventListener('activate', function(e){
  console.log('[SW] Activated');
  e.waitUntil(clients.claim()); // Ambil kontrol semua tab sekarang
});

// ── Push Event (dari Firebase via SW) ────────────────
// Dipanggil saat ada push notification dari server
self.addEventListener('push', function(e){
  var data = {};
  try { data = e.data ? e.data.json() : {}; } catch(err) {}

  var title = data.title || '🛒 Pesanan Baru Masuk!';
  var body  = data.body  || 'Ada pesanan baru di Toko Pak Ross';
  var icon  = data.icon  || '/tokopakross/icon-192.png';

  var options = {
    body           : body,
    icon           : icon,
    badge          : icon,
    tag            : 'pakross-order-' + Date.now(),
    renotify       : true,
    requireInteraction: true,          // Notif tidak hilang otomatis
    vibrate        : [200, 100, 200, 100, 400], // Pola getar
    data           : { url: self.location.origin + '/tokopakross/' },
    actions        : [
      { action: 'buka',  title: '📋 Buka Dashboard' },
      { action: 'tutup', title: '✖ Tutup'            }
    ]
  };

  e.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// ── Notification Click ───────────────────────────────
self.addEventListener('notificationclick', function(e){
  e.notification.close();

  if(e.action === 'tutup') return;

  // Buka/fokus tab app
  var targetUrl = e.notification.data && e.notification.data.url
    ? e.notification.data.url
    : self.location.origin + '/tokopakross/';

  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList){
        // Cari tab yang sudah terbuka
        for(var i = 0; i < clientList.length; i++){
          var c = clientList[i];
          if(c.url.indexOf('tokopakross') !== -1 && 'focus' in c){
            // Kirim pesan ke tab agar buka dashboard seller
            c.postMessage({ action: 'open-dashboard' });
            return c.focus();
          }
        }
        // Tidak ada tab terbuka — buka tab baru
        if(clients.openWindow) return clients.openWindow(targetUrl);
      })
  );
});

// ── Message dari halaman utama ───────────────────────
// Menerima instruksi dari app (misal: kirim test notif)
self.addEventListener('message', function(e){
  if(!e.data) return;

  if(e.data.type === 'SKIP_WAITING'){
    self.skipWaiting();
  }

  if(e.data.type === 'SHOW_NOTIF'){
    var opts = {
      body           : e.data.body  || 'Notifikasi dari Toko Pak Ross',
      icon           : e.data.icon  || '/tokopakross/icon-192.png',
      tag            : 'pakross-msg-' + Date.now(),
      renotify       : true,
      requireInteraction: true,
      vibrate        : [200, 100, 200, 100, 400],
      data           : { url: self.location.origin + '/tokopakross/' },
      actions        : [
        { action: 'buka',  title: '📋 Buka Dashboard' },
        { action: 'tutup', title: '✖ Tutup'            }
      ]
    };
    self.registration.showNotification(
      e.data.title || '🛒 Pesanan Baru Masuk!',
      opts
    );
  }
});
