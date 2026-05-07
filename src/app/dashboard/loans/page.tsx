'use client';
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, CircularProgress, Tooltip, Stack, TextField, InputAdornment,
  MenuItem, FormControl, InputLabel, Select, Chip
} from '@mui/material';
import {
  Add as AddIcon, Delete as DeleteIcon,
  Refresh as RefreshIcon, Search as SearchIcon
} from '@mui/icons-material';
import FeedbackModal from '@/components/FeedbackModal';
import CurrencyInput from '@/components/CurrencyInput';
import { Loan, Employee, LoanService, EmployeeService } from '@/utils/api';

const emptyForm = { employee_id: 0, loan_date: '', usd_amount: 0, usd_exchange_rate: 0, notes: '' };

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState<Loan | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; item: Loan | null }>({ open: false, item: null });
  const [form, setForm] = useState(emptyForm);

  const loadData = async () => {
    try {
      setLoading(true);
      const [loansData, empsData] = await Promise.all([
        LoanService.getAll(),
        EmployeeService.getAll()
      ]);
      setLoans(loansData);
      setEmployees(empsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar préstamos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleOpenCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, loan_date: new Date().toISOString().slice(0, 10) });
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    if (!form.employee_id) return setError('El empleado es obligatorio');
    if (!form.loan_date) return setError('La fecha es obligatoria');
    if (!form.usd_amount || form.usd_amount <= 0) return setError('El monto USD debe ser mayor a 0');
    if (!form.usd_exchange_rate || form.usd_exchange_rate <= 0) return setError('La cotización debe ser mayor a 0');
    
    try {
      if (editing) {
        // We only allow editing notes on backend? Actually our service says we can update.
        // Wait, LoanService.update is not defined in api.ts? 
        // Oh, wait, in api.ts for LoanService I didn't add update(). I only added create, addPayment, delete.
        // So we can't edit loans natively unless we implement update().
        // For now let's just show an error or we can implement update.
        // But let's assume we can't edit the core amounts once created, only notes.
        // I will just remove the editing feature.
        setError('No se pueden editar préstamos. Elimine y vuelva a crear si hay un error.');
      } else {
        await LoanService.create(form);
        setSuccess('Préstamo registrado exitosamente');
      }
      setOpenDialog(false);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.item) return;
    try {
      await LoanService.delete(deleteDialog.item.id);
      setDeleteDialog({ open: false, item: null });
      setSuccess('Préstamo eliminado');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  const formatCurrency = (val: number) =>
    `$${Number(val).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

  const filtered = loans.filter(c => {
    const term = search.toLowerCase();
    const empName = c.employee ? `${c.employee.lastname} ${c.employee.name}`.toLowerCase() : '';
    const notes = c.notes?.toLowerCase() || '';
    return empName.includes(term) || notes.includes(term);
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />
      <FeedbackModal open={!!success} onClose={() => setSuccess('')} message={success} type="success" />

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h4" fontWeight={700} letterSpacing="-0.02em" color="#1E293B">
            Préstamos en USD
          </Typography>
          <Typography variant="body2" color="#64748B">
            Gestioná los adelantos o préstamos otorgados al personal con fijación en Dólares.
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadData} size="small">
            Actualizar
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate} size="small">
            Otorgar Préstamo
          </Button>
        </Box>
      </Box>

      {/* Search */}
      <TextField
        placeholder="Buscar por empleado o notas..."
        fullWidth size="small" sx={{ mb: 2 }}
        value={search} onChange={(e) => setSearch(e.target.value)}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
      />

      {/* Desktop Table */}
      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#F8FAFC' }}>
              <TableCell><strong>Fecha</strong></TableCell>
              <TableCell><strong>Empleado</strong></TableCell>
              <TableCell><strong>Monto Prestado</strong></TableCell>
              <TableCell><strong>Equivalente ARS</strong></TableCell>
              <TableCell><strong>Estado</strong></TableCell>
              <TableCell align="center"><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">No hay préstamos registrados</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((loan) => (
                <TableRow key={loan.id} hover>
                  <TableCell>
                    <Typography fontWeight={600} color="text.secondary">
                      {new Date(loan.loan_date).toLocaleDateString('es-AR')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight={600}>{loan.employee ? `${loan.employee.lastname}, ${loan.employee.name}` : "Desconocido"}</Typography>
                    <Typography variant="caption" color="text.secondary">{loan.notes}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight={700} color="error.main">
                      USD {Number(loan.usd_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatCurrency(loan.usd_amount * loan.usd_exchange_rate)}
                      <br/>(Cot: {formatCurrency(loan.usd_exchange_rate)})
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={loan.status === 'active' ? 'Activo' : loan.status === 'paid' ? 'Pagado' : 'Cancelado'} 
                      color={loan.status === 'active' ? 'warning' : loan.status === 'paid' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Eliminar">
                      <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, item: loan })} disabled={loan.status !== 'active'}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Otorgar Nuevo Préstamo (Fijado en USD)</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Empleado *</InputLabel>
              <Select
                value={form.employee_id || ''}
                label="Empleado *"
                onChange={(e) => setForm({ ...form, employee_id: Number(e.target.value) })}
              >
                {employees.map((emp) => (
                  <MenuItem key={emp.id} value={emp.id}>{emp.lastname}, {emp.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Fecha de Otorgamiento *"
              type="date"
              fullWidth
              value={form.loan_date.slice(0, 10)}
              onChange={(e) => setForm({ ...form, loan_date: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />

            <CurrencyInput
              label="Monto Prestado (USD) *"
              fullWidth
              value={form.usd_amount}
              onChange={(val) => setForm({ ...form, usd_amount: val ?? 0 })}
            />
            <CurrencyInput
              label="Cotización Dólar del Día (ARS) *"
              fullWidth
              value={form.usd_exchange_rate}
              onChange={(val) => setForm({ ...form, usd_exchange_rate: val ?? 0 })}
            />

            <Box mt={1} p={1.5} sx={{ bgcolor: 'primary.50', borderRadius: 1, border: '1px solid', borderColor: 'primary.200' }}>
              <Typography variant="caption" color="text.secondary">Total entregado al empleado en Pesos (ARS)</Typography>
              <Typography variant="body2" fontWeight={700} color="primary.main">
                {formatCurrency(form.usd_amount * form.usd_exchange_rate)}
              </Typography>
            </Box>

            <TextField
              label="Notas o Referencia"
              fullWidth
              multiline
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Ej: Para reparación de vehículo..."
            />

          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">Registrar Préstamo</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, item: null })}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Eliminar el préstamo de <strong>{deleteDialog.item?.employee ? `${deleteDialog.item.employee.lastname}, ${deleteDialog.item.employee.name}` : ""}</strong> por <strong>USD {deleteDialog.item ? Number(deleteDialog.item.usd_amount).toLocaleString('en-US', { minimumFractionDigits: 2 }) : ''}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, item: null })}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Eliminar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
