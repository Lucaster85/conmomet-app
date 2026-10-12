// Tipos y mensajes de error de sesión/permisos, centralizados acá para que todas las páginas
// muestren el mismo texto en español sin tener que reimplementarlo cada una.

// Lanzado cuando la sesión venció o el token es inválido — dispara el flujo de re-login.
export class SessionExpiredError extends Error {
  constructor(message = 'Tu sesión expiró.') {
    super(message);
    this.name = 'SessionExpiredError';
  }
}

// Lanzado cuando el usuario está logueado pero no tiene el permiso para la acción — NO debe
// desloguear (ver authenticatedFetch).
export class ForbiddenError extends Error {
  constructor(message = MSG_FORBIDDEN) {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export const MSG_FORBIDDEN = 'No tenés autorización para realizar esta acción.';
export const MSG_NO_ROLE = 'Tu usuario no tiene un rol asignado. Pedile a un administrador que te asigne uno.';

// Lanzado cuando un guardado se rechaza por concurrencia (ver FLOWS.md §35): 409 `budget_stale`
// (otro usuario guardó una revision más nueva mientras tanto) o 409 `budget_locked` (otro
// usuario tiene el candado de edición — no debería pasar en el flujo normal, porque el candado
// ya bloquea la edición al abrir, pero puede darse en el margen de los ~30s del heartbeat). En
// los dos casos la página debe mostrar un diálogo propio, no el FeedbackModal genérico de error.
export class ConflictError extends Error {
  reason: 'budget_stale' | 'budget_locked';
  current_revision: number | null;
  last_edited_by: { id: number; name: string; lastname: string } | null;
  last_edited_at: string | null;
  locked_by: { user_id: number; name: string; lastname: string } | null;

  constructor(
    message: string,
    details: {
      reason: 'budget_stale' | 'budget_locked';
      current_revision?: number | null;
      last_edited_by?: { id: number; name: string; lastname: string } | null;
      last_edited_at?: string | null;
      locked_by?: { user_id: number; name: string; lastname: string } | null;
    }
  ) {
    super(message);
    this.name = 'ConflictError';
    this.reason = details.reason;
    this.current_revision = details.current_revision ?? null;
    this.last_edited_by = details.last_edited_by ?? null;
    this.last_edited_at = details.last_edited_at ?? null;
    this.locked_by = details.locked_by ?? null;
  }
}

// Convierte cualquier cosa lanzada en un mensaje en español presentable en un <Alert>/Snackbar.
export function getErrorMessage(err: unknown, fallback = 'Ocurrió un error inesperado.'): string {
  if (err instanceof ForbiddenError) return err.message;
  if (err instanceof SessionExpiredError) return err.message;
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'string' && err) return err;
  return fallback;
}
