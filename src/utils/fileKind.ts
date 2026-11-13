// Cómo se muestra un archivo en el visor de documentos (FileViewer). Se decide por la extensión de
// la URL: las keys del bucket las genera uploadToR2 como "<carpeta>/<uuid>.<ext>", así que la
// extensión siempre está y viene en minúscula.
export type FileKind = 'pdf' | 'image' | 'office' | 'other';

const IMAGE_EXT = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'avif'];
// Word / Excel / PowerPoint: el navegador no los muestra, se ven con el visor online de Microsoft.
const OFFICE_EXT = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];

const extensionOf = (value: string): string => {
  const segment = value.split(/[?#]/)[0].split('/').pop() || '';
  return segment.includes('.') ? (segment.split('.').pop() || '').toLowerCase() : '';
};

// La URL manda (es el archivo real); el nombre solo desempata si la URL no trae extensión.
export function getFileExtension(url: string, name?: string): string {
  return extensionOf(url) || (name ? extensionOf(name) : '');
}

export function getFileKind(url: string, name?: string): FileKind {
  const ext = getFileExtension(url, name);
  if (ext === 'pdf') return 'pdf';
  if (IMAGE_EXT.includes(ext)) return 'image';
  if (OFFICE_EXT.includes(ext)) return 'office';
  return 'other';
}

// Visor online de Microsoft: lee el archivo desde la URL que se le pasa. Con el bucket privado tiene
// que ser la URL FIRMADA (FileService.getSignedUrl): Office la lee mientras dure la firma (10 min).
export function officeViewerUrl(signedUrl: string): string {
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(signedUrl)}`;
}
