'use client';
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, CircularProgress, TextField, Stack,
  Chip, Checkbox, FormControlLabel, Autocomplete, Dialog, DialogTitle,
  DialogContent, DialogActions, Divider, IconButton, Tooltip,
} from '@mui/material';
import FeedbackModal from '../../../components/FeedbackModal';
import {
  Add as AddIcon, Refresh as RefreshIcon, Block as VoidIcon,
  CheckCircle as ApproveIcon, FilterList as FilterIcon,
} from '@mui/icons-material';
import {
  Employee, EmployeeService, Plant, PlantService,
  TimeEntry, TimeEntryService, CreateTimeEntryData,
} from '../../../utils/api';

const STATUS_COLORS: Record<string, 'success' | 'error' | 'warning' | 'default'> = {
  approved: 'success',
  pending: 'warning',
  voided: 'error',
};
const STATUS_LABELS: Record<string, string> = {
  approved: 'Aprobado',
  pending: 'Pendiente',
  voided: 'Anulado',
};

export default function TimeEntriesPage() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [voidDialog, setVoidDialog] = useState<{ open: boolean; entry: TimeEntry | null }>({ open: false, entry: null });
  const [voidReason, setVoidReason] = useState('');

  // Filters
  const [filterEmployee, setFilterEmployee] = useState<number | ''>('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // Create form
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);
  const [form, setForm] = useState<Omit<CreateTimeEntryData, 'employee_ids'>>({
    date: new Date().toISOString().split('T')[0],
    check_in: '08:00',
    check_out: '17:00',
    overtime_50_hours: 0,
    overtime_100_hours: 0,
    is_late: false,
    notes: '',
  });
  const [inPlant, setInPlant] = useState(false);
  const [selectedPlantId, setSelectedPlantId] = useState<number | ''>('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [emps, plts] = await Promise.all([
        EmployeeService.getAll('active'),
        PlantService.getAll(),
      ]);
      setEmployees(emps);
      setPlants(plts);
      await loadEntries();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const loadEntries = async () => {
    try {
      const filters: Record<string, string | number> = {};
      if (filterEmployee) filters.employee_id = filterEmployee;
      if (filterDateFrom) filters.date_from = filterDateFrom;
      if (filterDateTo) filters.date_to = filterDateTo;
      const data = await TimeEntryService.getAll(filters as never);
      setEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar horas');
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData(); }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (!loading) loadEntries(); }, [filterEmployee, filterDateFrom, filterDateTo]);

  const calculateHours = () => {
    const [inH, inM] = form.check_in.split(':').map(Number);
    const [outH, outM] = form.check_out.split(':').map(Number);
    const hours = (outH * 60 + outM - inH * 60 - inM) / 60;
    return Math.max(0, Math.round(hours * 100) / 100);
  };

  const handleCreate = async () => {
    if (selectedEmployees.length === 0) { setError('Seleccioná al menos un empleado'); return; }
    if (!form.date || !form.check_in || !form.check_out) { setError('Fecha, ingreso y egreso son obligatorios'); return; }
    if (calculateHours() <= 0) { setError('La hora de egreso debe ser mayor al ingreso'); return; }

    try {
      const payload: CreateTimeEntryData = {
        employee_ids: selectedEmployees.map(e => e.id),
        date: form.date,
        check_in: form.check_in,
        check_out: form.check_out,
        overtime_50_hours: form.overtime_50_hours || 0,
        overtime_100_hours: form.overtime_100_hours || 0,
        is_late: form.is_late,
        notes: form.notes,
        plant_id: inPlant && selectedPlantId ? Number(selectedPlantId) : undefined,
      };
      const result = await TimeEntryService.create(payload);
      const createdCount = result.data?.length || 0;
      const errorCount = result.errors?.length || 0;

      let msg = `${createdCount} registro(s) creado(s)`;
      if (errorCount > 0) msg += `. ${errorCount} error(es): ${result.errors.map(e => e.error).join(', ')}`;
      setSuccess(msg);

      setOpenCreateDialog(false);
      setSelectedEmployees([]);
      loadEntries();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear');
    }
  };

  const handleVoid = async () => {
    if (!voidDialog.entry || !voidReason.trim()) { setError('Debe indicar el motivo'); return; }
    try {
      await TimeEntryService.void(voidDialog.entry.id, voidReason);
      setVoidDialog({ open: false, entry: null });
      setVoidReason('');
      setSuccess('Registro anulado');
      loadEntries();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al anular');
    }
  };

  const handleApprove = async (entry: TimeEntry) => {
    try {
      await TimeEntryService.approve(entry.id);
      setSuccess('Registro aprobado');
      loadEntries();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al aprobar');
    }
  };

  // Group entries by date
  const grouped = entries.reduce<Record<string, TimeEntry[]>>((acc, entry) => {
    if (!acc[entry.date]) acc[entry.date] = [];
    acc[entry.date].push(entry);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  if (loading) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px"><CircularProgress /></Box>;
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Typography variant="h4" fontWeight="bold" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>Carga de Horas</Typography>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadEntries} size="small">Actualizar</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenCreateDialog(true)} size="small">Nuevo Registro</Button>
        </Box>
      </Box>

      <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />
      <FeedbackModal open={!!success} onClose={() => setSuccess('')} message={success} type="success" />

      {/* Filters */}
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

      {/* Entries grouped by date */}
      {sortedDates.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">No hay registros de horas para los filtros seleccionados</Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {sortedDates.map((date) => (
            <Paper key={date} sx={{ overflow: 'hidden' }}>
              <Box sx={{ bgcolor: 'primary.main', color: 'white', px: 2, py: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  📅 {new Date(date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </Typography>
              </Box>
              <Box sx={{ p: { xs: 1, md: 2 } }}>
                <Stack spacing={1} divider={<Divider />}>
                  {grouped[date].map((entry) => (
                    <Box key={entry.id} sx={{ p: 1, opacity: entry.status === 'voided' ? 0.5 : 1 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1}>
                        <Box flex={1} minWidth={200}>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {entry.employee?.lastname}, {entry.employee?.name}
                          </Typography>
                          <Typography variant="body2">
                            🕐 {entry.check_in?.substring(0, 5)} → {entry.check_out?.substring(0, 5)} — <strong>{Number(entry.regular_hours).toFixed(1)}h</strong>
                          </Typography>
                          {(Number(entry.overtime_50_hours) > 0 || Number(entry.overtime_100_hours) > 0) && (
                            <Typography variant="body2" color="warning.main">
                              {Number(entry.overtime_50_hours) > 0 && `Extra 50%: ${Number(entry.overtime_50_hours).toFixed(1)}h `}
                              {Number(entry.overtime_100_hours) > 0 && `Extra 100%: ${Number(entry.overtime_100_hours).toFixed(1)}h`}
                            </Typography>
                          )}
                          {entry.plant && <Typography variant="body2">🏭 {entry.plant.name}</Typography>}
                          {entry.is_late && <Chip label="Llegada tarde" size="small" color="warning" sx={{ mt: 0.5, mr: 0.5 }} />}
                          {entry.void_reason && <Typography variant="body2" color="error">Motivo: {entry.void_reason}</Typography>}
                          {entry.notes && <Typography variant="caption" color="text.secondary">{entry.notes}</Typography>}
                        </Box>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <Chip label={STATUS_LABELS[entry.status] || entry.status} color={STATUS_COLORS[entry.status] || 'default'} size="small" />
                          {entry.status === 'pending' && (
                            <Tooltip title="Aprobar">
                              <IconButton size="small" color="success" onClick={() => handleApprove(entry)}><ApproveIcon fontSize="small" /></IconButton>
                            </Tooltip>
                          )}
                          {entry.status !== 'voided' && (
                            <Tooltip title="Anular">
                              <IconButton size="small" color="error" onClick={() => { setVoidDialog({ open: true, entry }); setVoidReason(''); }}><VoidIcon fontSize="small" /></IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Paper>
          ))}
        </Stack>
      )}

      {/* Create Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nuevo Registro de Horas</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Autocomplete
              multiple
              options={employees}
              getOptionLabel={(e) => `${e.lastname}, ${e.name}`}
              value={selectedEmployees}
              onChange={(_, val) => setSelectedEmployees(val)}
              renderInput={(params) => <TextField {...params} label="Trabajadores *" placeholder="Seleccionar..." />}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => {
                  const { key, ...rest } = getTagProps({ index });
                  return <Chip key={key} label={`${option.name} ${option.lastname}`} size="small" {...rest} />;
                })
              }
            />

            <TextField label="Fecha *" type="date" fullWidth value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })} InputLabelProps={{ shrink: true }} />

            <Box display="flex" gap={2}>
              <TextField label="Ingreso *" type="time" fullWidth value={form.check_in}
                onChange={(e) => setForm({ ...form, check_in: e.target.value })} InputLabelProps={{ shrink: true }} />
              <TextField label="Egreso *" type="time" fullWidth value={form.check_out}
                onChange={(e) => setForm({ ...form, check_out: e.target.value })} InputLabelProps={{ shrink: true }} />
            </Box>

            {/* Preview */}
            <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'grey.50' }}>
              <Typography variant="body2" fontWeight="bold">
                Horas simples: {calculateHours().toFixed(1)}h
              </Typography>
            </Paper>

            <FormControlLabel
              control={<Checkbox checked={form.is_late || false} onChange={(e) => setForm({ ...form, is_late: e.target.checked })} />}
              label="Llegada tarde"
            />

            <FormControlLabel
              control={<Checkbox checked={inPlant} onChange={(e) => { setInPlant(e.target.checked); if (!e.target.checked) setSelectedPlantId(''); }} />}
              label="Dentro de planta"
            />
            {inPlant && (
              <TextField label="¿Cuál planta?" select fullWidth value={selectedPlantId}
                onChange={(e) => setSelectedPlantId(e.target.value ? Number(e.target.value) : '')} SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
                <option value="">Seleccionar planta</option>
                {plants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </TextField>
            )}

            <Box display="flex" gap={2}>
              <TextField label="Extras 50%" type="number" fullWidth value={form.overtime_50_hours}
                onChange={(e) => setForm({ ...form, overtime_50_hours: Number(e.target.value) })}
                inputProps={{ min: 0, step: 0.5 }} />
              <TextField label="Extras 100%" type="number" fullWidth value={form.overtime_100_hours}
                onChange={(e) => setForm({ ...form, overtime_100_hours: Number(e.target.value) })}
                inputProps={{ min: 0, step: 0.5 }} />
            </Box>

            <TextField label="Observaciones" fullWidth multiline rows={2} value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancelar</Button>
          <Button onClick={handleCreate} variant="contained">Guardar Registro</Button>
        </DialogActions>
      </Dialog>

      {/* Void Dialog */}
      <Dialog open={voidDialog.open} onClose={() => setVoidDialog({ open: false, entry: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Anular Registro</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Anular el registro de <strong>{voidDialog.entry?.employee?.name} {voidDialog.entry?.employee?.lastname}</strong> del {voidDialog.entry?.date}
          </Typography>
          <TextField label="Motivo de anulación *" fullWidth multiline rows={2} value={voidReason} onChange={(e) => setVoidReason(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVoidDialog({ open: false, entry: null })}>Cancelar</Button>
          <Button onClick={handleVoid} color="error" variant="contained">Anular</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
