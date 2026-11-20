'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { ReceiptLongOutlined as OrderIcon } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { BillingDocsService, MissingPurchaseOrderBudget } from '../../utils/api';
import { useAuth, userHasPermission } from '../../utils/auth';
import { formatDate } from '../../utils/billing';
import DashboardAlertCard, { DashboardAlertItem } from './DashboardAlertCard';
import { useRegisterAlertSummary } from './AlertViewsProvider';
import { ALERT_SHORT_LABEL } from '../../utils/alerts';

// Aviso "Presupuestos aprobados sin OC" (FLOWS.md §69): los aprobados que no tienen OC vigente y no están marcados como "No lleva OC".
// Se resuelve cargando la OC (desde el detalle de facturación) o con el botón "No lleva OC", que apaga el aviso para ese presupuesto.
// La revisión es fija: el item sale solo cuando se carga la OC o se marca que no lleva.
export default function PurchaseOrderMissingAlert() {
  const { user } = useAuth();
  const router = useRouter();
  const hasAccess = userHasPermission(user, 'invoices_read');
  const canMark = userHasPermission(user, 'invoices_update');

  const [budgets, setBudgets] = useState<MissingPurchaseOrderBudget[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(() => {
    BillingDocsService.getMissingOrders().then(setBudgets).catch(() => setBudgets([])).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!hasAccess) { setLoading(false); return; }
    load();
  }, [hasAccess, load]);

  const markNotRequired = async (id: number) => {
    setBusyId(id);
    try {
      await BillingDocsService.setNotRequired(id, true);
      load();
    } catch {
      // Si falla, el item sigue en el aviso: se puede reintentar.
    } finally {
      setBusyId(null);
    }
  };

  const items: DashboardAlertItem[] = useMemo(
    () =>
      budgets.map((b) => ({
        entity_id: b.id,
        revision: 'missing',
        content: (
          <Box>
            <Box display="flex" alignItems="center" flexWrap="wrap" gap={1}>
              <Typography variant="body2" fontWeight={600}>{b.number}</Typography>
              <Typography variant="body2">{b.title}</Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" display="block">
              {b.client?.razonSocial}{b.approved_at ? ` · aprobado el ${formatDate(b.approved_at)}` : ''}
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap" mt={0.5}>
              <Button size="small" variant="outlined" onClick={() => router.push(`/dashboard/billing/${b.id}`)}>Cargar OC</Button>
              {canMark && <Button size="small" color="inherit" disabled={busyId === b.id} onClick={() => markNotRequired(b.id)}>No lleva OC</Button>}
            </Box>
          </Box>
        ),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [budgets, router, canMark, busyId]
  );

  const ready = hasAccess && !loading;
  useRegisterAlertSummary(
    ready
      ? { type: 'budget_without_purchase_order', label: ALERT_SHORT_LABEL.budget_without_purchase_order, total: budgets.length, href: '/dashboard/billing', color: 'warning' }
      : null
  );

  if (!ready) return null;

  return (
    <DashboardAlertCard
      type="budget_without_purchase_order"
      title="Presupuestos aprobados sin OC"
      icon={<OrderIcon />}
      color="warning"
      items={items}
      footer={<Button variant="contained" size="small" onClick={() => router.push('/dashboard/billing')}>Ir a Facturación</Button>}
    />
  );
}
