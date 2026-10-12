'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { WarningAmberOutlined as WarningIcon } from '@mui/icons-material';
import { SalaryAdvanceDeletionAlertService, SalaryAdvanceDeletionAlert } from '../../utils/api';
import { useAuth, userHasPermission } from '../../utils/auth';
import DashboardAlertCard, { DashboardAlertItem } from './DashboardAlertCard';
import { useRegisterAlertSummary } from './AlertViewsProvider';
import { ALERT_SHORT_LABEL } from '../../utils/alerts';

const formatCurrency = (v: number) => `$${Number(v).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
const PAYMENT_METHOD_LABEL: Record<string, string> = { efectivo: 'Efectivo', transferencia: 'Transferencia' };

// Aviso a Socios Gerentes cuando se anula un adelanto que ya estaba pagado.
//
// Fue el primer aviso descartable por usuario del repo, con su propia columna `dismissed_by`
// (array JSON de user ids). Desde FLOWS.md §36 usa el mecanismo unificado de UserAlertViews: los
// descartes que había se migraron en 20261012100002, la columna quedó deprecada y
// `SalaryAdvanceDeletionAlertService.dismiss` ya no se llama desde el frontend.
export default function SalaryAdvanceDeletionAlertWidget() {
  const { user } = useAuth();
  const hasAccess = userHasPermission(user, 'salary_advance_deletion_alerts_read');

  const [alerts, setAlerts] = useState<SalaryAdvanceDeletionAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasAccess) {
      setLoading(false);
      return;
    }
    SalaryAdvanceDeletionAlertService.getAll()
      .then(setAlerts)
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  }, [hasAccess]);

  const formatPeriod = (p?: SalaryAdvanceDeletionAlert['payPeriod']) =>
    p ? `${p.type === 'first_half' ? '1ra' : '2da'} quincena ${p.month}/${p.year}` : 'sin quincena asignada';

  const items: DashboardAlertItem[] = useMemo(
    () =>
      alerts.map((a) => ({
        entity_id: a.id,
        // Revisión fija: el registro de un adelanto anulado es inmutable, nunca hay nada nuevo
        // que justifique volver a mostrarlo.
        revision: '1',
        content: (
          <Box>
            <Typography variant="body2">
              Adelanto de <strong>{a.employee ? `${a.employee.lastname}, ${a.employee.name}` : `empleado #${a.employee_id}`}</strong> por{' '}
              <strong>{formatCurrency(a.amount)}</strong>
              {a.payment_method ? ` (${PAYMENT_METHOD_LABEL[a.payment_method] || a.payment_method})` : ''}, {formatPeriod(a.payPeriod)}.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Motivo: &quot;{a.justification}&quot;
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Anulado por {a.deletedBy ? `${a.deletedBy.name} ${a.deletedBy.lastname}` : 'usuario desconocido'} el {new Date(a.created_at).toLocaleDateString('es-AR')}
            </Typography>
          </Box>
        ),
      })),
    [alerts]
  );

  const ready = hasAccess && !loading;
  useRegisterAlertSummary(
    ready
      ? {
          type: 'salary_advance_deletion',
          label: ALERT_SHORT_LABEL.salary_advance_deletion,
          total: alerts.length,
          href: '/dashboard/salary-advances',
          color: 'error',
        }
      : null
  );

  if (!ready) return null;

  return (
    <DashboardAlertCard
      type="salary_advance_deletion"
      title="Adelantos pagados anulados"
      icon={<WarningIcon />}
      color="error"
      items={items}
    />
  );
}
