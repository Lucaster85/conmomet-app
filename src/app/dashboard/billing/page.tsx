'use client';
import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box, Button, Checkbox, FormControlLabel, InputAdornment, MenuItem, Paper, Stack, Tab, Tabs, TextField, Typography,
} from '@mui/material';
import {
  AddOutlined as AddIcon, ReceiptOutlined as TitleIcon, RefreshOutlined as RefreshIcon, SearchOutlined as SearchIcon,
} from '@mui/icons-material';
import ListFilters, { FilterSelect, FilterSwitch } from '@/components/common/ListFilters';
import FeedbackModal from '../../../components/FeedbackModal';
import GearSpinner from '../../../components/GearSpinner';
import DateField from '../../../components/DateField';
import BillablesList from '../../../components/billing/BillablesList';
import InvoiceList from '../../../components/billing/InvoiceList';
import InvoiceDialog from '../../../components/billing/InvoiceDialog';
import NewInvoiceStartDialog from '../../../components/billing/NewInvoiceStartDialog';
import ExchangeDifferenceDialog from '../../../components/billing/ExchangeDifferenceDialog';
import InvoiceAdjustmentDialog from '../../../components/billing/InvoiceAdjustmentDialog';
import InvoiceNoteDialog from '../../../components/billing/InvoiceNoteDialog';
import InvoiceViewDialog from '../../../components/billing/InvoiceViewDialog';
import FceTrackingList from '../../../components/billing/FceTrackingList';
import { CancelInvoiceDialog, DiscardInvoiceDialog, EmitInvoiceDialog, PayInvoiceDialog, VerifyInvoiceDialog } from '../../../components/billing/InvoiceActionDialogs';
import {
  BillableBudget, BillableOca, BillingStatus, BudgetBillingDetail, FceTrackingRow, Invoice, InvoiceClientOption, InvoiceService, InvoiceStatus,
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
  // Emitir es irreversible: además de poder cargar facturas hace falta invoices_emit.
  const canEmit = canWrite && userHasPermission(user, 'invoices_emit');

  // 0 Por facturar · 1 Facturas · 2 FCE (seguimiento con ARCA, solo si ARCA está habilitado o ya hay alguna FCE emitida).
  const [tab, setTab] = useState(searchParams.get('tab') === 'invoices' ? 1 : searchParams.get('tab') === 'fce' ? 2 : 0);
  const [fceAvailable, setFceAvailable] = useState(false);
  const [fceRefresh, setFceRefresh] = useState(0);
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
  // Buscador del registro de facturas: comprobante, cliente, CUIT, presupuesto (nuestro y del cliente), OC… (FLOWS.md §79).
  const [invSearch, setInvSearch] = useState('');
  const [debouncedInvSearch, setDebouncedInvSearch] = useState('');
  const [invStatusFilter, setInvStatusFilter] = useState<InvoiceStatus | ''>('');
  const [invClientFilter, setInvClientFilter] = useState('');
  const [invTypeFilter, setInvTypeFilter] = useState<VoucherType | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [invIncludeClosed, setInvIncludeClosed] = useState(false);

  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [payTarget, setPayTarget] = useState<Invoice | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Invoice | null>(null);
  const [emitTarget, setEmitTarget] = useState<Invoice | null>(null);
  const [verifyTarget, setVerifyTarget] = useState<Invoice | null>(null);
  const [discardTarget, setDiscardTarget] = useState<Invoice | null>(null);
  // Nota de crédito o de débito sobre una factura emitida (o edición de su borrador).
  const [noteDialog, setNoteDialog] = useState<{ original: Invoice; type: 'credit_note' | 'debit_note'; editing?: Invoice; annulment?: boolean } | null>(null);
  // Ajuste de precio de una factura emitida (o edición del borrador del ajuste): una factura nueva vinculada a la original.
  const [adjustDialog, setAdjustDialog] = useState<{ original: Invoice; editing?: Invoice } | null>(null);
  // Nota por diferencia de cambio sobre una factura en dólares (o edición de su borrador).
  const [exchangeDialog, setExchangeDialog] = useState<{ original: Invoice; editing?: Invoice } | null>(null);
  const [freeDialogOpen, setFreeDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<{ invoice: Invoice; detail: BudgetBillingDetail | null } | null>(null);
  // "Nueva factura": se elige el cliente y los presupuestos (una factura puede cobrar varios) y después se abre el diálogo de la factura.
  const [startOpen, setStartOpen] = useState(false);
  const [newTarget, setNewTarget] = useState<{ detail: BudgetBillingDetail | null; extra: BudgetBillingDetail[]; ocas: BillableOca[]; client: InvoiceClientOption } | null>(null);

  useEffect(() => {
    InvoiceService.getClientOptions().then(setClients).catch(() => setClients([]));
    // La pestaña FCE aparece si ARCA está habilitado o ya hay alguna FCE emitida (con cerradas incluidas).
    InvoiceService.getFceTracking({ include_closed: true })
      .then((r) => setFceAvailable(r.arca_enabled || r.summary.total > 0))
      .catch(() => setFceAvailable(false));
    SystemSettingService.get().then((s) => setIva(ivaInfoFromRates(s.invoice_iva_rates))).catch(() => { /* queda el 21% */ });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedInvSearch(invSearch), invSearch ? 300 : 0);
    return () => clearTimeout(timer);
  }, [invSearch]);

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
        include_closed: invIncludeClosed,
        q: debouncedInvSearch.trim() || undefined,
      });
      if (request === invoicesRequest.current) setInvoices(result);
    } catch (err) {
      if (request === invoicesRequest.current) setError(err instanceof Error ? err.message : 'Error al cargar las facturas');
    } finally {
      if (request === invoicesRequest.current) setLoadingInvoices(false);
    }
  }, [invStatusFilter, invClientFilter, invTypeFilter, dateFrom, dateTo, invIncludeClosed, debouncedInvSearch]);

  useEffect(() => { loadRows(); }, [loadRows]);
  useEffect(() => { loadInvoices(); }, [loadInvoices]);

  const hasInvoiceFilters = !!(invSearch || invClientFilter || invStatusFilter || invTypeFilter || dateFrom || dateTo || invIncludeClosed);
  const clearInvoiceFilters = () => {
    setInvSearch(''); setInvClientFilter(''); setInvStatusFilter(''); setInvTypeFilter(''); setDateFrom(''); setDateTo(''); setInvIncludeClosed(false);
  };

  const refreshAll = () => { loadRows(); loadInvoices(); setFceRefresh((n) => n + 1); };

  const handleSaved = (message: string) => {
    setSuccess(message);
    setFreeDialogOpen(false);
    setEditTarget(null);
    setNewTarget(null);
    setAdjustDialog(null);
    setPayTarget(null);
    setCancelTarget(null);
    setEmitTarget(null);
    setVerifyTarget(null);
    setDiscardTarget(null);
    refreshAll();
  };

  const handleGeneratePdf = async (invoice: Invoice) => {
    try {
      await InvoiceService.generatePdf(invoice.id);
      handleSaved('PDF generado');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar el PDF de la factura');
    }
  };

  // Abre el diálogo de una nota sobre una factura emitida. Se vuelve a pedir la factura: trae lo que ya se acreditó de cada línea.
  const openNote = async (invoice: Invoice, type: 'credit_note' | 'debit_note', annulment = false) => {
    try {
      setNoteDialog({ original: await InvoiceService.get(invoice.id), type, annulment });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al abrir la factura');
    }
  };

  // Se vuelve a pedir la factura: trae lo ya acreditado de cada línea (la base del ajuste) y la OC de cada una.
  const openExchangeDifference = async (invoice: Invoice) => {
    try {
      setExchangeDialog({ original: await InvoiceService.get(invoice.id) });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al abrir la factura');
    }
  };

  const openAdjustment = async (invoice: Invoice) => {
    try {
      setAdjustDialog({ original: await InvoiceService.get(invoice.id) });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al abrir la factura');
    }
  };

  const editAdjustment = async (draft: Invoice) => {
    try {
      setAdjustDialog({ original: await InvoiceService.get(draft.adjusts_invoice_id as number), editing: draft });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al abrir el ajuste');
    }
  };

  // Un borrador de nota se edita en su propio diálogo (necesita la factura original).
  const editNote = async (note: Invoice) => {
    try {
      setNoteDialog({ original: await InvoiceService.get(note.associated_invoice_id as number), type: note.kind as 'credit_note' | 'debit_note', editing: note });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al abrir la nota');
    }
  };

  // Al guardar una nota nueva se pasa directo a la confirmación de emisión (si se puede emitir).
  const handleNoteSaved = (saved: Invoice) => {
    const wasEditing = !!noteDialog?.editing;
    setNoteDialog(null);
    refreshAll();
    setSuccess(wasEditing ? 'Borrador de nota actualizado' : 'Borrador de nota guardado');
    if (!wasEditing && canEmit) setEmitTarget(saved);
  };

  // Corregir una factura de un presupuesto necesita el detalle de saldos de ese presupuesto.
  const handleEdit = async (invoice: Invoice) => {
    if (invoice.exchange_difference) {
      try {
        setExchangeDialog({ original: await InvoiceService.get(invoice.associated_invoice_id as number), editing: invoice });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al abrir la nota');
      }
      return;
    }
    if (invoice.kind && invoice.kind !== 'invoice') { await editNote(invoice); return; }
    if (invoice.adjusts_invoice_id) { await editAdjustment(invoice); return; }
    try {
      // Una factura de varios presupuestos no tiene uno solo en la cabecera: el primero de sus líneas es el ancla y el diálogo trae el resto.
      const anchorId = invoice.budget_id ?? invoice.budgets?.[0]?.id ?? null;
      const detail = anchorId ? await InvoiceService.getBillable(anchorId) : null;
      setEditTarget({ invoice, detail });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al abrir la factura');
    }
  };

  const tabChange = (_: React.SyntheticEvent, value: number) => setTab(value);

  // Desde la pestaña FCE: ver la factura completa y emitir la nota de crédito de anulación de una rechazada.
  const viewFce = async (row: FceTrackingRow) => {
    try {
      setViewInvoice(await InvoiceService.get(row.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al abrir la factura');
    }
  };
  // Si la pestaña no corresponde (ARCA apagado y sin FCE), se vuelve a "Por facturar".
  const currentTab = tab === 2 && !fceAvailable ? 0 : tab;

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
          {canWrite && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setStartOpen(true)}>Nueva factura</Button>
          )}
          {canWrite && currentTab === 1 && (
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setFreeDialogOpen(true)}>Factura libre</Button>
          )}
        </Stack>
      </Box>

      <Tabs value={currentTab} onChange={tabChange} sx={{ mb: 2 }} variant="scrollable" scrollButtons="auto">
        <Tab label="Por facturar" />
        <Tab label="Facturas" />
        {fceAvailable && <Tab label="FCE" />}
      </Tabs>

      {currentTab === 0 && (
        <>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
              <TextField
                size="small" fullWidth placeholder="Buscar por presupuesto, N° del cliente, PC, proyecto, cliente o CUIT…"
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

      {currentTab === 1 && (
        <>
          <ListFilters
            search={invSearch} onSearchChange={setInvSearch}
            searchPlaceholder="Buscar por N° de factura, cliente, CUIT, presupuesto, N° del cliente u OC…"
            onClear={clearInvoiceFilters} hasActiveFilters={hasInvoiceFilters}
          >
            <FilterSelect label="Cliente" value={invClientFilter} onChange={setInvClientFilter} emptyLabel="Todos los clientes" options={clients.map((c) => ({ value: String(c.id), label: c.razonSocial }))} />
            <FilterSelect label="Estado" value={invStatusFilter} onChange={(v) => setInvStatusFilter(v as InvoiceStatus | '')} emptyLabel="Todos los estados" options={(Object.keys(INVOICE_STATUS_LABELS) as InvoiceStatus[]).map((st) => ({ value: st, label: INVOICE_STATUS_LABELS[st].label }))} />
            <FilterSelect label="Tipo" value={invTypeFilter} onChange={(v) => setInvTypeFilter(v as VoucherType | '')} emptyLabel="Todos los tipos" options={VOUCHER_TYPE_OPTIONS.filter((o) => o.value !== 'sin_factura' || canUnofficial).map((o) => ({ value: o.value, label: o.value === 'sin_factura' ? 'Sin factura' : o.label }))} />
            <DateField label="Emitida desde" size="small" fullWidth value={dateFrom} onChange={setDateFrom} />
            <DateField label="Emitida hasta" size="small" fullWidth value={dateTo} onChange={setDateTo} />
            <FilterSwitch label="Ver terminados" checked={invIncludeClosed} onChange={setInvIncludeClosed} />
          </ListFilters>
          {loadingInvoices ? (
            <Box display="flex" justifyContent="center" py={6}><GearSpinner /></Box>
          ) : (
            <InvoiceList
              invoices={invoices} canUpdate={canUpdate} canCorrect={canCorrect} canEmit={canEmit} canWrite={canWrite}
              onView={setViewInvoice} onEdit={handleEdit} onPay={setPayTarget} onCancel={setCancelTarget}
              onEmit={setEmitTarget} onVerify={setVerifyTarget} onDiscard={setDiscardTarget}
              onGeneratePdf={handleGeneratePdf} onCreateNote={openNote} onCreateAdjustment={openAdjustment} onCreateExchangeDifference={openExchangeDifference}
            />
          )}
        </>
      )}

      {currentTab === 2 && fceAvailable && (
        <FceTrackingList
          clients={clients} canWrite={canWrite} refreshKey={fceRefresh} onView={viewFce}
          onAnnul={(row) => openNote({ id: row.id } as Invoice, 'credit_note', true)} onError={setError}
        />
      )}

      <InvoiceViewDialog invoice={viewInvoice} onClose={() => setViewInvoice(null)} />
      <PayInvoiceDialog invoice={payTarget} onClose={() => setPayTarget(null)} onDone={() => handleSaved('Factura marcada como cobrada')} />
      <CancelInvoiceDialog invoice={cancelTarget} onClose={() => setCancelTarget(null)} onDone={() => handleSaved('Factura anulada')} />
      <EmitInvoiceDialog invoice={emitTarget} onClose={() => setEmitTarget(null)} onRefresh={refreshAll} onDone={(inv) => handleSaved(`Factura emitida en ARCA${inv.number ? `: N° ${String(inv.number).padStart(8, '0')}` : ''}`)} />
      <VerifyInvoiceDialog invoice={verifyTarget} onClose={() => setVerifyTarget(null)} onRefresh={refreshAll} onDone={() => handleSaved('Factura confirmada en ARCA')} />
      <DiscardInvoiceDialog invoice={discardTarget} onClose={() => setDiscardTarget(null)} onDone={() => handleSaved('Factura descartada')} />

      <ExchangeDifferenceDialog
        open={!!exchangeDialog} onClose={() => setExchangeDialog(null)} original={exchangeDialog?.original || null} editing={exchangeDialog?.editing}
        onSaved={() => { const editing = !!exchangeDialog?.editing; setExchangeDialog(null); handleSaved(editing ? 'Borrador de la nota actualizado' : 'Borrador de la nota guardado: emitilo desde el listado de facturas'); }}
      />
      <InvoiceAdjustmentDialog
        open={!!adjustDialog} onClose={() => setAdjustDialog(null)} original={adjustDialog?.original || null} editing={adjustDialog?.editing}
        onSaved={() => { const editing = !!adjustDialog?.editing; setAdjustDialog(null); handleSaved(editing ? 'Borrador de ajuste actualizado' : 'Borrador de ajuste guardado: emitilo desde el listado de facturas'); }}
      />
      <InvoiceNoteDialog
        open={!!noteDialog} onClose={() => setNoteDialog(null)} onSaved={handleNoteSaved}
        original={noteDialog?.original || null} type={noteDialog?.type || 'credit_note'} editing={noteDialog?.editing} annulmentPreset={noteDialog?.annulment}
      />
      <InvoiceDialog
        open={freeDialogOpen} onClose={() => setFreeDialogOpen(false)} ivaInfo={iva} canUnofficial={canUnofficial}
        onSaved={() => handleSaved('Factura registrada')}
      />
      <NewInvoiceStartDialog
        open={startOpen} onClose={() => setStartOpen(false)} clients={clients}
        onStart={(detail, extra, ocas, client) => { setStartOpen(false); setNewTarget({ detail, extra, ocas, client }); }}
      />
      <InvoiceDialog
        open={!!newTarget} onClose={() => setNewTarget(null)} ivaInfo={iva} canUnofficial={canUnofficial}
        detail={newTarget?.detail} extraDetails={newTarget?.extra} ocas={newTarget?.ocas} ocaClient={newTarget?.client}
        onSaved={(saved) => handleSaved(saved.source === 'arca' ? 'Borrador guardado: emitilo desde el listado de facturas' : 'Factura registrada')}
      />
      <InvoiceDialog
        open={!!editTarget} onClose={() => setEditTarget(null)} ivaInfo={iva} canUnofficial={canUnofficial}
        invoice={editTarget?.invoice} detail={editTarget?.detail}
        onSaved={(saved) => handleSaved(saved.source === 'arca' ? 'Borrador actualizado' : 'Factura corregida')}
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
