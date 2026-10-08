'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Alert, Box, Button, Card, CardContent, Chip, Grid, LinearProgress, Link as MuiLink, Paper, Stack, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Typography,
} from '@mui/material';
import { AddOutlined as AddIcon, ArrowBackOutlined as BackIcon } from '@mui/icons-material';
import FeedbackModal from '../../../../components/FeedbackModal';
import GearSpinner from '../../../../components/GearSpinner';
import InvoiceList from '../../../../components/billing/InvoiceList';
import InvoiceDialog from '../../../../components/billing/InvoiceDialog';
import InvoiceViewDialog from '../../../../components/billing/InvoiceViewDialog';
import { CancelInvoiceDialog, PayInvoiceDialog } from '../../../../components/billing/InvoiceActionDialogs';
import ProjectCodeLabel from '../../../../components/projects/ProjectCodeLabel';
import { BudgetBillingDetail, BudgetCurrency, Invoice, InvoiceService } from '../../../../utils/api';
import { userHasPermission, useAuth } from '../../../../utils/auth';
import {
  BILLING_STATUS_LABELS, CONCEPT_LABELS, formatDate, formatHours, formatMoney, formatPercent, ivaOf,
} from '../../../../utils/billing';
import { formatCuit, TAX_CONDITION_LABELS } from '../../../../utils/cuit';

const CURRENCIES: BudgetCurrency[] = ['ARS', 'USD'];

