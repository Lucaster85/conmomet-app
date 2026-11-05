'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { PostAddOutlined as AdditionalIcon } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { Additional, AdditionalService } from '../../utils/api';
import { useAuth, userHasPermission } from '../../utils/auth';
import DashboardAlertCard, { DashboardAlertItem } from './DashboardAlertCard';
import { useRegisterAlertSummary } from './AlertViewsProvider';
import { ALERT_SHORT_LABEL } from '../../utils/alerts';
import ProjectCodeLabel from '../projects/ProjectCodeLabel';

// Días enteros desde una fecha-hora ISO hasta hoy (nunca negativo).
const daysSince = (iso: string) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));

const agoLabel = (days: number) => {
  if (days === 0) return 'hoy';
  return `hace ${days} ${days === 1 ? 'día' : 'días'}`;
};

// Aviso "Adicionales para presupuestar" (ver FLOWS.md §50): le aparece a quien se eligió como
// responsable al notificar la finalización del adicional, mientras el presupuesto siga en borrador.
// Sale solo cuando el presupuesto se envía. La revisión es finish_notified_at: si alguien vuelve a
// notificar la finalización, el item reaparece aunque ya estuviera marcado como visto.
export default function AdditionalPendingBudgetAlert() {
  const { user } = useAuth();
  const router = useRouter();
  const hasAccess = userHasPermission(user, 'additionals_read');

  const [pending, setPending] = useState<Additional[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasAccess) {
      setLoading(false);
      return;
    }
    AdditionalService.getAll({ pending_budget_for_me: true })
      .then(setPending)
      .catch(() => setPending([]))
      .finally(() => setLoading(false));
  }, [hasAccess]);

  const items: DashboardAlertItem[] = useMemo(
    () =>
      pending.map((a) => ({
        entity_id: a.id,
        revision: a.finish_notified_at || 'sin-fecha',
        content: (
          <Box onClick={() => router.push(`/dashboard/additionals/${a.id}`)} sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}>
            <ProjectCodeLabel project={a} />
            <Typography variant="body2">{a.name}</Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              {a.client?.razonSocial}
              {a.finish_notified_at ? ` · finalizado ${agoLabel(daysSince(a.finish_notified_at))}` : ''}
            </Typography>
          </Box>
        ),
      })),
    [pending, router]
  );

  const ready = hasAccess && !loading;
  useRegisterAlertSummary(
    ready
      ? { type: 'additional_pending_budget', label: ALERT_SHORT_LABEL.additional_pending_budget, total: pending.length, href: '/dashboard/additionals', color: 'info' }
      : null
  );

  if (!ready) return null;

  return (
    <DashboardAlertCard
      type="additional_pending_budget"
      title="Adicionales para presupuestar"
      icon={<AdditionalIcon />}
      color="info"
      items={items}
      footer={
        <Button variant="contained" size="small" onClick={() => router.push('/dashboard/additionals')}>
          Ver adicionales
        </Button>
      }
    />
  );
}
