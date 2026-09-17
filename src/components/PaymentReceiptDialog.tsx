'use client';
import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, Divider } from '@mui/material';
import { PrintOutlined as PrintIcon } from '@mui/icons-material';

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia bancaria',
};

const formatCurrency = (val: number) =>
  `$${Number(val).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

interface PaymentReceiptDialogProps {
  open: boolean;
  onClose: () => void;
  concept: string;
  employeeName: string;
  amount: number;
  paidAt?: string | null;
  paymentMethod?: string | null;
  signatureUrl: string;
  numInstallments?: number | null;
  monthlyInterestPercent?: number | null;
}

export default function PaymentReceiptDialog({
  open, onClose, concept, employeeName, amount, paidAt, paymentMethod, signatureUrl,
  numInstallments, monthlyInterestPercent,
}: PaymentReceiptDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle className="no-print">Recibo de Pago</DialogTitle>
      <DialogContent>
        <Box className="print-area" sx={{ p: 2 }}>
          <Box display="flex" justifyContent="center" mb={2}>
            <img src="/img/logos/logo-conmomet-ROJO.png" alt="Conmomet" style={{ height: 56, objectFit: 'contain' }} />
          </Box>
          <Typography variant="h6" fontWeight={700} textAlign="center" gutterBottom>
            Recibo de Pago
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" gutterBottom>
            {concept}
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Box display="flex" flexDirection="column" gap={1.5}>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">Empleado</Typography>
              <Typography variant="body2" fontWeight={700}>{employeeName}</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">Monto</Typography>
              <Typography variant="body2" fontWeight={700}>{formatCurrency(amount)}</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">Fecha de pago</Typography>
              <Typography variant="body2" fontWeight={700}>
                {paidAt ? new Date(paidAt).toLocaleDateString('es-AR') : '—'}
              </Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">Método de pago</Typography>
              <Typography variant="body2" fontWeight={700}>
                {paymentMethod ? (PAYMENT_METHOD_LABEL[paymentMethod] || paymentMethod) : '—'}
              </Typography>
            </Box>
            {numInstallments != null && (
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Cantidad de cuotas</Typography>
                <Typography variant="body2" fontWeight={700}>{numInstallments}</Typography>
              </Box>
            )}
            {monthlyInterestPercent != null && (
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Interés mensual</Typography>
                <Typography variant="body2" fontWeight={700}>{monthlyInterestPercent}%</Typography>
              </Box>
            )}
          </Box>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body2" textAlign="center" sx={{ mb: 1 }}>
            Recibí de Conmomet la suma de <strong>{formatCurrency(amount)}</strong> en concepto de {concept.toLowerCase()}.
          </Typography>
          <Box display="flex" justifyContent="center" py={1}>
            <img src={signatureUrl} alt="Firma del empleado" style={{ maxHeight: 120, maxWidth: '100%' }} />
          </Box>
          <Typography variant="body2" fontWeight={700} textAlign="center">
            {employeeName}
          </Typography>
          <Typography variant="caption" color="text.secondary" textAlign="center" display="block">
            Firma del empleado
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions className="no-print">
        <Button onClick={onClose}>Cerrar</Button>
        <Button variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()}>
          Imprimir
        </Button>
      </DialogActions>
    </Dialog>
  );
}
