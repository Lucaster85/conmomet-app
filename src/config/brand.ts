// Identidad visual por ambiente (FLOWS.md §81): cada "marca" es una carpeta en public/brands/<marca>/
// con los mismos nombres de archivo, y APP_BRAND elige cuál se usa. Todo el código apunta a
// /brand/<archivo> (ver src/app/brand/[file]/route.ts) y nunca a la ruta de un logo puntual.
//
// Solo servidor. Sin el prefijo NEXT_PUBLIC_ a propósito: se cambia en Railway sin rebuild.
// Producción no define APP_BRAND → marca `conmomet` → mismos logos que siempre.

export const DEFAULT_BRAND = 'conmomet';

// Archivos que /brand/<archivo> puede servir (lista blanca: también evita path traversal) y su
// content-type. Un archivo nuevo de marca (ej. el logo de las facturas de ARCA, `logo-factura.png`)
// se suma acá y se agrega a cada carpeta de marca.
export const BRAND_FILES: Record<string, string> = {
  'logo.png': 'image/png',
  'logo-landing.svg': 'image/svg+xml',
  'mark.png': 'image/png',
  'favicon.svg': 'image/svg+xml',
  'icon-192.png': 'image/png',
  'icon-512.png': 'image/png',
  'icon-512-maskable.png': 'image/png',
  'apple-touch-icon.png': 'image/png',
};

// Nombre de carpeta válido: minúsculas, números y guiones. Cualquier otra cosa (mayúsculas, barras,
// puntos) cae a la marca por defecto en vez de armar una ruta con un valor de entorno arbitrario.
export function getBrandName(): string {
  const raw = (process.env.APP_BRAND ?? '').trim();
  return /^[a-z0-9-]+$/.test(raw) ? raw : DEFAULT_BRAND;
}
