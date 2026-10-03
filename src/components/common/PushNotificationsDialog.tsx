'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, Alert, Typography, Box } from '@mui/material';
import { NotificationsActiveOutlined as ActiveIcon, NotificationsOffOutlined as OffIcon } from '@mui/icons-material';
import { getPushState, subscribeToPush, unsubscribeFromPush, PushSupportState } from '@/utils/push';

interface PushNotificationsDialogProps {
  open: boolean;
  onClose: () => void;
}

// Diálogo de activación de notificaciones push — vive en el menú de perfil (avatar), igual que
// "Cambiar contraseña": configuración personal, disponible a cualquier usuario sin importar
// permisos (ver FLOWS.md flujo 28, plan §2.6). Cubre los 5 estados posibles (plan §3.9); nunca
// deja ver un botón "Activar" en un caso donde apretarlo no va a funcionar (iPhone sin instalar,
// browser sin soporte).
export default function PushNotificationsDialog({ open, onClose }: PushNotificationsDialogProps) {
  const [state, setState] = useState<PushSupportState | 'checking'>('checking');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const refreshState = useCallback(async () => {
    const s = await getPushState();
    setState(s);
  }, []);

  useEffect(() => {
    if (!open) return;
    setError('');
    setState('checking');
    refreshState();
  }, [open, refreshState]);

  // OJO: en iOS, Notification.requestPermission() tiene que llamarse de forma sincrónica desde
  // el handler del tap — no puede haber ningún `await` antes. subscribeToPush() ya respeta
  // esto (lo primero que hace es pedir el permiso), y acá no hay ningún await previo a esa
  // llamada, así que el gesto del usuario sigue "caliente" cuando llega.
  const handleActivate = async () => {
    setError('');
    setProcessing(true);
    try {
      await subscribeToPush();
      setState('subscribed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron activar las notificaciones.');
      await refreshState();
    } finally {
      setProcessing(false);
    }
  };

  const handleDeactivate = async () => {
    setError('');
    setProcessing(true);
    try {
      await unsubscribeFromPush();
      setState('not-subscribed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron desactivar las notificaciones.');
    } finally {
      setProcessing(false);
    }
  };

  const renderBody = () => {
    switch (state) {
      case 'checking':
        return <Typography variant="body2" color="text.secondary">Verificando…</Typography>;

      case 'unsupported':
        return (
          <Alert severity="info">
            Este navegador no soporta notificaciones push. Probá desde Chrome o Safari actualizados.
          </Alert>
        );

      case 'ios-not-installed':
        return (
          <Stack spacing={1.5}>
            <Alert severity="info">
              En iPhone, para recibir notificaciones primero hay que agregar la app a la pantalla
              de inicio.
            </Alert>
            <Box component="ol" sx={{ pl: 2.5, m: 0 }}>
              <Typography component="li" variant="body2">Tocá el botón <strong>Compartir</strong> en Safari.</Typography>
              <Typography component="li" variant="body2">Elegí <strong>&quot;Agregar a pantalla de inicio&quot;</strong>.</Typography>
              <Typography component="li" variant="body2">Abrí Conmomet desde el ícono nuevo y volvé a entrar acá.</Typography>
            </Box>
          </Stack>
        );

      case 'denied':
        return (
          <Alert severity="warning">
            Las notificaciones están bloqueadas para este sitio. Para activarlas hay que
            habilitarlas desde los ajustes del navegador (ícono del candado junto a la dirección).
          </Alert>
        );

      case 'not-subscribed':
        return (
          <Stack spacing={1.5}>
            <Box display="flex" alignItems="center" gap={1}>
              <OffIcon color="disabled" />
              <Typography variant="body2">Las notificaciones están desactivadas en este dispositivo.</Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Vas a recibir un aviso cuando te asignen un Pedido de Cotización, te entreguen o
              devuelvan un presupuesto, o se envíe uno al cliente.
            </Typography>
          </Stack>
        );

      case 'subscribed':
        return (
          <Box display="flex" alignItems="center" gap={1}>
            <ActiveIcon color="success" />
            <Typography variant="body2">Las notificaciones están activadas en este dispositivo.</Typography>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Notificaciones</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          {renderBody()}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
        {state === 'not-subscribed' && (
          <Button variant="contained" onClick={handleActivate} disabled={processing}>
            {processing ? 'Activando…' : 'Activar notificaciones'}
          </Button>
        )}
        {state === 'subscribed' && (
          <Button color="error" onClick={handleDeactivate} disabled={processing}>
            {processing ? 'Desactivando…' : 'Desactivar'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
