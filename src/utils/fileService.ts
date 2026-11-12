import { TokenManager } from './auth';

// Misma resolución de la URL base que utils/api.ts: window.__ENV__ en runtime (Docker/Railway) o
// el embed de build-time en dev local.
const API_BASE_URL =
  (typeof window !== 'undefined' && (window as { __ENV__?: { API_BASE_URL?: string } }).__ENV__?.API_BASE_URL) ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://localhost:4000';

export class FileService {
  // Baja un archivo del bucket al disco del usuario (botón "Descargar" del visor de documentos).
  // Pasa por GET /files/download con el token y arma un blob: no depende de CORS del bucket ni de
  // que el navegador decida abrir el tipo de archivo en lugar de bajarlo.
  static async download(fileUrl: string, fileName?: string): Promise<void> {
    const params = new URLSearchParams({ url: fileUrl });
    if (fileName) params.set('name', fileName);
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/files/download?${params.toString()}`);
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || 'No se pudo descargar el archivo');
    }
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    try {
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = fileName || decodeURIComponent(fileUrl.split('?')[0].split('/').pop() || 'archivo');
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
    }
  }
}
