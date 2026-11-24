import { NextResponse } from 'next/server';
import { buildSecurityHeaders } from './utils/securityHeaders';

// Runtime Node (estable en Next 15.5): lee process.env en tiempo de ejecución, igual que el
// window.__ENV__ de layout.tsx, así API_BASE_URL y CSP_ENFORCE se cambian en Railway sin rebuild.
export function middleware() {
  const response = NextResponse.next();
  const headers = buildSecurityHeaders({
    nodeEnv: process.env.NODE_ENV,
    apiBaseUrl: process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL,
    cspEnforce: process.env.CSP_ENFORCE,
  });
  for (const [name, value] of Object.entries(headers)) {
    response.headers.set(name, value);
  }
  return response;
}

export const config = {
  runtime: 'nodejs',
  // Excluye estáticos, imágenes optimizadas, el service worker, el manifest, los íconos y las
  // imágenes de marca (/brand/*, FLOWS.md §81).
  matcher: ['/((?!_next/static|_next/image|sw\\.js|manifest\\.webmanifest|icons/|img/|brand/|favicon\\.ico).*)'],
};
