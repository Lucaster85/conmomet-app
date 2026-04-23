'use client';
import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, CircularProgress, Tooltip, TextField, Stack,
  Chip, InputAdornment, Link
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon,
  Refresh as RefreshIcon, FilterList as FilterIcon,
  AttachFile as AttachFileIcon, OpenInNew as OpenIcon
} from '@mui/icons-material';
import { Attendance, AttendanceService, Employee, EmployeeService } from '../../../utils/api';

const STATUS_CONFIG: Record<string, { label: string; color: 'error' | 'warning' | 'info' | 'success' }> = {
  absent: { label: 'Injustificada', color: 'error' },
  justified: { label: 'Justificada', color: 'success' },
  vacation: { label: 'Vacaciones', color: 'info' },
  medical_leave: { label: 'Licencia Médica', color: 'warning' },
};

export default function AttendancePage() {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<Attendance | null>(null);

  // Filters
  const [filterEmployee, setFilterEmployee] = useState<number | ''>('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // Form
  const [form, setForm] = useState({ employee_id: '', date: '', status: 'absent', notes: '' });
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const emps = await EmployeeService.getAll();
      setEmployees(emps);
      await loadAttendances();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const loadAttendances = async () => {
    try {
      const filters: Record<string, string | number> = {};
      if (filterEmployee) filters.employee_id = filterEmployee;
      if (filterDateFrom) filters.date_from = filterDateFrom;
      if (filterDateTo) filters.date_to = filterDateTo;
      
      const data = await AttendanceService.getAll(filters);
      setAttendances(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar presentismo');
    }
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if (!loading) loadAttendances(); }, [filterEmployee, filterDateFrom, filterDateTo]);

  const handleOpenCreate = () => {
    setEditingAttendance(null);
    setForm({ employee_id: '', date: new Date().toISOString().split('T')[0], status: 'absent', notes: '' });
    setFile(null);
    setOpenDialog(true);
  };

  const handleOpenEdit = (att: Attendance) => {
    setEditingAttendance(att);
    setForm({
      employee_id: String(att.employee_id),
      date: att.date,
      status: att.status,
      notes: att.notes || ''
    });
    setFile(null);
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    if (!form.employee_id || !form.date || !form.status) {
      setError('Empleado, fecha y estado son obligatorios');
      return;
    }
    try {
      if (editingAttendance) {
        await AttendanceService.update(editingAttendance.id, {
          status: form.status,
          notes: form.notes,
          file: file || undefined
        });
        setSuccess('Registro actualizado');
      } else {
        await AttendanceService.create({
          employee_id: Number(form.employee_id),
          date: form.date,
          status: form.status,
          notes: form.notes,
          file: file || undefined
        });
        setSuccess('Registro creado');
      }
      setOpenDialog(false);
      loadAttendances();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  const formatDate = (d: string) => {
    return new Date(d + 'T12:00:00').toLocaleDateString('es-AR');
  };

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px"><CircularProgress /></Box>;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Typography variant="h4" fontWeight="bold">Presentismo</Typography>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadAttendances} size="small">Actualizar</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate} size="small">Registrar Ausencia</Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
          <FilterIcon color="action" />
          <TextField label="Empleado" select size="small" value={filterEmployee} onChange={(e) => setFilterEmployee(e.target.value ? Number(e.target.value) : '')}
            sx={{ minWidth: 200 }} SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
            <option value="">Todos</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.lastname}, {e.name}</option>)}
          </TextField>
          <TextField label="Desde" type="date" size="small" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
          <TextField label="Hasta" type="date" size="small" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} InputLabelProps={{ shrink: true }} />
        </Box>
      </Paper>

      {/* Mobile view */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {attendances.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={4}>No hay registros</Typography>
        ) : (
          <Stack spacing={2}>
            {attendances.map((att) => (
              <Paper key={att.id} sx={{ p: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">{att.employee?.lastname}, {att.employee?.name}</Typography>
                    <Typography variant="body2">{formatDate(att.date)}</Typography>
                    <Chip label={STATUS_CONFIG[att.status]?.label || att.status} color={STATUS_CONFIG[att.status]?.color || 'default'} size="small" sx={{ mt: 1, mb: 1 }} />
                    {att.notes && <Typography variant="body2" color="text.secondary">Notas: {att.notes}</Typography>}
                    {att.document_url && (
                      <Link href={att.document_url} target="_blank" rel="noopener noreferrer" variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                        <OpenIcon fontSize="small" /> Ver justificativo
                      </Link>
                    )}
                  </Box>
                  <IconButton size="small" color="primary" onClick={() => handleOpenEdit(att)}><EditIcon fontSize="small" /></IconButton>
                </Box>
              </Paper>
            ))}
          </Stack>
        )}
      </Box>

      {/* Desktop view */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <TableContainer component={Paper} elevation={2}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell><strong>Fecha</strong></TableCell>
                <TableCell><strong>Empleado</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell><strong>Justificativo</strong></TableCell>
                <TableCell><strong>Notas</strong></TableCell>
                <TableCell align="center"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {attendances.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><Typography color="text.secondary">No hay registros</Typography></TableCell></TableRow>
              ) : (
                attendances.map((att) => (
                  <TableRow key={att.id} hover>
                    <TableCell>{formatDate(att.date)}</TableCell>
                    <TableCell><Typography fontWeight="medium">{att.employee?.lastname}, {att.employee?.name}</Typography></TableCell>
                    <TableCell><Chip label={STATUS_CONFIG[att.status]?.label || att.status} color={STATUS_CONFIG[att.status]?.color || 'default'} size="small" /></TableCell>
                    <TableCell>
                      {att.document_url ? (
                        <Tooltip title="Ver documento adjunto">
                          <IconButton component="a" href={att.document_url} target="_blank" rel="noopener noreferrer" size="small" color="info">
                            <OpenIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : '—'}
                    </TableCell>
                    <TableCell>{att.notes || '—'}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Editar"><IconButton size="small" color="primary" onClick={() => handleOpenEdit(att)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingAttendance ? 'Editar Registro' : 'Registrar Ausencia'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Empleado *" select fullWidth value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
              SelectProps={{ native: true }} InputLabelProps={{ shrink: true }} disabled={!!editingAttendance}>
              <option value="">Seleccionar empleado</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.lastname}, {e.name}</option>)}
            </TextField>

            <TextField label="Fecha *" type="date" fullWidth value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
              InputLabelProps={{ shrink: true }} />

            <TextField label="Estado *" select fullWidth value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
              SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
              <option value="absent">Falta Injustificada</option>
              <option value="justified">Falta Justificada</option>
              <option value="medical_leave">Licencia Médica</option>
              <option value="vacation">Vacaciones</option>
            </TextField>

            <TextField label="Notas" fullWidth multiline rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />

            <Box>
              <Typography variant="body2" color="text.secondary" mb={1}>
                {editingAttendance?.document_url ? 'Actualizar justificativo (Opcional)' : 'Adjuntar justificativo (Opcional, foto o PDF)'}
              </Typography>
              <Button variant="outlined" component="label" startIcon={<AttachFileIcon />}>
                Seleccionar Archivo
                <input type="file" hidden accept="image/*,.pdf" ref={fileInputRef} onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </Button>
              {file && <Typography variant="caption" display="block" mt={1}>Archivo seleccionado: {file.name}</Typography>}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">{editingAttendance ? 'Guardar' : 'Registrar'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
