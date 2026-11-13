'use client';
import React, { useEffect, useState } from 'react';
import { FileService } from '../../utils/fileService';

// Imágenes sueltas del bucket privado (FLOWS.md §57): firmas, miniaturas de seguimiento, etc.
// Lo guardado en la base no abre por sí solo; se pide la URL firmada (cacheada y agrupada en
// FileService.getSignedUrl, así una grilla de miniaturas hace un solo POST).

export interface SignedFileUrlState {
  // URL firmada lista para usar en src/href; null mientras se resuelve o si falló.
  url: string | null;
  error: boolean;
}

// Resuelve la URL firmada de un archivo guardado. Con url vacía devuelve null sin pedir nada.
export function useSignedFileUrl(storedUrl: string | null | undefined): SignedFileUrlState {
  const [state, setState] = useState<{ source: string | null | undefined; url: string | null; error: boolean }>(
    () => ({ source: storedUrl, url: storedUrl ? FileService.peekSignedUrl(storedUrl) : null, error: false }),
  );

  // Si cambia el archivo, se descarta lo resuelto para el anterior (sin pasar por un frame con la
  // firma vieja).
  if (state.source !== storedUrl) {
    setState({ source: storedUrl, url: storedUrl ? FileService.peekSignedUrl(storedUrl) : null, error: false });
  }

  useEffect(() => {
    if (!storedUrl || FileService.peekSignedUrl(storedUrl)) return;
    let cancelled = false;
    FileService.getSignedUrl(storedUrl)
      .then((signed) => { if (!cancelled) setState({ source: storedUrl, url: signed, error: false }); })
      .catch(() => { if (!cancelled) setState({ source: storedUrl, url: null, error: true }); });
    return () => { cancelled = true; };
  }, [storedUrl]);

  return { url: state.source === storedUrl ? state.url : null, error: state.source === storedUrl && state.error };
}

type StoredImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  // Referencia guardada en la base (la URL "canónica"), NO una URL firmada.
  src: string | null | undefined;
};

// <img> para un archivo del bucket privado. Mientras se firma (o si falla) muestra un recuadro con
// el mismo tamaño que `style`, para que la grilla no salte.
export default function StoredImage({ src, alt, style, ...rest }: StoredImageProps) {
  const { url, error } = useSignedFileUrl(src);

  if (!url) {
    return (
      <span
        role={error ? 'img' : undefined}
        aria-label={error ? `${alt || 'Imagen'} (no disponible)` : undefined}
        aria-busy={!error}
        style={{
          display: 'inline-block',
          background: 'rgba(128, 128, 128, 0.15)',
          borderRadius: 4,
          minWidth: 24,
          minHeight: 24,
          ...style,
        }}
      />
    );
  }
  // eslint-disable-next-line @next/next/no-img-element -- URL firmada dinámica de R2: next/image no aporta nada acá.
  return <img src={url} alt={alt} style={style} {...rest} />;
}
