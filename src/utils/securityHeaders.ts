// Cabeceras de seguridad del frontend (FLOWS.md §75.4). Función pura para poder probarla sin Next.

export interface SecurityHeadersEnv {
  nodeEnv?: string;
  apiBaseUrl?: string;
  cspEnforce?: string;
}

const originOf = (url?: string): string => {
  if (!url) return '';
  try {
    return new URL(url).origin;
  } catch {
    return '';
  }
};

export function buildCsp(env: SecurityHeadersEnv): string {
  const isDev = env.nodeEnv !== 'production';
  const apiOrigin = originOf(env.apiBaseUrl);

  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    // 'unsafe-inline' porque Next inyecta scripts inline (hidratación y el window.__ENV__ del layout);
    // 'unsafe-eval' solo en dev (React lo usa para el overlay de errores).
    'script-src': ["'self'", "'unsafe-inline'", ...(isDev ? ["'unsafe-eval'"] : []), 'https://www.clarity.ms', 'https://*.clarity.ms', 'https://maps.googleapis.com'],
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'img-src': ["'self'", 'data:', 'blob:', 'https:'],
    'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],
    'connect-src': ["'self'", ...(apiOrigin ? [apiOrigin] : []), 'https://*.clarity.ms', 'https://maps.googleapis.com', 'https://places.googleapis.com', 'https://*.r2.cloudflarestorage.com'],
    // La vista previa de factura muestra un PDF (blob:) en un iframe.
    'frame-src': ["'self'", 'blob:'],
    'worker-src': ["'self'", 'blob:'],
    'media-src': ["'self'", 'blob:', 'mediastream:'],
    'frame-ancestors': ["'none'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
  };

  return Object.entries(directives)
    .map(([name, values]) => `${name} ${values.join(' ')}`)
    .join('; ');
}

export function buildSecurityHeaders(env: SecurityHeadersEnv): Record<string, string> {
  const enforce = env.cspEnforce === 'true';
  const headers: Record<string, string> = {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    // La cámara la usa el lector QR (html5-qrcode).
    'Permissions-Policy': 'camera=(self), microphone=(), geolocation=()',
    // Arranca en modo aviso (Report-Only): se activa con CSP_ENFORCE=true cuando no queden avisos.
    [enforce ? 'Content-Security-Policy' : 'Content-Security-Policy-Report-Only']: buildCsp(env),
  };
  if (env.nodeEnv === 'production') {
    headers['Strict-Transport-Security'] = 'max-age=31536000';
  }
  return headers;
}
