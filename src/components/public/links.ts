// Enlaces de contacto y de pie de la web pública (FLOWS.md §86). Se guarda `kind` + `value`, nunca un
// `href` crudo: el href se arma acá. Así no se puede colar un `javascript:`, el formulario pide "el
// número" en vez de "la URL" y el teléfono no se escribe dos veces (href y texto).

export const LINK_KINDS = ['whatsapp', 'phone', 'email', 'address', 'url', 'internal'] as const;
export type LinkKind = (typeof LINK_KINDS)[number];

const DIGITS_RE = /^\+?[0-9]{6,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** ¿`value` tiene la forma que pide ese `kind`? */
export function isValidLinkValue(kind: LinkKind, value: string): boolean {
  switch (kind) {
    case 'whatsapp':
    case 'phone':
      return DIGITS_RE.test(value);
    case 'email':
      return EMAIL_RE.test(value);
    case 'address':
      return value.length > 0 && value.length <= 255;
    case 'url':
      try {
        return new URL(value).protocol === 'https:';
      } catch {
        return false;
      }
    case 'internal':
      return value.startsWith('/') && !value.startsWith('//');
  }
}

/** Arma el href final. Asume que `value` ya pasó `isValidLinkValue`. */
export function buildHref(kind: LinkKind, value: string): string {
  switch (kind) {
    case 'whatsapp':
      return `https://wa.me/${value.replace(/^\+/, '')}`;
    case 'phone':
      return `tel:${value}`;
    case 'email':
      return `mailto:${value}`;
    case 'address':
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`;
    case 'url':
    case 'internal':
      return value;
  }
}

/** Los enlaces que salen del sitio se abren en pestaña nueva; tel:, mailto: y rutas internas no. */
export function opensInNewTab(kind: LinkKind): boolean {
  return kind === 'whatsapp' || kind === 'address' || kind === 'url';
}
