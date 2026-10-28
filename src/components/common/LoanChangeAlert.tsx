'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { EventRepeatOutlined as LoanChangeIcon } from '@mui/icons-material';
import { LoanChangeAlertService, LoanChangeAlert as LoanChangeAlertType, LoanTermsSnapshot } from '../../utils/api';
import { useAuth, userHasPermission } from '../../utils/auth';
import DashboardAlertCard, { DashboardAlertItem } from './DashboardAlertCard';
import { useRegisterAlertSummary } from './AlertViewsProvider';
import { ALERT_SHORT_LABEL } from '../../utils/alerts';

const formatCurrency = (v: number) => `$${Number(v).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

const formatTerms = (t: LoanTermsSnapshot) => {
  const freq = t.installment_frequency === 'biweekly' ? 'quincenales' : 'mensuales';
  const interest = Number(t.monthly_interest_percent) > 0 ? ` al ${Number(t.monthly_interest_percent)}% mensual` : '';
  return `${formatCurrency(Number(t.amount))} en ${t.num_installments} cuotas ${freq}${interest}, desde ${new Date(t.start_date).toLocaleDateString('es-AR')}`;
};

// Aviso a Socios Gerentes cuando se reprograma o cancela un préstamo sin ninguna cuota
// descontada (ver FLOWS.md §43). Mismo patrón que la anulación de adelantos pagados
// (SalaryAdvanceDeletionAlert.tsx): registro inmutable, sin acuse propio — delega el acuse de
// vista al mecanismo unificado de UserAlertViews (revision fija '1').
export default function LoanChangeAlertWidget() {
  const { user } = useAuth();
  const hasAccess = userHasPermission(user, 'loan_change_alerts_read');

  const [alerts, setAlerts] = useState<LoanChangeAlertType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasAccess) {
      setLoading(false);
      return;
    }
    LoanChangeAlertService.getAll()
      .then(setAlerts)
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  }, [hasAccess]);

  const items: DashboardAlertItem[] = useMemo(
    () =>
      alerts.map((a) => ({
        entity_id: a.id,
        revision: '1',
        content: (
          <Box>
            <Typography variant="body2">
              Préstamo de <strong>{a.employee ? `${a.employee.lastname}, ${a.employee.name}` : `empleado #${a.employee_id}`}</strong>{' '}
              {a.action === 'cancelled' ? 'cancelado' : 'reprogramado'}.
            </Typography>
            {a.action === 'rescheduled' && a.new_terms ? (
              <>
                <Typography variant="caption" color="text.secondary" display="block">
                  Antes: {formatTerms(a.previous_terms)}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Ahora: {formatTerms(a.new_terms)}
                </Typography>
              </>
            ) : (
              <Typography variant="caption" color="text.secondary" display="block">
                Monto: {formatCurrency(Number(a.previous_terms.amount))}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary">
              Motivo: &quot;{a.justification}&quot;
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {a.action === 'cancelled' ? 'Cancelado' : 'Reprogramado'} por {a.createdBy ? `${a.createdBy.name} ${a.createdBy.lastname}` : 'usuario desconocido'} el {new Date(a.created_at).toLocaleDateString('es-AR')}
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
          type: 'loan_change',
          label: ALERT_SHORT_LABEL.loan_change,
          total: alerts.length,
          href: '/dashboard/loans',
          color: 'warning',
        }
      : null
  );

  if (!ready) return null;

  return (
    <DashboardAlertCard
      type="loan_change"
      title="Préstamos reprogramados o cancelados"
      icon={<LoanChangeIcon />}
      color="warning"
      items={items}
    />
  );
}
