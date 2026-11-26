import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { renderBlock } from '../../components/public/blocks/registry';
import FloatingCta from '../../components/public/FloatingCta';
import { getEnvironmentConfig } from '../../config/environment';
import { readLandingManifest } from '../../utils/siteContent';

// Server component: la landing no necesita estado, así que puede exportar metadata real, con el
// prefijo del ambiente. El claim y la descripción salen del manifiesto de la marca.
export async function generateMetadata(): Promise<Metadata> {
  const manifest = await readLandingManifest();
  if (!manifest) return {}; // el layout redirige al login
  const { label, legalName } = getEnvironmentConfig();
  const { claim, description } = manifest.seo;
  const title = `${label ? `[${label}] ` : ''}${legalName}${claim ? ` | ${claim}` : ''}`;
  return {
    title,
    description: description || undefined,
    openGraph: { title, description: description || undefined, type: 'website', locale: 'es_AR', siteName: legalName },
  };
}

export default async function LandingPage() {
  const manifest = await readLandingManifest();
  if (!manifest) redirect('/login');

  return (
    <>
      {manifest.blocks.map((block) => renderBlock(block, manifest))}
      {manifest.blocks.some((block) => block.type === 'contact') && <FloatingCta />}
    </>
  );
}
