import { PushSubscriptionService, PushServerStatus } from './api';

// Mini-almacén en IndexedDB, espejado en public/sw.js con la MISMA forma (DB_NAME/STORE_NAME/
// RECORD_KEY) — es el único storage que un service worker puede leer. Guarda lo mínimo que la
// capa 2 de pushsubscriptionchange necesita para re-suscribirse y avisar al servidor SIN login
// (ver FLOWS.md flujo 28, plan §3.6): el endpoint actual, la clave VAPID (pública, no es
// secreto) y el origen de la API (el SW no puede leer window.__ENV__).

// Infraestructura transversal de Web Push — registro del service worker, suscripción,
// desuscripción y la reconciliación de arranque (ver FLOWS.md flujo 28, plan §3.6/§3.9).
//
// Reglas no negociables de este módulo:
// - Nunca cachea nada: no es una PWA offline, el manifest/SW existen solo porque iOS exige
//   la app instalada para permitir push.
// - En iOS, requestPermission() DEBE llamarse sincrónicamente desde el handler del tap —
//   nunca después de un await (como el fetch de la clave VAPID). Por eso subscribe() pide
//   el permiso ANTES de buscar la clave.

const SW_PATH = '/sw.js';
const IDB_NAME = 'conmomet-push';
const IDB_STORE = 'state';
const IDB_KEY = 'subscription';

function idbOpen(): Promise<IDBDatabase> {
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

interface StoredSubscriptionState {
  endpoint: string;
  vapidPublicKeyBase64: string;
  apiBaseUrl: string;
}

async function idbSetSubscriptionState(value: StoredSubscriptionState): Promise<void> {
  const db = await idbOpen();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(value, IDB_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function idbClearSubscriptionState(): Promise<void> {
  const db = await idbOpen();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).delete(IDB_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export type PushSupportState =
  | 'unsupported'
  | 'ios-not-installed'
  | 'denied'
  | 'not-subscribed'
  | 'subscribed';

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

// 'PushManager' in window da true en Safari de iOS aunque suscribirse vaya a fallar — el
// chequeo de capacidad del browser por sí solo lleva a un callejón confuso. Lo que importa en
// iOS es si la app está instalada en la pantalla de inicio.
function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true || window.matchMedia?.('(display-mode: standalone)').matches === true;
}

export function isPushSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

let registrationPromise: Promise<ServiceWorkerRegistration> | null = null;

// updateViaCache: 'none' es explícito a propósito — barato comparado con agregar headers()
// a next.config.ts, y deja afuera cualquier duda sobre si Next pinea el SW viejo.
async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!registrationPromise) {
    registrationPromise = navigator.serviceWorker.register(SW_PATH, { updateViaCache: 'none' });
  }
  return registrationPromise;
}

function subscriptionToPayload(sub: PushSubscription) {
  const json = sub.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    throw new Error('Suscripción inválida devuelta por el browser.');
  }
  return {
    endpoint: json.endpoint,
    keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
  };
}

/**
 * Estado actual para decidir qué mostrar en el diálogo de activación (5 casos, ver plan §3.9).
 * No pide ningún permiso — solo lee estado existente.
 */
export async function getPushState(): Promise<PushSupportState> {
  if (!isPushSupported()) return 'unsupported';
  if (isIOS() && !isStandalone()) return 'ios-not-installed';
  if (Notification.permission === 'denied') return 'denied';

  try {
    const registration = await registerServiceWorker();
    const existing = await registration.pushManager.getSubscription();
    return existing ? 'subscribed' : 'not-subscribed';
  } catch {
    return 'not-subscribed';
  }
}

/**
 * Activa las notificaciones en este dispositivo. DEBE llamarse directamente desde un handler
 * de click/tap (gesto de usuario) — en iOS, si hay un `await` antes de `requestPermission()`,
 * el permiso no se pide nunca.
 */
export async function subscribeToPush(): Promise<void> {
  if (!isPushSupported()) throw new Error('Este navegador no soporta notificaciones push.');
  if (isIOS() && !isStandalone()) {
    throw new Error('En iPhone hay que agregar la app a la pantalla de inicio antes de activar las notificaciones.');
  }

  // Primero el permiso (gesto de usuario todavía "caliente"), recién después cualquier await.
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error(
      permission === 'denied'
        ? 'Permiso de notificaciones denegado. Para activarlo hay que habilitarlo desde los ajustes del navegador.'
        : 'No se activaron las notificaciones.'
    );
  }

  const registration = await registerServiceWorker();
  const publicKey = await PushSubscriptionService.getVapidPublicKey();

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  const payload = subscriptionToPayload(subscription);
  try {
    await PushSubscriptionService.subscribe(payload);
  } catch (err) {
    // Si el servidor no registró la suscripción, NO se puede dejar viva la del browser: el
    // diálogo la leería como "activado" y el usuario quedaría esperando avisos que nunca
    // salen (el servidor no sabe a dónde mandarlos). Se revierte para que el estado sea
    // honesto y se pueda reintentar.
    await subscription.unsubscribe().catch(() => undefined);
    throw err;
  }

  // Para que el SW pueda reconciliar sin login si el browser rota el endpoint más adelante
  // (pushsubscriptionchange, capa 2 — ver plan §3.6). Falla en silencio: si IndexedDB no está
  // disponible, la capa 1 (reconciliar al abrir la app) igual cubre el caso.
  try {
    await idbSetSubscriptionState({
      endpoint: payload.endpoint,
      vapidPublicKeyBase64: publicKey,
      apiBaseUrl: PushSubscriptionService.getApiBaseUrl(),
    });
  } catch {
    // no crítico
  }
}

