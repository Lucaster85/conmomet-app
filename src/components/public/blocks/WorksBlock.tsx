import { BLOCK_ANCHORS } from '../../../config/landing';
import type { BlockProps } from './types';
import WorksGallery from './WorksGallery';

// Las obras salen del módulo Artículos (`/public/media/type/slider`), no del manifiesto: el bloque
// solo aporta los textos. Este wrapper server existe para no mandar el manifiesto entero al cliente.
export default function WorksBlock({ block }: BlockProps<'works'>) {
  return <WorksGallery id={BLOCK_ANCHORS.works} {...block.content} />;
}
