'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Stack, Box, Typography, CircularProgress, Alert, Divider, Paper,
  Select, MenuItem, InputLabel, FormControl,
} from '@mui/material';
import CurrencyInput from '@/components/CurrencyInput';
import {
  Category, Employee, EmployeeService, PayPeriod, PayPeriodService,
  CategoryService, ApplyCategoryBonusResponse,
} from '@/utils/api';

interface Props {
  open: boolean;
  category: Category | null;
  onClose: () => void;
  onSuccess: (result: ApplyCategoryBonusResponse) => void;
}

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const getPeriodName = (p: PayPeriod) => {
  const half = p.type === 'first_half' ? '1ª Q.' : '2ª Q.';
  return `${half} ${MONTHS[(p.month ?? 1) - 1]} ${p.year}`;
};

export default function ApplyCategoryBonusModal({ open, category, onClose, onSuccess }: Props) {
  const [periods, setPeriods] = useState<PayPeriod[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [payPeriodId, setPayPeriodId] = useState<number>(0);
  const [amount, setAmount] = useState<number>(0);
  const [label, setLabel] = useState<string>('');

  const loadData = useCallback(async () => {
    if (!category) return;
    try {
      setLoading(true);
      setError('');
      const [periodsData, allEmps] = await Promise.all([
        PayPeriodService.getAll(),
        EmployeeService.getAll(),
      ]);
      setPeriods(periodsData.filter(p => p.status === 'open'));
      setEmployees(allEmps.filter(e => e.category_id === category.id && e.status === 'active' && e.pay_type === 'hourly'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    if (open && category) {
      setPayPeriodId(0);
      setAmount(0);
      setLabel('');
      setError('');
      loadData();
    }
  }, [open, category, loadData]);

  const selectedPeriod = useMemo(() => periods.find(p => p.id === payPeriodId), [periods, payPeriodId]);

  const handleSubmit = async () => {
    if (!category) return;
    if (!payPeriodId) return setError('Debe seleccionar una quincena.');
    if (!label.trim()) return setError('La descripción es obligatoria.');
    if (!amount || amount <= 0) return setError('El monto debe ser mayor a 0.');

    try {
      setSubmitting(true);
      setError('');
      const result = await CategoryService.applyBonus(category.id, {
        pay_period_id: payPeriodId,
        amount,
        label: label.trim(),
      });
      onSuccess(result);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al aplicar la suma no remunerativa');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Aplicar Suma No Remunerativa — {category?.name}{category?.guild?.name ? ` (${category.guild.name})` : ''}
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
        ) : (
          <Stack spacing={3}>
            {error && <Alert severity="error">{error}</Alert>}

            <Typography variant="body2" color="text.secondary">
              Esta suma se carga como un ajuste puntual de esta quincena, igual que un premio/extra manual:
              no modifica el sueldo base ni el valor hora, y no afecta futuras liquidaciones, vacaciones ni aguinaldo.
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl fullWidth required>
                <InputLabel>Quincena *</InputLabel>
                <Select
                  value={payPeriodId || ''}
                  label="Quincena *"
                  onChange={(e) => setPayPeriodId(Number(e.target.value))}
                >
                  {periods.length === 0 && <MenuItem value="" disabled>No hay quincenas abiertas</MenuItem>}
                  {periods.map(p => (
                    <MenuItem key={p.id} value={p.id}>{getPeriodName(p)}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <CurrencyInput
                label="Monto *"
                fullWidth
                value={amount}
                onChange={(val) => setAmount(val ?? 0)}
              />
            </Stack>

            <TextField
              label="Descripción *"
              fullWidth
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ej: Suma no remunerativa Julio 2026"
            />

            <Divider />

            <Box>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                Empleados jornalizados activos de la categoría ({employees.length})
              </Typography>
              {employees.length === 0 ? (
                <Alert severity="info">No hay empleados jornalizados activos en esta categoría.</Alert>
              ) : (
                <Paper variant="outlined" sx={{ p: 2, maxHeight: 200, overflowY: 'auto' }}>
                  {employees.map(e => (
                    <Typography key={e.id} variant="body2">{e.lastname}, {e.name}</Typography>
                  ))}
                </Paper>
              )}
              <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                Los empleados mensualizados de esta categoría (si hay) quedan afuera de este alcance por ahora — se cargan manualmente.
                {selectedPeriod && employees.length > 0 && ` Se aplicará a quien ya tenga liquidación generada en ${getPeriodName(selectedPeriod)}; el resto se informará al confirmar.`}
              </Typography>
            </Box>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>Cancelar</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting || loading || employees.length === 0}
        >
          {submitting ? 'Aplicando...' : 'Aplicar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
