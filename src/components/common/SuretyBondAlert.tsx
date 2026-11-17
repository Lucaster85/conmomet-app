'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, Chip, Typography } from '@mui/material';
import { GppMaybeOutlined as BondIcon } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { BillingDocsService, SuretyBondAlert as SuretyBondAlertData } from '../../utils/api';
import { useAuth, userHasPermission } from '../../utils/auth';
import { bondDaysLabel, formatDate, formatMoney } from '../../utils/billing';
import DashboardAlertCard, { DashboardAlertItem } from './DashboardAlertCard';
import { useRegisterAlertSummary } from './AlertViewsProvider';
import { ALERT_SHORT_LABEL } from '../../utils/alerts';

// Aviso "Seguros de caución por vencer" (FLOWS.md §69): pólizas sin liberar que vencieron o vencen dentro de su plazo de aviso. Se resuelve
// liberándola o actualizando el vencimiento desde el detalle de facturación. La revisión incluye el estado y el vencimiento: si pasa de "por
// vencer" a "vencida", o se renueva, vuelve a mostrarse aunque estuviera marcada como vista.
export default function SuretyBondAlert() {
  const { user } = useAuth();
  const router = useRouter();
  const hasAccess = userHasPermission(user, 'invoices_read');

  const [bonds, setBonds] = useState<SuretyBondAlertData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasAccess) { setLoading(false); return; }
    BillingDocsService.getBondAlerts().then(setBonds).catch(() => setBonds([])).finally(() => setLoading(false));
  }, [hasAccess]);

  const items: DashboardAlertItem[] = useMemo(
    () =>
      bonds.map((b) => ({
        entity_id: b.id,
        revision: `${b.status}|${b.expiration_date ?? ''}`,
        content: (
          <Box onClick={() => router.push(`/dashboard/billing/${b.budget_id}`)} sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}>
            <Box display="flex" alignItems="center" flexWrap="wrap" gap={1}>
              <Typography variant="body2" fontWeight={600}>Póliza {b.policy_number}</Typography>
              <Typography variant="body2">{b.insurer} · {formatMoney(b.amount, b.currency)}</Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" display="block">
              {b.budget.number} · {b.budget.client?.razonSocial}
            </Typography>
            <Chip
              size="small" variant="outlined" color={b.status === 'expired' ? 'error' : 'warning'} sx={{ mt: 0.5 }}
              label={`${formatDate(b.expiration_date)} · ${bondDaysLabel(b.days_left)}`}
            />
          </Box>
        ),
      })),
    [bonds, router]
  );

  const ready = hasAccess && !loading;
  const expired = bonds.some((b) => b.status === 'expired');
  useRegisterAlertSummary(
    ready
      ? { type: 'surety_bond', label: ALERT_SHORT_LABEL.surety_bond, total: bonds.length, href: '/dashboard/billing', color: expired ? 'error' : 'warning' }
      : null
  );

  if (!ready) return null;

  return (
    <DashboardAlertCard
      type="surety_bond"
      title="Seguros de caución por vencer"
      icon={<BondIcon />}
      color={expired ? 'error' : 'warning'}
      items={items}
      footer={<Button variant="contained" size="small" onClick={() => router.push('/dashboard/billing')}>Ir a Facturación</Button>}
    />
  );
}
