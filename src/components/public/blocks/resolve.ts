// Mezcla el manifiesto de la marca (archivo) con lo que el cliente editó en la base (FLOWS.md §86).
// Función pura y solo de servidor (importa de config/landing, que usa `fs`).
//
// Reglas:
//  - El texto de un bloque se mezcla campo por campo: la base pisa solo lo que trae.
//  - Servicios, clientes y los dos grupos de enlaces del pie se reemplazan enteros por la lista de la base
//    solo si esa lista alguna vez tuvo filas (`touched`). Una lista que nunca se tocó significa "usá el
//    archivo", no "no quiero servicios"; en cambio una que se cargó y se desactivó entera sí oculta la sección.
//  - Un bloque marcado como no visible no se dibuja y tampoco aparece en el menú (el menú sale de los bloques).
//  - Servicios o clientes sin ningún ítem dejan de dibujarse: un título sobre una grilla vacía no sirve.
import {
  interpolateNames,
  parseClients,
  parseLinks,
  parseServices,
  type LandingBlock,
  type LandingManifest,
} from '../../../config/landing';

export interface SiteContent {
  blocks: { block_type: string; content: Record<string, unknown>; is_visible: boolean }[];
  services: unknown[];
  clients: { name?: unknown; short_name?: unknown; logo_file?: unknown }[];
  links: { group?: unknown }[];
  touched: { services: boolean; clients: boolean; contact_links: boolean; quick_links: boolean };
}

// Solo se pisan campos que el bloque ya tiene y del mismo tipo (texto por texto, lista por lista); un valor
// vacío o de otro tipo se ignora y queda el del manifiesto. La imagen no se toca: viaja por la carpeta de marca.
function overrideContent<T extends LandingBlock>(block: T, override: Record<string, unknown>): T {
  const content: Record<string, unknown> = { ...block.content };
  for (const [key, value] of Object.entries(override)) {
    if (key === 'image' || !(key in content)) continue;
    if (typeof content[key] === 'string' && typeof value === 'string' && value.trim()) {
      content[key] = interpolateNames(value.trim());
    } else if (
      Array.isArray(content[key]) &&
      Array.isArray(value) &&
      value.length > 0 &&
      value.every((v) => typeof v === 'string' && v.trim())
    ) {
      // Solo las listas de texto (los párrafos de "Nosotros"); los ítems de servicios y clientes van por sus tablas.
      if (typeof (content[key] as unknown[])[0] === 'string') content[key] = interpolateNames(value);
    }
  }
  return { ...block, content } as T;
}

export function resolveManifest(manifest: LandingManifest, site: SiteContent): LandingManifest {
  const blocks: LandingBlock[] = [];

  for (const original of manifest.blocks) {
    const row = site.blocks.find((b) => b.block_type === original.type);
    if (row && !row.is_visible) continue;
    let block: LandingBlock = row ? overrideContent(original, row.content) : original;

    if (block.type === 'services' && site.touched.services) {
      block = { ...block, content: { ...block.content, items: parseServices(interpolateNames(site.services)) } };
    }
    if (block.type === 'clients' && site.touched.clients) {
      const rows = site.clients.map((c) => ({ name: c.name, shortName: c.short_name, logo: c.logo_file }));
      block = { ...block, content: { ...block.content, items: parseClients(interpolateNames(rows)) } };
    }
    if ((block.type === 'services' || block.type === 'clients') && block.content.items.length === 0) continue;

    blocks.push(block);
  }

  const linksOf = (group: 'contact' | 'quick') =>
    parseLinks(interpolateNames(site.links.filter((l) => l.group === group)), `site.links.${group}`);

  return {
    ...manifest,
    blocks,
    footer: {
      ...manifest.footer,
      contact: site.touched.contact_links ? linksOf('contact') : manifest.footer.contact,
      links: site.touched.quick_links ? linksOf('quick') : manifest.footer.links,
    },
  };
}
