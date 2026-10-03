// Service worker de Web Push — NO es una PWA offline. No cachea nada (ni un solo listener de
// `fetch`: uno vacío ya rutea toda la navegación por acá y es fuente clásica de lentitud y
// roturas offline misteriosas). Existe solo para recibir push y, en iOS, porque Apple exige un
// SW + manifest para habilitar notificaciones. Ver FLOWS.md flujo 28.

const IDB_NAME = 'conmomet-push';
const IDB_STORE = 'state';
const IDB_KEY = 'subscription';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// ---------- IndexedDB — mismo esquema que src/utils/push.ts, es el único storage que un SW
// puede leer (no hay localStorage ni JWT acá, ver plan §2.3/§3.6).
function idbOpen() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(IDB_STORE)) {
        req.result.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGetSubscriptionState() {
  const db = await idbOpen();
  const value = await new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly');
    const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return value;
}

async function idbSetSubscriptionState(value) {
  const db = await idbOpen();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(value, IDB_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// ---------- push: el payload es AUTOSUFICIENTE (título/cuerpo/url van cifrados adentro) — el
// SW nunca llama a la API, no tiene con qué autenticarse (ver plan §2.3). Nunca un return
// temprano sin mostrar notificación: en Chrome eso dispara el aviso genérico "este sitio se
// actualizó en segundo plano", y en iOS gasta el presupuesto de pushes silenciosos y puede
// terminar revocando la suscripción (ver plan §5).
self.addEventListener('push', (event) => {
  event.waitUntil(handlePush(event));
});

async function handlePush(event) {
  let data = { title: 'Conmomet', body: 'Tenés una novedad', url: '/dashboard', tag: undefined };
  try {
    if (event.data) {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    }
  } catch {
    // payload vacío o no-JSON — nos quedamos con el fallback, nunca cortamos acá.
  }

  try {
    await self.registration.showNotification(data.title, {
      body: data.body,
      tag: data.tag,
      data: { url: data.url },
      icon: '/icons/icon-192.png',
    });
  } catch {
    // última red de seguridad
    try {
      await self.registration.showNotification('Conmomet', { body: 'Tenés una novedad' });
    } catch {
      // si ni esto funciona, no hay nada más que hacer acá
    }
  }
}

// ---------- notificationclick: enfoca una pestaña existente de la app en vez de abrir una
// duplicada; si no hay ninguna, abre una nueva. `url` siempre es un path del origen del
// frontend (nunca de la API — openWindow falla en silencio cross-origin, ver plan §3.8). Si la
// sesión venció mientras tanto, ProtectedRoute + el redirect de /login ya resuelven volver acá
// solos, no hace falta nada especial de este lado.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/dashboard';
  event.waitUntil(openOrFocus(url));
});

async function openOrFocus(path) {
  const targetUrl = new URL(path, self.location.origin).href;
  // includeUncontrolled: true importa en la primera instalación — la pestaña que acaba de
  // activar el SW todavía no está "controlada" por él.
  const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const client of allClients) {
    if (client.url.startsWith(self.location.origin)) {
      await client.focus();
      if ('navigate' in client) {
        try {
          await client.navigate(targetUrl);
        } catch {
          // si navigate falla igual queda la pestaña enfocada
        }
      }
      return;
    }
  }
  await self.clients.openWindow(targetUrl);
}

// ---------- pushsubscriptionchange — capa 2, best-effort (ver plan §3.6). El SW no tiene JWT,
// así que esto NUNCA puede ser la vía principal: la capa 1 (reconciliar al abrir la app, en
// src/utils/push.ts) es la que de verdad garantiza que el servidor se entere, y es la única que
// cubre iOS (que directamente no dispara este evento). Esto es solo para acortar la ventana en
// browsers que sí lo soportan.
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(handleSubscriptionChange(event));
});

async function handleSubscriptionChange(event) {
  try {
    const stored = await idbGetSubscriptionState();
    const oldEndpoint = (event.oldSubscription && event.oldSubscription.endpoint) || (stored && stored.endpoint);
    if (!oldEndpoint || !stored || !stored.apiBaseUrl) return;

    let newSubscription = event.newSubscription;
    if (!newSubscription) {
      if (!stored.vapidPublicKeyBase64) return;
      newSubscription = await self.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(stored.vapidPublicKeyBase64),
      });
    }

    const json = newSubscription.toJSON();
    if (!json.endpoint || !json.keys) return;

    await fetch(`${stored.apiBaseUrl}/push/rotate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        old_endpoint: oldEndpoint,
        new_subscription: { endpoint: json.endpoint, keys: json.keys },
      }),
    });

    await idbSetSubscriptionState({
      endpoint: json.endpoint,
      vapidPublicKeyBase64: stored.vapidPublicKeyBase64,
      apiBaseUrl: stored.apiBaseUrl,
    });
  } catch {
    // best-effort — la capa 1 cubre el resto en el próximo arranque de la app.
  }
}
