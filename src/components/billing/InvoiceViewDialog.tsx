'use client';
import React, { useEffect, useState } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, DialogActions, DialogContent, DialogTitle, Divider, Link as MuiLink, Stack, Tab, Tabs, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import { useFileViewer } from '@/components/common/FileViewer';
import AppDialog from '@/components/common/AppDialog';
import { Invoice, InvoiceService } from '../../utils/api';
import { FileService } from '../../utils/fileService';
import {
  ARCA_CONCEPT_LABELS, ARCA_STATUS_LABELS, CONCEPT_LABELS, fceStateChip, FCE_CBTE_TIPO, FCE_TRANSFER_LABELS, formatAssociated, isNote, formatDate, formatMoney, formatPercent, formatVoucher, INVOICE_STATUS_LABELS, formatRate} from '../../utils/billing';
import { formatCuit } from '../../utils/cuit';

// Solo lectura. La pestaña "Factura" muestra la factura con su formato final, como un PDF: el real si ya se emitió (o se cargó a mano con su PDF) y, si todavía es
// un borrador, la VISTA PREVIA (sin número, CAE ni QR: con asteriscos). La pestaña "Datos" es el resumen de siempre: encabezado, líneas por concepto y totales.
export default function InvoiceViewDialog({ invoice, onClose }: { invoice: Invoice | null; onClose: () => void }) {
  const { fileLinkProps } = useFileViewer();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Qué PDF hay para mostrar: la vista previa de un borrador de ARCA, el PDF guardado de una factura emitida, o el que se adjuntó a una factura cargada a mano.
  const isDraftArca = !!invoice && invoice.source === 'arca' && ['draft', 'rejected'].includes(invoice.arca_status || '') && invoice.status !== 'cancelled';
  const hasStoredPdf = !!invoice?.file_url;
  const pdfKind: 'preview' | 'stored' | null = isDraftArca ? 'preview' : hasStoredPdf ? 'stored' : null;

  const [tab, setTab] = useState<'pdf' | 'data'>('pdf');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState('');

  useEffect(() => {
    if (!invoice) return;
    setTab(pdfKind ? 'pdf' : 'data');
    setPdfUrl(null);
    setPdfError('');
    if (!pdfKind) return;
    let cancelled = false;
    let blobUrl: string | null = null;
    setPdfLoading(true);
    const load = pdfKind === 'preview'
      ? InvoiceService.previewPdf(invoice.id).then((blob) => { blobUrl = URL.createObjectURL(blob); return blobUrl; })
      : FileService.getSignedUrl(invoice.file_url as string);
    load
      .then((url) => { if (!cancelled) setPdfUrl(url); })
      .catch((err) => { if (!cancelled) { setPdfError(err instanceof Error ? err.message : 'No se pudo mostrar la factura'); setTab('data'); } })
      .finally(() => { if (!cancelled) setPdfLoading(false); });
    return () => {
      cancelled = true;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
    // Solo cuando se abre otra factura (o cambia su estado de emisión).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoice?.id, invoice?.arca_status, invoice?.file_url]);

  const row = (label: string, value: React.ReactNode) => (
    <Box display="flex" justifyContent="space-between" gap={2}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" textAlign="right">{value}</Typography>
    </Box>
  );

  return (
    <AppDialog open={!!invoice} onClose={onClose} fullWidth maxWidth={pdfKind ? 'md' : 'sm'} fullScreen={isMobile && !!pdfKind}>
      {invoice && (
        <>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
            {formatVoucher(invoice)}
            <Chip size="small" color={INVOICE_STATUS_LABELS[invoice.status].color} label={INVOICE_STATUS_LABELS[invoice.status].label} />
          </DialogTitle>
          {pdfKind && (
            <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ px: 3, borderBottom: 1, borderColor: 'divider' }}>
              <Tab value="pdf" label={pdfKind === 'preview' ? 'Vista previa' : 'Factura'} />
              <Tab value="data" label="Datos" />
            </Tabs>
          )}
          <DialogContent>
            {pdfKind && tab === 'pdf' ? (
              <Box>
                {pdfKind === 'preview' && (
                  <Alert severity="info" sx={{ mb: 1.5 }}>
                    BORRADOR de Factura
                  </Alert>
                )}
                {pdfLoading && (
                  <Box display="flex" alignItems="center" justifyContent="center" gap={1.5} sx={{ height: '60vh' }}>
                    <CircularProgress size={24} />
                    <Typography variant="body2" color="text.secondary">Armando la factura…</Typography>
                  </Box>
                )}
                {pdfUrl && (
                  <Box
                    component="iframe"
                    title="Factura"
                    src={`${pdfUrl}#${pdfKind === 'preview' ? 'toolbar=0&navpanes=0&' : ''}view=FitH`}
                    sx={{ width: '100%', height: isMobile ? 'calc(100vh - 260px)' : '68vh', minHeight: 420, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: '#f5f5f5' }}
                  />
                )}
                {pdfUrl && (
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    ¿No se ve en el celular? Usá «Abrir en una pestaña».
                  </Typography>
                )}
              </Box>
            ) : (
            <>
            {pdfError && <Alert severity="warning" sx={{ mb: 2 }}>No se pudo mostrar la factura en formato PDF ({pdfError}). Acá están sus datos.</Alert>}
            {invoice.source === 'arca' && invoice.arca_status === 'authorized' && !invoice.file_url && (
              <Alert severity="info" sx={{ mb: 2 }}>El PDF de esta factura todavía no se generó: usá «Generar PDF» en las acciones del listado.</Alert>
            )}
            <Stack spacing={0.75} sx={{ mb: 2 }}>
              {row('Cliente', `${invoice.client?.razonSocial || '—'}${invoice.client?.cuit ? ` · CUIT ${formatCuit(invoice.client.cuit)}` : ''}`)}
              {row(invoice.budgets && invoice.budgets.length > 1 ? 'Presupuestos' : 'Presupuesto', invoice.budgets && invoice.budgets.length > 0 ? invoice.budgets.map((b) => `${b.number} · ${b.title}`).join(' | ') : invoice.budget ? `${invoice.budget.number} · ${invoice.budget.title}` : 'Factura libre')}
              {invoice.project && row('Proyecto', `${invoice.project.code} · ${invoice.project.name}`)}
              {row('Fecha de emisión', formatDate(invoice.issue_date))}
              {invoice.due_date && row('Vencimiento de pago', formatDate(invoice.due_date))}
              {invoice.status === 'paid' && row('Cobrada el', formatDate(invoice.paid_at))}
              {invoice.exchange_rate && row('Cotización', formatRate(invoice.exchange_rate))}
              {invoice.currency === 'USD' && invoice.total_amount_ars != null && row('Total en pesos', formatMoney(invoice.total_amount_ars, 'ARS'))}
              {invoice.source === 'arca' && invoice.arca_status && invoice.arca_status !== 'manual' && row('Estado en ARCA', (
                <Chip size="small" color={ARCA_STATUS_LABELS[invoice.arca_status].color} label={ARCA_STATUS_LABELS[invoice.arca_status].label} />
              ))}
              {invoice.source === 'arca' && invoice.pointOfSale && row('Punto de venta', `${String(invoice.pointOfSale.number).padStart(4, '0')}${invoice.pointOfSale.usage_description ? ` — ${invoice.pointOfSale.usage_description}` : ''}`)}
              {invoice.source === 'arca' && invoice.arca_concept && row('Concepto', ARCA_CONCEPT_LABELS[invoice.arca_concept])}
              {invoice.service_from && invoice.service_to && row('Período facturado', `${formatDate(invoice.service_from)} al ${formatDate(invoice.service_to)}`)}
              {invoice.cbte_tipo === FCE_CBTE_TIPO && (invoice.issuer_snapshot?.bank || invoice.bankAccount) && row('Cuenta del emisor', (() => {
                const bank = invoice.issuer_snapshot?.bank || invoice.bankAccount!;
                return `${bank.bank_name} · CBU ${bank.cbu}${bank.alias ? ` · ${bank.alias}` : ''}`;
              })())}
              {invoice.cbte_tipo === FCE_CBTE_TIPO && invoice.fce_transfer_option && row('Opción de transferencia', FCE_TRANSFER_LABELS[invoice.fce_transfer_option])}
              {invoice.cbte_tipo === FCE_CBTE_TIPO && invoice.arca_status === 'authorized' && row('Estado en ARCA', (
                <Chip size="small" color={fceStateChip(invoice).color} label={fceStateChip(invoice).label} />
              ))}
              {invoice.cbte_tipo === FCE_CBTE_TIPO && invoice.arca_status === 'authorized' && invoice.fce_synced_at && invoice.fce_acceptance_due && invoice.fce_acceptance !== 'accepted' && row('Aceptación del cliente hasta', formatDate(invoice.fce_acceptance_due))}
              {invoice.cbte_tipo === FCE_CBTE_TIPO && invoice.fce_balance !== null && invoice.fce_balance !== undefined && row('Saldo en ARCA', formatMoney(invoice.fce_balance, invoice.currency))}
              {invoice.cbte_tipo === FCE_CBTE_TIPO && (invoice.fce_rejection_reasons || []).length > 0 && row('Motivos del rechazo', (invoice.fce_rejection_reasons || []).map((r) => [r.description, r.justification].filter(Boolean).join(': ')).join(' · '))}
              {isNote(invoice) && row('Sobre la factura', formatAssociated(invoice))}
              {invoice.kind === 'credit_note' && invoice.fce_annulment && row('Anulación', 'Con marca de anulación (el cliente rechazó la FCE)')}
              {(invoice.credited_total || 0) > 0 && row('Acreditado con notas de crédito', formatMoney(invoice.credited_total, invoice.currency))}
              {invoice.cae && row('CAE', `${invoice.cae}${invoice.cae_expiration ? ` (vence ${formatDate(invoice.cae_expiration)})` : ''}`)}
              {invoice.arca_env && row('Ambiente', invoice.arca_env === 'homologacion' ? 'Homologación (pruebas, sin validez fiscal)' : 'Producción')}
              {invoice.sale_condition && row('Condición de venta', invoice.sale_condition)}
              {invoice.remito_number && row('Remito', invoice.remito_number)}
              {invoice.commercial_reference && row('Referencia comercial', invoice.commercial_reference)}
              {invoice.createdBy && row('Cargada por', `${invoice.createdBy.name} ${invoice.createdBy.lastname}`)}
              {invoice.payment_file_url && row('Comprobante de pago', (
                <MuiLink {...fileLinkProps(invoice.payment_file_url, invoice.payment_file_name || undefined)}>{invoice.payment_file_name || 'Ver comprobante'}</MuiLink>
              ))}
              {invoice.file_url && row('Factura (PDF)', (
                <MuiLink {...fileLinkProps(invoice.file_url, invoice.file_name || undefined)}>{invoice.file_name || 'Ver PDF'}</MuiLink>
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
                    {(invoice.budgets || []).length > 1 && line.budget && (
                      <Typography component="span" variant="caption" color="text.secondary"> · {line.budget.number}</Typography>
                    )}
                    {line.purchaseOrder && (
                      <Typography component="span" variant="caption" color="text.secondary"> · OC {line.purchaseOrder.number}</Typography>
                    )}
                    {line.progressEntry && (
                      <Typography component="span" variant="caption" color="text.secondary">
                        {' '}· avance real {formatPercent(line.progressEntry.percent)}{line.progressEntry.certificate_number ? ` (certificado ${line.progressEntry.certificate_number})` : ''}
                      </Typography>
                    )}
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

            {invoice.arca_status === 'rejected' && invoice.arca_result?.reason && (
              <Alert severity="error" sx={{ mt: 1.5 }}>{invoice.arca_result.reason}</Alert>
            )}
            {(invoice.arca_result?.observations || []).length > 0 && (
              <Alert severity="warning" sx={{ mt: 1.5 }}>
                ARCA emitió la factura con observaciones: {(invoice.arca_result?.observations || []).map((o) => `(${o.code}) ${o.msg}`).join(' · ')}
              </Alert>
            )}
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
            </>
            )}
          </DialogContent>
          <DialogActions>
            {pdfKind && tab === 'pdf' && pdfUrl && (
              <Button onClick={() => window.open(pdfUrl, '_blank', 'noopener')}>Abrir en una pestaña</Button>
            )}
            {pdfKind === 'stored' && tab === 'pdf' && invoice.file_url && (
              <Button onClick={() => FileService.download(invoice.file_url as string, invoice.file_name || 'factura.pdf')}>Descargar</Button>
            )}
            <Button onClick={onClose}>Cerrar</Button>
          </DialogActions>
        </>
      )}
    </AppDialog>
  );
}
