'use client';
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, CircularProgress, Tooltip, Stack, TextField, InputAdornment,
  MenuItem, FormControl, InputLabel, Select, Chip, ToggleButtonGroup, ToggleButton
} from '@mui/material';
import {
  Add as AddIcon, Delete as DeleteIcon,
  Refresh as RefreshIcon, Search as SearchIcon
} from '@mui/icons-material';
import FeedbackModal from '@/components/FeedbackModal';
import CurrencyInput from '@/components/CurrencyInput';
import { Loan, Employee, LoanService, EmployeeService } from '@/utils/api';

const emptyForm = { employee_id: 0, currency: 'USD' as 'USD' | 'ARS', start_date: '', amount: 0, exchange_rate_at_origin: 0, notes: '' };

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
    setForm({ ...emptyForm, start_date: new Date().toISOString().slice(0, 10) });
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    if (!form.employee_id) return setError('El empleado es obligatorio');
    if (!form.start_date) return setError('La fecha es obligatoria');
    if (!form.amount || form.amount <= 0) return setError('El monto debe ser mayor a 0');
    if (form.currency === 'USD' && (!form.exchange_rate_at_origin || form.exchange_rate_at_origin <= 0)) {
      return setError('La cotización debe ser mayor a 0 para préstamos en USD');
    }
    
    try {
      if (editing) {
        setError('No se pueden editar préstamos. Elimine y vuelva a crear si hay un error.');
      } else {
        const createData: Parameters<typeof LoanService.create>[0] = {
          employee_id: form.employee_id,
          currency: form.currency,
          start_date: form.start_date,
          amount: form.amount,
          notes: form.notes || undefined,
        };
        if (form.currency === 'USD') {
          createData.exchange_rate_at_origin = form.exchange_rate_at_origin;
        }
        await LoanService.create(createData);
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

  const formatLoanAmount = (loan: Loan) =>
    loan.currency === 'USD'
      ? `USD ${Number(loan.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
      : formatCurrency(loan.amount);

  const formatLoanBalance = (loan: Loan) =>
    loan.currency === 'USD'
      ? `USD ${Number(loan.remaining_balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
      : formatCurrency(loan.remaining_balance);

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
            Préstamos
          </Typography>
          <Typography variant="body2" color="#64748B">
            Gestioná los adelantos o préstamos otorgados al personal en Pesos o Dólares.
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
              <TableCell align="center"><strong>Moneda</strong></TableCell>
              <TableCell align="right"><strong>Monto</strong></TableCell>
              <TableCell align="right"><strong>Cotización</strong></TableCell>
              <TableCell align="right"><strong>Monto Pesos Orig.</strong></TableCell>
              <TableCell align="right"><strong>Saldo Pendiente</strong></TableCell>
              <TableCell align="center"><strong>Estado</strong></TableCell>
              <TableCell align="center"><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">No hay préstamos registrados</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((loan) => (
                <TableRow key={loan.id} hover>
                  <TableCell>
                    {new Date(loan.start_date).toLocaleDateString('es-AR')}
                  </TableCell>
                  <TableCell>
                    {loan.employee && <Typography fontWeight={600}>{loan.employee.lastname}, {loan.employee.name}</Typography>}
                    {loan.notes && <Typography variant="caption" color="text.secondary" display="block">{loan.notes}</Typography>}
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={loan.currency} size="small" variant="outlined" color={loan.currency === 'USD' ? 'info' : 'default'} />
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    {formatLoanAmount(loan)}
                  </TableCell>
                  <TableCell align="right">
                    {loan.currency === 'USD' && loan.exchange_rate_at_origin
                      ? formatCurrency(loan.exchange_rate_at_origin)
                      : '—'}
                  </TableCell>
                  <TableCell align="right" sx={{ color: 'text.secondary' }}>
                    {loan.currency === 'USD' && loan.amount_ars_at_origin
                      ? formatCurrency(loan.amount_ars_at_origin)
                      : '—'}
                  </TableCell>
                  <TableCell align="right" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                    {formatLoanBalance(loan)}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={loan.status === 'completed' ? 'Completado' : loan.status === 'cancelled' ? 'Cancelado' : 'Activo'}
                      color={loan.status === 'completed' ? 'success' : loan.status === 'cancelled' ? 'default' : 'primary'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title={loan.status === 'completed' ? "Préstamo completado" : "Eliminar"}>
                      <span>
                        <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, item: loan })} disabled={loan.status === 'completed'}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </span>
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
        <DialogTitle>Otorgar Préstamo a Empleado</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Empleado *</InputLabel>
              <Select
                value={form.employee_id || ''}
                label="Empleado *"
                onChange={(e) => setForm({ ...form, employee_id: Number(e.target.value) })}
              >
                {employees.map(e => <MenuItem key={e.id} value={e.id}>{e.lastname}, {e.name}</MenuItem>)}
              </Select>
            </FormControl>
            
            <TextField
              label="Fecha de Entrega *"
              type="date"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={form.start_date.slice(0, 10)}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            />

            <Box>
              <Typography variant="caption" color="text.secondary" mb={0.5} display="block">Moneda del Préstamo *</Typography>
              <ToggleButtonGroup
                value={form.currency}
                exclusive
                onChange={(_, val) => { if (val) setForm({ ...form, currency: val }); }}
                size="small"
                fullWidth
              >
                <ToggleButton value="USD">🇺🇸 Dólares (USD)</ToggleButton>
                <ToggleButton value="ARS">🇦🇷 Pesos (ARS)</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Box display="flex" gap={2}>
              <CurrencyInput
                label={form.currency === 'USD' ? 'Monto Préstamo (USD) *' : 'Monto Préstamo ($) *'}
                value={form.amount}
                onChange={(val) => setForm({ ...form, amount: val ?? 0 })}
                fullWidth
                size="small"
                InputProps={{ startAdornment: <InputAdornment position="start">{form.currency === 'USD' ? 'USD' : '$'}</InputAdornment> }}
              />
              {form.currency === 'USD' && (
                <CurrencyInput
                  label="Cotización USD ($) *"
                  value={form.exchange_rate_at_origin}
                  onChange={(val) => setForm({ ...form, exchange_rate_at_origin: val ?? 0 })}
                  fullWidth
                  size="small"
                  InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                />
              )}
            </Box>

            {form.currency === 'USD' && (
              <Box mt={1} p={1.5} sx={{ bgcolor: 'primary.50', borderRadius: 1, border: '1px solid', borderColor: 'primary.200' }}>
                <Typography variant="caption" color="text.secondary">Total entregado al empleado en Pesos (ARS)</Typography>
                <Typography variant="body2" fontWeight={700} color="primary.main">
                  {formatCurrency(form.amount * form.exchange_rate_at_origin)}
                </Typography>
              </Box>
            )}

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
            ¿Eliminar el préstamo de <strong>{deleteDialog.item?.employee ? `${deleteDialog.item.employee.lastname}, ${deleteDialog.item.employee.name}` : ""}</strong> por <strong>{deleteDialog.item ? (deleteDialog.item.currency === 'USD' ? `USD ${Number(deleteDialog.item.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : formatCurrency(deleteDialog.item.amount)) : ''}</strong>?
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
