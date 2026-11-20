'use client';
import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material';
import AppDialog from '@/components/common/AppDialog';
import GearSpinner from '../GearSpinner';
import { FceHistory, FceTrackingRow, InvoiceService } from '../../utils/api';
import { FCE_ACCOUNT_STATE_LABELS, FCE_CMP_STATE_LABELS, formatVoucher } from '../../utils/billing';
import type { FceAccountState, FceCmpState } from '../../utils/api';

interface Props {
  row: FceTrackingRow | null;
  onClose: () => void;
}

const formatDateTime = (iso: string | null) => (iso ? new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }) : '—');

function Timeline({ title, part, labels }: { title: string; part: FceHistory['comprobante'] | null; labels: Record<string, { label: string }> }) {
  if (!part) return null;
  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={700} gutterBottom>{title}</Typography>
      {!part.ok && <Alert severity="error">{part.error || 'No se pudo consultar a ARCA.'}</Alert>}
      {part.ok && part.items.length === 0 && <Typography variant="body2" color="text.secondary">ARCA no informa cambios de estado todavía.</Typography>}
      {part.ok && part.items.length > 0 && (
        <Stack spacing={0}>
          {part.items.map((item, index) => (
            <Box key={`${item.state}-${index}`} display="flex" gap={1.5}>
              <Box display="flex" flexDirection="column" alignItems="center">
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: index === part.items.length - 1 ? 'primary.main' : 'grey.400', mt: 0.5 }} />
                {index < part.items.length - 1 && <Box sx={{ width: 2, flex: 1, bgcolor: 'grey.300', minHeight: 20 }} />}
              </Box>
              <Box pb={1.5}>
                <Typography variant="body2" fontWeight={600}>{(item.state && labels[item.state]?.label) || item.state || 'Estado desconocido'}</Typography>
                <Typography variant="caption" color="text.secondary">{formatDateTime(item.at)}</Typography>
              </Box>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}

// Historial de estados de una FCE: lo pide ARCA en el momento (no se guarda en la app). Dos líneas de tiempo: la del comprobante y la de su cuenta corriente.
export default function FceHistoryDialog({ row, onClose }: Props) {
  const [history, setHistory] = useState<FceHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!row) return;
    let cancelled = false;
    setHistory(null);
    setError('');
    setLoading(true);
    InvoiceService.getFceHistory(row.id)
      .then((result) => { if (!cancelled) setHistory(result); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Error al obtener el historial'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [row]);

  return (
    <AppDialog open={!!row} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Historial de estados en ARCA</DialogTitle>
      <DialogContent>
        {row && <Typography variant="body2" sx={{ mb: 2 }}><strong>{formatVoucher({ voucher_type: 'A', cbte_tipo: row.cbte_tipo, pos_number: row.pos_number, number: row.number })}</strong></Typography>}
        {loading && <Box display="flex" justifyContent="center" py={4}><GearSpinner /></Box>}
        {error && <Alert severity="error">{error}</Alert>}
        {history && (
          <Stack spacing={2.5}>
            <Timeline title="Comprobante" part={history.comprobante} labels={FCE_CMP_STATE_LABELS as Record<FceCmpState, { label: string }>} />
            <Timeline title="Cuenta corriente" part={history.cuenta_corriente} labels={FCE_ACCOUNT_STATE_LABELS as Record<FceAccountState, { label: string }>} />
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </AppDialog>
  );
}
