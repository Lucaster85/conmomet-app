'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Paper, Typography, Chip, Button, Stack } from '@mui/material';
import { RequestQuoteOutlined as BudgetIcon } from '@mui/icons-material';
import { SystemSettingService, OcaService, Oca } from '../../utils/api';
import { useAuth } from '../../utils/auth';

const TYPE_LABELS: Record<Oca['type'], string> = {
  man_hours: 'Horas Hombre',
  crane_hours: 'Grúa',
};

// Aviso simple (sin infraestructura de notificaciones) para el único usuario configurado en
// Configuración General que debe generar/presentar presupuestos de OCA — sigue mostrándose
// hasta que el presupuesto se presenta a administración del cliente, no alcanza con cargar el
// precio. No todas las OCAs requieren presupuesto: solo las marcadas explícitamente al aprobar
// (o después) con `requires_budget`. Cubre ambos tipos de OCA (horas hombre y grúa) con el mismo
// usuario global — se muestra un conteo por tipo, cada uno con su propio link a la pestaña
// correspondiente.
export default function OcaBudgetAlert() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = (user as unknown as Record<string, unknown>)?.id as number | undefined;

  const [pendingByType, setPendingByType] = useState<Record<Oca['type'], number>>({ man_hours: 0, crane_hours: 0 });
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
        const [manHoursOcas, craneOcas] = await Promise.all([
          OcaService.getAll({ type: 'man_hours', status: 'aprobado' }),
          OcaService.getAll({ type: 'crane_hours', status: 'aprobado' }),
        ]);
        const countPending = (ocas: Oca[]) =>
          ocas.filter((o) => o.requires_budget && (!o.budget_status || o.budget_status === 'pendiente')).length;
        setPendingByType({
          man_hours: countPending(manHoursOcas),
          crane_hours: countPending(craneOcas),
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [userId]);

  const total = pendingByType.man_hours + pendingByType.crane_hours;

  if (!userId || loading || total === 0) return null;

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
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <BudgetIcon color="info" />
        <Typography variant="h6" fontWeight="bold">OCAs pendientes de generar presupuesto</Typography>
        <Chip label={total} color="info" size="small" />
      </Box>
      <Stack spacing={1}>
        {(Object.keys(pendingByType) as Oca['type'][])
          .filter((type) => pendingByType[type] > 0)
          .map((type) => (
            <Box key={type} display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
              <Typography variant="body2">{TYPE_LABELS[type]}: {pendingByType[type]}</Typography>
              <Button
                variant="contained"
                size="small"
                onClick={() => router.push(`/dashboard/ocas?type=${type}&budget_filter=pendiente`)}
              >
                Ver OCAs pendientes
              </Button>
            </Box>
          ))}
      </Stack>
    </Paper>
  );
}
