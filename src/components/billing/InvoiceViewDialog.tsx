'use client';
import React from 'react';
import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Link as MuiLink, Stack, Typography,
} from '@mui/material';
import { Invoice } from '../../utils/api';
import {
  CONCEPT_LABELS, formatDate, formatMoney, formatPercent, formatVoucher, INVOICE_STATUS_LABELS,
} from '../../utils/billing';
import { formatCuit } from '../../utils/cuit';

// Solo lectura: encabezado, líneas por concepto y totales de una factura.
export default function InvoiceViewDialog({ invoice, onClose }: { invoice: Invoice | null; onClose: () => void }) {
  const row = (label: string, value: React.ReactNode) => (
    <Box display="flex" justifyContent="space-between" gap={2}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" textAlign="right">{value}</Typography>
    </Box>
  );

  return (
    <Dialog open={!!invoice} onClose={onClose} fullWidth maxWidth="sm">
      {invoice && (
        <>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
            {formatVoucher(invoice)}
            <Chip size="small" color={INVOICE_STATUS_LABELS[invoice.status].color} label={INVOICE_STATUS_LABELS[invoice.status].label} />
          </DialogTitle>
          <DialogContent>
            <Stack spacing={0.75} sx={{ mb: 2 }}>
              {row('Cliente', `${invoice.client?.razonSocial || '—'}${invoice.client?.cuit ? ` · CUIT ${formatCuit(invoice.client.cuit)}` : ''}`)}
              {row('Presupuesto', invoice.budget ? `${invoice.budget.number} · ${invoice.budget.title}` : 'Factura libre')}
              {invoice.project && row('Proyecto', `${invoice.project.code} · ${invoice.project.name}`)}
              {row('Fecha de emisión', formatDate(invoice.issue_date))}
              {invoice.due_date && row('Vencimiento de pago', formatDate(invoice.due_date))}
              {invoice.status === 'paid' && row('Cobrada el', formatDate(invoice.paid_at))}
              {invoice.exchange_rate && row('Cotización', invoice.exchange_rate.toLocaleString('es-AR', { maximumFractionDigits: 4 }))}
              {invoice.createdBy && row('Cargada por', `${invoice.createdBy.name} ${invoice.createdBy.lastname}`)}
              {invoice.payment_file_url && row('Comprobante de pago', (
                <MuiLink href={invoice.payment_file_url} target="_blank" rel="noopener noreferrer">{invoice.payment_file_name || 'Ver comprobante'}</MuiLink>
              ))}
              {invoice.file_url && row('Factura (PDF)', (
                <MuiLink href={invoice.file_url} target="_blank" rel="noopener noreferrer">{invoice.file_name || 'Ver PDF'}</MuiLink>
              ))}
            </Stack>

            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Detalle</Typography>
            <Stack spacing={0.75}>
              {invoice.lines.map((line, index) => (
                <Box key={line.id ?? index} display="flex" justifyContent="space-between" gap={2}>
                  <Typography variant="body2">
                    {CONCEPT_LABELS[line.concept]}
                    {line.description ? ` — ${line.description}` : ''}
                    {line.percent != null && (
                      <Typography component="span" variant="caption" color="text.secondary"> ({formatPercent(line.percent)} del concepto)</Typography>
                    )}
                  </Typography>
                  <Typography variant="body2" whiteSpace="nowrap">{formatMoney(line.net_amount, invoice.currency)}</Typography>
                </Box>
              ))}
            </Stack>

            <Divider sx={{ my: 1.5 }} />
            <Stack spacing={0.5}>
              {row('Neto', formatMoney(invoice.net_amount, invoice.currency))}
              {row(`IVA ${formatPercent(invoice.iva_rate)}`, formatMoney(invoice.iva_amount, invoice.currency))}
              {row('Total', <strong>{formatMoney(invoice.total_amount, invoice.currency)}</strong>)}
            </Stack>

            {invoice.notes && (
              <>
                <Divider sx={{ my: 1.5 }} />
                <Typography variant="caption" color="text.secondary">Notas</Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{invoice.notes}</Typography>
              </>
            )}
            {invoice.status === 'cancelled' && (
              <>
                <Divider sx={{ my: 1.5 }} />
                <Typography variant="caption" color="text.secondary">Motivo de la anulación</Typography>
                <Typography variant="body2">{invoice.cancellation_reason}</Typography>
              </>
            )}
          </DialogContent>
          <DialogActions><Button onClick={onClose}>Cerrar</Button></DialogActions>
        </>
      )}
    </Dialog>
  );
}
