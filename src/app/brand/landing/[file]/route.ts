import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { getBrandName, LANDING_IMAGE_RE, LANDING_IMAGE_TYPES } from '../../../../config/brand';

// Sirve /brand/landing/<archivo> desde public/brands/<APP_BRAND>/landing/<archivo> (FLOWS.md §86):
// la foto del hero y los logos de clientes de la landing. Calcado de /brand/[file], con dos
// diferencias a propósito:
//  - el nombre se valida con un patrón (cada marca pone los suyos) en vez de una lista blanca;
//  - NO cae a la marca por defecto: un cliente sin foto no debe mostrar la de Conmomet.
//
// force-dynamic: APP_BRAND se lee en cada request, no se congela en el build.
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  // El patrón no admite `/` ni `.` suelto: `../x` es 404 sin tocar el disco.
  if (!LANDING_IMAGE_RE.test(file)) return new Response('Not found', { status: 404 });

  let body: Buffer;
  try {
    body = await readFile(path.join(process.cwd(), 'public', 'brands', getBrandName(), 'landing', file));
  } catch {
    return new Response('Not found', { status: 404 });
  }

  return new Response(new Uint8Array(body), {
    headers: {
      'Content-Type': LANDING_IMAGE_TYPES[file.split('.').pop() as string],
      'X-Content-Type-Options': 'nosniff',
      // Corto a propósito: si se cambia APP_BRAND o se reemplaza una imagen, no queda cacheado por días.
      'Cache-Control': 'public, max-age=300',
    },
  });
}
