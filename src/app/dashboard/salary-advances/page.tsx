'use client';
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Dialog, DialogTitle, DialogContent,
  DialogActions, CircularProgress, TextField, Stack, Chip, Autocomplete, Grid, useTheme, useMediaQuery
} from '@mui/material';
import FeedbackModal from '../../../components/FeedbackModal';
import DateField from '../../../components/DateField';
import CurrencyInput from '../../../components/CurrencyInput';
import {
  Add as AddIcon, Refresh as RefreshIcon,
  LocalAtm as CashIcon, AccountBalance as BankIcon
} from '@mui/icons-material';
import { SalaryAdvance, SalaryAdvanceService, Employee, EmployeeService } from '../../../utils/api';

export default function SalaryAdvancesPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [advances, setAdvances] = useState<SalaryAdvance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);

  // Filters
  const [filterEmployee, setFilterEmployee] = useState<number | ''>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'discounted'>('all');

  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);
  const [form, setForm] = useState<{ amount: number | null; date: string; notes: string; payment_method: 'efectivo' | 'transferencia' }>({
    amount: null,
    date: new Date().toISOString().split('T')[0],
    notes: '',
    payment_method: 'transferencia'
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [advs, emps] = await Promise.all([
        SalaryAdvanceService.getAll(),
        EmployeeService.getAll()
      ]);
      setAdvances(advs);
      setEmployees(emps);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleOpenDialog = () => {
    setSelectedEmployees([]);
    setForm({
      amount: null,
      date: new Date().toISOString().split('T')[0],
      notes: '',
      payment_method: 'transferencia'
    });
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    if (selectedEmployees.length === 0 || !form.amount || !form.date) {
      setError('Campos obligatorios');
      return;
    }
    try {
      await SalaryAdvanceService.create({
        employee_ids: selectedEmployees.map(e => e.id),
        amount: form.amount!,
        date: form.date,
        payment_method: form.payment_method,
        notes: form.notes
      });
      setSuccess(selectedEmployees.length > 1 ? 'Adelantos registrados en lote' : 'Adelanto registrado');
      setOpenDialog(false);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  const formatCurrency = (v: number) => `$${Number(v).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
  const formatDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('es-AR');

  const renderPaymentMethodChip = (method: 'efectivo' | 'transferencia') => {
    if (method === 'efectivo') {
      return (
        <Chip
          label="Efectivo"
          size="small"
          color="warning"
          variant="outlined"
          icon={<CashIcon sx={{ fontSize: '0.875rem !important' }} />}
        />
      );
    }
    return (
      <Chip
        label="Transferencia"
        size="small"
        color="info"
        variant="outlined"
        icon={<BankIcon sx={{ fontSize: '0.875rem !important' }} />}
      />
    );
  };

  const filteredAdvances = advances.filter(a => {
    if (filterEmployee && a.employee_id !== filterEmployee) return false;
    if (filterStatus === 'pending' && a.pay_period_id) return false;
    if (filterStatus === 'discounted' && !a.pay_period_id) return false;
    return true;
  });

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px"><CircularProgress /></Box>;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Typography variant="h4" fontWeight="bold">Adelantos</Typography>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadData} size="small">Actualizar</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenDialog} size="small">Registrar Adelanto</Button>
        </Box>
      </Box>

      <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />
      <FeedbackModal open={!!success} onClose={() => setSuccess('')} message={success} type="success" />

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label="Empleado"
              select
              size="small"
              fullWidth
              value={filterEmployee}
              onChange={(e) => setFilterEmployee(e.target.value ? Number(e.target.value) : '')}
              SelectProps={{ native: true }}
              InputLabelProps={{ shrink: true }}
            >
              <option value="">Todos los empleados</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.lastname}, {e.name}</option>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label="Estado"
              select
              size="small"
              fullWidth
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'pending' | 'discounted')}
              SelectProps={{ native: true }}
              InputLabelProps={{ shrink: true }}
            >
              <option value="all">Todos los adelantos</option>
              <option value="pending">Pendiente de descuento</option>
              <option value="discounted">Descontado</option>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Mobile view */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {filteredAdvances.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">No hay adelantos para los filtros seleccionados</Typography>
          </Paper>
        ) : (
          <Stack spacing={2}>
            {filteredAdvances.map(a => (
              <Paper key={a.id} sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold">{a.employee?.lastname}, {a.employee?.name}</Typography>
                <Typography variant="h6" color="error.main">{formatCurrency(a.amount)}</Typography>
                <Typography variant="body2">{formatDate(a.date)}</Typography>
                {a.notes && <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>{a.notes}</Typography>}
                <Box mt={1.5} display="flex" gap={1} flexWrap="wrap">
                  {renderPaymentMethodChip(a.payment_method)}
                  {a.pay_period_id ? <Chip label="Descontado" size="small" color="success" /> : <Chip label="Pendiente de descuento" size="small" color="warning" />}
                </Box>
              </Paper>
            ))}
          </Stack>
        )}
      </Box>

      {/* Desktop view */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell><strong>Fecha</strong></TableCell>
                <TableCell><strong>Empleado</strong></TableCell>
                <TableCell><strong>Monto</strong></TableCell>
                <TableCell><strong>Método</strong></TableCell>
                <TableCell><strong>Notas</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAdvances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No hay adelantos para los filtros seleccionados</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAdvances.map(a => (
                  <TableRow key={a.id} hover>
                    <TableCell>{formatDate(a.date)}</TableCell>
                    <TableCell>{a.employee?.lastname}, {a.employee?.name}</TableCell>
                    <TableCell><Typography color="error.main" fontWeight="bold">{formatCurrency(a.amount)}</Typography></TableCell>
                    <TableCell>{renderPaymentMethodChip(a.payment_method)}</TableCell>
                    <TableCell>{a.notes || '—'}</TableCell>
                    <TableCell>{a.pay_period_id ? <Chip label="Descontado" size="small" color="success" /> : <Chip label="Pendiente de descuento" size="small" color="warning" />}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle>Registrar Adelanto</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1.5 }}>
            <Autocomplete
              multiple
              options={employees.filter(e => e.status !== 'inactive')}
              getOptionLabel={(e) => `${e.lastname}, ${e.name}`}
              value={selectedEmployees}
              onChange={(_, val) => setSelectedEmployees(val)}
              renderInput={(params) => <TextField {...params} label="Empleado(s) *" placeholder="Seleccionar..." />}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => {
                  const { key, ...rest } = getTagProps({ index });
                  return <Chip key={key} label={`${option.name} ${option.lastname}`} size="small" {...rest} />;
                })
              }
            />
            <DateField label="Fecha *" fullWidth value={form.date} onChange={(val) => setForm({ ...form, date: val })} InputLabelProps={{ shrink: true }} />
            <CurrencyInput label="Monto *" fullWidth value={form.amount} onChange={(value) => setForm({ ...form, amount: value })} />
            <TextField
              label="Método de Pago *"
              select
              fullWidth
              value={form.payment_method}
              onChange={(e) => setForm({ ...form, payment_method: e.target.value as 'efectivo' | 'transferencia' })}
              SelectProps={{ native: true }}
              InputLabelProps={{ shrink: true }}
            >
              <option value="transferencia">Transferencia bancaria</option>
              <option value="efectivo">Efectivo</option>
            </TextField>
            <TextField label="Notas" fullWidth multiline rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={selectedEmployees.length === 0 || !form.amount || !form.date}>
            Registrar {selectedEmployees.length > 1 ? `(${selectedEmployees.length})` : ''}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
