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

// Lanzado cuando un guardado llega con una `revision` vieja — otro usuario guardó cambios en el
// medio y el backend rechazó el guardado (409 `budget_stale`, ver FLOWS.md §35). La página debe
// mostrar un diálogo propio (quién guardó, cuándo, y un botón Recargar), no el FeedbackModal
// genérico de error.
export class ConflictError extends Error {
  current_revision: number;
  last_edited_by: { id: number; name: string; lastname: string } | null;
  last_edited_at: string | null;

  constructor(
    message: string,
    details: { current_revision: number; last_edited_by: { id: number; name: string; lastname: string } | null; last_edited_at: string | null }
  ) {
    super(message);
    this.name = 'ConflictError';
    this.current_revision = details.current_revision;
    this.last_edited_by = details.last_edited_by;
    this.last_edited_at = details.last_edited_at;
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
