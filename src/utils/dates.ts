// Fecha relativa en español, compartida entre la campanita de notificaciones y cualquier lugar
// que necesite mostrar "hace cuánto" de un timestamp (ver FLOWS.md §19c).
//
// Defensiva a propósito: con una fecha inválida, `getTime()` da NaN, TODAS las comparaciones de
// abajo dan false y se cae hasta el último return. Por eso ese último return es '' y no una fecha
// formateada — un formateador de fecha en la UI nunca debería poder mostrar "Invalid Date".
//
// `maxDays` corta a fecha absoluta a partir de cierta antigüedad (la campanita lo usa en 30 días,
// para no cambiar su comportamiento actual); sin `maxDays` sigue relativo indefinidamente, hasta
// años, que es lo que necesita el label de antigüedad de precios.
export function relativeTime(iso?: string | null, opts?: { maxDays?: number }): string {
  if (!iso) return '';
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return '';

  const maxDays = opts?.maxDays ?? Infinity;
  const diff = Date.now() - time;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'ayer';
  if (days >= maxDays) return new Date(iso).toLocaleDateString('es-AR');
  if (days < 30) return `hace ${days} días`;
  const months = Math.floor(days / 30);
  if (months < 12) return months === 1 ? 'hace 1 mes' : `hace ${months} meses`;
  const years = Math.floor(days / 365);
  return years === 1 ? 'hace 1 año' : `hace ${years} años`;
}
