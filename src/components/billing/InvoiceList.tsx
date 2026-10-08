'use client';
import React from 'react';
import {
  Box, Card, Chip, IconButton, Link as MuiLink, Paper, Stack, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Tooltip, Typography,
} from '@mui/material';
import {
  BlockOutlined as CancelIcon,
  CheckCircleOutline as PayIcon,
  EditOutlined as EditIcon,
  PictureAsPdfOutlined as PdfIcon,
  VisibilityOutlined as ViewIcon,
} from '@mui/icons-material';
import { Invoice } from '../../utils/api';
import { formatDate, formatMoney, formatVoucher, INVOICE_STATUS_LABELS } from '../../utils/billing';

interface InvoiceListProps {
  invoices: Invoice[];
  emptyText?: string;
  // En el detalle de un presupuesto las columnas de cliente y presupuesto sobran.
  hideBudgetColumns?: boolean;
  // invoices_update: marcar cobrada y anular.
  canUpdate: boolean;
  // invoices_correct (además de invoices_update): corregir los datos de una factura mal cargada.
  canCorrect: boolean;
  onView: (invoice: Invoice) => void;
  onEdit: (invoice: Invoice) => void;
  onPay: (invoice: Invoice) => void;
  onCancel: (invoice: Invoice) => void;
}

export default function InvoiceList({
  invoices, emptyText = 'No hay facturas registradas', hideBudgetColumns = false,
  canUpdate, canCorrect, onView, onEdit, onPay, onCancel,
}: InvoiceListProps) {
  const renderActions = (invoice: Invoice) => (
    <Box display="flex" gap={0.5} flexWrap="wrap">
      <Tooltip title="Ver"><IconButton size="small" onClick={() => onView(invoice)}><ViewIcon fontSize="small" /></IconButton></Tooltip>
      {canUpdate && canCorrect && invoice.status !== 'cancelled' && (
        <Tooltip title="Corregir datos"><IconButton size="small" color="primary" onClick={() => onEdit(invoice)}><EditIcon fontSize="small" /></IconButton></Tooltip>
      )}
      {canUpdate && invoice.status === 'pending' && (
        <Tooltip title="Marcar cobrada"><IconButton size="small" color="success" onClick={() => onPay(invoice)}><PayIcon fontSize="small" /></IconButton></Tooltip>
      )}
      {canUpdate && invoice.status !== 'cancelled' && (
        <Tooltip title="Anular"><IconButton size="small" color="error" onClick={() => onCancel(invoice)}><CancelIcon fontSize="small" /></IconButton></Tooltip>
      )}
    </Box>
  );

  const statusChip = (invoice: Invoice) => {
    const status = INVOICE_STATUS_LABELS[invoice.status];
    const detail = invoice.status === 'paid' && invoice.paid_at ? ` el ${formatDate(invoice.paid_at)}` : '';
    return <Chip size="small" color={status.color} label={`${status.label}${detail}`} />;
  };

  // Archivos de la factura: el PDF del comprobante y, si se adjuntó al cobrarla, el comprobante de pago.
  const pdfLink = (invoice: Invoice) => (invoice.file_url || invoice.payment_file_url ? (
    <Stack spacing={0.25}>
      {invoice.file_url && (
        <MuiLink href={invoice.file_url} target="_blank" rel="noopener noreferrer" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
          <PdfIcon fontSize="small" /> PDF
        </MuiLink>
      )}
      {invoice.payment_file_url && (
        <MuiLink href={invoice.payment_file_url} target="_blank" rel="noopener noreferrer" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
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
