import { TokenManager } from './auth';

// Misma resolución de la URL base que utils/api.ts: window.__ENV__ en runtime (Docker/Railway) o
// el embed de build-time en dev local.
const API_BASE_URL =
  (typeof window !== 'undefined' && (window as { __ENV__?: { API_BASE_URL?: string } }).__ENV__?.API_BASE_URL) ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://localhost:4000';

// Las URLs firmadas que devuelve POST /files/signed-urls duran 10 minutos (TTL del backend). Se
// reutilizan mientras falte más de RENEW_MARGIN para que venzan, y se piden juntas (hasta
// MAX_BATCH por llamada, el tope del backend).
const SIGNED_URL_TTL_MS = 10 * 60 * 1000;
const RENEW_MARGIN_MS = 60 * 1000;
const MAX_BATCH = 50;
const BATCH_DELAY_MS = 10;

interface SignedEntry { signed: string; expiresAt: number }
interface PendingRequest { resolve: (url: string) => void; reject: (err: Error) => void }

const signedCache = new Map<string, SignedEntry>();
const inFlight = new Map<string, Promise<string>>();
const queue = new Map<string, PendingRequest[]>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;

const isFresh = (entry: SignedEntry | undefined): entry is SignedEntry =>
  !!entry && entry.expiresAt - Date.now() > RENEW_MARGIN_MS;

async function requestSignedUrls(urls: string[]): Promise<Record<string, string>> {
  const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/files/signed-urls`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ urls }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error || 'No se pudo acceder al archivo');
  }
  const body = await response.json();
  return body?.data || {};
}

async function flushQueue(): Promise<void> {
  flushTimer = null;
  const batch = Array.from(queue.entries());
  queue.clear();

  for (let i = 0; i < batch.length; i += MAX_BATCH) {
    const chunk = batch.slice(i, i + MAX_BATCH);
    try {
      const data = await requestSignedUrls(chunk.map(([url]) => url));
      chunk.forEach(([url, waiters]) => {
        // El backend omite lo que no es del bucket (o está bloqueado): se devuelve tal cual.
        const signed = data[url] || url;
        if (data[url]) signedCache.set(url, { signed, expiresAt: Date.now() + SIGNED_URL_TTL_MS });
        waiters.forEach((w) => w.resolve(signed));
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('No se pudo acceder al archivo');
      chunk.forEach(([, waiters]) => waiters.forEach((w) => w.reject(error)));
    }
  }
}

export class FileService {
  // Devuelve la URL firmada (10 min) para mostrar un archivo del bucket privado. `storedUrl` es la
  // URL que viene de la API (la "referencia canónica"), que por sí sola ya no abre. Cachea en
  // memoria y agrupa en un solo POST las llamadas del mismo momento (ej. una grilla de miniaturas).
  static getSignedUrl(storedUrl: string): Promise<string> {
    const cached = signedCache.get(storedUrl);
    if (isFresh(cached)) return Promise.resolve(cached.signed);

    const pending = inFlight.get(storedUrl);
    if (pending) return pending;

    const promise = new Promise<string>((resolve, reject) => {
      const waiters = queue.get(storedUrl) || [];
      waiters.push({ resolve, reject });
      queue.set(storedUrl, waiters);
      if (!flushTimer) flushTimer = setTimeout(() => { void flushQueue(); }, BATCH_DELAY_MS);
    }).finally(() => inFlight.delete(storedUrl));
    inFlight.set(storedUrl, promise);
    return promise;
  }

  // URL firmada ya cacheada y vigente (o null): permite pintar sin parpadeo si el archivo ya se pidió.
  static peekSignedUrl(storedUrl: string): string | null {
    const cached = signedCache.get(storedUrl);
    return isFresh(cached) ? cached.signed : null;
  }

  // Baja un archivo del bucket al disco del usuario (botón "Descargar" del visor de documentos).
  // Pasa por GET /files/download con el token y arma un blob: no depende de CORS del bucket ni de
  // que el navegador decida abrir el tipo de archivo en lugar de bajarlo.
  static async download(fileUrl: string, fileName?: string): Promise<void> {
    const params = new URLSearchParams({ url: fileUrl });
    if (fileName) params.set('name', fileName);
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/files/download?${params.toString()}`);
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || 'No se pudo descargar el archivo');
    }
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    try {
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = fileName || decodeURIComponent(fileUrl.split('?')[0].split('/').pop() || 'archivo');
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
    }
  }
}
