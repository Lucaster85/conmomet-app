'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, Chip, Typography } from '@mui/material';
import { HourglassTopOutlined as WaitingIcon } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { Budget, BudgetService } from '../../utils/api';
import { useAuth, userHasPermission } from '../../utils/auth';
import DashboardAlertCard, { DashboardAlertItem } from './DashboardAlertCard';
import { useRegisterAlertSummary } from './AlertViewsProvider';
import { ALERT_SHORT_LABEL } from '../../utils/alerts';

const DAY_MS = 24 * 60 * 60 * 1000;

const plural = (n: number) => `${n} ${n === 1 ? 'día' : 'días'}`;

const sentAgo = (sentAt: string) => {
  const days = Math.max(0, Math.floor((Date.now() - new Date(sentAt).getTime()) / DAY_MS));
  return days === 0 ? 'enviado hoy' : `enviado hace ${plural(days)}`;
};

// Vigencia contra sent_at. Es solo visual, igual que en el listado de Presupuestos: aprobar un
// presupuesto vencido sigue estando permitido.
function validityOf(budget: Budget): { label: string; expired: boolean } | null {
  if (!budget.sent_at || !budget.validity_days) return null;
  const deadline = new Date(budget.sent_at).getTime() + budget.validity_days * DAY_MS;
  const remaining = Math.ceil((deadline - Date.now()) / DAY_MS);
  if (remaining < 0) return { label: `vencida hace ${plural(-remaining)}`, expired: true };
  if (remaining === 0) return { label: 'vence hoy', expired: false };
  return { label: `vence en ${plural(remaining)}`, expired: false };
}

// Aviso "Presupuestos esperando respuesta" (ver FLOWS.md §51): los presupuestos enviados al cliente
// por quien está mirando (followup_user_id), hasta que se carga la aprobación o el rechazo. Vale para
// TODOS los presupuestos (de un PC, directos o de adicionales). Los más viejos primero. La revisión
// incluye sent_at: si el presupuesto cambia de estado sale solo, porque el filtro es status = sent.
export default function BudgetAwaitingResponseAlert() {
  const { user } = useAuth();
  const router = useRouter();
  const hasAccess = userHasPermission(user, 'budgets_read');

  const [pending, setPending] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasAccess) {
      setLoading(false);
      return;
    }
    BudgetService.getAll({ awaiting_response_for_me: true })
      .then((list) => setPending([...list].sort((a, b) => new Date(a.sent_at || 0).getTime() - new Date(b.sent_at || 0).getTime())))
      .catch(() => setPending([]))
      .finally(() => setLoading(false));
  }, [hasAccess]);

  const items: DashboardAlertItem[] = useMemo(
    () =>
      pending.map((b) => {
        const validity = validityOf(b);
        return {
          entity_id: b.id,
          revision: `${b.status}|${b.sent_at ?? ''}`,
          content: (
            <Box onClick={() => router.push(`/dashboard/budgets?view=${b.id}`)} sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}>
              <Box display="flex" alignItems="center" flexWrap="wrap" gap={1}>
                <Typography variant="body2" fontWeight={600}>{b.number}</Typography>
                <Typography variant="body2">{b.title}</Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" display="block">
                {b.client?.razonSocial}{b.sent_at ? ` · ${sentAgo(b.sent_at)}` : ''}
              </Typography>
              {validity && (
                <Chip size="small" variant="outlined" color={validity.expired ? 'warning' : 'default'} label={`Vigencia: ${validity.label}`} sx={{ mt: 0.5 }} />
              )}
            </Box>
          ),
        };
      }),
    [pending, router]
  );

  const ready = hasAccess && !loading;
  useRegisterAlertSummary(
    ready
      ? { type: 'budget_awaiting_response', label: ALERT_SHORT_LABEL.budget_awaiting_response, total: pending.length, href: '/dashboard/budgets', color: 'info' }
      : null
  );

  if (!ready) return null;

  return (
    <DashboardAlertCard
      type="budget_awaiting_response"
      title="Presupuestos esperando respuesta"
      icon={<WaitingIcon />}
      color="info"
      items={items}
      footer={
        <Button variant="contained" size="small" onClick={() => router.push('/dashboard/budgets')}>
          Ver presupuestos enviados
        </Button>
      }
    />
  );
}
