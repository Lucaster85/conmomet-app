import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Typography, Box, Paper, TextField, MenuItem, CircularProgress, Select, InputLabel, FormControl, Divider
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { PayrollAdjustment, PayrollAdjustmentService, CreatePayrollAdjustmentData, Loan, LoanService } from '../../../../../utils/api';
import CurrencyInput from '../../../../../components/CurrencyInput';

interface Props {
  open: boolean;
  onClose: () => void;
  payrollEntryId: number;
  employeeId: number;
  employeeName: string;
}

export default function PayrollAdjustmentsModal({ open, onClose, payrollEntryId, employeeId, employeeName }: Props) {
  const [adjustments, setAdjustments] = useState<PayrollAdjustment[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<Partial<CreatePayrollAdjustmentData>>({});
  const [loanForm, setLoanForm] = useState({ loanId: '', amount: 0, exchangeRate: 0 });

  const loadData = React.useCallback(async () => {
    if (!payrollEntryId) return;
    try {
      setLoading(true);
      const [adjData, loansData] = await Promise.all([
        PayrollAdjustmentService.getByPayrollEntry(payrollEntryId),
        LoanService.getAll({ status: 'active', employee_id: employeeId })
      ]);
      setAdjustments(adjData);
      setLoans(loansData);
    } catch {
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [payrollEntryId, employeeId]);

  useEffect(() => {
    if (open) {
      loadData();
      setForm({ type: 'bonus', amount: 0, label: '' });
      setLoanForm({ loanId: '', amount: 0, exchangeRate: 0 });
    }
  }, [open, payrollEntryId, loadData]);

  const handleAdd = async () => {
    if (!form.label) return setError('La descripción es requerida');
    if (!form.amount || form.amount <= 0) return setError('El monto debe ser mayor a cero');
    if (!form.type) return setError('El tipo es requerido');

    try {
      setLoading(true);
      await PayrollAdjustmentService.create({
        payroll_entry_id: payrollEntryId,
        type: form.type as 'bonus' | 'deduction',
        label: form.label,
        amount: form.amount
      });
      setForm({ type: 'bonus', amount: 0, label: '' });
      await loadData();
    } catch {
      setError('Error al crear ajuste');
      setLoading(false);
    }
  };

  // Get the selected loan to determine its currency
  const selectedLoan = loans.find(l => l.id.toString() === loanForm.loanId);
  const isUSDLoan = selectedLoan?.currency === 'USD';

  const handleAddLoanPayment = async () => {
    if (!loanForm.loanId) return setError('Seleccione un préstamo');
    if (!loanForm.amount || loanForm.amount <= 0) return setError('Monto inválido');
    if (isUSDLoan && (!loanForm.exchangeRate || loanForm.exchangeRate <= 0)) return setError('Cotización inválida');

    try {
      setLoading(true);

      const paymentData: Parameters<typeof LoanService.addPayment>[1] = {
        loan_id: Number(loanForm.loanId),
        date: new Date().toISOString().split('T')[0],
        amount: loanForm.amount,
        payroll_entry_id: payrollEntryId
      };

      if (isUSDLoan) {
        paymentData.exchange_rate = loanForm.exchangeRate;
        paymentData.amount_ars = loanForm.amount * loanForm.exchangeRate;
      }

      await LoanService.addPayment(Number(loanForm.loanId), paymentData);
      setLoanForm({ loanId: '', amount: 0, exchangeRate: 0 });
      await loadData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Error al descontar préstamo');
      } else {
        setError('Error al descontar préstamo');
      }
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setLoading(true);
      await PayrollAdjustmentService.delete(id);
      await loadData();
    } catch {
      setError('Error al eliminar');
      setLoading(false);
    }
  };

  const formatLoanOption = (l: Loan) => {
    const dateStr = l.start_date.split('-').reverse().join('/');
    const balanceStr = l.currency === 'USD'
      ? `USD ${Number(l.remaining_balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
      : `$${Number(l.remaining_balance).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
    return `${dateStr} - Restan ${balanceStr}`;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Ajustes Manuales - {employeeName}</DialogTitle>
      <DialogContent>
        {error && <Typography color="error" variant="body2" mb={2}>{error}</Typography>}

        <Typography variant="subtitle2" mb={1} mt={1}>Agregar Premio o Retención manual</Typography>
        <Box display="flex" gap={2} mb={3} alignItems="flex-start" flexWrap="wrap">
          <FormControl sx={{ minWidth: 150, flexShrink: 0 }} size="small">
            <InputLabel>Tipo</InputLabel>
            <Select
              value={form.type || 'bonus'}
              label="Tipo"
              onChange={(e) => setForm({ ...form, type: e.target.value as 'bonus' | 'deduction' })}
            >
              <MenuItem value="bonus">Premio / Extra</MenuItem>
              <MenuItem value="deduction">Descuento</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Descripción"
            size="small"
            fullWidth
            value={form.label || ''}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            placeholder="Ej: Premio puntual, Viáticos"
            sx={{ flexGrow: 1, minWidth: 200 }}
          />

          <CurrencyInput
            label="Monto"
            value={form.amount || 0}
            onChange={(val: number | null) => setForm({ ...form, amount: val ?? 0 })}
            sx={{ width: 180, flexShrink: 0 }}
            size="small"
          />

          <Button 
            variant="contained" 
            onClick={handleAdd} 
            disabled={loading} 
            startIcon={<AddIcon />}
            sx={{ flexShrink: 0, whiteSpace: 'nowrap', height: 40 }}
          >
            Agregar
          </Button>
        </Box>

        {loans.length > 0 && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle2" mb={1} color="secondary">Descontar Cuota de Préstamo Activo</Typography>
            <Box display="flex" gap={2} mb={3} alignItems="flex-start" flexWrap="wrap">
              <FormControl sx={{ minWidth: 200, flexShrink: 0 }} size="small">
                <InputLabel>Préstamo</InputLabel>
                <Select
                  value={loanForm.loanId}
                  label="Préstamo"
                  onChange={(e) => setLoanForm({ loanId: e.target.value, amount: 0, exchangeRate: 0 })}
                >
                  {loans.map(l => (
                    <MenuItem key={l.id} value={l.id.toString()}>
                      {formatLoanOption(l)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <CurrencyInput
                label={isUSDLoan ? 'Monto a descontar (USD)' : 'Monto a descontar ($)'}
                value={loanForm.amount}
                onChange={(val: number | null) => setLoanForm({ ...loanForm, amount: val ?? 0 })}
                sx={{ width: 200, flexShrink: 0 }}
                size="small"
              />

              {isUSDLoan && (
                <CurrencyInput
                  label="Cotización USD/ARS"
                  value={loanForm.exchangeRate}
                  onChange={(val: number | null) => setLoanForm({ ...loanForm, exchangeRate: val ?? 0 })}
                  sx={{ width: 180, flexShrink: 0 }}
                  size="small"
                />
              )}

              <Button 
                variant="contained" 
                color="secondary" 
                onClick={handleAddLoanPayment} 
                disabled={loading} 
                startIcon={<AddIcon />}
                sx={{ flexShrink: 0, whiteSpace: 'nowrap', height: 40 }}
              >
                Descontar
              </Button>
            </Box>
          </>
        )}

        <Divider sx={{ my: 3 }} />
        <Typography variant="subtitle2" mb={1}>Ajustes Registrados (impactarán al generar la liquidación)</Typography>

        {loading && adjustments.length === 0 ? (
          <Box display="flex" justifyContent="center" p={3}><CircularProgress /></Box>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell align="right">Monto</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {adjustments.length === 0 ? (
                  <TableRow><TableCell colSpan={4} align="center">No hay ajustes</TableCell></TableRow>
                ) : (
                  adjustments.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        {a.type === 'bonus' ? 'Premio/Extra' : 'Descuento'}
                      </TableCell>
                      <TableCell>{a.label}</TableCell>
                      <TableCell align="right" sx={{ color: a.type === 'deduction' ? 'error.main' : 'success.main' }}>
                        {a.type === 'deduction' ? '-' : '+'}${Number(a.amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" color="error" onClick={() => handleDelete(a.id)} disabled={a.is_auto}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
