'use client';
import React from 'react';
import {
  Box, Card, Chip, IconButton, Link as MuiLink, Paper, Stack, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Tooltip, Typography,
} from '@mui/material';
import { useFileViewer } from '@/components/common/FileViewer';
import {
  BlockOutlined as CancelIcon,
  CheckCircleOutline as PayIcon,
  DeleteOutline as DiscardIcon,
  EditOutlined as EditIcon,
  PictureAsPdfOutlined as PdfIcon,
  HandshakeOutlined as AcceptanceIcon,
  SendOutlined as EmitIcon,
  SyncOutlined as VerifyIcon,
  VisibilityOutlined as ViewIcon,
} from '@mui/icons-material';
import { Invoice } from '../../utils/api';
import { ARCA_STATUS_LABELS, FCE_ACCEPTANCE_LABELS, FCE_CBTE_TIPO, formatDate, formatMoney, formatVoucher, INVOICE_STATUS_LABELS } from '../../utils/billing';

interface InvoiceListProps {
  invoices: Invoice[];
  emptyText?: string;
  // En el detalle de un presupuesto las columnas de cliente y presupuesto sobran.
  hideBudgetColumns?: boolean;
  // invoices_update: marcar cobrada y anular.
  canUpdate: boolean;
  // invoices_correct (además de invoices_update): corregir los datos de una factura mal cargada.
  canCorrect: boolean;
  // invoices_write + invoices_emit: emitir un borrador en ARCA y verificar una que quedó "autorizando".
  canEmit?: boolean;
  // invoices_write: generar el PDF de una factura emitida que todavía no lo tiene.
  canWrite?: boolean;
  onView: (invoice: Invoice) => void;
  onEdit: (invoice: Invoice) => void;
  onPay: (invoice: Invoice) => void;
  onCancel: (invoice: Invoice) => void;
  onEmit?: (invoice: Invoice) => void;
  onVerify?: (invoice: Invoice) => void;
  onDiscard?: (invoice: Invoice) => void;
  onGeneratePdf?: (invoice: Invoice) => void;
  // Registrar a mano la aceptación del cliente de una FCE emitida.
  onFceAcceptance?: (invoice: Invoice) => void;
}

