import type { CSSProperties } from 'react';
import { redirect } from 'next/navigation';
import PublicFooter from '../../components/public/PublicFooter';
import PublicHeader, { type NavItem } from '../../components/public/PublicHeader';
import { BLOCK_ANCHORS, readLandingManifest } from '../../config/landing';

// Route group de la web pública (landing y /trabaja-con-nosotros): no cambia ninguna URL.
// Todo sale del manifiesto de la marca (public/brands/<APP_BRAND>/landing.json, FLOWS.md §86). Sin
// manifiesto no hay sitio público: va acá y no en la página para cubrir también
// /trabaja-con-nosotros, que un cliente con su propia web tampoco quiere.
//
// Las clases van en un wrapper y no en el <body> porque le ganan a los selectores de `body` del
// CssBaseline de MUI y al `font-family: Arial` de globals.css, que si no pisarían la tipografía.
// `data-public-site` habilita el scroll suave por anchor solo acá (ver globals.css). La paleta de la
// marca pisa las variables `--pub-*` en este mismo wrapper y cascadea a todas las utilidades.
export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const manifest = await readLandingManifest();
  if (!manifest) redirect('/login');

  // El menú se deriva de los bloques: no puede quedar desincronizado con las secciones que existen.
  const navItems: NavItem[] = manifest.blocks.flatMap((block) =>
    block.navLabel ? [{ label: block.navLabel, href: `#${BLOCK_ANCHORS[block.type]}` }] : [],
  );
  const hasContact = manifest.blocks.some((block) => block.type === 'contact');

  return (
    <div
      data-public-site
      className="font-body min-h-dvh bg-pub-bg text-pub-navy"
      style={manifest.themeVars as CSSProperties}
    >
      <PublicHeader navItems={navItems} contactHref={hasContact ? `#${BLOCK_ANCHORS.contact}` : null} />
      <main>{children}</main>
      <PublicFooter footer={manifest.footer} />
    </div>
  );
}
