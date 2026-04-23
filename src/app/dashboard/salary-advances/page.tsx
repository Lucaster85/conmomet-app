'use client';
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, CircularProgress, TextField, Stack, InputAdornment, Chip
} from '@mui/material';
import { Add as AddIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { SalaryAdvance, SalaryAdvanceService, Employee, EmployeeService } from '../../../utils/api';

export default function SalaryAdvancesPage() {
  const [advances, setAdvances] = useState<SalaryAdvance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);

  const [form, setForm] = useState({ employee_id: '', amount: '', date: new Date().toISOString().split('T')[0], notes: '' });

  const loadData = async () => {
    try {
      setLoading(true);
      const [advs, emps] = await Promise.all([
        SalaryAdvanceService.getAll(),
        EmployeeService.getAll('active')
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

  const handleSubmit = async () => {
    if (!form.employee_id || !form.amount || !form.date) { setError('Campos obligatorios'); return; }
    try {
      await SalaryAdvanceService.create({
        employee_id: Number(form.employee_id),
        amount: Number(form.amount),
        date: form.date,
        notes: form.notes
      });
      setSuccess('Adelanto registrado');
      setOpenDialog(false);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  const formatCurrency = (v: number) => `$${Number(v).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
  const formatDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('es-AR');

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px"><CircularProgress /></Box>;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Typography variant="h4" fontWeight="bold">Adelantos</Typography>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadData} size="small">Actualizar</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenDialog(true)} size="small">Registrar Adelanto</Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Mobile view */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        <Stack spacing={2}>
          {advances.map(a => (
            <Paper key={a.id} sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold">{a.employee?.lastname}, {a.employee?.name}</Typography>
              <Typography variant="h6" color="error.main">{formatCurrency(a.amount)}</Typography>
              <Typography variant="body2">{formatDate(a.date)}</Typography>
              {a.notes && <Typography variant="caption" color="text.secondary">{a.notes}</Typography>}
              <Box mt={1}>
                {a.pay_period_id ? <Chip label="Descontado" size="small" color="success" /> : <Chip label="Pendiente de descuento" size="small" color="warning" />}
              </Box>
            </Paper>
          ))}
        </Stack>
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
                <TableCell><strong>Notas</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {advances.map(a => (
                <TableRow key={a.id} hover>
                  <TableCell>{formatDate(a.date)}</TableCell>
                  <TableCell>{a.employee?.lastname}, {a.employee?.name}</TableCell>
                  <TableCell><Typography color="error.main" fontWeight="bold">{formatCurrency(a.amount)}</Typography></TableCell>
                  <TableCell>{a.notes || '—'}</TableCell>
                  <TableCell>{a.pay_period_id ? <Chip label="Descontado" size="small" color="success" /> : <Chip label="Pendiente de descuento" size="small" color="warning" />}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Registrar Adelanto</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Empleado *" select fullWidth value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })} SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
              <option value="">Seleccionar empleado</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.lastname}, {e.name}</option>)}
            </TextField>
            <TextField label="Fecha *" type="date" fullWidth value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} InputLabelProps={{ shrink: true }} />
            <TextField label="Monto *" type="number" fullWidth value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} />
            <TextField label="Notas" fullWidth multiline rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">Registrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
