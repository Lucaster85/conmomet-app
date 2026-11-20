'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert, Box, Button, Card, Chip, Collapse, IconButton, Paper, Snackbar, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography,
} from '@mui/material';
import {
  HistoryOutlined as HistoryIcon, SyncOutlined as SyncIcon, UndoOutlined as AnnulIcon, VisibilityOutlined as ViewIcon,
} from '@mui/icons-material';
import ListFilters, { FilterSelect, FilterSwitch } from '@/components/common/ListFilters';
import GearSpinner from '../GearSpinner';
import DateField from '../DateField';
import FceHistoryDialog from './FceHistoryDialog';
import {
  FceGroup, FceSyncResult, FceTrackingRow, FceTrackingSummary, InvoiceClientOption, InvoiceService,
} from '../../utils/api';
import {
  acceptanceDueText, FCE_ACCOUNT_STATE_LABELS, FCE_GROUP_LABELS, fceStateChip, formatDate, formatMoney, formatVoucher,
} from '../../utils/billing';

interface Props {
  clients: InvoiceClientOption[];
  // invoices_write: sincronizar con ARCA y emitir la nota de crédito de anulación.
  canWrite: boolean;
  // Cambia cuando la pantalla recarga todo (botón "Actualizar", después de emitir una nota).
  refreshKey: number;
  onView: (row: FceTrackingRow) => void;
  onAnnul: (row: FceTrackingRow) => void;
  onError: (message: string) => void;
}

const EMPTY_SUMMARY: FceTrackingSummary = { pending: 0, accepted: 0, rejected: 0, informed: 0, cancelled: 0, adc_pending: 0, total: 0 };
const WARNING_DAYS = 5;

