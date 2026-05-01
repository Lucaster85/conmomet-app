'use client';

import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, CircularProgress, Tooltip, TextField, Stack,
  Chip, MenuItem, Select, FormControl, InputLabel,
} from '@mui/material';
import FeedbackModal from '../../../components/FeedbackModal';
import DateField from '../../../components/DateField';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Block as CancelIcon,
  CloudUpload as UploadIcon,
} from '@mui/icons-material';
import { LeaveRequest, LeaveRequestService, Employee, EmployeeService, LeaveBalance } from '../../../utils/api';

const LEAVE_TYPES = {
  vacation: { label: 'Vacaciones', color: 'success' as const },
  medical_leave: { label: 'Licencia Médica', color: 'info' as const },
  justified: { label: 'Falta Justificada', color: 'warning' as const },
  other: { label: 'Otra', color: 'default' as const },
};

const STATUS_LABELS = {
  pending: { label: 'Pendiente', color: 'warning' as const },
  approved: { label: 'Aprobada', color: 'success' as const },
  rejected: { label: 'Rechazada', color: 'error' as const },
  cancelled: { label: 'Cancelada', color: 'default' as const },
};

export default function LeaveRequestsPage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterEmployee, setFilterEmployee] = useState<string>('');

  // Dialog State
  const [openDialog, setOpenDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [balance, setBalance] = useState<LeaveBalance | null>(null);

  // Form State
  const [form, setForm] = useState<{
    employee_id: number | '';
    leave_type: 'vacation' | 'medical_leave' | 'justified' | 'other';
    start_date: string;
    end_date: string;
    notes: string;
    file: File | null;
  }>({
    employee_id: '',
    leave_type: 'vacation',
    start_date: '',
    end_date: '',
    notes: '',
    file: null,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [requestsData, employeesData] = await Promise.all([
        LeaveRequestService.getAll(),
        EmployeeService.getAll(),
      ]);
      setRequests(Array.isArray(requestsData) ? requestsData : []);
      setEmployees(Array.isArray(employeesData) ? employeesData : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const fetchBalance = async () => {
      if (form.employee_id && form.leave_type === 'vacation') {
        try {
          const bal = await LeaveRequestService.getBalance(Number(form.employee_id));
          setBalance(bal);
        } catch (err) {
          console.error(err);
          setBalance(null);
        }
      } else {
        setBalance(null);
      }
    };
    fetchBalance();
  }, [form.employee_id, form.leave_type]);

  const filteredRequests = requests.filter(req => {
    if (filterStatus && req.status !== filterStatus) return false;
    if (filterType && req.leave_type !== filterType) return false;
    if (filterEmployee && req.employee_id !== Number(filterEmployee)) return false;
    return true;
  });

  const calculateDays = () => {
    if (!form.start_date || !form.end_date) return 0;
    const start = new Date(form.start_date);
    const end = new Date(form.end_date);
    if (end < start) return 0;
    return Math.round(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleCreate = async () => {
    if (!form.employee_id || !form.leave_type || !form.start_date || !form.end_date) {
      setError('Faltan campos obligatorios');
      return;
    }

    const days = calculateDays();
    if (days <= 0) {
      setError('La fecha de fin debe ser mayor o igual a la de inicio');
      return;
    }

    if (form.leave_type === 'vacation' && balance && days > balance.balance) {
      setError(`No hay saldo suficiente. Saldo: ${balance.balance} días. Solicitados: ${days} días.`);
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('employee_id', form.employee_id.toString());
      formData.append('leave_type', form.leave_type);
      formData.append('start_date', form.start_date);
      formData.append('end_date', form.end_date);
      formData.append('notes', form.notes);
      if (form.file) {
        formData.append('file', form.file);
      }

      await LeaveRequestService.create(formData);
      setSuccess('Solicitud creada correctamente');
      setOpenDialog(false);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (id: number, action: 'approve' | 'reject' | 'cancel') => {
    try {
      setLoading(true);
      if (action === 'approve') await LeaveRequestService.approve(id);
      else if (action === 'reject') await LeaveRequestService.reject(id, 'Rechazado manualmente');
      else if (action === 'cancel') await LeaveRequestService.cancel(id);
      
      setSuccess(`Solicitud ${action === 'approve' ? 'aprobada' : action === 'reject' ? 'rechazada' : 'cancelada'}`);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Error al ${action} solicitud`);
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    // Treat as UTC to avoid timezone shift on YYYY-MM-DD
    const d = new Date(dateStr + 'T12:00:00Z');
    return d.toLocaleDateString('es-AR');
  };

  return (
    <Box>
      <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />
      <FeedbackModal open={!!success} onClose={() => setSuccess('')} message={success} type="success" />

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Typography variant="h4" fontWeight="bold">Licencias y Vacaciones</Typography>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadData} disabled={loading}>
            Actualizar
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => {
            setForm({ employee_id: '', leave_type: 'vacation', start_date: '', end_date: '', notes: '', file: null });
            setOpenDialog(true);
          }}>
            Nueva Solicitud
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Empleado</InputLabel>
          <Select value={filterEmployee} label="Empleado" onChange={(e) => setFilterEmployee(e.target.value)}>
            <MenuItem value="">Todos</MenuItem>
            {employees.map(e => (
              <MenuItem key={e.id} value={e.id.toString()}>{e.lastname}, {e.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Tipo</InputLabel>
          <Select value={filterType} label="Tipo" onChange={(e) => setFilterType(e.target.value)}>
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="vacation">Vacaciones</MenuItem>
            <MenuItem value="medical_leave">Licencia Médica</MenuItem>
            <MenuItem value="justified">Justificada</MenuItem>
            <MenuItem value="other">Otra</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Estado</InputLabel>
          <Select value={filterStatus} label="Estado" onChange={(e) => setFilterStatus(e.target.value)}>
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="pending">Pendiente</MenuItem>
            <MenuItem value="approved">Aprobada</MenuItem>
            <MenuItem value="rejected">Rechazada</MenuItem>
            <MenuItem value="cancelled">Cancelada</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      {/* Content */}
      {loading ? (
        <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell><strong>Empleado</strong></TableCell>
                <TableCell><strong>Tipo</strong></TableCell>
                <TableCell><strong>Fechas</strong></TableCell>
                <TableCell align="center"><strong>Días</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell align="center"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRequests.map(req => {
                const typeConfig = LEAVE_TYPES[req.leave_type];
                const statusConfig = STATUS_LABELS[req.status];
                
                return (
                  <TableRow key={req.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {req.employee?.lastname}, {req.employee?.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={typeConfig.label} color={typeConfig.color} />
                    </TableCell>
                    <TableCell>
                      {formatDate(req.start_date)} - {formatDate(req.end_date)}
                    </TableCell>
                    <TableCell align="center">
                      <Chip size="small" label={`${req.total_days} días`} variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={statusConfig.label} color={statusConfig.color} />
                    </TableCell>
                    <TableCell align="center">
                      {req.status === 'pending' && (
                        <Box display="flex" justifyContent="center" gap={1}>
                          <Tooltip title="Aprobar">
                            <IconButton size="small" color="success" onClick={() => handleAction(req.id, 'approve')}>
                              <ApproveIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Rechazar">
                            <IconButton size="small" color="error" onClick={() => handleAction(req.id, 'reject')}>
                              <RejectIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )}
                      {req.status === 'approved' && (
                        <Tooltip title="Cancelar Solicitud">
                          <IconButton size="small" color="error" onClick={() => handleAction(req.id, 'cancel')}>
                            <CancelIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredRequests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No se encontraron solicitudes.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Form Dialog */}
      <Dialog open={openDialog} onClose={() => !submitting && setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nueva Solicitud de Ausencia</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControl fullWidth required>
              <InputLabel>Empleado</InputLabel>
              <Select
                value={form.employee_id}
                label="Empleado"
                onChange={(e) => setForm({ ...form, employee_id: e.target.value as number })}
              >
                {employees.map(e => (
                  <MenuItem key={e.id} value={e.id}>{e.lastname}, {e.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>Tipo de Ausencia</InputLabel>
              <Select
                value={form.leave_type}
                label="Tipo de Ausencia"
                onChange={(e) => setForm({ ...form, leave_type: e.target.value as 'vacation' | 'medical_leave' | 'justified' | 'other' })}
              >
                <MenuItem value="vacation">Vacaciones</MenuItem>
                <MenuItem value="medical_leave">Licencia Médica</MenuItem>
                <MenuItem value="justified">Falta Justificada</MenuItem>
                <MenuItem value="other">Otra</MenuItem>
              </Select>
            </FormControl>

            <Box display="flex" gap={2}>
              <DateField
                label="Fecha de Inicio"
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
                value={form.start_date}
                onChange={(val) => setForm({ ...form, start_date: val })}
              />
              <DateField
                label="Fecha de Fin"
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
                value={form.end_date}
                onChange={(val) => setForm({ ...form, end_date: val })}
              />
            </Box>

            {form.start_date && form.end_date && (
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2" gutterBottom>
                  📅 <strong>{calculateDays()} días corridos</strong>
                </Typography>
                
                {form.leave_type === 'vacation' && balance && (
                  <Box mt={1}>
                    <Typography variant="body2" color={calculateDays() > balance.balance ? 'error' : 'text.secondary'}>
                      🏖️ Saldo: {balance.balance} días disponibles (Corresponden: {balance.corresponding_days}, Usados: {balance.used_days})
                    </Typography>
                    {calculateDays() <= balance.balance && (
                      <Typography variant="body2" color="success.main" sx={{ mt: 0.5 }}>
                        → Quedarían {balance.balance - calculateDays()} días restantes
                      </Typography>
                    )}
                  </Box>
                )}
              </Paper>
            )}

            <TextField
              label="Notas (Opcional)"
              fullWidth
              multiline
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />

            <Button
              component="label"
              variant="outlined"
              startIcon={<UploadIcon />}
              fullWidth
            >
              {form.file ? form.file.name : 'Adjuntar Documento (Opcional)'}
              <input
                type="file"
                hidden
                onChange={(e) => setForm({ ...form, file: e.target.files?.[0] || null })}
              />
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} disabled={submitting}>Cancelar</Button>
          <Button onClick={handleCreate} variant="contained" disabled={submitting}>
            {submitting ? <CircularProgress size={24} /> : 'Crear Solicitud'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
