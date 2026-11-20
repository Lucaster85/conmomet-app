'use client';
import React, { useState } from 'react';
import {
  Alert, Box, Button, Card, Chip, Collapse, DialogActions, DialogContent, DialogTitle, IconButton, Link as MuiLink, Stack, TextField, Tooltip, Typography,
} from '@mui/material';
import {
  AddOutlined as AddIcon, DeleteOutline as DeleteIcon, EditOutlined as EditIcon, UploadFileOutlined as UploadIcon,
} from '@mui/icons-material';
import AppDialog from '@/components/common/AppDialog';
import { useFileViewer } from '@/components/common/FileViewer';
import {
  BillingDocsService, BillingStoredFile, BudgetBillingDetail, BudgetBillingFile, PurchaseOrder, SuretyBond,
} from '../../utils/api';
import {
  BILLING_FILE_ACCEPT, bondDaysLabel, BOND_PURPOSE_LABELS, BOND_STATUS_LABELS, formatDate, formatMoney, PO_ADJUSTMENT_LABELS, PO_CONCEPT_LABELS,
  PO_STATUS_LABELS, validateBillingFiles,
} from '../../utils/billing';
import PurchaseOrderDialog, { PurchaseOrderDialogMode } from './PurchaseOrderDialog';
import SuretyBondDialog from './SuretyBondDialog';

interface Props {
  detail: BudgetBillingDetail;
  canWrite: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  // Algo cambió: la página recarga el detalle y muestra el mensaje (y los archivos que no se pudieron subir, si hubo).
  onChanged: (message: string, warnings?: string[]) => void;
  onError: (message: string) => void;
}

type Confirm =
  | { kind: 'reject-order'; order: PurchaseOrder }
  | { kind: 'delete-order'; order: PurchaseOrder }
  | { kind: 'delete-bond'; bond: SuretyBond }
  | { kind: 'delete-file'; file: BudgetBillingFile }
  | null;

