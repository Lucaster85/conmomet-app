'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, Chip, Button } from '@mui/material';
import { RequestQuoteOutlined as BudgetIcon } from '@mui/icons-material';
import { SystemSettingService, OcaService, Oca } from '../../utils/api';
import { useAuth } from '../../utils/auth';
import DashboardAlertCard, { DashboardAlertItem } from './DashboardAlertCard';
import { useRegisterAlertSummary } from './AlertViewsProvider';
import { ALERT_SHORT_LABEL } from '../../utils/alerts';

const TYPE_LABELS: Record<Oca['type'], string> = {
  man_hours: 'Horas Hombre',
  crane_hours: 'Grúa',
};

// Aviso para el único usuario configurado en Configuración General que debe generar/presentar
// presupuestos de OCA — sigue mostrándose hasta que el presupuesto se presenta a administración
// del cliente, no alcanza con cargar el precio. No todas las OCAs requieren presupuesto: solo las
// marcadas explícitamente al aprobar (o después) con `requires_budget`. Cubre ambos tipos de OCA
// (horas hombre y grúa) con el mismo usuario global.
//
// Desde FLOWS.md §36 lista las OCAs una por una en vez de mostrar solo un conteo por tipo: el
// acuse de vista necesita un `entity_id` por item, y de paso se ve CUÁL es la OCA nueva.
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
        const [manHoursOcas, craneOcas] = await Promise.all([
          OcaService.getAll({ type: 'man_hours', status: 'aprobado' }),
          OcaService.getAll({ type: 'crane_hours', status: 'aprobado' }),
        ]);
        const needsBudget = (o: Oca) => o.requires_budget && (!o.budget_status || o.budget_status === 'pendiente');
        setPending([...manHoursOcas, ...craneOcas].filter(needsBudget));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [userId]);

  const items: DashboardAlertItem[] = useMemo(
    () =>
      pending.map((oca) => ({
        entity_id: oca.id,
        // Reaparece si el presupuesto avanzó de estado (ej. volvió a "pendiente" tras un rechazo).
        revision: `${oca.budget_status ?? 'pendiente'}`,
        content: (
          <Box
            onClick={() => router.push(`/dashboard/ocas?type=${oca.type}&budget_filter=pendiente`)}
            sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
          >
            <Box display="flex" alignItems="center" flexWrap="wrap" gap={1}>
              <Typography variant="body2" fontWeight={600}>{oca.number}</Typography>
              <Chip size="small" variant="outlined" label={TYPE_LABELS[oca.type]} />
            </Box>
            {oca.client?.razonSocial && (
              <Typography variant="body2" color="text.secondary">{oca.client.razonSocial}</Typography>
            )}
          </Box>
        ),
      })),
    [pending, router]
  );

  const ready = !!userId && !loading;
  useRegisterAlertSummary(
    ready
      ? {
          type: 'oca_budget',
          label: ALERT_SHORT_LABEL.oca_budget,
          total: pending.length,
          href: '/dashboard/ocas?budget_filter=pendiente',
          color: 'info',
        }
      : null
  );

  if (!ready) return null;

  return (
    <DashboardAlertCard
      type="oca_budget"
      title="OCAs pendientes de generar presupuesto"
      icon={<BudgetIcon />}
      color="info"
      items={items}
      footer={
        <Button
          variant="contained"
          size="small"
          onClick={() => router.push('/dashboard/ocas?budget_filter=pendiente')}
        >
          Ver OCAs pendientes
        </Button>
      }
    />
  );
}
