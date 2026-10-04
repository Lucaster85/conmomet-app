'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, Alert, Typography, Box } from '@mui/material';
import { NotificationsActiveOutlined as ActiveIcon, NotificationsOffOutlined as OffIcon } from '@mui/icons-material';
import {
  getPushDiagnostics,
  subscribeToPush,
  unsubscribeFromPush,
  PushSupportState,
  PushDiagnostics,
} from '@/utils/push';
import { PushSubscriptionService } from '@/utils/api';

interface PushNotificationsDialogProps {
  open: boolean;
  onClose: () => void;
}

// Diálogo de activación de notificaciones push — vive en el menú de perfil (avatar), igual que
// "Cambiar contraseña": configuración personal, disponible a cualquier usuario sin importar
// permisos (ver FLOWS.md flujo 28, plan §2.6). Cubre los 5 estados posibles (plan §3.9); nunca
// deja ver un botón "Activar" en un caso donde apretarlo no va a funcionar (iPhone sin instalar,
// browser sin soporte).
//
// El estado que se muestra cruza SIEMPRE el browser con el servidor. Tener una suscripción viva
// en el browser no alcanza: si el servidor no tiene la fila, no hay a dónde mandar el aviso. Esa
// distinción es la que hacía que en staging se viera "activado" sin que llegara nada.
export default function PushNotificationsDialog({ open, onClose }: PushNotificationsDialogProps) {
  const [diag, setDiag] = useState<PushDiagnostics | null>(null);
  const [state, setState] = useState<PushSupportState | 'checking'>('checking');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const refreshState = useCallback(async () => {
    const d = await getPushDiagnostics();
    setDiag(d);
    setState(d.state);
  }, []);

  useEffect(() => {
    if (!open) return;
    setError('');
    setInfo('');
    setState('checking');
    setDiag(null);
    refreshState();
  }, [open, refreshState]);

  // OJO: en iOS, Notification.requestPermission() tiene que llamarse de forma sincrónica desde
  // el handler del tap — no puede haber ningún `await` antes. subscribeToPush() ya respeta
  // esto (lo primero que hace es pedir el permiso), y acá no hay ningún await previo a esa
  // llamada, así que el gesto del usuario sigue "caliente" cuando llega.
  const handleActivate = async () => {
    setError('');
    setInfo('');
    setProcessing(true);
    try {
      await subscribeToPush();
      setInfo('Listo. Probá con "Enviar prueba" para confirmar que te llega.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron activar las notificaciones.');
    } finally {
      await refreshState();
      setProcessing(false);
    }
  };

  const handleDeactivate = async () => {
    setError('');
    setInfo('');
    setProcessing(true);
    try {
      await unsubscribeFromPush();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron desactivar las notificaciones.');
    } finally {
      await refreshState();
      setProcessing(false);
    }
  };

  // Cierra el lazo de diagnóstico: en vez de "no me llega nada" repartido entre browser, API y
  // el servicio de push de Apple/Google, muestra el error concreto de quien lo rechazó.
  const handleTest = async () => {
    setError('');
    setInfo('');
    setProcessing(true);
    try {
      const result = await PushSubscriptionService.sendTest();
      setInfo(
        result.devices > 1
          ? `Enviada a ${result.sent} de ${result.devices} dispositivos registrados. Si no la ves, revisá que las notificaciones de Conmomet estén permitidas en los ajustes del sistema.`
          : 'Notificación enviada. Si no la ves en unos segundos, revisá que las notificaciones de Conmomet estén permitidas en los ajustes del sistema.'
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar la notificación de prueba.');
      await refreshState();
    } finally {
      setProcessing(false);
    }
  };

  // El browser dice que sí, pero el servidor no tiene esta suscripción registrada: no va a
  // llegar nada. Es recuperable reactivando, así que se ofrece eso en vez de solo informar.
  const desyncWithServer =
    state === 'subscribed' && diag?.server !== null && diag?.server?.thisDeviceRegistered === false;

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
            {diag?.server?.vapidConfigured === false && (
              <Alert severity="error">
                El servidor no tiene configuradas las claves de notificaciones (VAPID). Hay que
                cargarlas en las variables de entorno antes de poder activar nada.
              </Alert>
            )}
          </Stack>
        );

      case 'subscribed':
        return (
          <Stack spacing={1.5}>
            {desyncWithServer ? (
              <Alert severity="warning">
                Este dispositivo está suscripto en el navegador pero <strong>el servidor no lo
                tiene registrado</strong>, así que no te van a llegar avisos. Desactivá y volvé
                a activar para corregirlo.
              </Alert>
            ) : (
              <Box display="flex" alignItems="center" gap={1}>
                <ActiveIcon color="success" />
                <Typography variant="body2">Las notificaciones están activadas en este dispositivo.</Typography>
              </Box>
            )}
            {diag?.server && diag.server.devices > 1 && (
              <Typography variant="caption" color="text.secondary">
                Tenés {diag.server.devices} dispositivos registrados.
              </Typography>
            )}
            {diag?.serverError && (
              <Typography variant="caption" color="text.secondary">
                No se pudo confirmar el estado con el servidor ({diag.serverError}).
              </Typography>
            )}
          </Stack>
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
          {info && <Alert severity="success">{info}</Alert>}
          {renderBody()}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ flexWrap: 'wrap', gap: 1 }}>
        <Button onClick={onClose}>Cerrar</Button>
        {state === 'subscribed' && !desyncWithServer && (
          <Button onClick={handleTest} disabled={processing}>
            {processing ? 'Enviando…' : 'Enviar prueba'}
          </Button>
        )}
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
