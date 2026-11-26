// Manifiesto de la landing por marca (FLOWS.md §86): public/brands/<APP_BRAND>/landing.json declara qué
// bloques tiene el sitio público, en qué orden, con qué variante, la paleta y el contenido por defecto.
//
// Solo servidor (usa `fs`). La ausencia del archivo ES el interruptor: sin `landing.json` no hay
// sitio público y `/` va al login. No hay fallback a la marca por defecto, a propósito: un cliente sin
// manifiesto no debe heredar la landing de Conmomet.
//
// El shape se valida a mano (convención del repo: no hay zod/Joi). Lo inválido se descarta con un
// aviso en consola en vez de romper la página; un JSON ilegible o sin ningún bloque válido equivale
// a "sin sitio público".

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { cache } from 'react';
import { PUBLIC_ICONS, type PublicIconKey } from '../components/public/icons';
import { isValidLinkValue, LINK_KINDS, type LinkKind } from '../components/public/links';
import { getBrandName, LANDING_IMAGE_RE } from './brand';
import { getEnvironmentConfig, normalizeHex } from './environment';

export const BLOCK_TYPES = ['hero', 'about', 'services', 'works', 'clients', 'contact'] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];

/** Ancla de cada tipo de bloque: de acá se deriva el menú, no se escribe a mano. */
export const BLOCK_ANCHORS: Record<BlockType, string> = {
  hero: 'inicio',
  about: 'nosotros',
  services: 'servicios',
  works: 'nuestro-trabajo',
  clients: 'clientes',
  contact: 'contacto',
};

export const HERO_VARIANTS = ['blueprint-silo', 'blueprint-grid'] as const;
export type HeroVariant = (typeof HERO_VARIANTS)[number];

// Clave del manifiesto → variable CSS que pisa en el wrapper de la web pública (ver globals.css).
const THEME_VARS = {
  bg: '--pub-bg',
  navy: '--pub-navy',
  navy2: '--pub-navy-2',
  brand: '--pub-brand',
  brandDeep: '--pub-brand-deep',
  action: '--pub-action',
  line: '--pub-line',
  muted: '--pub-muted',
} as const;

export interface HeroContent {
  eyebrow: string;
  /** Admite `**negrita**`. */
  subtitle: string;
  primaryCta: string;
  secondaryCta: string;
  /** Archivo dentro de public/brands/<marca>/landing/, o null si la marca no tiene foto. */
  image: string | null;
  imageAlt: string;
}
export interface AboutContent {
  eyebrow: string;
  title: string;
  paragraphs: string[];
  banner: string;
}
export interface ServiceItem {
  icon: PublicIconKey;
  title: string;
  text: string;
  bullets: string[];
}
export interface ServicesContent {
  eyebrow: string;
  title: string;
  items: ServiceItem[];
}
export interface WorksContent {
  eyebrow: string;
  title: string;
  /** Mensaje cuando todavía no hay obras cargadas en Artículos. */
  empty: string;
}
export interface ClientItem {
  name: string;
  shortName: string;
  logo: string | null;
}
export interface ClientsContent {
  eyebrow: string;
  title: string;
  subtitle: string;
  items: ClientItem[];
}
export interface ContactContent {
  eyebrow: string;
  title: string;
  subtitle: string;
}

interface BlockBase {
  /** Texto en el menú; null = el bloque no aparece en el menú. */
  navLabel: string | null;
}
export type LandingBlock =
  | (BlockBase & { type: 'hero'; variant: HeroVariant; content: HeroContent })
  | (BlockBase & { type: 'about'; content: AboutContent })
  | (BlockBase & { type: 'services'; content: ServicesContent })
  | (BlockBase & { type: 'works'; content: WorksContent })
  | (BlockBase & { type: 'clients'; content: ClientsContent })
  | (BlockBase & { type: 'contact'; content: ContactContent });

export type BlockOf<T extends BlockType> = Extract<LandingBlock, { type: T }>;

export interface LandingLink {
  icon: PublicIconKey;
  kind: LinkKind;
  value: string;
  label: string;
}
export interface LandingFooter {
  description: string;
  /** «Powered by Lucaster Web Studio»; se apaga con `"attribution": false`. */
  attribution: boolean;
  /** Alimenta la sección #contacto (sin las direcciones) y la columna Contacto del pie. */
  contact: LandingLink[];
  links: LandingLink[];
}

export interface LandingManifest {
  /** Variables CSS ya validadas (`--pub-brand` → `#2B6CB0`), listas para el `style` del wrapper. */
  themeVars: Record<string, string>;
  seo: { claim: string; description: string };
  blocks: LandingBlock[];
  footer: LandingFooter;
}

type Json = Record<string, unknown>;