export default function BillingDetailPage() {
  const params = useParams<{ budgetId: string }>();
  const budgetId = Number(params.budgetId);
  const router = useRouter();
  const { user } = useAuth();
  const canWrite = userHasPermission(user, 'invoices_write');
  const canUpdate = userHasPermission(user, 'invoices_update');
  const canCorrect = userHasPermission(user, 'invoices_correct');
  const canUnofficial = userHasPermission(user, 'invoices_unofficial');
  const canSeeBudgets = userHasPermission(user, 'budgets_read');
  const canSeeProjects = userHasPermission(user, 'projects_read');

  const [detail, setDetail] = useState<BudgetBillingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [newOpen, setNewOpen] = useState(false);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [payTarget, setPayTarget] = useState<Invoice | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Invoice | null>(null);

  const load = useCallback(async () => {
    try {
      setDetail(await InvoiceService.getBillable(budgetId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el detalle de facturación');
    } finally {
      setLoading(false);
    }
  }, [budgetId]);

  useEffect(() => { load(); }, [load]);

  const handleSaved = (message: string) => {
    setSuccess(message);
    setNewOpen(false);
    setEditInvoice(null);
    setPayTarget(null);
    setCancelTarget(null);
    load();
  };

  if (loading) return <Box display="flex" justifyContent="center" py={8}><GearSpinner /></Box>;

  if (!detail) {
    return (
      <Box>
        <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />
        <Button startIcon={<BackIcon />} onClick={() => router.push('/dashboard/billing')}>Volver a Facturación</Button>
      </Box>
    );
  }

  const { budget, billing, hour_buckets: hourBuckets, invoices, iva } = detail;
  const status = BILLING_STATUS_LABELS[billing.billing_status];
  const progress = billing.project_progress;
  const currencies = CURRENCIES.filter((c) => billing.bases[c].materials.net > 0 || billing.bases[c].labor.net > 0);

  const conceptCard = (currency: BudgetCurrency, concept: 'materials' | 'labor') => {
    const base = billing.bases[currency][concept];
    if (base.net <= 0) return null;
    const billed = billing.billed[currency][concept];
    const balance = billing.balances[currency][concept];
    const pct = billing.billed_percent[currency][concept];
    return (
      <Grid size={{ xs: 12, md: 6 }} key={`${currency}-${concept}`}>
        <Card sx={{ height: '100%', borderRadius: 2 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
              <Typography variant="subtitle1" fontWeight={700}>{CONCEPT_LABELS[concept]} ({currency})</Typography>
              {balance <= 0.01 && <Chip size="small" color="success" label="Todo facturado" />}
            </Box>
            <Typography variant="body2" color="text.secondary">
              {base.discount_percent > 0
                ? `${formatMoney(base.gross, currency)} − ${formatPercent(base.discount_percent)} = `
                : ''}
              <strong>{formatMoney(base.net, currency)}</strong> + IVA {formatPercent(iva.default_rate)} ({formatMoney(ivaOf(base.net, iva.default_rate), currency)})
            </Typography>
            <LinearProgress variant="determinate" value={Math.min(pct, 100)} sx={{ height: 8, borderRadius: 4, my: 1.5 }} />
            <Box display="flex" justifyContent="space-between" flexWrap="wrap" gap={1}>
              <Typography variant="body2">Facturado: <strong>{formatMoney(billed, currency)}</strong> ({formatPercent(pct)})</Typography>
              <Typography variant="body2">Saldo: <strong>{formatMoney(balance, currency)}</strong></Typography>
            </Box>
            {balance > 0.01 && (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                Saldo con IVA: {formatMoney(balance + ivaOf(balance, iva.default_rate), currency)}
              </Typography>
            )}
            {billing.covered_by_reserved[currency][concept] && (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                Parte de este concepto está cubierta por un registro reservado.
              </Typography>
            )}
            {concept === 'labor' && (
              <Box sx={{ mt: 1 }}>
                {progress ? (
                  <Typography variant="body2" color="text.secondary">
                    Facturado {formatPercent(pct)} ≈ {formatHours((progress.budgeted_hours_own * pct) / 100)} de {formatHours(progress.budgeted_hours_own)}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">Sin proyecto todavía</Typography>
                )}
                {billing.overbilled_labor && (
                  <Chip size="small" color="warning" label="Facturado > avance" sx={{ mt: 0.5 }} />
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    );
  };

  return (
    <Box>
      <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />
      <FeedbackModal open={!!success} onClose={() => setSuccess('')} message={success} type="success" />

      <Button startIcon={<BackIcon />} onClick={() => router.push('/dashboard/billing')} sx={{ mb: 1 }}>Volver a Facturación</Button>

      {/* Encabezado */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2} mb={2}>
        <Box>
          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
            <Typography variant="h5" fontWeight={700}>{budget.number}</Typography>
            <Chip size="small" color={status.color} label={status.label} />
            {billing.has_pending_payment && (
              <Chip size="small" variant="outlined" color="warning" label={`${billing.pending_invoices_count} pendiente${billing.pending_invoices_count === 1 ? '' : 's'} de cobro`} />
            )}
          </Box>
          <Typography variant="body1">{budget.title}</Typography>
          <Typography variant="body2" color="text.secondary">
            {budget.client?.razonSocial}
            {budget.client?.cuit ? ` · CUIT ${formatCuit(budget.client.cuit)}` : ''}
            {budget.client?.tax_condition ? ` · ${TAX_CONDITION_LABELS[budget.client.tax_condition]}` : ''}
          </Typography>
          <Typography variant="body2" color="text.secondary" component="div">
            {budget.quoteRequest && (
              <>{budget.quoteRequest.number}{budget.quoteRequest.client_quote_number ? ` (N° cliente ${budget.quoteRequest.client_quote_number})` : ''} · </>
            )}
            Aprobado el {formatDate(budget.approved_at)}
          </Typography>
          <Box mt={0.5} display="flex" gap={2} flexWrap="wrap">
            {budget.project ? (
              canSeeProjects ? (
                <MuiLink component="button" variant="body2" onClick={() => router.push(`/dashboard/projects/${budget.project!.id}`)}>
                  <ProjectCodeLabel project={budget.project} linkParent={false} /> · {budget.project.name}
                </MuiLink>
              ) : (
                <Typography variant="body2"><ProjectCodeLabel project={budget.project} linkParent={false} /> · {budget.project.name}</Typography>
              )
            ) : (
              <Typography variant="body2" color="text.secondary">Sin proyecto todavía</Typography>
            )}
            {canSeeBudgets && (
              <MuiLink component="button" variant="body2" onClick={() => router.push(`/dashboard/budgets?view=${budget.id}`)}>Ver presupuesto</MuiLink>
            )}
          </Box>
        </Box>
        {canWrite && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setNewOpen(true)} disabled={!billing.has_balance}>
            Nueva factura
          </Button>
        )}
      </Box>

      {detail.has_reserved_records && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Parte de este presupuesto está cubierta por un registro reservado. Ya está descontada de los saldos.
        </Alert>
      )}

      {/* Un bloque por moneda y concepto */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {currencies.flatMap((c) => [conceptCard(c, 'materials'), conceptCard(c, 'labor')])}
      </Grid>

      {/* Avance de horas */}
      <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>Avance de horas del proyecto</Typography>
      {progress ? (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {formatHours(progress.consumed_hours_own)} de {formatHours(progress.budgeted_hours_own)}
            {progress.progress_percent != null ? ` (${formatPercent(progress.progress_percent)})` : ''}. Son las horas propias de este proyecto: las de sus adicionales se ven en el presupuesto de cada adicional.
          </Typography>
          <TableContainer component={Paper} elevation={1} sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Rubro</TableCell>
                  <TableCell align="right">Presupuestadas</TableCell>
                  <TableCell align="right">Consumidas</TableCell>
                  <TableCell align="right">Avance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {hourBuckets.map((b) => (
                  <TableRow key={b.budget_item_type_id ?? 'general'}>
                    <TableCell>{b.item_type_name}</TableCell>
                    <TableCell align="right">{formatHours(b.budgeted_hours)}</TableCell>
                    <TableCell align="right">{formatHours(b.consumed_hours)}</TableCell>
                    <TableCell align="right">{b.budgeted_hours > 0 ? formatPercent((b.consumed_hours / b.budgeted_hours) * 100) : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Sin proyecto todavía: cuando se genere el proyecto de este presupuesto, acá se va a ver el avance real de horas.
        </Typography>
      )}

      {/* Facturas del presupuesto */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="h6" fontWeight={700}>Facturas del presupuesto</Typography>
      </Stack>
      <InvoiceList
        invoices={invoices} hideBudgetColumns canUpdate={canUpdate} canCorrect={canCorrect}
        emptyText="Todavía no se registró ninguna factura de este presupuesto"
        onView={setViewInvoice} onEdit={setEditInvoice} onPay={setPayTarget} onCancel={setCancelTarget}
      />

      <InvoiceViewDialog invoice={viewInvoice} onClose={() => setViewInvoice(null)} />
      <PayInvoiceDialog invoice={payTarget} onClose={() => setPayTarget(null)} onDone={() => handleSaved('Factura marcada como cobrada')} />
      <CancelInvoiceDialog invoice={cancelTarget} onClose={() => setCancelTarget(null)} onDone={() => handleSaved('Factura anulada')} />
      <InvoiceDialog
        open={newOpen} onClose={() => setNewOpen(false)} detail={detail} ivaInfo={iva} canUnofficial={canUnofficial}
        onSaved={() => handleSaved('Factura registrada')}
      />
      <InvoiceDialog
        open={!!editInvoice} onClose={() => setEditInvoice(null)} detail={detail} invoice={editInvoice} ivaInfo={iva} canUnofficial={canUnofficial}
        onSaved={() => handleSaved('Factura corregida')}
      />
    </Box>
  );
}
