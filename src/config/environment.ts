// Marca de ambiente (FLOWS.md §80): que test/demo/producción no se confundan a simple vista.
//
// SOLO se lee del lado servidor (layout raíz) y se baja al cliente por EnvironmentProvider. No usa
// el prefijo NEXT_PUBLIC_ a propósito: ese prefijo congela el valor en el build, y acá queremos
// cambiarlo en Railway sin rebuild (mismo criterio que API_BASE_URL y CLARITY_PROJECT_ID).
//
// Producción NO define APP_ENV_LABEL → label vacío → no se dibuja nada y el título/themeColor
// quedan como siempre.

export interface EnvironmentConfig {
  /** Texto del distintivo (ej. "TEST"). Vacío = ambiente sin marca (producción). */
  label: string;
  /** Color de fondo del distintivo, hex de 6 dígitos. */
  color: string;
  /** Color del texto sobre `color`, elegido por contraste. */
  textColor: string;
}

export const DEFAULT_ENV_COLOR = '#F9A825';
const MAX_LABEL_LENGTH = 12;

// Nombres de color aceptados en APP_ENV_COLOR, en español e inglés. Son tonos de la paleta de Material
// (500–700) elegidos para que el distintivo se vea bien sobre el header celeste. Cualquier otro tono
// se pasa en hexadecimal.
const COLOR_NAMES: Record<string, string> = {
  amarillo: '#F9A825', yellow: '#F9A825',
  naranja: '#EF6C00', orange: '#EF6C00',
  rojo: '#D32F2F', red: '#D32F2F',
  violeta: '#7B1FA2', purple: '#7B1FA2',
  rosa: '#D81B60', pink: '#D81B60',
  verde: '#2E7D32', green: '#2E7D32',
  celeste: '#0288D1', azul: '#1565C0', blue: '#1565C0',
  turquesa: '#00897B', teal: '#00897B',
  marron: '#6D4C41', 'marrón': '#6D4C41', brown: '#6D4C41',
  gris: '#616161', grey: '#616161', gray: '#616161',
  negro: '#212121', black: '#212121',
};

// Acepta un nombre de COLOR_NAMES, #RGB o #RRGGBB y devuelve siempre #RRGGBB en mayúsculas, o null
// si no es ninguno. Se valida porque el valor termina en estilos inline y en el <meta theme-color>.
function normalizeHex(value: string | undefined): string | null {
  const raw = (value ?? '').trim();
  const key = raw.toLowerCase();
  if (Object.prototype.hasOwnProperty.call(COLOR_NAMES, key)) return COLOR_NAMES[key];
  if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(raw)) return null;
  const hex = raw.slice(1);
  const full = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
  return `#${full.toUpperCase()}`;
}

// Luminancia relativa (WCAG): decide si el texto va en negro o blanco para que un amarillo claro
// no quede con letra blanca ilegible.
function pickTextColor(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const channel = parseInt(hex.slice(i, i + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.4 ? '#1A1A1A' : '#FFFFFF';
}

export function getEnvironmentConfig(): EnvironmentConfig {
  const label = (process.env.APP_ENV_LABEL ?? '').trim().slice(0, MAX_LABEL_LENGTH);
  const color = normalizeHex(process.env.APP_ENV_COLOR) ?? DEFAULT_ENV_COLOR;
  return { label, color, textColor: pickTextColor(color) };
}