const isObj = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v);
const text = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
const textList = (v: unknown): string[] =>
  Array.isArray(v) ? v.map(text).filter((s) => s.length > 0) : [];

function warn(message: string): void {
  console.warn(`[landing] ${getBrandName()}: ${message}`);
}

// `{{empresa}}` → nombre legal, `{{EMPRESA}}` → nombre legal en mayúsculas, `{{app}}` → nombre corto.
// Se aplica a todo el manifiesto antes de validar, así los componentes reciben el texto ya resuelto
// y el nombre del cliente no se repite en el JSON (queda atado a APP_NAME / APP_LEGAL_NAME).
function interpolate(value: unknown, legalName: string, appName: string): unknown {
  if (typeof value === 'string') {
    return value
      .replace(/{{empresa}}/g, () => legalName)
      .replace(/{{EMPRESA}}/g, () => legalName.toUpperCase())
      .replace(/{{app}}/g, () => appName);
  }
  if (Array.isArray(value)) return value.map((v) => interpolate(v, legalName, appName));
  if (isObj(value)) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, interpolate(v, legalName, appName)]));
  }
  return value;
}

/** Aplica los marcadores `{{empresa}}`, `{{EMPRESA}}` y `{{app}}` a cualquier valor con los nombres de la marca. */
export function interpolateNames<T>(value: T): T {
  const { legalName, appName } = getEnvironmentConfig();
  return interpolate(value, legalName, appName) as T;
}

function imageFile(v: unknown, where: string): string | null {
  const file = text(v);
  if (!file) return null;
  if (!LANDING_IMAGE_RE.test(file)) {
    warn(`${where}: «${file}» no es un nombre de imagen válido (minúsculas, números y guiones + extensión).`);
    return null;
  }
  return file;
}

function parseTheme(raw: unknown): Record<string, string> {
  const vars: Record<string, string> = {};
  if (!isObj(raw)) return vars;
  for (const [key, cssVar] of Object.entries(THEME_VARS)) {
    if (raw[key] === undefined) continue;
    const hex = normalizeHex(typeof raw[key] === 'string' ? raw[key] : undefined);
    if (hex) vars[cssVar] = hex;
    else warn(`theme.${key}: color inválido, se usa el de la paleta base.`);
  }
  return vars;
}

export function parseLinks(raw: unknown, where: string): LandingLink[] {
  if (!Array.isArray(raw)) return [];
  const links: LandingLink[] = [];
  raw.forEach((item, i) => {
    const at = `${where}[${i}]`;
    if (!isObj(item)) return warn(`${at}: no es un objeto, se descarta.`);
    const icon = text(item.icon);
    const kind = text(item.kind);
    const value = text(item.value);
    const label = text(item.label);
    if (!Object.prototype.hasOwnProperty.call(PUBLIC_ICONS, icon)) return warn(`${at}: ícono «${icon}» desconocido, se descarta.`);
    if (!(LINK_KINDS as readonly string[]).includes(kind)) return warn(`${at}: kind «${kind}» desconocido, se descarta.`);
    if (!isValidLinkValue(kind as LinkKind, value)) return warn(`${at}: «${value}» no es válido para kind «${kind}», se descarta.`);
    if (!label) return warn(`${at}: sin label, se descarta.`);
    links.push({ icon: icon as PublicIconKey, kind: kind as LinkKind, value, label });
  });
  return links;
}

export function parseServices(raw: unknown): ServiceItem[] {
  if (!Array.isArray(raw)) return [];
  const items: ServiceItem[] = [];
  raw.forEach((item, i) => {
    const at = `services.items[${i}]`;
    if (!isObj(item)) return warn(`${at}: no es un objeto, se descarta.`);
    const icon = text(item.icon);
    const title = text(item.title);
    if (!title) return warn(`${at}: sin título, se descarta.`);
    if (!Object.prototype.hasOwnProperty.call(PUBLIC_ICONS, icon)) return warn(`${at}: ícono «${icon}» desconocido, se descarta.`);
    items.push({ icon: icon as PublicIconKey, title, text: text(item.text), bullets: textList(item.bullets) });
  });
  return items;
}

export function parseClients(raw: unknown): ClientItem[] {
  if (!Array.isArray(raw)) return [];
  const items: ClientItem[] = [];
  raw.forEach((item, i) => {
    const at = `clients.items[${i}]`;
    if (!isObj(item)) return warn(`${at}: no es un objeto, se descarta.`);
    const name = text(item.name);
    if (!name) return warn(`${at}: sin nombre, se descarta.`);
    items.push({
      name,
      shortName: (text(item.shortName) || name.slice(0, 3)).toUpperCase().slice(0, 8),
      logo: imageFile(item.logo, `${at}.logo`),
    });
  });
  return items;
}

