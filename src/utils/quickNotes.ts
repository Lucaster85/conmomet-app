import type { QuickNote } from './api';

// Lógica de fechas de las notas rápidas, compartida entre el panel, el botón flotante y (etapa 2)
// el widget de Inicio. Todo trabaja con strings YYYY-MM-DD en hora LOCAL del navegador.
//
// 🔴 Nunca `new Date().toISOString().slice(0, 10)` para "hoy": toISOString convierte a UTC, y en
// Argentina (UTC-3) a partir de las 21 hs eso da el día siguiente — una nota para hoy aparecería
// como "vence mañana" a la noche. Se arma la fecha con los componentes locales.

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayKey(now: Date = new Date()): string {
  return toDateKey(now);
}

export function tomorrowKey(now: Date = new Date()): string {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return toDateKey(d);
}

export type QuickNoteDueState = 'overdue' | 'today' | 'upcoming';

// null = la nota no tiene vencimiento. Comparar strings YYYY-MM-DD alcanza: ordenan igual que las
// fechas.
export function dueState(dueDate: string | null, now: Date = new Date()): QuickNoteDueState | null {
  if (!dueDate) return null;
  const today = todayKey(now);
  if (dueDate < today) return 'overdue';
  if (dueDate === today) return 'today';
  return 'upcoming';
}

// Color del chip de vencimiento, compartido por el panel y el widget de Inicio: rojo si ya pasó,
// amarillo si es hoy, neutro si todavía hay tiempo.
export function dueChipColor(state: QuickNoteDueState | null): 'error' | 'warning' | 'default' {
  if (state === 'overdue') return 'error';
  if (state === 'today') return 'warning';
  return 'default';
}

export function formatDueDate(dueDate: string): string {
  const [y, m, d] = dueDate.split('-');
  return `${d}/${m}/${y}`;
}

// Texto del chip de vencimiento: "Vencida el 03/11/2026", "Hoy", "Mañana" o "Vence el 24/12/2026".
export function dueLabel(dueDate: string, now: Date = new Date()): string {
  const state = dueState(dueDate, now);
  if (state === 'overdue') return `Vencida el ${formatDueDate(dueDate)}`;
  if (state === 'today') return 'Hoy';
  if (dueDate === tomorrowKey(now)) return 'Mañana';
  return `Vence el ${formatDueDate(dueDate)}`;
}

// Cantidad de pendientes vencidas o para hoy: lo que muestra el numerito rojo del botón flotante.
export function countOverdueOrToday(pending: QuickNote[], now: Date = new Date()): number {
  return pending.filter((n) => {
    const state = dueState(n.due_date, now);
    return state === 'overdue' || state === 'today';
  }).length;
}

// Mismo orden que el endpoint (primero con vencimiento, la más próxima arriba; después las sueltas,
// de la más nueva a la más vieja). El provider lo reaplica en las actualizaciones optimistas, para
// que una nota recién editada no salte de lugar hasta el próximo refresco.
export function sortPending(notes: QuickNote[]): QuickNote[] {
  return [...notes].sort((a, b) => {
    if (a.due_date && b.due_date) {
      if (a.due_date !== b.due_date) return a.due_date < b.due_date ? -1 : 1;
    } else if (a.due_date || b.due_date) {
      return a.due_date ? -1 : 1;
    }
    // created_at ISO: a igual vencimiento (o ambas sueltas), la más nueva primero. Desempata por id.
    if (a.created_at !== b.created_at) return a.created_at < b.created_at ? 1 : -1;
    return b.id - a.id;
  });
}
