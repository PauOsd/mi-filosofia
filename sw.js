// sw.js — Service Worker para Filosofía Diaria
const CACHE_NAME = 'filosofia-v1';
const ASSETS = ['/', '/index.html'];

// ── Instalación: guardar archivos en caché ──
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// ── Activación: limpiar cachés viejas ──
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
  programarNotificacion();
});

// ── Fetch: servir desde caché si está disponible ──
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});

// ── Mensaje desde la página principal ──
self.addEventListener('message', e => {
  if (e.data?.type === 'SCHEDULE') {
    programarNotificacion();
  }
});

// ── Notificación al hacer click ──
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      if (windowClients.length > 0) {
        return windowClients[0].focus();
      }
      return clients.openWindow('/');
    })
  );
});

// ── Frases filosóficas (misma lista que index.html) ──
const FRASES = [
  { text: "Conócete a ti mismo.", author: "Sócrates" },
  { text: "Solo sé que no sé nada.", author: "Sócrates" },
  { text: "El hombre es la medida de todas las cosas.", author: "Protágoras" },
  { text: "La felicidad depende de nosotros mismos.", author: "Aristóteles" },
  { text: "Somos lo que hacemos repetidamente.", author: "Aristóteles" },
  { text: "Todo fluye, nada permanece.", author: "Heráclito" },
  { text: "No puedes bañarte dos veces en el mismo río.", author: "Heráclito" },
  { text: "La vida sin examen no merece ser vivida.", author: "Sócrates" },
  { text: "Cogito, ergo sum.", author: "René Descartes" },
  { text: "El hombre está condenado a ser libre.", author: "Jean-Paul Sartre" },
  { text: "La existencia precede a la esencia.", author: "Jean-Paul Sartre" },
  { text: "Lo que no me mata me hace más fuerte.", author: "Friedrich Nietzsche" },
  { text: "Sin música, la vida sería un error.", author: "Friedrich Nietzsche" },
  { text: "El tiempo es la imagen móvil de la eternidad.", author: "Platón" },
  { text: "El cielo estrellado sobre mí, la ley moral dentro de mí.", author: "Immanuel Kant" },
  { text: "La libertad es la conciencia de la necesidad.", author: "Hegel" },
  { text: "El dolor es inevitable, el sufrimiento es opcional.", author: "Buda" },
  { text: "Nada es permanente excepto el cambio.", author: "Heráclito" },
  { text: "La imaginación es más importante que el conocimiento.", author: "Albert Einstein" },
  { text: "Sé el cambio que deseas ver en el mundo.", author: "Mahatma Gandhi" },
  { text: "El corazón tiene razones que la razón no comprende.", author: "Blaise Pascal" },
  { text: "Donde no hay esperanza, es preciso inventarla.", author: "Albert Camus" },
  { text: "Hay que imaginar a Sísifo feliz.", author: "Albert Camus" },
  { text: "No es la especie más fuerte la que sobrevive, sino la más adaptable.", author: "Charles Darwin" },
  { text: "La mayor de las victorias es la victoria sobre uno mismo.", author: "Platón" },
  { text: "No hay viento favorable para el que no sabe a qué puerto va.", author: "Séneca" },
  { text: "No es pobre quien tiene poco, sino quien desea mucho.", author: "Séneca" },
  { text: "El sabio no hace nada de lo que pueda arrepentirse.", author: "Epicuro" },
  { text: "La sabiduría comienza en la admiración.", author: "Sócrates" },
  { text: "La duda es el origen de la sabiduría.", author: "René Descartes" },
  { text: "El hombre que mueve montañas comienza cargando pequeñas piedras.", author: "Confucio" },
  { text: "La vida es aquello que te pasa mientras haces otros planes.", author: "John Lennon" },
  { text: "El arte es la mentira que nos hace comprender la verdad.", author: "Pablo Picasso" },
  { text: "La justicia sin fuerza es impotente.", author: "Blaise Pascal" },
  { text: "Nuestra mayor gloria es levantarnos cada vez que caemos.", author: "Confucio" },
];

function getFraseDelDia() {
  const hoy = new Date();
  const inicio = new Date(hoy.getFullYear(), 0, 0);
  const diaDelAnio = Math.floor((hoy - inicio) / 86400000);
  return FRASES[diaDelAnio % FRASES.length];
}

// ── Programar notificación para las 00:00 del día siguiente ──
function programarNotificacion() {
  const ahora = new Date();
  const maniana = new Date(
    ahora.getFullYear(),
    ahora.getMonth(),
    ahora.getDate() + 1,
    0, 0, 0
  );
  const msHastaMedianoche = maniana.getTime() - ahora.getTime();

  // Limpiar timer previo si existe
  if (self._notifTimer) clearTimeout(self._notifTimer);

  self._notifTimer = setTimeout(() => {
    enviarNotificacion();
    // Volver a programar para el día siguiente
    setInterval(enviarNotificacion, 24 * 60 * 60 * 1000);
  }, msHastaMedianoche);
}

function enviarNotificacion() {
  const frase = getFraseDelDia();
  self.registration.showNotification('Filosofía del día ✦', {
    body: `"${frase.text}" — ${frase.author}`,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'frase-diaria',
    renotify: false,
    requireInteraction: false,
    data: { url: '/' }
  });
}