function parseBlock(raw: unknown, i: number): LandingBlock | null {
  const at = `blocks[${i}]`;
  if (!isObj(raw)) {
    warn(`${at}: no es un objeto, se descarta.`);
    return null;
  }
  const type = text(raw.type);
  if (!(BLOCK_TYPES as readonly string[]).includes(type)) {
    warn(`${at}: tipo «${type}» desconocido, se descarta.`);
    return null;
  }
  const content = isObj(raw.content) ? raw.content : {};
  const navLabel = text(raw.navLabel) || null;
  const eyebrow = text(content.eyebrow);
  const title = text(content.title);

  if (type !== 'hero' && !title) {
    warn(`${at} (${type}): sin content.title, se descarta.`);
    return null;
  }

  switch (type as BlockType) {
    case 'hero': {
      const variant = text(raw.variant) || HERO_VARIANTS[0];
      if (!(HERO_VARIANTS as readonly string[]).includes(variant)) {
        warn(`${at}: variante de hero «${variant}» desconocida, se descarta.`);
        return null;
      }
      return {
        type: 'hero',
        variant: variant as HeroVariant,
        navLabel,
        content: {
          eyebrow,
          subtitle: text(content.subtitle),
          primaryCta: text(content.primaryCta),
          secondaryCta: text(content.secondaryCta),
          image: imageFile(content.image, `${at}.content.image`),
          imageAlt: text(content.imageAlt),
        },
      };
    }
    case 'about':
      return {
        type: 'about',
        navLabel,
        content: { eyebrow, title, paragraphs: textList(content.paragraphs), banner: text(content.banner) },
      };
    case 'services':
      return { type: 'services', navLabel, content: { eyebrow, title, items: parseServices(content.items) } };
    case 'works':
      return { type: 'works', navLabel, content: { eyebrow, title, empty: text(content.empty) } };
    case 'clients':
      return {
        type: 'clients',
        navLabel,
        content: { eyebrow, title, subtitle: text(content.subtitle), items: parseClients(content.items) },
      };
    case 'contact':
      return { type: 'contact', navLabel, content: { eyebrow, title, subtitle: text(content.subtitle) } };
  }
}

function parseManifest(raw: unknown): LandingManifest | null {
  if (!isObj(raw)) {
    warn('landing.json no es un objeto.');
    return null;
  }

  // Un bloque por tipo: el ancla (#servicios…) tiene que ser única.
  const seen = new Set<BlockType>();
  const blocks: LandingBlock[] = [];
  (Array.isArray(raw.blocks) ? raw.blocks : []).forEach((item, i) => {
    const block = parseBlock(item, i);
    if (!block) return;
    if (seen.has(block.type)) return warn(`blocks[${i}]: «${block.type}» repetido, se descarta (un bloque por tipo).`);
    seen.add(block.type);
    blocks.push(block);
  });
  if (blocks.length === 0) {
    warn('no tiene ningún bloque válido: se trata como "sin sitio público".');
    return null;
  }

  const seo = isObj(raw.seo) ? raw.seo : {};
  const footer = isObj(raw.footer) ? raw.footer : {};
  return {
    themeVars: parseTheme(raw.theme),
    seo: { claim: text(seo.claim), description: text(seo.description) },
    blocks,
    footer: {
      description: text(footer.description),
      attribution: footer.attribution !== false,
      contact: parseLinks(footer.contact, 'footer.contact'),
      links: parseLinks(footer.links, 'footer.links'),
    },
  };
}

/**
 * Lee y valida SOLO el archivo de la marca activa, sin el contenido editado en la base. `null` = la marca
 * no tiene sitio público. Para renderizar el sitio usar `readLandingManifest` de src/utils/siteContent.ts, que
 * además mezcla lo que el cliente editó. `cache` de React: una sola lectura por request. APP_BRAND se respeta
 * en cada request porque el layout raíz es `force-dynamic`.
 */
export const readManifestFile = cache(async (): Promise<LandingManifest | null> => {
  const file = path.join(process.cwd(), 'public', 'brands', getBrandName(), 'landing.json');
  let source: string;
  try {
    source = await readFile(file, 'utf8');
  } catch (error) {
    // Que no exista es el caso normal (marca sin sitio público); cualquier otro error sí se avisa.
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') console.error('[landing] no se pudo leer landing.json:', error);
    return null;
  }

  let raw: unknown;
  try {
    raw = JSON.parse(source);
  } catch (error) {
    console.error(`[landing] ${getBrandName()}: landing.json no es un JSON válido:`, error);
    return null;
  }

  const { legalName, appName } = getEnvironmentConfig();
  return parseManifest(interpolate(raw, legalName, appName));
});