// "hace 5 minutos", "hace 2 horas", "hace 3 días".
function timeAgo(iso: string | null): string {
  if (!iso) return 'nunca';
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return 'hace instantes';
  if (minutes < 60) return `hace ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  const days = Math.round(hours / 24);
  return `hace ${days} ${days === 1 ? 'día' : 'días'}`;
}

// Todas son FCE A (código 201): el tipo de letra no viaja en el listado.
const fceVoucher = (row: FceTrackingRow) => formatVoucher({ voucher_type: 'A', cbte_tipo: row.cbte_tipo, pos_number: row.pos_number, number: row.number });

const STATE_OPTIONS = (Object.keys(FCE_GROUP_LABELS) as FceGroup[]).map((g) => ({ value: g, label: FCE_GROUP_LABELS[g].label }));

export default function FceTrackingList({ clients, canWrite, refreshKey, onView, onAnnul, onError }: Props) {
  const [rows, setRows] = useState<FceTrackingRow[]>([]);
  const [summary, setSummary] = useState<FceTrackingSummary>(EMPTY_SUMMARY);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncingId, setSyncingId] = useState<number | null>(null);
  const [snack, setSnack] = useState('');
  const [syncResult, setSyncResult] = useState<FceSyncResult | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [historyRow, setHistoryRow] = useState<FceTrackingRow | null>(null);

  const [search, setSearch] = useState('');
  const [client, setClient] = useState('');
  const [state, setState] = useState<FceGroup | ''>('');
  const [transfer, setTransfer] = useState<'SCA' | 'ADC' | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [includeClosed, setIncludeClosed] = useState(false);

  // Las respuestas pueden volver desordenadas si se cambian los filtros rápido: solo vale la última.
  const requestId = useRef(0);
  const load = useCallback(async () => {
    const request = ++requestId.current;
    setLoading(true);
    try {
      const result = await InvoiceService.getFceTracking({
        q: search.trim() || undefined,
        client_id: client ? Number(client) : undefined,
        state: state || undefined,
        transfer_option: transfer || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        include_closed: includeClosed || undefined,
      });
      if (request !== requestId.current) return;
      setRows(result.data);
      setSummary(result.summary);
      setLastSync(result.last_sync_at);
    } catch (err) {
      if (request === requestId.current) onError(err instanceof Error ? err.message : 'Error al obtener el seguimiento de las FCE');
    } finally {
      if (request === requestId.current) setLoading(false);
    }
  }, [search, client, state, transfer, dateFrom, dateTo, includeClosed, onError]);

  // Debounce solo en la búsqueda de texto: los selects consultan al tocarlos.
  useEffect(() => {
    const timer = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, refreshKey, search]);

  const summaryText = (result: FceSyncResult) =>
    `${result.checked} ${result.checked === 1 ? 'revisada' : 'revisadas'}, ${result.updated} ${result.updated === 1 ? 'cambió' : 'cambiaron'}`;

  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      const result = await InvoiceService.syncFce();
      setSyncResult(result);
      setShowDetail(false);
      setSnack(summaryText(result));
      await load();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Error al sincronizar las FCE con ARCA');
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncOne = async (row: FceTrackingRow) => {
    setSyncingId(row.id);
    try {
      const result = await InvoiceService.syncFceInvoice(row.id);
      if (result.not_found_in_arca.length > 0 && result.checked === result.not_found_in_arca.length) {
        setSnack('ARCA todavía no devuelve esta factura (puede ser una demora). Probá de nuevo más tarde.');
      } else {
        setSnack(result.updated > 0 ? 'La FCE se actualizó con lo que informa ARCA' : 'Sin cambios en ARCA');
      }
      await load();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Error al sincronizar la FCE con ARCA');
    } finally {
      setSyncingId(null);
    }
  };

  const hasFilters = !!(search || client || state || transfer || dateFrom || dateTo || includeClosed);
  const clearFilters = () => { setSearch(''); setClient(''); setState(''); setTransfer(''); setDateFrom(''); setDateTo(''); setIncludeClosed(false); };
  const pickGroup = (group: FceGroup) => { setTransfer(''); setState(state === group ? '' : group); };
  const pickAdc = () => {
    const active = state === 'accepted' && transfer === 'ADC';
    setState(active ? '' : 'accepted');
    setTransfer(active ? '' : 'ADC');
  };

  const hasDetail = !!syncResult && (syncResult.not_found_in_arca.length > 0 || syncResult.only_in_arca.length > 0 || syncResult.truncated);

  const dueCell = (row: FceTrackingRow) => {
    if (row.group === 'accepted' || row.group === 'informed' || row.group === 'cancelled') {
      if (!row.fce_synced_at) return null;
      return (
        <Typography variant="caption" color="text.secondary" display="block">
          {row.fce_acceptance_type === 'Tacita' ? 'Aceptada tácitamente' : row.fce_acceptance_type === 'Expresa' ? 'Aceptada por el cliente' : 'Aceptada'}
          {row.fce_acceptance_at ? ` el ${formatDate(row.fce_acceptance_at)}` : ''}
        </Typography>
      );
    }
    const text = acceptanceDueText(row.acceptance_days_left);
    if (!text) return null;
    const warn = row.acceptance_days_left !== null && row.acceptance_days_left <= WARNING_DAYS;
    return <Typography variant="caption" color={warn ? 'warning.main' : 'text.secondary'} fontWeight={warn ? 700 : 400} display="block">{text}</Typography>;
  };

  const stateChips = (row: FceTrackingRow) => {
    const cmp = fceStateChip(row);
    const account = row.fce_account_state ? FCE_ACCOUNT_STATE_LABELS[row.fce_account_state] : null;
    return (
      <Stack spacing={0.5} alignItems="flex-start">
        <Chip size="small" color={cmp.color} label={cmp.label} />
        {account && <Chip size="small" variant="outlined" color={account.color} label={`Cuenta: ${account.label}`} />}
        {row.adc_pending && <Chip size="small" color="warning" variant="outlined" label="ADC: falta informar" />}
      </Stack>
    );
  };

  const rejection = (row: FceTrackingRow) => (row.group === 'rejected' ? (
    <Box>
      {row.fce_rejection_reasons.map((reason, index) => (
        <Typography key={index} variant="caption" color="error" display="block">
          {[reason.description, reason.justification].filter(Boolean).join(': ') || 'Motivo sin detalle'}
        </Typography>
      ))}
      {row.annulment_note ? (
        <Chip size="small" color="success" variant="outlined" sx={{ mt: 0.5 }} label="NC de anulación emitida" />
      ) : (
        canWrite && <Button size="small" color="warning" variant="outlined" startIcon={<AnnulIcon />} sx={{ mt: 0.5 }} onClick={() => onAnnul(row)}>Emitir nota de crédito de anulación</Button>
      )}
    </Box>
  ) : null);

  const notes = (row: FceTrackingRow) => row.notes.filter((n) => n.status !== 'cancelled' && n.arca_status === 'authorized').map((n) => (
    <Chip key={n.id} size="small" variant="outlined" sx={{ mr: 0.5, mt: 0.5 }}
      label={`${n.kind === 'credit_note' ? 'NC' : 'ND'} ${String(n.pos_number ?? 0).padStart(4, '0')}-${String(n.number ?? 0).padStart(8, '0')}${n.fce_cmp_state ? ` · ${n.fce_cmp_state === 'Rechazado' ? 'Rechazada' : n.fce_cmp_state === 'Recepcionado' ? 'Recepcionada' : n.fce_cmp_state === 'PendienteRecepcion' ? 'Pend. de recepción' : 'Aceptada'}` : ''}`} />
  ));

  const actions = (row: FceTrackingRow) => (
    <Box display="flex" gap={0.5} flexWrap="wrap">
      <Tooltip title="Ver factura"><IconButton size="small" onClick={() => onView(row)}><ViewIcon fontSize="small" /></IconButton></Tooltip>
      {canWrite && (
        <Tooltip title="Actualizar desde ARCA">
          <span><IconButton size="small" color="primary" onClick={() => handleSyncOne(row)} disabled={syncing || syncingId === row.id}>
            {syncingId === row.id ? <GearSpinner size={18} /> : <SyncIcon fontSize="small" />}
          </IconButton></span>
        </Tooltip>
      )}
      <Tooltip title="Historial de estados"><IconButton size="small" onClick={() => setHistoryRow(row)}><HistoryIcon fontSize="small" /></IconButton></Tooltip>
    </Box>
  );

  const balance = (row: FceTrackingRow) => (row.fce_balance === null ? null : (
    <>
      <Typography variant="body2">Saldo {formatMoney(row.fce_balance, row.currency)}</Typography>
      {row.fce_accepted_balance !== null && <Typography variant="caption" color="text.secondary" display="block">Aceptado {formatMoney(row.fce_accepted_balance, row.currency)}</Typography>}
    </>
  ));

  const emptyText = hasFilters ? 'No hay FCE que coincidan con los filtros.' : 'Todavía no hay Facturas de Crédito Electrónica emitidas por ARCA.';

  return (
    <>
      <Paper sx={{ p: 2, mb: 2, borderRadius: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1.5}>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {(['pending', 'accepted', 'rejected'] as FceGroup[]).map((group) => (
              <Chip
                key={group} clickable color={FCE_GROUP_LABELS[group].color} variant={state === group && !transfer ? 'filled' : 'outlined'}
                label={`${FCE_GROUP_LABELS[group].label}: ${summary[group]}`} onClick={() => pickGroup(group)}
              />
            ))}
            <Chip
              clickable color="warning" variant={state === 'accepted' && transfer === 'ADC' ? 'filled' : 'outlined'}
              label={`ADC sin informar: ${summary.adc_pending}`} onClick={pickAdc}
            />
          </Stack>
          <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
            <Typography variant="caption" color="text.secondary">Última sincronización: {timeAgo(lastSync)}</Typography>
            <Tooltip title={canWrite ? '' : 'Necesitás permiso para cargar facturas (invoices_write)'}>
              <span>
                <Button variant="contained" startIcon={syncing ? undefined : <SyncIcon />} onClick={handleSyncAll} disabled={!canWrite || syncing}>
                  {syncing ? <GearSpinner size={20} /> : 'Sincronizar con ARCA'}
                </Button>
              </span>
            </Tooltip>
          </Box>
        </Box>
        {syncResult && (
          <Box mt={1.5}>
            <Alert severity={hasDetail ? 'warning' : 'success'} onClose={() => setSyncResult(null)}
              action={hasDetail ? <Button size="small" color="inherit" onClick={() => setShowDetail((v) => !v)}>{showDetail ? 'Ocultar detalle' : 'Ver detalle'}</Button> : undefined}>
              {summaryText(syncResult)}.
              {hasDetail && ' Hay avisos para revisar.'}
            </Alert>
            <Collapse in={showDetail && hasDetail}>
              <Stack spacing={1} mt={1}>
                {syncResult.truncated && <Alert severity="warning">ARCA devolvió más resultados de los que se pueden traer de una vez: sincronizá de nuevo para completar.</Alert>}
                {syncResult.not_found_in_arca.length > 0 && (
                  <Alert severity="info">
                    ARCA todavía no devuelve estas facturas (suele ser una demora de ARCA; no se tocaron): {syncResult.not_found_in_arca.map((i) => i.label).join(' · ')}
                  </Alert>
                )}
                {syncResult.only_in_arca.length > 0 && (
                  <Alert severity="info">
                    En ARCA y no en la app (probablemente emitidas fuera de la app; no se importan): {syncResult.only_in_arca.map((i) => i.label).join(' · ')}
                  </Alert>
                )}
              </Stack>
            </Collapse>
          </Box>
        )}
      </Paper>

      <ListFilters search={search} onSearchChange={setSearch} searchPlaceholder="Buscar por cliente, CUIT o número de factura…" onClear={clearFilters} hasActiveFilters={hasFilters}>
        <FilterSelect label="Cliente" value={client} onChange={setClient} emptyLabel="Todos los clientes" options={clients.map((c) => ({ value: String(c.id), label: c.razonSocial }))} />
        <FilterSelect label="Estado" value={state} onChange={(v) => setState(v as FceGroup | '')} emptyLabel="Todos los estados" options={STATE_OPTIONS} />
        <FilterSelect label="Opción de transferencia" value={transfer} onChange={(v) => setTransfer(v as 'SCA' | 'ADC' | '')} emptyLabel="Todas las opciones" options={[{ value: 'SCA', label: 'SCA' }, { value: 'ADC', label: 'ADC' }]} />
        <DateField label="Emitida desde" size="small" fullWidth value={dateFrom} onChange={setDateFrom} />
        <DateField label="Emitida hasta" size="small" fullWidth value={dateTo} onChange={setDateTo} />
        <FilterSwitch label="Ver terminados" checked={includeClosed} onChange={setIncludeClosed} />
      </ListFilters>

      {loading ? (
        <Box display="flex" justifyContent="center" py={6}><GearSpinner /></Box>
      ) : (
        <>
          {/* Mobile Cards */}
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            {rows.length === 0 ? (
              <Typography color="text.secondary" textAlign="center" py={4}>{emptyText}</Typography>
            ) : (
              <Stack spacing={2}>
                {rows.map((row) => (
                  <Card key={row.id} sx={{ p: 2, borderRadius: 2, opacity: row.status === 'cancelled' ? 0.65 : 1 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1} mb={1}>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">{fceVoucher(row)}</Typography>
                        <Typography variant="caption" color="text.secondary">Emitida {formatDate(row.issue_date)}{row.transfer_option ? ` · ${row.transfer_option}` : ''}</Typography>
                      </Box>
                      {stateChips(row)}
                    </Box>
                    <Typography variant="body2">{row.client?.razonSocial}</Typography>
                    <Typography variant="subtitle2" sx={{ mt: 0.5 }}>Total {formatMoney(row.total_amount, row.currency)}</Typography>
                    {balance(row)}
                    {dueCell(row)}
                    {!row.fce_synced_at && <Typography variant="caption" color="text.secondary" display="block">Todavía no se sincronizó con ARCA.</Typography>}
                    {rejection(row)}
                    <Box>{notes(row)}</Box>
                    <Box mt={1}>{actions(row)}</Box>
                  </Card>
                ))}
              </Stack>
            )}
          </Box>

          {/* Desktop Table */}
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <TableContainer component={Paper} elevation={2}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Comprobante</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Emisión</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell>Opción</TableCell>
                    <TableCell>Estado en ARCA</TableCell>
                    <TableCell>Aceptación</TableCell>
                    <TableCell align="right">Saldo</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow><TableCell colSpan={9} align="center">{emptyText}</TableCell></TableRow>
                  ) : rows.map((row) => (
                    <TableRow key={row.id} hover sx={{ opacity: row.status === 'cancelled' ? 0.65 : 1, verticalAlign: 'top' }}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{fceVoucher(row)}</Typography>
                        <Box>{notes(row)}</Box>
                      </TableCell>
                      <TableCell>{row.client?.razonSocial}</TableCell>
                      <TableCell>{formatDate(row.issue_date)}</TableCell>
                      <TableCell align="right"><strong>{formatMoney(row.total_amount, row.currency)}</strong></TableCell>
                      <TableCell>{row.transfer_option || '—'}</TableCell>
                      <TableCell>
                        {stateChips(row)}
                        {!row.fce_synced_at && <Typography variant="caption" color="text.secondary" display="block">Sin sincronizar</Typography>}
                      </TableCell>
                      <TableCell>
                        {dueCell(row)}
                        {rejection(row)}
                      </TableCell>
                      <TableCell align="right">{balance(row) || '—'}</TableCell>
                      <TableCell>{actions(row)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </>
      )}

      <FceHistoryDialog row={historyRow} onClose={() => setHistoryRow(null)} />
      <Snackbar open={!!snack} autoHideDuration={6000} onClose={() => setSnack('')} message={snack} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </>
  );
}
