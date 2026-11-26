// Contenido editable del sitio público (FLOWS.md §86), lado servidor: trae lo que el cliente editó desde el
// ABM y lo mezcla con el manifiesto de la marca. Es la función que usan el layout y la página públicos.
import { cache } from 'react';
import { resolveManifest, type SiteContent } from '../components/public/blocks/resolve';
import { readManifestFile, type LandingManifest } from '../config/landing';

const REVALIDATE_SECONDS = 300;
const TIMEOUT_MS = 4000;

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function parseSiteContent(raw: unknown): SiteContent | null {
  if (!isObj(raw) || !isObj(raw.touched)) return null;
  const list = (v: unknown) => (Array.isArray(v) ? v.filter(isObj) : []);
  const touched = raw.touched;
  return {
    blocks: list(raw.blocks).flatMap((b) =>
      typeof b.block_type === 'string' && isObj(b.content)
        ? [{ block_type: b.block_type, content: b.content, is_visible: b.is_visible !== false }]
        : [],
    ),
    services: list(raw.services),
    clients: list(raw.clients),
    links: list(raw.links),
    touched: {
      services: touched.services === true,
      clients: touched.clients === true,
      contact_links: touched.contact_links === true,
      quick_links: touched.quick_links === true,
    },
  };
}

/**
 * GET /public/site. `null` si la API no responde: el sitio degrada al contenido del manifiesto en vez de
 * quedar vacío. La caché de 5 minutos hace que un corte breve de la API no se note.
 */
async function fetchSiteContent(): Promise<SiteContent | null> {
  // Se lee acá y no al cargar el módulo: la URL es de runtime (Railway), no del build.
  const base = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
  try {
    const response = await fetch(`${base}/public/site`, {
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) return null;
    return parseSiteContent((await response.json()).data);
  } catch {
    return null;
  }
}

/**
 * Manifiesto de la marca activa con lo editado en la base ya aplicado. `null` = la marca no tiene sitio
 * público (no se consulta la API en ese caso). Una sola lectura por request (layout, página y metadata).
 */
export const readLandingManifest = cache(async (): Promise<LandingManifest | null> => {
  const manifest = await readManifestFile();
  if (!manifest) return null;
  const site = await fetchSiteContent();
  return site ? resolveManifest(manifest, site) : manifest;
});
