'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { PaidOutlined as AgreementIcon } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { EmployeeTerminationService, TerminationAgreementAlertItem } from '../../utils/api';
import { useAuth, userHasPermission } from '../../utils/auth';
import DashboardAlertCard, { DashboardAlertItem } from './DashboardAlertCard';
import { useRegisterAlertSummary } from './AlertViewsProvider';
import { ALERT_SHORT_LABEL } from '../../utils/alerts';

const formatCurrency = (v: number) => `$${Number(v).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

// Aviso de cuotas vencidas sin pagar de un acuerdo de pago de egreso (ver FLOWS.md §47). Es un aviso
// de estado, no un registro inmutable: cuando se paga la cuota deja de listarse. La revisión incluye
// los días de atraso, así que una cuota que ya se había marcado como vista vuelve a aparecer si pasa a
// otro mes de atraso.
export default function TerminationAgreementAlertWidget() {
  const { user } = useAuth();
  const router = useRouter();
  const hasAccess = userHasPermission(user, 'employee_terminations_read') && userHasPermission(user, 'employee_salaries_read');

  const [alerts, setAlerts] = useState<TerminationAgreementAlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasAccess) {
      setLoading(false);
      return;
    }
    EmployeeTerminationService.getAgreementAlerts()
      .then(setAlerts)
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  }, [hasAccess]);

  const items: DashboardAlertItem[] = useMemo(
    () =>
      alerts.map((a) => ({
        entity_id: a.id,
        revision: `m${Math.floor(a.days_overdue / 30)}`,
        content: (
          <Box>
            <Typography variant="body2">
              Cuota {a.installment_number}/{a.installments_total} de la indemnización de{' '}
              <strong>{a.employee.lastname}, {a.employee.name}</strong>: {formatCurrency(a.amount)}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Venció el {new Date(a.due_date + 'T12:00:00').toLocaleDateString('es-AR')} ({a.days_overdue} {a.days_overdue === 1 ? 'día' : 'días'} de atraso)
            </Typography>
            <Button size="small" sx={{ mt: 0.5, px: 0 }} onClick={() => router.push(`/dashboard/employees/${a.employee.id}?tab=termination`)}>
              Ver egreso
            </Button>
          </Box>
        ),
      })),
    [alerts, router]
  );

  const ready = hasAccess && !loading;
  useRegisterAlertSummary(
    ready
      ? { type: 'termination_agreement', label: ALERT_SHORT_LABEL.termination_agreement, total: alerts.length, href: '/dashboard/employees', color: 'error' }
      : null
  );

  if (!ready) return null;

  return (
    <DashboardAlertCard
      type="termination_agreement"
      title="Cuotas de indemnización vencidas"
      icon={<AgreementIcon />}
      color="error"
      items={items}
    />
  );
}
