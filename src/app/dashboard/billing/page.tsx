'use client';
import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box, Button, Checkbox, FormControlLabel, InputAdornment, MenuItem, Paper, Stack, Tab, Tabs, TextField, Typography,
} from '@mui/material';
import {
  AddOutlined as AddIcon, ReceiptOutlined as TitleIcon, RefreshOutlined as RefreshIcon, SearchOutlined as SearchIcon,
} from '@mui/icons-material';
import FeedbackModal from '../../../components/FeedbackModal';
import GearSpinner from '../../../components/GearSpinner';
import DateField from '../../../components/DateField';
import BillablesList from '../../../components/billing/BillablesList';
import InvoiceList from '../../../components/billing/InvoiceList';
import InvoiceDialog from '../../../components/billing/InvoiceDialog';
import InvoiceViewDialog from '../../../components/billing/InvoiceViewDialog';
import { CancelInvoiceDialog, PayInvoiceDialog } from '../../../components/billing/InvoiceActionDialogs';
import {
  BillableBudget, BillingStatus, BudgetBillingDetail, Invoice, InvoiceClientOption, InvoiceService, InvoiceStatus,
  IvaInfo, SystemSettingService, VoucherType,
} from '../../../utils/api';
import { userHasPermission, useAuth } from '../../../utils/auth';
import { BILLING_STATUS_LABELS, INVOICE_STATUS_LABELS, ivaInfoFromRates, VOUCHER_TYPE_OPTIONS } from '../../../utils/billing';

function BillingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const canWrite = userHasPermission(user, 'invoices_write');
  const canUpdate = userHasPermission(user, 'invoices_update');
  const canCorrect = userHasPermission(user, 'invoices_correct');
  const canUnofficial = userHasPermission(user, 'invoices_unofficial');

  const [tab, setTab] = useState(searchParams.get('tab') === 'invoices' ? 1 : 0);
  const [clients, setClients] = useState<InvoiceClientOption[]>([]);
  const [iva, setIva] = useState<IvaInfo>(ivaInfoFromRates(null));
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // --- Por facturar ---
  const [rows, setRows] = useState<BillableBudget[]>([]);
  const [loadingRows, setLoadingRows] = useState(true);
  const [clientFilter, setClientFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<BillingStatus | ''>('');
  const [pendingOnly, setPendingOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // --- Facturas (registro) ---
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [invStatusFilter, setInvStatusFilter] = useState<InvoiceStatus | ''>('');
  const [invClientFilter, setInvClientFilter] = useState('');
  const [invTypeFilter, setInvTypeFilter] = useState<VoucherType | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [payTarget, setPayTarget] = useState<Invoice | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Invoice | null>(null);
  const [freeDialogOpen, setFreeDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<{ invoice: Invoice; detail: BudgetBillingDetail | null } | null>(null);

  useEffect(() => {
    InvoiceService.getClientOptions().then(setClients).catch(() => setClients([]));
    SystemSettingService.get().then((s) => setIva(ivaInfoFromRates(s.invoice_iva_rates))).catch(() => { /* queda el 21% */ });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Las respuestas pueden volver desordenadas si se cambian los filtros rápido: solo vale la última.
  const rowsRequest = useRef(0);
  const loadRows = useCallback(async () => {
    const request = ++rowsRequest.current;
    setLoadingRows(true);
    try {
      const result = await InvoiceService.getBillables({
        client_id: clientFilter ? Number(clientFilter) : undefined,
        billing_status: statusFilter || undefined,
        has_pending_payment: pendingOnly || undefined,
        q: debouncedSearch || undefined,
      });
      if (request !== rowsRequest.current) return;
      setRows(result.data);
      setIva(result.iva);
    } catch (err) {
      if (request === rowsRequest.current) setError(err instanceof Error ? err.message : 'Error al cargar los presupuestos');
    } finally {
      if (request === rowsRequest.current) setLoadingRows(false);
    }
  }, [clientFilter, statusFilter, pendingOnly, debouncedSearch]);

  const invoicesRequest = useRef(0);
  const loadInvoices = useCallback(async () => {
    const request = ++invoicesRequest.current;
    setLoadingInvoices(true);
    try {
      const result = await InvoiceService.getAll({
        status: invStatusFilter || undefined,
        client_id: invClientFilter ? Number(invClientFilter) : undefined,
        voucher_type: invTypeFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });
      if (request === invoicesRequest.current) setInvoices(result);
    } catch (err) {
      if (request === invoicesRequest.current) setError(err instanceof Error ? err.message : 'Error al cargar las facturas');
    } finally {
      if (request === invoicesRequest.current) setLoadingInvoices(false);
    }
  }, [invStatusFilter, invClientFilter, invTypeFilter, dateFrom, dateTo]);

  useEffect(() => { loadRows(); }, [loadRows]);
  useEffect(() => { loadInvoices(); }, [loadInvoices]);

  const refreshAll = () => { loadRows(); loadInvoices(); };

  const handleSaved = (message: string) => {
    setSuccess(message);
    setFreeDialogOpen(false);
    setEditTarget(null);
    setPayTarget(null);
    setCancelTarget(null);
    refreshAll();
  };

  // Corregir una factura de un presupuesto necesita el detalle de saldos de ese presupuesto.
  const handleEdit = async (invoice: Invoice) => {
    try {
      const detail = invoice.budget_id ? await InvoiceService.getBillable(invoice.budget_id) : null;
      setEditTarget({ invoice, detail });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al abrir la factura');
    }
  };

  const tabChange = (_: React.SyntheticEvent, value: number) => setTab(value);

  return (
    <Box>
      <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />
      <FeedbackModal open={!!success} onClose={() => setSuccess('')} message={success} type="success" />

      <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1} mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <TitleIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" fontWeight={700} letterSpacing="-0.02em" color="#1E293B">Facturación</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button startIcon={<RefreshIcon />} onClick={refreshAll}>Actualizar</Button>
          {canWrite && tab === 1 && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setFreeDialogOpen(true)}>Factura libre</Button>
          )}
        </Stack>
      </Box>

      <Tabs value={tab} onChange={tabChange} sx={{ mb: 2 }} variant="scrollable" scrollButtons="auto">
        <Tab label="Por facturar" />
        <Tab label="Facturas" />
      </Tabs>

      {tab === 0 && (
        <>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
              <TextField
                size="small" fullWidth placeholder="Buscar por presupuesto, PC, proyecto, cliente o CUIT…"
                value={search} onChange={(e) => setSearch(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
              />
              <TextField select size="small" label="Cliente" value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} sx={{ minWidth: 200 }}>
                <MenuItem value="">Todos</MenuItem>
                {clients.map((c) => <MenuItem key={c.id} value={String(c.id)}>{c.razonSocial}</MenuItem>)}
              </TextField>
              <TextField select size="small" label="Estado" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as BillingStatus | '')} sx={{ minWidth: 200 }}>
                <MenuItem value="">Todos</MenuItem>
                {(Object.keys(BILLING_STATUS_LABELS) as BillingStatus[]).map((s) => (
                  <MenuItem key={s} value={s}>{BILLING_STATUS_LABELS[s].label}</MenuItem>
                ))}
              </TextField>
              <FormControlLabel
                control={<Checkbox checked={pendingOnly} onChange={(e) => setPendingOnly(e.target.checked)} />}
                label="Con facturas pendientes de cobro" sx={{ whiteSpace: 'nowrap' }}
              />
            </Stack>
          </Paper>
          {loadingRows ? (
            <Box display="flex" justifyContent="center" py={6}><GearSpinner /></Box>
          ) : (
            <BillablesList rows={rows} ivaRate={iva.default_rate} onOpen={(row) => router.push(`/dashboard/billing/${row.id}`)} />
          )}
        </>
      )}

      {tab === 1 && (
        <>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField select size="small" label="Cliente" value={invClientFilter} onChange={(e) => setInvClientFilter(e.target.value)} sx={{ minWidth: 200 }}>
                <MenuItem value="">Todos</MenuItem>
                {clients.map((c) => <MenuItem key={c.id} value={String(c.id)}>{c.razonSocial}</MenuItem>)}
              </TextField>
              <TextField select size="small" label="Estado" value={invStatusFilter} onChange={(e) => setInvStatusFilter(e.target.value as InvoiceStatus | '')} sx={{ minWidth: 180 }}>
                <MenuItem value="">Todos</MenuItem>
                {(Object.keys(INVOICE_STATUS_LABELS) as InvoiceStatus[]).map((s) => (
                  <MenuItem key={s} value={s}>{INVOICE_STATUS_LABELS[s].label}</MenuItem>
                ))}
              </TextField>
              <TextField select size="small" label="Tipo" value={invTypeFilter} onChange={(e) => setInvTypeFilter(e.target.value as VoucherType | '')} sx={{ minWidth: 180 }}>
                <MenuItem value="">Todos</MenuItem>
                {VOUCHER_TYPE_OPTIONS.filter((o) => o.value !== 'sin_factura' || canUnofficial).map((o) => (
                  <MenuItem key={o.value} value={o.value}>{o.value === 'sin_factura' ? 'Sin factura' : o.label}</MenuItem>
                ))}
              </TextField>
              <DateField label="Emitida desde" size="small" value={dateFrom} onChange={setDateFrom} />
              <DateField label="Emitida hasta" size="small" value={dateTo} onChange={setDateTo} />
            </Stack>
          </Paper>
          {loadingInvoices ? (
            <Box display="flex" justifyContent="center" py={6}><GearSpinner /></Box>
          ) : (
            <InvoiceList
              invoices={invoices} canUpdate={canUpdate} canCorrect={canCorrect}
              onView={setViewInvoice} onEdit={handleEdit} onPay={setPayTarget} onCancel={setCancelTarget}
            />
          )}
        </>
      )}

      <InvoiceViewDialog invoice={viewInvoice} onClose={() => setViewInvoice(null)} />
      <PayInvoiceDialog invoice={payTarget} onClose={() => setPayTarget(null)} onDone={() => handleSaved('Factura marcada como cobrada')} />
      <CancelInvoiceDialog invoice={cancelTarget} onClose={() => setCancelTarget(null)} onDone={() => handleSaved('Factura anulada')} />

      <InvoiceDialog
        open={freeDialogOpen} onClose={() => setFreeDialogOpen(false)} ivaInfo={iva} canUnofficial={canUnofficial}
        onSaved={() => handleSaved('Factura registrada')}
      />
      <InvoiceDialog
        open={!!editTarget} onClose={() => setEditTarget(null)} ivaInfo={iva} canUnofficial={canUnofficial}
        invoice={editTarget?.invoice} detail={editTarget?.detail}
        onSaved={() => handleSaved('Factura corregida')}
      />
    </Box>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<Box display="flex" justifyContent="center" py={8}><GearSpinner /></Box>}>
      <BillingContent />
    </Suspense>
  );
}
