import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { BRAND_FILES, DEFAULT_BRAND, getBrandName } from '../../../config/brand';

// Sirve /brand/<archivo> desde public/brands/<APP_BRAND>/<archivo> (FLOWS.md §81). Si la marca
// elegida no tiene ese archivo, cae al de la marca por defecto: una marca nueva puede traer solo el
// logo y heredar el resto.
//
// force-dynamic: APP_BRAND se lee en cada request, no se congela en el build.
export const dynamic = 'force-dynamic';

async function readBrandFile(brand: string, file: string): Promise<Buffer | null> {
  try {
    return await readFile(path.join(process.cwd(), 'public', 'brands', brand, file));
  } catch {
    return null;
  }
}

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  // hasOwn contra la lista blanca: cualquier otro nombre (incluido `../x`) es 404 sin tocar el disco.
  if (!Object.prototype.hasOwnProperty.call(BRAND_FILES, file)) {
    return new Response('Not found', { status: 404 });
  }

  const brand = getBrandName();
  const body = (await readBrandFile(brand, file)) ?? (brand !== DEFAULT_BRAND ? await readBrandFile(DEFAULT_BRAND, file) : null);
  if (!body) return new Response('Not found', { status: 404 });

  return new Response(new Uint8Array(body), {
    headers: {
      'Content-Type': BRAND_FILES[file],
      // Corto a propósito: si se cambia APP_BRAND o se reemplaza un logo, no queda cacheado por días.
      'Cache-Control': 'public, max-age=300',
    },
  });
}
