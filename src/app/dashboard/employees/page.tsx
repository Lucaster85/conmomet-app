'use client';
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, CircularProgress, Tooltip, TextField, Stack,
  Chip, InputAdornment,
} from '@mui/material';
import FeedbackModal from '../../../components/FeedbackModal';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Refresh as RefreshIcon, Search as SearchIcon,
} from '@mui/icons-material';
import { Employee, EmployeeService, CreateEmployeeData } from '../../../utils/api';

const STATUS_LABELS: Record<string, { label: string; color: 'success' | 'error' | 'warning' | 'info' }> = {
  active: { label: 'Activo', color: 'success' },
  inactive: { label: 'Inactivo', color: 'error' },
  vacation: { label: 'Vacaciones', color: 'warning' },
  medical_leave: { label: 'Licencia', color: 'info' },
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; employee: Employee | null }>({ open: false, employee: null });

  const emptyForm: CreateEmployeeData & { status?: string; pay_type?: string; monthly_salary?: number } = {
    name: '', lastname: '', dni: '', cuil: '', address: '', phone: '', email: '',
    position: '', hire_date: '', hourly_rate: 0, pay_type: 'hourly', monthly_salary: 0, notes: '',
  };
  const [form, setForm] = useState(emptyForm);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await EmployeeService.getAll();
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar empleados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEmployees(); }, []);

  const filtered = employees.filter((e) => {
    const q = search.toLowerCase();
    return `${e.name} ${e.lastname} ${e.dni}`.toLowerCase().includes(q);
  });

  const handleOpenCreate = () => {
    setEditingEmployee(null);
    setForm({ ...emptyForm });
    setOpenDialog(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setForm({
      name: emp.name, lastname: emp.lastname, dni: emp.dni, cuil: emp.cuil,
      address: emp.address || '', phone: emp.phone || '', email: emp.email || '',
      position: emp.position || '', hire_date: emp.hire_date, hourly_rate: emp.hourly_rate,
      pay_type: emp.pay_type || 'hourly',
      monthly_salary: emp.monthly_salary || 0,
      notes: emp.notes || '', status: emp.status,
    });
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.lastname || !form.dni || !form.cuil || !form.hire_date || !form.hourly_rate) {
      setError('Nombre, Apellido, DNI, CUIL, Fecha ingreso y Valor hora son obligatorios');
      return;
    }
    try {
      if (editingEmployee) {
        await EmployeeService.update(editingEmployee.id, form);
        setSuccess('Empleado actualizado');
      } else {
        await EmployeeService.create(form);
        setSuccess('Empleado creado');
      }
      setOpenDialog(false);
      loadEmployees();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.employee) return;
    try {
      await EmployeeService.delete(deleteDialog.employee.id);
      setDeleteDialog({ open: false, employee: null });
      setSuccess('Empleado eliminado');
      loadEmployees();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  const formatCurrency = (val: number) => `$${Number(val).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

  if (loading) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px"><CircularProgress /></Box>;
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Typography variant="h4" fontWeight="bold">Empleados</Typography>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadEmployees} size="small">Actualizar</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate} size="small">Nuevo Empleado</Button>
        </Box>
      </Box>

      {/* Search */}
      <TextField
        placeholder="Buscar por nombre, apellido o DNI..."
        fullWidth size="small" sx={{ mb: 2 }}
        value={search} onChange={(e) => setSearch(e.target.value)}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
      />

      <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />
      <FeedbackModal open={!!success} onClose={() => setSuccess('')} message={success} type="success" />

      {/* Mobile Cards */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {filtered.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={4}>No hay empleados</Typography>
        ) : (
          <Stack spacing={2}>
            {filtered.map((emp) => (
              <Paper key={emp.id} sx={{ p: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box flex={1}>
                    <Typography variant="subtitle1" fontWeight="bold">{emp.lastname}, {emp.name}</Typography>
                    <Typography variant="body2" color="text.secondary">DNI: {emp.dni}</Typography>
                    {emp.position && <Typography variant="body2">{emp.position}</Typography>}
                    <Typography variant="body2" fontWeight="medium">
                      {emp.pay_type === 'monthly' ? `${formatCurrency(emp.monthly_salary || 0)} /mes (Fijo)` : `${formatCurrency(emp.hourly_rate)} /hora`}
                    </Typography>
                    <Chip label={STATUS_LABELS[emp.status]?.label || emp.status} color={STATUS_LABELS[emp.status]?.color || 'default'} size="small" sx={{ mt: 0.5 }} />
                  </Box>
                  <Box>
                    <IconButton size="small" color="primary" onClick={() => handleOpenEdit(emp)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, employee: emp })}><DeleteIcon fontSize="small" /></IconButton>
                  </Box>
                </Box>
              </Paper>
            ))}
          </Stack>
        )}
      </Box>

      {/* Desktop Table */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <TableContainer component={Paper} elevation={2}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell><strong>Empleado</strong></TableCell>
                <TableCell><strong>DNI</strong></TableCell>
                <TableCell><strong>Puesto</strong></TableCell>
                <TableCell><strong>Remuneración</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell align="center"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><Typography variant="body2" color="text.secondary">No hay empleados</Typography></TableCell></TableRow>
              ) : (
                filtered.map((emp) => (
                  <TableRow key={emp.id} hover>
                    <TableCell>
                      <Typography fontWeight="medium">{emp.lastname}, {emp.name}</Typography>
                      {emp.phone && <Typography variant="caption" color="text.secondary">📞 {emp.phone}</Typography>}
                    </TableCell>
                    <TableCell>{emp.dni}</TableCell>
                    <TableCell>{emp.position || '—'}</TableCell>
                    <TableCell>
                      <Typography variant="body2">{emp.pay_type === 'monthly' ? formatCurrency(emp.monthly_salary || 0) : formatCurrency(emp.hourly_rate)}</Typography>
                      <Typography variant="caption" color="text.secondary">{emp.pay_type === 'monthly' ? 'por mes' : 'por hora'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={STATUS_LABELS[emp.status]?.label || emp.status} color={STATUS_LABELS[emp.status]?.color || 'default'} size="small" />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Editar"><IconButton size="small" color="primary" onClick={() => handleOpenEdit(emp)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Eliminar"><IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, employee: emp })}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingEmployee ? 'Editar Empleado' : 'Nuevo Empleado'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }}>
              <TextField label="Nombre *" fullWidth value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <TextField label="Apellido *" fullWidth value={form.lastname} onChange={(e) => setForm({ ...form, lastname: e.target.value })} />
            </Box>
            <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }}>
              <TextField label="DNI *" fullWidth value={form.dni} onChange={(e) => setForm({ ...form, dni: e.target.value })} />
              <TextField label="CUIL *" fullWidth value={form.cuil} onChange={(e) => setForm({ ...form, cuil: e.target.value })} />
            </Box>
            <TextField label="Puesto" fullWidth value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="Ej: Soldador, Tornero" />
            <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }}>
              <TextField label="Fecha Ingreso *" type="date" fullWidth value={form.hire_date} onChange={(e) => setForm({ ...form, hire_date: e.target.value })} InputLabelProps={{ shrink: true }} />
              <TextField label="Tipo de Pago" select fullWidth value={form.pay_type || 'hourly'} onChange={(e) => setForm({ ...form, pay_type: e.target.value })}
                SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
                <option value="hourly">Jornalizado (por hora)</option>
                <option value="monthly">Mensualizado (sueldo fijo)</option>
              </TextField>
            </Box>
            <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }}>
              <TextField label="Valor Hora *" type="number" fullWidth value={form.hourly_rate} onChange={(e) => setForm({ ...form, hourly_rate: Number(e.target.value) })}
                InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} />
              {form.pay_type === 'monthly' && (
                <TextField label="Sueldo Mensual *" type="number" fullWidth value={form.monthly_salary || 0} onChange={(e) => setForm({ ...form, monthly_salary: Number(e.target.value) })}
                  InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} />
              )}
            </Box>
            <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }}>
              <TextField label="Teléfono" fullWidth value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <TextField label="Email" fullWidth value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Box>
            <TextField label="Dirección" fullWidth value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            {editingEmployee && (
              <TextField label="Estado" select fullWidth value={form.status || 'active'} onChange={(e) => setForm({ ...form, status: e.target.value })}
                SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
                <option value="vacation">Vacaciones</option>
                <option value="medical_leave">Licencia Médica</option>
              </TextField>
            )}
            <TextField label="Notas" fullWidth multiline rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">{editingEmployee ? 'Guardar' : 'Crear'}</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, employee: null })}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>¿Eliminar a <strong>{deleteDialog.employee?.name} {deleteDialog.employee?.lastname}</strong>?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, employee: null })}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Eliminar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
