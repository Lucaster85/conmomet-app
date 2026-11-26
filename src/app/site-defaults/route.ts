import { readManifestFile } from '../../config/landing';

// Lo que dice HOY el landing.json de la marca (sin lo editado en la base), para que el ABM de Configuración General
// pueda cargarlo y editarlo en vez de pedir tipear todo de cero (FLOWS.md §86). Es el mismo contenido que se ve en
// la web pública, así que no requiere sesión. 404 si la marca no tiene sitio público.
//
// force-dynamic: APP_BRAND se lee en cada request.
export const dynamic = 'force-dynamic';

export async function GET() {
  const manifest = await readManifestFile();
  if (!manifest) return new Response('Not found', { status: 404 });

  return Response.json(
    {
      data: {
        blocks: manifest.blocks.map((b) => ({ type: b.type, navLabel: b.navLabel, content: b.content })),
        footer: { contact: manifest.footer.contact, links: manifest.footer.links },
      },
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
