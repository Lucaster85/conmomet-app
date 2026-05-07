import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Typography, Box, Paper, TextField, MenuItem, CircularProgress, Select, InputLabel, FormControl
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { PayrollAdjustment, PayrollAdjustmentService, CreatePayrollAdjustmentData } from '../../../../../utils/api';
import CurrencyInput from '../../../../../components/CurrencyInput';

interface Props {
  open: boolean;
  onClose: () => void;
  payPeriodId: number;
  employeeId: number;
  employeeName: string;
}

export default function PayrollAdjustmentsModal({ open, onClose, payPeriodId, employeeId, employeeName }: Props) {
  const [adjustments, setAdjustments] = useState<PayrollAdjustment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<Partial<CreatePayrollAdjustmentData>>({});

  const loadData = React.useCallback(async () => {
    if (!payPeriodId || !employeeId) return;
    try {
      setLoading(true);
      const data = await PayrollAdjustmentService.getByPayPeriod(payPeriodId);
      setAdjustments(data.filter((a: PayrollAdjustment) => a.employee_id === employeeId));
    } catch {
      setError('Error al cargar ajustes');
    } finally {
      setLoading(false);
    }
  }, [payPeriodId, employeeId]);

  useEffect(() => {
    if (open) {
      loadData();
      setForm({ type: 'bonus', amount: 0, description: '', is_taxable: true });
    }
  }, [open, payPeriodId, employeeId, loadData]);

  const handleAdd = async () => {
    if (!form.description) return setError('La descripción es requerida');
    if (!form.amount || form.amount <= 0) return setError('El monto debe ser mayor a cero');
    if (!form.type) return setError('El tipo es requerido');

    try {
      setLoading(true);
      await PayrollAdjustmentService.create({
        pay_period_id: payPeriodId,
        employee_id: employeeId,
        type: form.type as 'bonus' | 'deduction' | 'retroactive' | 'other',
        description: form.description,
        amount: form.amount,
        is_taxable: form.is_taxable,
        notes: form.notes
      });
      setForm({ type: 'bonus', amount: 0, description: '', is_taxable: true });
      await loadData();
    } catch {
      setError('Error al crear ajuste');
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Ajustes Manuales - {employeeName}</DialogTitle>
      <DialogContent>
        {error && <Typography color="error" variant="body2" mb={2}>{error}</Typography>}

        <Box display="flex" gap={2} mb={3} alignItems="flex-start" mt={1}>
          <FormControl sx={{ minWidth: 150 }} size="small">
            <InputLabel>Tipo</InputLabel>
            <Select
              value={form.type || 'bonus'}
              label="Tipo"
              onChange={(e) => setForm({ ...form, type: e.target.value as 'bonus' | 'deduction' | 'retroactive' | 'other' })}
            >
              <MenuItem value="bonus">Premio / Extra</MenuItem>
              <MenuItem value="deduction">Descuento</MenuItem>
              <MenuItem value="retroactive">Retroactivo</MenuItem>
              <MenuItem value="other">Otro</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Descripción"
            size="small"
            fullWidth
            value={form.description || ''}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Ej: Premio puntual, Viáticos"
          />

          <CurrencyInput
            label="Monto"
            value={form.amount || 0}
            onChange={(val: number | null) => setForm({ ...form, amount: val ?? 0 })}
            sx={{ width: 150 }}
            size="small"
          />

          <Button variant="contained" onClick={handleAdd} disabled={loading} startIcon={<AddIcon />}>
            Agregar
          </Button>
        </Box>

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
                        {a.type === 'bonus' ? 'Premio/Extra' : a.type === 'deduction' ? 'Descuento' : a.type === 'retroactive' ? 'Retroactivo' : 'Otro'}
                      </TableCell>
                      <TableCell>{a.description}</TableCell>
                      <TableCell align="right" sx={{ color: a.type === 'deduction' ? 'error.main' : 'success.main' }}>
                        {a.type === 'deduction' ? '-' : '+'}${Number(a.amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" color="error" onClick={() => handleDelete(a.id)}>
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
