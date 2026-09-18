'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Paper, Typography, Chip, Button } from '@mui/material';
import { RequestQuoteOutlined as BudgetIcon } from '@mui/icons-material';
import { SystemSettingService, OcaService, Oca } from '../../utils/api';
import { useAuth } from '../../utils/auth';

// Aviso simple (sin infraestructura de notificaciones) para el único usuario configurado en
// Configuración General que debe generar/presentar presupuestos de OCA — sigue mostrándose
// hasta que el presupuesto se presenta a administración del cliente, no alcanza con cargar el
// precio. No todas las OCAs requieren presupuesto: solo las marcadas explícitamente al aprobar
// (o después) con `requires_budget`.
export default function OcaBudgetAlert() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = (user as unknown as Record<string, unknown>)?.id as number | undefined;

  const [pending, setPending] = useState<Oca[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    SystemSettingService.get()
      .then(async (settings) => {
        if (settings.oca_budget_notification_user_id !== userId) {
          setLoading(false);
          return;
        }
        const ocas = await OcaService.getAll({ type: 'man_hours', status: 'aprobado' });
        setPending(ocas.filter((o) => o.requires_budget && (!o.budget_status || o.budget_status === 'pendiente')));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [userId]);

  if (!userId || loading || pending.length === 0) return null;

  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: 2,
        mb: 3,
        borderLeft: '4px solid',
        borderLeftColor: 'info.main',
      }}
    >
      <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <BudgetIcon color="info" />
          <Typography variant="h6" fontWeight="bold">OCAs pendientes de generar presupuesto</Typography>
          <Chip label={pending.length} color="info" size="small" />
        </Box>
        <Button
          variant="contained"
          size="small"
          onClick={() => router.push('/dashboard/ocas?type=man_hours&budget_filter=pendiente')}
        >
          Ver OCAs pendientes
        </Button>
      </Box>
    </Paper>
  );
}
