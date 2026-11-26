import type { ComponentType } from 'react';
import type { BlockType, LandingBlock, LandingManifest } from '../../../config/landing';
import AboutBlock from './AboutBlock';
import ClientsBlock from './ClientsBlock';
import ContactBlock from './ContactBlock';
import HeroBlock from './HeroBlock';
import ServicesBlock from './ServicesBlock';
import type { BlockProps } from './types';
import WorksBlock from './WorksBlock';

// Registro de bloques (FLOWS.md §86). Para agregar un tipo nuevo: su componente acá, su tipo en
// BLOCK_TYPES / BLOCK_ANCHORS / parseBlock de src/config/landing.ts, y listo. El `satisfies` hace que
// olvidarse de uno sea un error de compilación.
const BLOCKS = {
  hero: HeroBlock,
  about: AboutBlock,
  services: ServicesBlock,
  works: WorksBlock,
  clients: ClientsBlock,
  contact: ContactBlock,
} satisfies { [T in BlockType]: ComponentType<BlockProps<T>> };

export function renderBlock(block: LandingBlock, manifest: LandingManifest) {
  // TS no puede correlacionar `block.type` con el componente de la unión; la correspondencia la
  // garantiza el `satisfies` de arriba.
  const Block = BLOCKS[block.type] as ComponentType<BlockProps>;
  return <Block key={block.type} block={block} manifest={manifest} />;
}
