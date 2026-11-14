'use client';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Chip, Collapse, DialogActions, DialogContent, DialogTitle, Stack,
  TextField, Typography,
} from '@mui/material';
import AppDialog from '@/components/common/AppDialog';
import GearSpinner from '@/components/GearSpinner';
import { ConsentText, ConsentTextService } from '@/utils/api';

const MAX_LENGTH = 20000;

const formatDateTime = (iso: string) => new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });

interface Props {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

// Texto de privacidad que acepta quien se postula desde "Trabajá con nosotros" (FLOWS.md §63). Cada cambio
// publica una VERSIÓN NUEVA: no se edita ni se borra una anterior, porque cada postulante guarda qué versión
// vio al aceptar. Por eso el botón dice "Publicar nueva versión" y no "Guardar".
export default function PrivacyTextSettingsCard({ onSuccess, onError }: Props) {
  const [versions, setVersions] = useState<ConsentText[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [viewing, setViewing] = useState<ConsentText | null>(null);

  const current = versions[0] || null;

  const load = useCallback(async () => {
    try {
      const list = await ConsentTextService.list();
      setVersions(list);
      setDraft(list[0]?.content || '');
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Error al cargar el texto de privacidad');
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => { load(); }, [load]);

  const unchanged = !!current && draft.replace(/\r\n/g, '\n').trim() === current.content.trim();
  const invalid = !draft.trim() || draft.length > MAX_LENGTH;

  const handlePublish = async () => {
    try {
      setPublishing(true);
      const created = await ConsentTextService.publish(draft);
      setConfirmOpen(false);
      onSuccess(`Se publicó la versión ${created.version} del texto de privacidad.`);
      await load();
    } catch (err) {
      setConfirmOpen(false);
      onError(err instanceof Error ? err.message : 'Error al publicar el texto de privacidad');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <Card sx={{ maxWidth: 760, borderRadius: 3, mt: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap" mb={0.5}>
          <Typography variant="h6" fontWeight={600}>Trabajá con nosotros — Texto de privacidad</Typography>
          {current && <Chip size="small" color="primary" label={`Versión ${current.version}`} />}
        </Box>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Es el texto que se muestra en el formulario público de postulación y que la persona acepta al enviarlo. Cada
          cambio se publica como una <strong>versión nueva</strong> y vale solo para las postulaciones que lleguen desde
          ese momento. Las versiones anteriores <strong>no se modifican ni se borran</strong>: cada postulante conserva la
          versión que aceptó.
        </Typography>

        {loading ? (
          <GearSpinner />
        ) : (
          <Stack spacing={2}>
            {current && (
              <Typography variant="caption" color="text.secondary">
                Vigente desde el {formatDateTime(current.created_at)}
                {current.created_by ? ` · publicada por ${current.created_by.name} ${current.created_by.lastname}` : ' · texto inicial'}
              </Typography>
            )}
            <TextField
              label="Texto"
              multiline
              minRows={8}
              maxRows={24}
              fullWidth
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              error={draft.length > MAX_LENGTH}
              helperText={`${draft.length.toLocaleString('es-AR')} / ${MAX_LENGTH.toLocaleString('es-AR')} caracteres. Se muestra como texto plano: los saltos de línea y los párrafos separados por una línea en blanco se respetan.`}
            />
            <Box display="flex" gap={1} flexWrap="wrap">
              <Button variant="contained" onClick={() => setConfirmOpen(true)} disabled={unchanged || invalid}>
                Publicar nueva versión
              </Button>
              <Button onClick={() => setDraft(current?.content || '')} disabled={unchanged}>Descartar cambios</Button>
              <Box flexGrow={1} />
              <Button onClick={() => setShowHistory((v) => !v)}>
                {showHistory ? 'Ocultar historial' : `Ver historial (${versions.length})`}
              </Button>
            </Box>

            <Collapse in={showHistory}>
              <Stack spacing={1} divider={<Box sx={{ borderTop: 1, borderColor: 'divider' }} />}>
                {versions.map((v) => (
                  <Box key={v.id} display="flex" alignItems="center" gap={1} flexWrap="wrap">
                    <Chip size="small" label={`v${v.version}`} color={v.id === current?.id ? 'primary' : 'default'} />
                    <Box flex={1} minWidth={160}>
                      <Typography variant="body2">{formatDateTime(v.created_at)}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {v.created_by ? `${v.created_by.name} ${v.created_by.lastname}` : 'Texto inicial'}
                      </Typography>
                    </Box>
                    <Button size="small" onClick={() => setViewing(v)}>Ver</Button>
                    {v.id !== current?.id && <Button size="small" onClick={() => setDraft(v.content)}>Usar como base</Button>}
                  </Box>
                ))}
              </Stack>
            </Collapse>
          </Stack>
        )}
      </CardContent>

      <AppDialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Publicar la versión {(current?.version || 0) + 1}</DialogTitle>
        <DialogContent>
          <Alert severity="warning">
            Desde que la publiques, el formulario público muestra este texto y las nuevas postulaciones lo aceptan. La versión
            anterior queda en el historial y <strong>no se puede deshacer ni editar</strong> (para volver atrás hay que publicar
            de nuevo el texto anterior como una versión nueva).
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={publishing}>Cancelar</Button>
          <Button variant="contained" onClick={handlePublish} disabled={publishing}>
            {publishing ? <GearSpinner size={20} /> : 'Publicar'}
          </Button>
        </DialogActions>
      </AppDialog>

      <AppDialog open={!!viewing} onClose={() => setViewing(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Versión {viewing?.version}</DialogTitle>
        <DialogContent>
          <Typography variant="caption" color="text.secondary" display="block" mb={1}>
            {viewing && formatDateTime(viewing.created_at)}
          </Typography>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{viewing?.content}</Typography>
        </DialogContent>
        <DialogActions><Button onClick={() => setViewing(null)}>Cerrar</Button></DialogActions>
      </AppDialog>
    </Card>
  );
}
