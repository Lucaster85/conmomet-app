// Qué mostrar en lugar del vencimiento de un Pedido de Cotización (PC). Antes cada pantalla lo
// calculaba por su cuenta y sin mirar el estado: el vencimiento seguía corriendo (y poniéndose
// rojo) después de enviar el presupuesto, y el usuario creía que quedaba algo pendiente.
//
// - due:  el PC está en curso, o el presupuesto vinculado todavía es borrador → fecha límite.
// - sent: la cotización ya salió al cliente → "Enviado el dd/mm", no hay nada que vigilar.
// - none: PC cancelado → no hay nada que mostrar.
//
// Puramente visual: nunca bloquea nada (mismo criterio que daysExpired en budgets/page.tsx).

export type QuoteRequestDueKind = 'due' | 'sent' | 'none';
export type QuoteRequestDueColor = 'default' | 'warning' | 'error' | 'success';

export interface QuoteRequestDueInfo {
  kind: QuoteRequestDueKind;
  label: string;
  color: QuoteRequestDueColor;
}

export interface QuoteRequestDueSource {
  status: string;
  due_date: string;
  // Fecha del último presupuesto enviado y no rechazado (la calcula el listado de PC).
  last_sent_at?: string | null;
}

export interface QuoteRequestDueBudget {
  status: string;
  sent_at?: string | null;
}

const IN_PROGRESS_STATUSES = ['pending', 'in_progress', 'pending_review'];

export function daysUntil(dueDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(dueDate + 'T00:00:00');
  return Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDayMonth(value: string): string {
  const date = new Date(value);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
}

function dueLabel(dueDate: string): { label: string; color: QuoteRequestDueColor } {
  const days = daysUntil(dueDate);
  if (days < 0) return { label: `Vencido hace ${Math.abs(days)} día${Math.abs(days) === 1 ? '' : 's'}`, color: 'error' };
  if (days === 0) return { label: 'Vence hoy', color: 'error' };
  if (days <= 2) return { label: `Vence en ${days} día${days === 1 ? '' : 's'}`, color: 'error' };
  if (days <= 7) return { label: `Vence en ${days} días`, color: 'warning' };
  return { label: `Vence en ${days} días`, color: 'default' };
}

// `budget` es el presupuesto que se está mirando (listado/detalle de Presupuestos). Sin él (listado
// de PC) alcanza con el estado del PC y la fecha del último envío.
export function quoteRequestDueInfo(
  quoteRequest: QuoteRequestDueSource,
  budget?: QuoteRequestDueBudget | null,
): QuoteRequestDueInfo {
  if (quoteRequest.status === 'cancelled') return { kind: 'none', label: '', color: 'default' };

  const sentAt = budget?.sent_at || (quoteRequest.status === 'quoted' ? quoteRequest.last_sent_at : null);
  if (budget?.sent_at || quoteRequest.status === 'quoted') {
    const day = sentAt ? formatDayMonth(sentAt) : '';
    return { kind: 'sent', label: day ? `Enviado el ${day}` : 'Enviado', color: 'success' };
  }

  const open = IN_PROGRESS_STATUSES.includes(quoteRequest.status);
  if (open && (!budget || budget.status === 'draft')) {
    return { kind: 'due', ...dueLabel(quoteRequest.due_date) };
  }
  return { kind: 'none', label: '', color: 'default' };
}
