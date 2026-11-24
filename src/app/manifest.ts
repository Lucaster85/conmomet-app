import type { MetadataRoute } from 'next';
import { getEnvironmentConfig } from '../config/environment';

// Manifest dinámico (reemplaza a public/manifest.webmanifest, FLOWS.md §81): los íconos salen de la
// marca activa (/brand/*) y, en un ambiente con marca, el nombre y el theme_color lo reflejan —
// así una PWA instalada desde test no se confunde con la de producción en el celular.
//
// force-dynamic: lee env vars en cada request, no se congela en el build. Sigue sirviéndose en
// /manifest.webmanifest, la misma URL que ya referencia el layout.
export const dynamic = 'force-dynamic';

export default function manifest(): MetadataRoute.Manifest {
  const { label, color } = getEnvironmentConfig();
  const name = label ? `Conmomet ${label}` : 'Conmomet';
  return {
    name,
    short_name: name,
    description: 'Sistema de gestión Conmomet',
    lang: 'es-AR',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: label ? color : '#F44336',
    icons: [
      { src: '/brand/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/brand/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/brand/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