/**
 * Desactiva en este dispositivo. Orden importante (ver FLOWS.md flujo 28, celular compartido):
 * primero avisar al servidor (todavía tenemos el endpoint a mano), recién después invalidar
 * localmente — `unsubscribe()` local es la defensa real, corta la entrega al instante sin
 * depender de la red, así que se hace SIEMPRE aunque el DELETE al servidor falle.
 */
export async function unsubscribeFromPush(): Promise<void> {
  if (!isPushSupported()) return;
  const registration = await navigator.serviceWorker.getRegistration(SW_PATH);
  if (!registration) return;

  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;

  try {
    await PushSubscriptionService.unsubscribe(subscription.endpoint);
  } catch {
    // Best-effort — igual se desuscribe localmente abajo.
  }
  await subscription.unsubscribe();
  try {
    await idbClearSubscriptionState();
  } catch {
    // no crítico
  }
}

/**
 * SOLO desuscribe en el browser, sin avisar al servidor — para los caminos donde el token ya
 * no es válido (sesión vencida, ver FLOWS.md flujo 28 §4): un DELETE autenticado ahí fallaría
 * igual y dispararía otro handleSessionExpired en cascada. `unsubscribe()` local alcanza: es
 * la defensa real (invalida el endpoint al instante), y la fila del servidor igual se poda
 * sola la próxima vez que se intente enviarle un push (404/410).
 */
export async function unsubscribeFromPushLocalOnly(): Promise<void> {
  if (!isPushSupported()) return;
  try {
    const registration = await navigator.serviceWorker.getRegistration(SW_PATH);
    const subscription = await registration?.pushManager.getSubscription();
    await subscription?.unsubscribe();
    await idbClearSubscriptionState();
  } catch {
    // best-effort
  }
}

/**
 * Capa 1 de la reconciliación de `pushsubscriptionchange` (ver plan §3.6): en cada arranque de
 * la app, si ya había una suscripción activa en este dispositivo, se vuelve a mandar al
 * servidor. Es idempotente (upsert por endpoint) y es la única vía que cubre iOS, que no
 * implementa el evento `pushsubscriptionchange` en absoluto. No pide permiso ni crea nada
 * nuevo — si no hay sesión iniciada, el POST falla silenciosamente y no importa.
 */
export async function reconcilePushSubscriptionOnLoad(): Promise<void> {
  if (!isPushSupported() || Notification.permission !== 'granted') return;
  try {
    const registration = await registerServiceWorker();
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;
    const payload = subscriptionToPayload(subscription);
    await PushSubscriptionService.subscribe(payload);

    // Refresca también el estado de IndexedDB que usa la capa 2 — cubre el caso de una
    // suscripción que quedó activa de una sesión anterior sin haber pasado por subscribeToPush
    // en este arranque (ej. se limpió solo IndexedDB, no la suscripción del browser).
    const publicKey = await PushSubscriptionService.getVapidPublicKey();
    await idbSetSubscriptionState({
      endpoint: payload.endpoint,
      vapidPublicKeyBase64: publicKey,
      apiBaseUrl: PushSubscriptionService.getApiBaseUrl(),
    });
  } catch {
    // No es crítico — se reintenta en el próximo arranque.
  }
}


export interface PushDiagnostics {
  state: PushSupportState;
  endpoint: string | null;
  server: PushServerStatus | null;
  serverError: string | null;
}

/**
 * Estado del browser CRUZADO con el del servidor. Son dos cosas distintas y la diferencia es
 * la que importa: el browser puede tener una suscripción viva mientras el servidor no tiene
 * ninguna fila (el POST de alta falló, o la fila se podó por un 404/410). En ese caso no llega
 * nada y hasta ahora se veía igual que "todo bien".
 */
export async function getPushDiagnostics(): Promise<PushDiagnostics> {
  const state = await getPushState();
  let endpoint: string | null = null;

  if (state === 'subscribed') {
    try {
      const registration = await registerServiceWorker();
      const subscription = await registration.pushManager.getSubscription();
      endpoint = subscription?.endpoint ?? null;
    } catch {
      endpoint = null;
    }
  }

  try {
    const server = await PushSubscriptionService.status(endpoint ?? undefined);
    return { state, endpoint, server, serverError: null };
  } catch (err) {
    return {
      state,
      endpoint,
      server: null,
      serverError: err instanceof Error ? err.message : 'No se pudo consultar al servidor.',
    };
  }
}
