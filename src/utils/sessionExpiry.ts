// Punto de entrada único para "la sesión se murió", sin importar quién lo detectó primero
// (el chequeo local del exp del JWT, un 401 del backend, o el re-chequeo de ProtectedRoute al
// volver el foco a la pestaña). Es idempotente a propósito: una página puede disparar varias
// llamadas en paralelo y todas fallar a la vez — sin el guard se encadenarían varios redirects.
//
// No usa React Context porque el proyecto no tiene ningún createContext (0 ocurrencias en src/);
// un módulo con un Set de listeners alcanza para este caso puntual.

import { TokenManager } from './auth';

let alreadyHandling = false;
const listeners = new Set<() => void>();

export function handleSessionExpired(): void {
  if (alreadyHandling) return;
  alreadyHandling = true;
  TokenManager.removeToken();
  listeners.forEach((fn) => fn());
}

export function onSessionExpired(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Solo para tests: resetea el guard entre casos.
export function resetSessionExpiryGuard(): void {
  alreadyHandling = false;
}
