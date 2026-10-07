'use client';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert, Box, Button, Card, Dialog, DialogActions, DialogContent, IconButton, Link, Paper, Stack, TextField, Typography,
} from '@mui/material';
import {
  AddPhotoAlternateOutlined as PhotoIcon, CloseOutlined as CloseIcon, SendOutlined as SendIcon,
} from '@mui/icons-material';
import GearSpinner from '../GearSpinner';
import FeedbackModal from '../FeedbackModal';
import { ProjectLogEntry, ProjectLogFile, ProjectLogService } from '../../utils/api';
import { useAuth } from '../../utils/auth';
import { shrinkImage } from '../../utils/imageResize';

interface Props {
  projectId: number;
}

interface PendingPhoto {
  file: File;
  preview: string;
}

const dayKey = (iso: string) => new Date(iso).toLocaleDateString('en-CA');

const dayLabel = (iso: string) => {
  const key = dayKey(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (key === today.toLocaleDateString('en-CA')) return 'Hoy';
  if (key === yesterday.toLocaleDateString('en-CA')) return 'Ayer';
  const label = new Date(iso).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
};

const timeLabel = (iso: string) => new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

// Seguimiento de un proyecto o adicional: notas de seguimiento con fecha, autor y fotos. Se usa en la
// pestaña "Seguimiento" de la ficha de un proyecto y en la ficha de un adicional. Pensada para
// cargarse desde el celular (un campo, un botón de foto, un botón de enviar) y leerse igual en
// escritorio. Es un registro de solo agregar: no hay edición ni borrado.
export default function ProjectLogPanel({ projectId }: Props) {
  const { user } = useAuth();
  const permissions: string[] = Array.isArray((user as unknown as Record<string, unknown>)?.permissions)
    ? ((user as unknown as Record<string, unknown>).permissions as string[])
    : [];
  const canRead = permissions.includes('admin_granted') || permissions.includes('project_logs_read');
  const canWrite = permissions.includes('admin_granted') || permissions.includes('project_logs_write');

  const [entries, setEntries] = useState<ProjectLogEntry[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [note, setNote] = useState('');
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const [processingPhotos, setProcessingPhotos] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [lightbox, setLightbox] = useState<ProjectLogFile | null>(null);
  const photosRef = useRef<PendingPhoto[]>([]);
  photosRef.current = photos;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const result = await ProjectLogService.list(projectId);
      setEntries(result.data);
      setHasMore(result.has_more);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el seguimiento');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { if (canRead) load(); }, [canRead, load]);

  // Las miniaturas usan object URLs: se liberan al desmontar.
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.preview)), []);

  const handleLoadMore = async () => {
    const last = entries[entries.length - 1];
    if (!last) return;
    try {
      setLoadingMore(true);
      const result = await ProjectLogService.list(projectId, last.id);
      setEntries((prev) => [...prev, ...result.data]);
      setHasMore(result.has_more);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar más notas');
    } finally {
      setLoadingMore(false);
    }
  };

  const handlePickPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = '';
    if (picked.length === 0) return;
    setProcessingPhotos(true);
    try {
      const shrunk = await Promise.all(picked.map(shrinkImage));
      setPhotos((prev) => [...prev, ...shrunk.map((file) => ({ file, preview: URL.createObjectURL(file) }))].slice(0, 8));
    } finally {
      setProcessingPhotos(false);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const canSubmit = (note.trim().length > 0 || photos.length > 0) && !saving && !processingPhotos;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      const created = await ProjectLogService.create(projectId, note, photos.map((p) => p.file));
      setEntries((prev) => [created, ...prev]);
      setNote('');
      photos.forEach((p) => URL.revokeObjectURL(p.preview));
      setPhotos([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al agregar la nota');
    } finally {
      setSaving(false);
    }
  };

  // Agrupadas por día, de la más nueva a la más vieja.
  const groups = useMemo(() => {
    const result: { key: string; label: string; items: ProjectLogEntry[] }[] = [];
    for (const entry of entries) {
      const key = dayKey(entry.createdAt);
      const last = result[result.length - 1];
      if (last && last.key === key) last.items.push(entry);
      else result.push({ key, label: dayLabel(entry.createdAt), items: [entry] });
    }
    return result;
  }, [entries]);

  if (!canRead) return null;

  return (
    <Box>
      <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />

      {canWrite && (
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <TextField
            label="Nueva nota" placeholder="Ej: se compró material para…, se hizo tal trabajo…" fullWidth multiline minRows={3} maxRows={8}
            value={note} onChange={(e) => setNote(e.target.value)} inputProps={{ maxLength: 5000 }}
          />
          {photos.length > 0 && (
            <Box display="flex" gap={1} flexWrap="wrap" mt={1.5}>
              {photos.map((photo, i) => (
                <Box key={photo.preview} sx={{ position: 'relative', width: 72, height: 72 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.preview} alt={`Foto ${i + 1}`} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 6 }} />
                  <IconButton size="small" aria-label="Quitar foto" onClick={() => removePhoto(i)}
                    sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'background.paper', boxShadow: 1, '&:hover': { bgcolor: 'background.paper' } }}>
                    <CloseIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}
          <Box display="flex" gap={1} flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} mt={1.5}>
            <Button component="label" variant="outlined" startIcon={processingPhotos ? <GearSpinner size={18} /> : <PhotoIcon />} disabled={processingPhotos || photos.length >= 8}>
              Agregar foto
              <input type="file" hidden multiple accept="image/*" onChange={handlePickPhotos} />
            </Button>
            <Button variant="contained" startIcon={<SendIcon />} onClick={handleSubmit} disabled={!canSubmit}>
              {saving ? <GearSpinner size={20} /> : 'Agregar nota'}
            </Button>
          </Box>
          <Typography variant="caption" color="text.secondary" display="block" mt={1}>
            La fecha y la hora se registran solas. Las notas no se pueden editar ni borrar: si te equivocás, agregá otra nota.
          </Typography>
        </Paper>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}><GearSpinner /></Box>
      ) : entries.length === 0 ? (
        <Alert severity="info">Todavía no hay notas de seguimiento.</Alert>
      ) : (
        <Stack spacing={2}>
          {groups.map((group) => (
            <Box key={group.key}>
              <Typography variant="subtitle2" color="text.secondary" fontWeight={700} sx={{ mb: 1 }}>{group.label}</Typography>
              <Stack spacing={1.5}>
                {group.items.map((entry) => (
                  <Card key={entry.id} sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      {timeLabel(entry.createdAt)} · {entry.author ? `${entry.author.lastname}, ${entry.author.name}` : '—'}
                    </Typography>
                    {entry.note && <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mt: 0.5 }}>{entry.note}</Typography>}
                    {entry.files.length > 0 && (
                      <Box display="flex" gap={1} flexWrap="wrap" mt={1.5}>
                        {entry.files.map((file) => (
                          <Box key={file.id} component="button" type="button" onClick={() => setLightbox(file)}
                            sx={{ p: 0, border: 0, bgcolor: 'transparent', cursor: 'pointer', borderRadius: 1, overflow: 'hidden', width: 96, height: 96 }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={file.file_url} alt={file.file_name || 'Foto'} loading="lazy" style={{ width: 96, height: 96, objectFit: 'cover' }} />
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Card>
                ))}
              </Stack>
            </Box>
          ))}
          {hasMore && (
            <Box textAlign="center">
              <Button onClick={handleLoadMore} disabled={loadingMore}>{loadingMore ? 'Cargando…' : 'Cargar notas anteriores'}</Button>
            </Box>
          )}
        </Stack>
      )}

      <Dialog open={!!lightbox} onClose={() => setLightbox(null)} maxWidth="md" fullWidth>
        <DialogContent sx={{ p: 1, textAlign: 'center' }}>
          {lightbox && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={lightbox.file_url} alt={lightbox.file_name || 'Foto'} style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain' }} />
          )}
        </DialogContent>
        <DialogActions>
          {lightbox && <Link href={lightbox.file_url} target="_blank" rel="noopener noreferrer" underline="hover" sx={{ mr: 'auto', ml: 1 }}>Abrir original</Link>}
          <Button onClick={() => setLightbox(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
