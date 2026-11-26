import type { BlockOf, BlockType, LandingManifest } from '../../../config/landing';

/**
 * Props de todo bloque: el bloque ya validado y el manifiesto entero, porque algunos necesitan mirar
 * a los demás (el hero decide si enlaza a #contacto según exista ese bloque; el contacto lee los
 * canales del pie).
 */
export interface BlockProps<T extends BlockType = BlockType> {
  block: BlockOf<T>;
  manifest: LandingManifest;
}