export default function InvoiceList({
  invoices, emptyText = 'No hay facturas registradas', hideBudgetColumns = false,
  canUpdate, canCorrect, canEmit = false, canWrite = false, onView, onEdit, onPay, onCancel, onEmit, onVerify, onDiscard, onGeneratePdf, onFceAcceptance,
}: InvoiceListProps) {
  const { fileLinkProps } = useFileViewer();
  // Una factura de ARCA (source 'arca') tiene su propio ciclo: borrador -> emitida (o rechazada / autorizando). Una emitida
  // (o en proceso) no se corrige ni se anula acá: ARCA ya la conoce (se anula con una nota de crédito). Un borrador o una
  // rechazada se pueden editar y descartar. Las cargadas a mano siguen igual que siempre.
  const renderActions = (invoice: Invoice) => {
    const isArca = invoice.source === 'arca';
    const arcaStatus = invoice.arca_status;
    const open = invoice.status !== 'cancelled';
    const editable = open && (isArca ? canUpdate && (arcaStatus === 'draft' || arcaStatus === 'rejected') : canUpdate && canCorrect);
    const payable = canUpdate && invoice.status === 'pending' && (!isArca || arcaStatus === 'authorized');
    return (
      <Box display="flex" gap={0.5} flexWrap="wrap">
        <Tooltip title="Ver"><IconButton size="small" onClick={() => onView(invoice)}><ViewIcon fontSize="small" /></IconButton></Tooltip>
        {open && isArca && arcaStatus === 'draft' && canEmit && onEmit && (
          <Tooltip title="Emitir en ARCA"><IconButton size="small" color="primary" onClick={() => onEmit(invoice)}><EmitIcon fontSize="small" /></IconButton></Tooltip>
        )}
        {open && isArca && arcaStatus === 'authorizing' && canEmit && onVerify && (
          <Tooltip title="Verificar en ARCA"><IconButton size="small" color="warning" onClick={() => onVerify(invoice)}><VerifyIcon fontSize="small" /></IconButton></Tooltip>
        )}
        {open && isArca && arcaStatus === 'authorized' && !invoice.file_url && canWrite && onGeneratePdf && (
          <Tooltip title="Generar PDF"><IconButton size="small" color="primary" onClick={() => onGeneratePdf(invoice)}><PdfIcon fontSize="small" /></IconButton></Tooltip>
        )}
        {open && isArca && arcaStatus === 'authorized' && invoice.cbte_tipo === FCE_CBTE_TIPO && canUpdate && onFceAcceptance && (
          <Tooltip title="Aceptación del cliente"><IconButton size="small" onClick={() => onFceAcceptance(invoice)}><AcceptanceIcon fontSize="small" /></IconButton></Tooltip>
        )}
        {editable && (
          <Tooltip title={isArca ? 'Editar borrador' : 'Corregir datos'}><IconButton size="small" color="primary" onClick={() => onEdit(invoice)}><EditIcon fontSize="small" /></IconButton></Tooltip>
        )}
        {payable && (
          <Tooltip title="Marcar cobrada"><IconButton size="small" color="success" onClick={() => onPay(invoice)}><PayIcon fontSize="small" /></IconButton></Tooltip>
        )}
        {open && isArca && canUpdate && (arcaStatus === 'draft' || arcaStatus === 'rejected') && onDiscard && (
          <Tooltip title="Descartar (nunca se emitió)"><IconButton size="small" color="error" onClick={() => onDiscard(invoice)}><DiscardIcon fontSize="small" /></IconButton></Tooltip>
        )}
        {canUpdate && open && !isArca && (
          <Tooltip title="Anular"><IconButton size="small" color="error" onClick={() => onCancel(invoice)}><CancelIcon fontSize="small" /></IconButton></Tooltip>
        )}
      </Box>
    );
  };

  const statusChip = (invoice: Invoice) => {
    const isArca = invoice.source === 'arca';
    const arcaStatus = invoice.arca_status;
    // Antes de emitirse (o si ARCA no la aceptó) lo que importa es el estado de la emisión, no el de cobro.
    if (isArca && invoice.status !== 'cancelled' && arcaStatus && arcaStatus !== 'authorized' && arcaStatus !== 'manual') {
      const arca = ARCA_STATUS_LABELS[arcaStatus];
      return (
        <Stack spacing={0.25} alignItems="flex-start">
          <Chip size="small" color={arca.color} label={arca.label} />
          {arcaStatus === 'rejected' && invoice.arca_result?.reason && (
            <Tooltip title={invoice.arca_result.reason}>
              <Typography variant="caption" color="error" noWrap sx={{ maxWidth: 200 }}>{invoice.arca_result.reason}</Typography>
            </Tooltip>
          )}
          {arcaStatus === 'authorizing' && (
            <Typography variant="caption" color="text.secondary">Verificala en ARCA: no la vuelvas a emitir.</Typography>
          )}
        </Stack>
      );
    }
    const status = INVOICE_STATUS_LABELS[invoice.status];
    const detail = invoice.status === 'paid' && invoice.paid_at ? ` el ${formatDate(invoice.paid_at)}` : '';
    const observations = invoice.arca_result?.observations || [];
    return (
      <Stack spacing={0.25} alignItems="flex-start">
        <Chip size="small" color={status.color} label={`${status.label}${detail}`} />
        {isArca && invoice.arca_status === 'authorized' && invoice.status !== 'cancelled' && (
          <Box display="flex" gap={0.5} flexWrap="wrap">
            <Chip size="small" color="success" variant="outlined" label={invoice.cae ? `CAE ${invoice.cae}` : 'Emitida en ARCA'} />
            {invoice.arca_env === 'homologacion' && (
              <Tooltip title="Emitida en el ambiente de pruebas de ARCA: no tiene validez fiscal.">
                <Chip size="small" color="warning" label="PRUEBA" />
              </Tooltip>
            )}
            {invoice.cbte_tipo === FCE_CBTE_TIPO && (
              <Chip size="small" variant="outlined" color={FCE_ACCEPTANCE_LABELS[invoice.fce_acceptance || 'pending'].color} label={FCE_ACCEPTANCE_LABELS[invoice.fce_acceptance || 'pending'].label} />
            )}
            {observations.length > 0 && (
              <Tooltip title={observations.map((o) => `(${o.code}) ${o.msg}`).join(' · ')}>
                <Chip size="small" color="warning" variant="outlined" label="Con observaciones de ARCA" />
              </Tooltip>
            )}
          </Box>
        )}
      </Stack>
    );
  };

  // Archivos de la factura: el PDF del comprobante y, si se adjuntó al cobrarla, el comprobante de pago.
  const pdfLink = (invoice: Invoice) => (invoice.file_url || invoice.payment_file_url ? (
    <Stack spacing={0.25}>
      {invoice.file_url && (
        <MuiLink {...fileLinkProps(invoice.file_url, invoice.file_name || undefined)} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
          <PdfIcon fontSize="small" /> PDF
        </MuiLink>
      )}
      {invoice.payment_file_url && (
        <MuiLink {...fileLinkProps(invoice.payment_file_url, invoice.payment_file_name || undefined)} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
          <PdfIcon fontSize="small" /> Comprobante de pago
        </MuiLink>
      )}
    </Stack>
  ) : '—');

  const reference = (invoice: Invoice) => [invoice.budget?.number, invoice.project?.code].filter(Boolean).join(' · ') || 'Factura libre';

  return (
    <>
      {/* Mobile Cards */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {invoices.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={4}>{emptyText}</Typography>
        ) : (
          <Stack spacing={2}>
            {invoices.map((invoice) => (
              <Card key={invoice.id} sx={{ p: 2, borderRadius: 2, opacity: invoice.status === 'cancelled' ? 0.65 : 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1} mb={1}>
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold">{formatVoucher(invoice)}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Emitida {formatDate(invoice.issue_date)}{invoice.due_date ? ` · Vence ${formatDate(invoice.due_date)}` : ''}
                    </Typography>
                  </Box>
                  {statusChip(invoice)}
                </Box>
                {!hideBudgetColumns && (
                  <>
                    <Typography variant="body2">{invoice.client?.razonSocial}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block">{reference(invoice)}</Typography>
                  </>
                )}
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Neto {formatMoney(invoice.net_amount, invoice.currency)} · IVA {formatMoney(invoice.iva_amount, invoice.currency)}
                </Typography>
                <Typography variant="subtitle2">Total {formatMoney(invoice.total_amount, invoice.currency)}</Typography>
                {invoice.status === 'cancelled' && invoice.cancellation_reason && (
                  <Typography variant="caption" color="text.secondary" display="block">Motivo: {invoice.cancellation_reason}</Typography>
                )}
                <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                  {pdfLink(invoice)}
                  {renderActions(invoice)}
                </Box>
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
                <TableCell>Fecha</TableCell>
                {!hideBudgetColumns && <TableCell>Cliente</TableCell>}
                {!hideBudgetColumns && <TableCell>Presupuesto / Proyecto</TableCell>}
                <TableCell align="right">Neto</TableCell>
                <TableCell align="right">IVA</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Archivos</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow><TableCell colSpan={hideBudgetColumns ? 8 : 10} align="center">{emptyText}</TableCell></TableRow>
              ) : invoices.map((invoice) => (
                <TableRow key={invoice.id} hover sx={{ opacity: invoice.status === 'cancelled' ? 0.65 : 1 }}>
                  <TableCell><Typography variant="body2" fontWeight={600}>{formatVoucher(invoice)}</Typography></TableCell>
                  <TableCell>
                    {formatDate(invoice.issue_date)}
                    {invoice.due_date && <Typography variant="caption" color="text.secondary" display="block">Vence {formatDate(invoice.due_date)}</Typography>}
                  </TableCell>
                  {!hideBudgetColumns && <TableCell>{invoice.client?.razonSocial}</TableCell>}
                  {!hideBudgetColumns && <TableCell>{reference(invoice)}</TableCell>}
                  <TableCell align="right">{formatMoney(invoice.net_amount, invoice.currency)}</TableCell>
                  <TableCell align="right">{formatMoney(invoice.iva_amount, invoice.currency)}</TableCell>
                  <TableCell align="right"><strong>{formatMoney(invoice.total_amount, invoice.currency)}</strong></TableCell>
                  <TableCell>
                    {statusChip(invoice)}
                    {invoice.status === 'cancelled' && invoice.cancellation_reason && (
                      <Tooltip title={invoice.cancellation_reason}><Typography variant="caption" color="text.secondary" display="block" noWrap sx={{ maxWidth: 180 }}>{invoice.cancellation_reason}</Typography></Tooltip>
                    )}
                  </TableCell>
                  <TableCell>{pdfLink(invoice)}</TableCell>
                  <TableCell>{renderActions(invoice)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </>
  );
}