// OC del cliente, seguros de caución y documentos extra del presupuesto (FLOWS.md §69). Va dentro del detalle de facturación.
export default function BillingDocsSection({ detail, canWrite, canUpdate, canDelete, onChanged, onError }: Props) {
  const { fileLinkProps } = useFileViewer();
  const { budget, purchase_orders: orders, surety_bonds: bonds, billing_files: billingFiles, purchase_order_not_required: notRequired } = detail;
  const activeOrders = orders.filter((o) => o.status === 'active');
  const history = orders.filter((o) => o.status !== 'active');

  const [orderDialog, setOrderDialog] = useState<PurchaseOrderDialogMode | null>(null);
  const [bondDialog, setBondDialog] = useState<{ bond: SuretyBond | null } | null>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const run = async (action: () => Promise<unknown>, message: string, fallback: string) => {
    setBusy(true);
    try {
      await action();
      setConfirm(null);
      onChanged(message);
    } catch (err) {
      onError(err instanceof Error ? err.message : fallback);
    } finally {
      setBusy(false);
    }
  };

  const toggleNotRequired = (value: boolean) =>
    run(() => BillingDocsService.setNotRequired(budget.id, value), value ? 'Marcado: este presupuesto no lleva OC' : 'Listo: el presupuesto vuelve a esperar su OC', 'Error al actualizar el presupuesto');

  const attachToOrder = async (order: PurchaseOrder, list: FileList | null) => {
    const files = Array.from(list || []);
    if (files.length === 0) return;
    const invalid = validateBillingFiles(files);
    if (invalid) { onError(invalid); return; }
    setBusy(true);
    try {
      const { warnings } = await BillingDocsService.addOrderFiles(order.id, files);
      onChanged('Archivos adjuntados', warnings);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Error al adjuntar los archivos');
    } finally {
      setBusy(false);
    }
  };

  const fileLinks = (files: BillingStoredFile[], onRemove?: (file: BillingStoredFile) => void) => (
    <Stack spacing={0.25}>
      {files.map((file) => (
        <Box key={file.id} display="flex" alignItems="center" gap={0.5}>
          <MuiLink variant="body2" {...fileLinkProps(file.file_url, file.file_name)}>{file.file_name}</MuiLink>
          {onRemove && (
            <Tooltip title="Quitar archivo"><IconButton size="small" aria-label={`Quitar ${file.file_name}`} onClick={() => onRemove(file)}><DeleteIcon fontSize="inherit" /></IconButton></Tooltip>
          )}
        </Box>
      ))}
    </Stack>
  );

  const orderCard = (order: PurchaseOrder) => {
    const status = PO_STATUS_LABELS[order.status];
    const isActive = order.status === 'active';
    return (
      <Card key={order.id} sx={{ p: 2, borderRadius: 2, opacity: isActive ? 1 : 0.85 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1} flexWrap="wrap">
          <Box>
            <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
              <Typography variant="subtitle1" fontWeight={700}>OC {order.number}</Typography>
              <Chip size="small" color={status.color} label={status.label} />
              <Chip size="small" variant="outlined" label={PO_CONCEPT_LABELS[order.concept]} />
            </Box>
            <Typography variant="body2" color="text.secondary">
              {formatDate(order.date)} · {order.amount != null ? formatMoney(order.amount, order.currency) : 'Solo de referencia (sin monto)'}
              {order.replaces ? ` · reemplaza a la OC ${order.replaces.number}` : ''}
            </Typography>
          </Box>
          {isActive && (
            <Box display="flex" gap={0.5} flexWrap="wrap">
              {canUpdate && <Button size="small" startIcon={<EditIcon />} onClick={() => setOrderDialog({ kind: 'edit', order })}>Editar</Button>}
              {canWrite && <Button size="small" onClick={() => setOrderDialog({ kind: 'replace', order })}>Reemplazar</Button>}
              {canUpdate && <Button size="small" color="warning" onClick={() => { setReason(''); setConfirm({ kind: 'reject-order', order }); }}>Rechazar</Button>}
              {canDelete && <IconButton size="small" aria-label="Eliminar OC" onClick={() => setConfirm({ kind: 'delete-order', order })}><DeleteIcon fontSize="small" /></IconButton>}
            </Box>
          )}
        </Box>
        {isActive && (order.billed ?? 0) > 0 && (
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            <strong>Facturado contra esta OC:</strong> {formatMoney(order.billed ?? 0, order.currency)}
            {order.balance !== null && order.balance !== undefined ? ` · Saldo: ${formatMoney(order.balance, order.currency)}` : ''}
          </Typography>
        )}
        {order.rejection_reason && (
          <Typography variant="body2" sx={{ mt: 1 }}><strong>{order.status === 'replaced' ? 'Motivo del reemplazo' : 'Motivo del rechazo'}:</strong> {order.rejection_reason}</Typography>
        )}
        {order.payment_terms && <Typography variant="body2" sx={{ mt: 1 }}><strong>Condiciones de pago:</strong> {order.payment_terms}</Typography>}
        {order.allows_adjustment && (
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            <strong>Ajuste de precios:</strong> {PO_ADJUSTMENT_LABELS[order.adjustment_type]}{order.adjustment_notes ? ` · ${order.adjustment_notes}` : ''}
          </Typography>
        )}
        {order.items.length > 0 && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">Posiciones</Typography>
            {order.items.map((item) => (
              <Typography variant="body2" key={item.id}>
                {item.position ? `${item.position} · ` : ''}{item.description}{item.amount != null ? ` — ${formatMoney(item.amount, order.currency)}` : ''}
              </Typography>
            ))}
          </Box>
        )}
        {(order.files.length > 0 || (isActive && canWrite)) && (
          <Box sx={{ mt: 1 }}>
            {order.files.length > 0 && fileLinks(order.files, isActive && canDelete ? (file) => run(() => BillingDocsService.removeOrderFile(order.id, file.id), 'Archivo quitado', 'Error al quitar el archivo') : undefined)}
            {isActive && canWrite && (
              <Button component="label" size="small" startIcon={<UploadIcon />} disabled={busy} sx={{ mt: 0.5 }}>
                Adjuntar archivos
                <input hidden multiple type="file" accept={BILLING_FILE_ACCEPT} onChange={(e) => { attachToOrder(order, e.target.files); e.target.value = ''; }} />
              </Button>
            )}
          </Box>
        )}
      </Card>
    );
  };

  const bondCard = (bond: SuretyBond) => {
    const status = BOND_STATUS_LABELS[bond.status];
    return (
      <Card key={bond.id} sx={{ p: 2, borderRadius: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1} flexWrap="wrap">
          <Box>
            <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
              <Typography variant="subtitle1" fontWeight={700}>Póliza {bond.policy_number}</Typography>
              <Chip size="small" color={status.color} label={status.label} />
              <Chip size="small" variant="outlined" label={BOND_PURPOSE_LABELS[bond.purpose]} />
            </Box>
            <Typography variant="body2" color="text.secondary">
              {bond.insurer} · {formatMoney(bond.amount, bond.currency)}
              {bond.purchaseOrder ? ` · OC ${bond.purchaseOrder.number}` : ''}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {bond.issue_date ? `Emitida el ${formatDate(bond.issue_date)} · ` : ''}
              {bond.expiration_date ? `Vence el ${formatDate(bond.expiration_date)}${bond.status === 'released' ? '' : ` (${bondDaysLabel(bond.days_left)})`}` : 'Sin vencimiento'}
              {bond.released_at ? ` · liberada el ${formatDate(bond.released_at)}` : ''}
            </Typography>
          </Box>
          <Box display="flex" gap={0.5} flexWrap="wrap">
            {canUpdate && <Button size="small" startIcon={<EditIcon />} onClick={() => setBondDialog({ bond })}>Editar</Button>}
            {canUpdate && (
              <Button size="small" onClick={() => run(() => BillingDocsService.releaseBond(bond.id, !bond.released_at), bond.released_at ? 'Caución reactivada' : 'Caución liberada: no avisa más', 'Error al actualizar la caución')} disabled={busy}>
                {bond.released_at ? 'Reactivar' : 'Marcar liberada'}
              </Button>
            )}
            {canDelete && <IconButton size="small" aria-label="Eliminar caución" onClick={() => setConfirm({ kind: 'delete-bond', bond })}><DeleteIcon fontSize="small" /></IconButton>}
          </Box>
        </Box>
        {bond.notes && <Typography variant="body2" sx={{ mt: 1 }}>{bond.notes}</Typography>}
        {bond.file_url && (
          <Box sx={{ mt: 1 }}><MuiLink variant="body2" {...fileLinkProps(bond.file_url, bond.file_name || undefined)}>{bond.file_name || 'Ver póliza'}</MuiLink></Box>
        )}
      </Card>
    );
  };

  const [extraFiles, setExtraFiles] = useState<File[]>([]);
  const [extraDescription, setExtraDescription] = useState('');
  const uploadExtras = async () => {
    const invalid = validateBillingFiles(extraFiles);
    if (invalid) { onError(invalid); return; }
    setBusy(true);
    try {
      const { warnings } = await BillingDocsService.addBillingFiles(budget.id, extraFiles, extraDescription.trim());
      setExtraFiles([]);
      setExtraDescription('');
      onChanged('Documentos adjuntados', warnings);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Error al adjuntar los documentos');
    } finally {
      setBusy(false);
    }
  };

  const confirmTitle = confirm?.kind === 'reject-order' ? 'Rechazar OC' : confirm?.kind === 'delete-order' ? 'Eliminar OC' : confirm?.kind === 'delete-bond' ? 'Eliminar caución' : 'Quitar documento';

  const handleConfirm = () => {
    if (!confirm) return;
    if (confirm.kind === 'reject-order') {
      if (!reason.trim()) { onError('Indicá el motivo del rechazo.'); return; }
      run(() => BillingDocsService.rejectOrder(confirm.order.id, reason.trim()), 'OC rechazada: quedó guardada con su motivo', 'Error al rechazar la OC');
    } else if (confirm.kind === 'delete-order') {
      run(() => BillingDocsService.deleteOrder(confirm.order.id), 'OC eliminada', 'Error al eliminar la OC');
    } else if (confirm.kind === 'delete-bond') {
      run(() => BillingDocsService.deleteBond(confirm.bond.id), 'Caución eliminada', 'Error al eliminar la caución');
    } else {
      run(() => BillingDocsService.deleteBillingFile(confirm.file.id), 'Documento quitado', 'Error al quitar el documento');
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      {/* Órdenes de compra del cliente */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }} flexWrap="wrap" gap={1}>
        <Typography variant="h6" fontWeight={700}>Órdenes de compra del cliente</Typography>
        {canWrite && <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => setOrderDialog({ kind: 'create' })}>Cargar OC</Button>}
      </Stack>
      {activeOrders.length === 0 && !notRequired && (
        <Alert
          severity="warning" sx={{ mb: 1.5 }}
          action={canUpdate ? <Button color="inherit" size="small" disabled={busy} onClick={() => toggleNotRequired(true)}>No lleva OC</Button> : undefined}
        >
          Este presupuesto está aprobado y todavía no tiene OC del cliente. Cargala o, si el cliente no emite OC, marcalo como “No lleva OC” para apagar el aviso del tablero.
        </Alert>
      )}
      {activeOrders.length === 0 && notRequired && (
        <Alert
          severity="info" sx={{ mb: 1.5 }}
          action={canUpdate ? <Button color="inherit" size="small" disabled={busy} onClick={() => toggleNotRequired(false)}>Sí lleva OC</Button> : undefined}
        >
          Marcado como “No lleva OC”: no aparece en el aviso del tablero.
        </Alert>
      )}
      <Stack spacing={1.5}>{activeOrders.map(orderCard)}</Stack>
      {history.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <Button size="small" onClick={() => setShowHistory((v) => !v)}>{showHistory ? 'Ocultar' : 'Ver'} OC rechazadas o reemplazadas ({history.length})</Button>
          <Collapse in={showHistory}><Stack spacing={1.5} sx={{ mt: 1 }}>{history.map(orderCard)}</Stack></Collapse>
        </Box>
      )}

      {/* Seguros de caución */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 3, mb: 1 }} flexWrap="wrap" gap={1}>
        <Typography variant="h6" fontWeight={700}>Seguros de caución</Typography>
        {canWrite && <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => setBondDialog({ bond: null })}>Cargar caución</Button>}
      </Stack>
      {bonds.length === 0 ? (
        <Typography variant="body2" color="text.secondary">Sin seguros de caución. Si el cliente pidió una póliza (por ejemplo por el anticipo), cargala acá: se avisa antes de que venza.</Typography>
      ) : (
        <Stack spacing={1.5}>{bonds.map(bondCard)}</Stack>
      )}

      {/* Documentos extra */}
      <Typography variant="h6" fontWeight={700} sx={{ mt: 3, mb: 1 }}>Documentos para facturar</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Contratos, planillas o cualquier documento que el cliente pida adjuntar a la factura.</Typography>
      {billingFiles.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Todavía no hay documentos.</Typography>
      ) : (
        <Stack spacing={1} sx={{ mb: 1 }}>
          {billingFiles.map((file) => (
            <Card key={file.id} sx={{ p: 1.5, borderRadius: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" gap={1}>
                <Box>
                  <MuiLink variant="body2" {...fileLinkProps(file.file_url, file.file_name)}>{file.file_name}</MuiLink>
                  {file.description && <Typography variant="caption" color="text.secondary" display="block">{file.description}</Typography>}
                </Box>
                {canDelete && <IconButton size="small" aria-label={`Quitar ${file.file_name}`} onClick={() => setConfirm({ kind: 'delete-file', file })}><DeleteIcon fontSize="small" /></IconButton>}
              </Box>
            </Card>
          ))}
        </Stack>
      )}
      {canWrite && (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
          <Button component="label" variant="outlined" size="small" startIcon={<UploadIcon />}>
            {extraFiles.length ? `${extraFiles.length} archivo${extraFiles.length === 1 ? '' : 's'}` : 'Elegir archivos'}
            <input hidden multiple type="file" accept={BILLING_FILE_ACCEPT} onChange={(e) => { setExtraFiles(Array.from(e.target.files || [])); e.target.value = ''; }} />
          </Button>
          {extraFiles.length > 0 && (
            <>
              <TextField size="small" label="Descripción (opcional)" value={extraDescription} onChange={(e) => setExtraDescription(e.target.value)} inputProps={{ maxLength: 255 }} sx={{ minWidth: 220 }} />
              <Button variant="contained" size="small" onClick={uploadExtras} disabled={busy}>Subir</Button>
            </>
          )}
        </Stack>
      )}

      <PurchaseOrderDialog
        open={!!orderDialog} onClose={() => setOrderDialog(null)} budgetId={budget.id} budgetCurrency={budget.currency}
        mode={orderDialog || { kind: 'create' }}
        onSaved={(message, warnings) => { setOrderDialog(null); onChanged(message, warnings); }}
      />
      <SuretyBondDialog
        open={!!bondDialog} onClose={() => setBondDialog(null)} budgetId={budget.id} budgetCurrency={budget.currency}
        orders={activeOrders} bond={bondDialog?.bond || null}
        onSaved={(message, warnings) => { setBondDialog(null); onChanged(message, warnings); }}
      />

      <AppDialog open={!!confirm} onClose={busy ? undefined : () => setConfirm(null)} fullWidth maxWidth="xs">
        <DialogTitle>{confirmTitle}</DialogTitle>
        <DialogContent>
          {confirm?.kind === 'reject-order' && (
            <>
              <Typography variant="body2" sx={{ mb: 2 }}>La OC {confirm.order.number} queda guardada como rechazada, con el motivo que indiques.</Typography>
              <TextField label="Motivo del rechazo *" value={reason} onChange={(e) => setReason(e.target.value)} fullWidth multiline minRows={2} autoFocus />
            </>
          )}
          {confirm?.kind === 'delete-order' && <Typography variant="body2">¿Eliminar la OC {confirm.order.number} con sus posiciones y archivos? Usalo solo para una OC cargada por error: no se puede deshacer.</Typography>}
          {confirm?.kind === 'delete-bond' && <Typography variant="body2">¿Eliminar la caución {confirm.bond.policy_number} y su archivo? No se puede deshacer.</Typography>}
          {confirm?.kind === 'delete-file' && <Typography variant="body2">¿Quitar “{confirm.file.file_name}”? No se puede deshacer.</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm(null)} disabled={busy}>Cancelar</Button>
          <Button variant="contained" color={confirm?.kind === 'reject-order' ? 'warning' : 'error'} onClick={handleConfirm} disabled={busy}>
            {confirm?.kind === 'reject-order' ? 'Rechazar' : 'Eliminar'}
          </Button>
        </DialogActions>
      </AppDialog>
    </Box>
  );
}
