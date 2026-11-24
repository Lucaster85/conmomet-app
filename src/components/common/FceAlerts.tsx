'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, Chip, Typography } from '@mui/material';
import { HighlightOffOutlined as RejectedIcon, SavingsOutlined as AdcIcon } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { FceTrackingRow, InvoiceService } from '../../utils/api';
import { useAuth, userHasPermission } from '../../utils/auth';
import { formatDate, formatMoney, formatVoucher } from '../../utils/billing';
import DashboardAlertCard, { DashboardAlertItem } from './DashboardAlertCard';
import { useRegisterAlertSummary } from './AlertViewsProvider';
import { ALERT_SHORT_LABEL } from '../../utils/alerts';

// Avisos del seguimiento de FCE con ARCA (FLOWS.md §78). Los dos salen del listado de la pestaña FCE (GET /invoices/fce) y los ve quien tiene acceso a Facturación.
const FCE_TAB = '/dashboard/billing?tab=fce';
const fceVoucher = (row: FceTrackingRow) => formatVoucher({ voucher_type: 'A', cbte_tipo: row.cbte_tipo, pos_number: row.pos_number, number: row.number });

function useFceRows(load: () => Promise<FceTrackingRow[]>) {
  const { user } = useAuth();
  const hasAccess = userHasPermission(user, 'invoices_read');
  const [rows, setRows] = useState<FceTrackingRow[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!hasAccess) { setLoading(false); return; }
    load().then(setRows).catch(() => setRows([])).finally(() => setLoading(false));
    // `load` es estable por componente: se pide una sola vez al entrar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAccess]);
  return { rows, ready: hasAccess && !loading };
}

// FCE rechazadas por el cliente a las que todavía no se les emitió la nota de crédito de anulación. Desaparece solo al emitirla (la revisión incluye el id de la nota).
export function FceRejectedAlert() {
  const router = useRouter();
  const { rows: all, ready } = useFceRows(async () => (await InvoiceService.getFceTracking({ state: 'rejected' })).data);
  const rows = useMemo(() => all.filter((r) => !r.annulment_note), [all]);

  const items: DashboardAlertItem[] = useMemo(() => rows.map((row) => ({
    entity_id: row.id,
    revision: `${row.fce_cmp_state ?? ''}|${row.annulment_note ? row.annulment_note.id : ''}`,
    content: (
      <Box onClick={() => router.push(FCE_TAB)} sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}>
        <Box display="flex" alignItems="center" flexWrap="wrap" gap={1}>
          <Typography variant="body2" fontWeight={600}>{fceVoucher(row)}</Typography>
          <Typography variant="body2">{row.client?.razonSocial} · {formatMoney(row.total_amount, row.currency)}</Typography>
        </Box>
        {row.fce_rejection_reasons.length > 0 && (
          <Typography variant="caption" color="error" display="block">
            {row.fce_rejection_reasons.map((r) => [r.description, r.justification].filter(Boolean).join(': ')).join(' · ')}
          </Typography>
        )}
        <Chip size="small" variant="outlined" color="error" sx={{ mt: 0.5 }} label={`Emitida el ${formatDate(row.issue_date)} · falta la nota de crédito de anulación`} />
      </Box>
    ),
  })), [rows, router]);

  useRegisterAlertSummary(ready ? { type: 'fce_rejected', label: ALERT_SHORT_LABEL.fce_rejected, total: rows.length, href: FCE_TAB, color: 'error' } : null);
  if (!ready) return null;
  return (
    <DashboardAlertCard
      type="fce_rejected"
      title="FCE rechazadas por el cliente"
      icon={<RejectedIcon />}
      color="error"
      items={items}
      footer={<Button variant="contained" size="small" onClick={() => router.push(FCE_TAB)}>Ir a las FCE</Button>}
    />
  );
}

// FCE aceptadas con opción ADC que todavía no se informaron al agente de depósito colectivo. La app no lo informa (se hace por fuera): es un recordatorio, y
// desaparece solo cuando la sincronización ve la cuenta Informada al ADC (o Cancelada totalmente).
export function FceAdcPendingAlert() {
  const router = useRouter();
  const { rows: all, ready } = useFceRows(async () => (await InvoiceService.getFceTracking({ state: 'accepted', transfer_option: 'ADC' })).data);
  const rows = useMemo(() => all.filter((r) => r.adc_pending), [all]);

  const items: DashboardAlertItem[] = useMemo(() => rows.map((row) => ({
    entity_id: row.id,
    revision: `${row.fce_account_state ?? ''}`,
    content: (
      <Box onClick={() => router.push(FCE_TAB)} sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}>
        <Box display="flex" alignItems="center" flexWrap="wrap" gap={1}>
          <Typography variant="body2" fontWeight={600}>{fceVoucher(row)}</Typography>
          <Typography variant="body2">{row.client?.razonSocial}</Typography>
        </Box>
        <Typography variant="caption" color="text.secondary" display="block">
          {row.fce_accepted_balance !== null ? `Saldo aceptado ${formatMoney(row.fce_accepted_balance, row.currency)}` : formatMoney(row.total_amount, row.currency)}
        </Typography>
        <Chip size="small" variant="outlined" color="warning" sx={{ mt: 0.5 }} label={`Aceptada${row.fce_acceptance_at ? ` el ${formatDate(row.fce_acceptance_at)}` : ''} · falta informarla al ADC`} />
      </Box>
    ),
  })), [rows, router]);

  useRegisterAlertSummary(ready ? { type: 'fce_adc_pending', label: ALERT_SHORT_LABEL.fce_adc_pending, total: rows.length, href: FCE_TAB, color: 'warning' } : null);
  if (!ready) return null;
  return (
    <DashboardAlertCard
      type="fce_adc_pending"
      title="FCE para informar al ADC"
      icon={<AdcIcon />}
      color="warning"
      items={items}
      footer={<Button variant="contained" size="small" onClick={() => router.push(FCE_TAB)}>Ir a las FCE</Button>}
    />
  );
}
