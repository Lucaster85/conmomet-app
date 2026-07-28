import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Typography, Box, Paper, TextField, MenuItem, CircularProgress, Select, InputLabel, FormControl, FormControlLabel, Checkbox, Divider, useTheme, useMediaQuery
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [adjustments, setAdjustments] = useState<PayrollAdjustment[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<Partial<CreatePayrollAdjustmentData>>({});
  const [loanForm, setLoanForm] = useState({ loanId: '', amount: 0, exchangeRate: 0, inputCurrency: 'USD' as 'USD' | 'ARS' });

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
      setLoanForm({ loanId: '', amount: 0, exchangeRate: 0, inputCurrency: 'USD' });
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
  const isArsInput = isUSDLoan && loanForm.inputCurrency === 'ARS';

  // Equivalente informativo en la otra moneda (no se envía tal cual al backend; el préstamo siempre se descuenta en USD y el sueldo siempre en ARS)
  const equivalentAmount = loanForm.exchangeRate > 0
    ? (isArsInput ? loanForm.amount / loanForm.exchangeRate : loanForm.amount * loanForm.exchangeRate)
    : 0;

  const handleAddLoanPayment = async () => {
    if (!loanForm.loanId) return setError('Seleccione un préstamo');
    if (!loanForm.amount || loanForm.amount <= 0) return setError('Monto inválido');
    if (isUSDLoan && (!loanForm.exchangeRate || loanForm.exchangeRate <= 0)) return setError('Cotización inválida');

    try {
      setLoading(true);

      // El préstamo siempre se descuenta en su moneda de origen (USD acá); si el usuario cargó
      // el monto en pesos, se convierte a USD solo para descontar del saldo del préstamo
      // (ahí una diferencia de centavos por redondeo es aceptable). El monto que impacta el
      // sueldo neto (amount_ars) se manda tal cual lo ingresó el usuario, sin recalcularlo desde
      // el USD redondeado, para evitar que $133.000 termine descontándose como $133.002,90.
      const usdAmount = isArsInput
        ? Math.round((loanForm.amount / loanForm.exchangeRate) * 100) / 100
        : loanForm.amount;

      const paymentData: Parameters<typeof LoanService.addPayment>[1] = {
        loan_id: Number(loanForm.loanId),
        date: new Date().toISOString().split('T')[0],
        amount: isUSDLoan ? usdAmount : loanForm.amount,
        payroll_entry_id: payrollEntryId
      };

      if (isUSDLoan) {
        paymentData.exchange_rate = loanForm.exchangeRate;
        paymentData.amount_ars = isArsInput ? loanForm.amount : usdAmount * loanForm.exchangeRate;
      }

      await LoanService.addPayment(Number(loanForm.loanId), paymentData);
      setLoanForm({ loanId: '', amount: 0, exchangeRate: 0, inputCurrency: 'USD' });
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
    const notesStr = l.notes ? ` · ${l.notes}` : '';
    return `${dateStr} · Restan ${balanceStr}${notesStr}`;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth fullScreen={isMobile}>
      <DialogTitle>Ajustes Manuales - {employeeName}</DialogTitle>
      <DialogContent>
        {error && <Typography color="error" variant="body2" mb={2}>{error}</Typography>}

        <Typography variant="subtitle2" mb={1} mt={1}>Agregar Premio o Retención manual</Typography>
        <Box display="flex" gap={2} mb={3} alignItems="flex-start" flexWrap="wrap">
          <FormControl sx={{ minWidth: 150, width: isMobile ? '100%' : 'auto', flexShrink: 0 }} size="small">
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
            sx={{ flexGrow: 1, minWidth: 200, width: isMobile ? '100%' : 'auto' }}
          />

          <CurrencyInput
            label="Monto"
            value={form.amount || 0}
            onChange={(val: number | null) => setForm({ ...form, amount: val ?? 0 })}
            sx={{ width: isMobile ? '100%' : 180, flexShrink: 0 }}
            size="small"
          />

          <Button 
            variant="contained" 
            onClick={handleAdd} 
            disabled={loading} 
            startIcon={<AddIcon />}
            sx={{ flexShrink: 0, whiteSpace: 'nowrap', height: 40, width: isMobile ? '100%' : 'auto' }}
          >
            Agregar
          </Button>
        </Box>

        {loans.length > 0 && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle2" mb={1} color="secondary">Descontar Cuota de Préstamo Activo</Typography>
            <Box display="flex" gap={2} mb={3} alignItems="flex-start" flexWrap="wrap">
              <FormControl sx={{ minWidth: 200, maxWidth: isMobile ? '100%' : 260, width: isMobile ? '100%' : 'auto', flexShrink: 0 }} size="small">
                <InputLabel>Préstamo</InputLabel>
                <Select
                  value={loanForm.loanId}
                  label="Préstamo"
                  onChange={(e) => setLoanForm({ loanId: e.target.value, amount: 0, exchangeRate: 0, inputCurrency: 'USD' })}
                  sx={{ '& .MuiSelect-select': { fontSize: '0.78rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }}
                  MenuProps={{ PaperProps: { sx: { maxWidth: 320 } } }}
                >
                  {loans.map(l => (
                    <MenuItem key={l.id} value={l.id.toString()} sx={{ fontSize: '0.78rem', whiteSpace: 'normal' }}>
                      {formatLoanOption(l)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {isUSDLoan && (
                <FormControlLabel
                  sx={{ flexShrink: 0, mr: 0, ml: 0 }}
                  control={
                    <Checkbox
                      size="small"
                      checked={loanForm.inputCurrency === 'ARS'}
                      onChange={(e) => setLoanForm({ ...loanForm, amount: 0, inputCurrency: e.target.checked ? 'ARS' : 'USD' })}
                    />
                  }
                  label={<Typography variant="caption">Pesos</Typography>}
                />
              )}

              <CurrencyInput
                label={isArsInput ? 'Monto a descontar ($)' : 'Monto a descontar (USD)'}
                value={loanForm.amount}
                onChange={(val: number | null) => setLoanForm({ ...loanForm, amount: val ?? 0 })}
                sx={{ width: isMobile ? '100%' : 200, flexShrink: 0 }}
                size="small"
              />

              {isUSDLoan && (
                <CurrencyInput
                  label="Cotización USD/ARS"
                  value={loanForm.exchangeRate}
                  onChange={(val: number | null) => setLoanForm({ ...loanForm, exchangeRate: val ?? 0 })}
                  sx={{ width: isMobile ? '100%' : 180, flexShrink: 0 }}
                  size="small"
                />
              )}

              {isUSDLoan && (
                <CurrencyInput
                  label={isArsInput ? 'Equivale a (USD)' : 'Equivale a ($)'}
                  value={Math.round(equivalentAmount * 100) / 100}
                  onChange={() => {}}
                  disabled
                  sx={{ width: isMobile ? '100%' : 180, flexShrink: 0 }}
                  size="small"
                />
              )}

              <Button
                variant="contained" 
                color="secondary" 
                onClick={handleAddLoanPayment} 
                disabled={loading} 
                startIcon={<AddIcon />}
                sx={{ flexShrink: 0, whiteSpace: 'nowrap', height: 40, width: isMobile ? '100%' : 'auto' }}
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
