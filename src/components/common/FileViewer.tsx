'use client';
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  Alert, Box, Button, CircularProgress, DialogActions, DialogContent, DialogTitle, IconButton,
  Typography, useMediaQuery, useTheme,
} from '@mui/material';
import {
  CloseOutlined as CloseIcon,
  DownloadOutlined as DownloadIcon,
  InsertDriveFileOutlined as FileIcon,
  OpenInNewOutlined as OpenInNewIcon,
} from '@mui/icons-material';
import AppDialog from './AppDialog';
import { FileService } from '../../utils/fileService';
import { getFileExtension, getFileKind, officeViewerUrl } from '../../utils/fileKind';

// Visor de documentos de la app (FLOWS.md §54). Cualquier archivo guardado en el bucket se abre
// acá, en una ventana, en lugar de bajarse al disco; la descarga es un botón del propio visor.
// Uso: const { openFile, fileLinkProps } = useFileViewer();
//   <Button onClick={() => openFile(doc.file_url, doc.file_name)}>Ver</Button>
//   <Link {...fileLinkProps(doc.file_url, doc.file_name)}>Ver archivo</Link>   // conserva el href

interface OpenFile { url: string; name?: string }

interface FileViewerContextValue {
  openFile: (url: string | null | undefined, name?: string | null) => void;
  // Props para un <a>/Link/Button con href: el click normal abre el visor; click con Ctrl/Cmd/Shift
  // o botón del medio sigue siendo el comportamiento nativo del navegador (abrir en otra pestaña).
  fileLinkProps: (url: string, name?: string) => {
    href: string;
    target: string;
    rel: string;
    onClick: (e: React.MouseEvent) => void;
  };
}

const FileViewerContext = createContext<FileViewerContextValue | null>(null);

// Si algún componente se usa fuera del provider, cae al comportamiento viejo en vez de romperse.
const fallbackOpen = (url: string | null | undefined) => {
  if (url) window.open(url, '_blank', 'noopener,noreferrer');
};

export function useFileViewer(): FileViewerContextValue {
  const ctx = useContext(FileViewerContext);
  if (ctx) return ctx;
  return {
    openFile: fallbackOpen,
    fileLinkProps: (url) => ({ href: url, target: '_blank', rel: 'noopener noreferrer', onClick: () => undefined }),
  };
}

export function FileViewerProvider({ children }: { children: React.ReactNode }) {
  const [file, setFile] = useState<OpenFile | null>(null);

  const openFile = useCallback((url: string | null | undefined, name?: string | null) => {
    if (!url) return;
    setFile({ url, name: name || undefined });
  }, []);

  const fileLinkProps = useCallback((url: string, name?: string) => ({
    href: url,
    target: '_blank',
    rel: 'noopener noreferrer',
    onClick: (e: React.MouseEvent) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      openFile(url, name);
    },
  }), [openFile]);

  const value = useMemo(() => ({ openFile, fileLinkProps }), [openFile, fileLinkProps]);

  return (
    <FileViewerContext.Provider value={value}>
      {children}
      <FileViewerDialog file={file} onClose={() => setFile(null)} />
    </FileViewerContext.Provider>
  );
}

function FileViewerDialog({ file, onClose }: { file: OpenFile | null; onClose: () => void }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);

  // El visor se reutiliza para todos los archivos: estado limpio cada vez que cambia el archivo.
  const [lastUrl, setLastUrl] = useState<string | null>(null);
  if (file && file.url !== lastUrl) {
    setLastUrl(file.url);
    setError('');
    setLoaded(false);
  }

  const kind = file ? getFileKind(file.url, file.name) : 'other';
  const title = file?.name || (file ? decodeURIComponent(file.url.split('?')[0].split('/').pop() || 'Archivo') : '');

  const handleDownload = async () => {
    if (!file) return;
    try {
      setDownloading(true);
      setError('');
      // Algunos nombres son títulos sin extensión ("Seguro 2026"): se la agregamos desde la URL
      // para que el archivo bajado se pueda abrir.
      const ext = getFileExtension(file.url);
      const hasExt = !!file.name && /\.[a-z0-9]{2,5}$/i.test(file.name);
      const downloadName = file.name && ext && !hasExt ? `${file.name}.${ext}` : file.name;
      await FileService.download(file.url, downloadName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo descargar el archivo');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <AppDialog open={!!file} onClose={onClose} fullWidth maxWidth="lg" fullScreen={fullScreen}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 1 }}>
        <Typography component="span" variant="h6" noWrap sx={{ flex: 1, minWidth: 0 }}>{title}</Typography>
        <IconButton onClick={onClose} aria-label="Cerrar"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0, height: { xs: 'auto', sm: '70vh' }, flex: { xs: 1, sm: 'none' }, display: 'flex', flexDirection: 'column' }}>
        {file && kind === 'pdf' && (
          <Box component="iframe" src={file.url} title={title} sx={{ flex: 1, width: '100%', border: 0 }} />
        )}
        {file && kind === 'image' && (
          <Box sx={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'action.hover', overflow: 'auto', p: 1 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={file.url} alt={title} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          </Box>
        )}
        {file && kind === 'office' && (
          <Box sx={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
            {!loaded && (
              <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress size={32} />
              </Box>
            )}
            <Box
              component="iframe"
              src={officeViewerUrl(file.url)}
              title={title}
              onLoad={() => setLoaded(true)}
              sx={{ flex: 1, width: '100%', border: 0 }}
            />
          </Box>
        )}
        {file && kind === 'other' && (
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, p: 3, textAlign: 'center' }}>
            <FileIcon sx={{ fontSize: 56, color: 'text.disabled' }} />
            <Typography variant="body1" fontWeight={600}>Este tipo de archivo no tiene vista previa</Typography>
            <Typography variant="body2" color="text.secondary">Podés descargarlo con el botón de abajo.</Typography>
          </Box>
        )}
      </DialogContent>
      {error && <Alert severity="error" sx={{ borderRadius: 0 }}>{error}</Alert>}
      <DialogActions sx={{ px: 2, py: 1.5, gap: 1, flexWrap: 'wrap' }}>
        {kind === 'office' && (
          <Typography variant="caption" color="text.secondary" sx={{ mr: 'auto' }}>
            Vista provista por Microsoft Office Online. Si no carga, descargá el archivo.
          </Typography>
        )}
        {file && (kind === 'pdf' || kind === 'image') && (
          // En el celular el visor de PDF embebido es limitado: el navegador lo muestra mejor en su propia pestaña.
          <Button
            component="a"
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            startIcon={<OpenInNewIcon />}
            sx={{ mr: 'auto' }}
          >
            Abrir en pestaña
          </Button>
        )}
        <Button onClick={handleDownload} disabled={downloading} variant="contained" startIcon={downloading ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}>
          Descargar
        </Button>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </AppDialog>
  );
}
