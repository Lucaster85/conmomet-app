'use client';
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, CircularProgress, TextField, Stack, Chip
} from '@mui/material';
import { Add as AddIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { SafetyEquipment, SafetyEquipmentService, Employee, EmployeeService } from '../../../utils/api';

const CONDITION_COLORS: Record<string, "success" | "info" | "warning" | "error"> = {
  new: 'success',
  good: 'info',
  worn: 'warning',
  damaged: 'error',
};

const CONDITION_LABELS: Record<string, string> = {
  new: 'Nuevo',
  good: 'Buen estado',
  worn: 'Desgastado',
  damaged: 'Dañado',
};

export default function SafetyEquipmentPage() {
  const [equipment, setEquipment] = useState<SafetyEquipment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);

  const [form, setForm] = useState({ employee_id: '', item_name: '', delivered_date: new Date().toISOString().split('T')[0], condition: 'new', notes: '' });

  const loadData = async () => {
    try {
      setLoading(true);
      const [eqs, emps] = await Promise.all([
        SafetyEquipmentService.getAll(),
        EmployeeService.getAll('active')
      ]);
      setEquipment(eqs);
      setEmployees(emps);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async () => {
    if (!form.employee_id || !form.item_name || !form.delivered_date) { setError('Campos obligatorios'); return; }
    try {
      await SafetyEquipmentService.create({
        employee_id: Number(form.employee_id),
        item_name: form.item_name,
        delivered_date: form.delivered_date,
        condition: form.condition,
        notes: form.notes
      });
      setSuccess('Entrega de EPP registrada');
      setOpenDialog(false);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  const formatDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('es-AR');

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px"><CircularProgress /></Box>;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Typography variant="h4" fontWeight="bold">Entrega de EPP</Typography>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadData} size="small">Actualizar</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenDialog(true)} size="small">Registrar Entrega</Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        <Stack spacing={2}>
          {equipment.map(e => (
            <Paper key={e.id} sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold">{e.employee?.lastname}, {e.employee?.name}</Typography>
              <Typography variant="body1">{e.item_name}</Typography>
              <Typography variant="body2">Entregado: {formatDate(e.delivered_date)}</Typography>
              <Chip label={CONDITION_LABELS[e.condition || 'new']} size="small" color={CONDITION_COLORS[e.condition || 'new']} sx={{ mt: 1 }} />
              {e.notes && <Typography variant="caption" display="block" mt={1} color="text.secondary">{e.notes}</Typography>}
            </Paper>
          ))}
        </Stack>
      </Box>

      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell><strong>Fecha Entrega</strong></TableCell>
                <TableCell><strong>Empleado</strong></TableCell>
                <TableCell><strong>Artículo</strong></TableCell>
                <TableCell><strong>Condición</strong></TableCell>
                <TableCell><strong>Notas</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {equipment.map(e => (
                <TableRow key={e.id} hover>
                  <TableCell>{formatDate(e.delivered_date)}</TableCell>
                  <TableCell>{e.employee?.lastname}, {e.employee?.name}</TableCell>
                  <TableCell><Typography fontWeight="medium">{e.item_name}</Typography></TableCell>
                  <TableCell><Chip label={CONDITION_LABELS[e.condition || 'new']} size="small" color={CONDITION_COLORS[e.condition || 'new']} /></TableCell>
                  <TableCell>{e.notes || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Registrar Entrega de EPP</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Empleado *" select fullWidth value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })} SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
              <option value="">Seleccionar empleado</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.lastname}, {e.name}</option>)}
            </TextField>
            <TextField label="Artículo / Elemento *" fullWidth value={form.item_name} onChange={(e) => setForm({ ...form, item_name: e.target.value })} placeholder="Ej: Botines de seguridad talle 42, Casco" />
            <TextField label="Fecha de entrega *" type="date" fullWidth value={form.delivered_date} onChange={(e) => setForm({ ...form, delivered_date: e.target.value })} InputLabelProps={{ shrink: true }} />
            <TextField label="Estado del artículo" select fullWidth value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
              <option value="new">Nuevo</option>
              <option value="good">Buen estado (Usado)</option>
              <option value="worn">Desgastado</option>
            </TextField>
            <TextField label="Notas / Talles" fullWidth multiline rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
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
