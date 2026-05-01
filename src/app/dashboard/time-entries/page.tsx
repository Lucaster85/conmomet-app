'use client';
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, CircularProgress, TextField, Stack,
  Chip, Checkbox, FormControlLabel, Autocomplete, Dialog, DialogTitle,
  DialogContent, DialogActions, Divider, IconButton, Tooltip, Switch, Grid
} from '@mui/material';
import FeedbackModal from '../../../components/FeedbackModal';
import DateField from '../../../components/DateField';
import {
  Add as AddIcon, Refresh as RefreshIcon, Block as VoidIcon,
  CheckCircle as ApproveIcon, FilterList as FilterIcon, Delete as DeleteIcon
} from '@mui/icons-material';
import {
  Employee, EmployeeService, Plant, PlantService,
  TimeEntry, TimeEntryService, CreateTimeEntryData,
  PayrollConcept, PayrollConceptService
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

// Types for block creation
interface TimeBlock {
  id: string;
  check_in: string;
  check_out: string;
  concept_id: number | '';
  overtime_50_hours: number;
  overtime_100_hours: number;
  plant_id: number | '';
  notes: string;
}

export default function TimeEntriesPage() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [concepts, setConcepts] = useState<PayrollConcept[]>([]);
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

  // Create form state
  const [entryMode, setEntryMode] = useState<'individual' | 'massive'>('individual');
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLate, setIsLate] = useState(false);
  
  // Masivo state
  const [massiveBlock, setMassiveBlock] = useState<TimeBlock>({
    id: 'massive', check_in: '08:00', check_out: '17:00', concept_id: '', overtime_50_hours: 0, overtime_100_hours: 0, plant_id: '', notes: ''
  });

  // Individual state
  const [individualBlocks, setIndividualBlocks] = useState<TimeBlock[]>([{
    id: Date.now().toString(), check_in: '08:00', check_out: '17:00', concept_id: '', overtime_50_hours: 0, overtime_100_hours: 0, plant_id: '', notes: ''
  }]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [emps, plts, concs] = await Promise.all([
        EmployeeService.getAll('active'),
        PlantService.getAll(),
        PayrollConceptService.getAll(true), // active only
      ]);
      setEmployees(emps);
      setPlants(plts);
      setConcepts(concs);
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

  const calculateHours = (inTime: string, outTime: string) => {
    if (!inTime || !outTime) return 0;
    const [inH, inM] = inTime.split(':').map(Number);
    const [outH, outM] = outTime.split(':').map(Number);
    const hours = (outH * 60 + outM - inH * 60 - inM) / 60;
    return Math.max(0, Math.round(hours * 100) / 100);
  };

  const handleCreate = async () => {
    if (selectedEmployees.length === 0) { setError('Seleccioná al menos un empleado'); return; }
    if (!formDate) { setError('Fecha obligatoria'); return; }

    const isMonthly = selectedEmployees[0]?.pay_type === 'monthly';
    if (entryMode === 'massive' && isMonthly && selectedEmployees.length > 1) {
      // Validate that all selected are monthly, or warn
      const allMonthly = selectedEmployees.every(e => e.pay_type === 'monthly');
      if (!allMonthly) {
        setError('No podés mezclar mensualizados y jornalizados en carga masiva');
        return;
      }
    }

    try {
      // Build payloads depending on mode
      const payloads: CreateTimeEntryData[] = [];

      if (entryMode === 'massive') {
        if (!massiveBlock.check_in || !massiveBlock.check_out) { setError('Ingreso y egreso obligatorios en carga masiva'); return; }
        
        payloads.push({
          employee_ids: selectedEmployees.map(e => e.id),
          date: formDate,
          check_in: massiveBlock.check_in,
          check_out: massiveBlock.check_out,
          concept_id: massiveBlock.concept_id ? Number(massiveBlock.concept_id) : undefined,
          overtime_50_hours: massiveBlock.overtime_50_hours || 0,
          overtime_100_hours: massiveBlock.overtime_100_hours || 0,
          is_late: isLate,
          notes: massiveBlock.notes,
          plant_id: massiveBlock.plant_id ? Number(massiveBlock.plant_id) : undefined,
        });
      } else {
        // Individual blocks (only 1 employee allowed)
        if (selectedEmployees.length !== 1) { setError('El modo bloques es para un solo empleado a la vez'); return; }
        
        for (const block of individualBlocks) {
          if (!block.check_in || !block.check_out) { setError('Ingreso y egreso obligatorios en todos los bloques'); return; }
          payloads.push({
            employee_ids: [selectedEmployees[0].id],
            date: formDate,
            check_in: block.check_in,
            check_out: block.check_out,
            concept_id: block.concept_id ? Number(block.concept_id) : undefined,
            overtime_50_hours: block.overtime_50_hours || 0,
            overtime_100_hours: block.overtime_100_hours || 0,
            is_late: isLate,
            notes: block.notes,
            plant_id: block.plant_id ? Number(block.plant_id) : undefined,
          });
        }
      }

      // Execute sequentially
      let totalCreated = 0;
      let totalErrors = 0;
      const errorMsgs: string[] = [];

      for (const payload of payloads) {
        const result = await TimeEntryService.create(payload);
        totalCreated += result.data?.length || 0;
        if (result.errors?.length) {
          totalErrors += result.errors.length;
          errorMsgs.push(...result.errors.map((e: { error: string }) => e.error));
        }
      }

      let msg = `${totalCreated} registro(s) creado(s)`;
      if (totalErrors > 0) msg += `. ${totalErrors} error(es): ${errorMsgs.join(', ')}`;
      setSuccess(msg);

      setOpenCreateDialog(false);
      resetForm();
      loadEntries();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear');
    }
  };

  const resetForm = () => {
    setSelectedEmployees([]);
    setFormDate(new Date().toISOString().split('T')[0]);
    setIsLate(false);
    setMassiveBlock({ id: 'massive', check_in: '08:00', check_out: '17:00', concept_id: '', overtime_50_hours: 0, overtime_100_hours: 0, plant_id: '', notes: '' });
    setIndividualBlocks([{ id: Date.now().toString(), check_in: '08:00', check_out: '17:00', concept_id: '', overtime_50_hours: 0, overtime_100_hours: 0, plant_id: '', notes: '' }]);
  };

  const addBlock = () => {
    setIndividualBlocks([...individualBlocks, { id: Date.now().toString(), check_in: '13:00', check_out: '17:00', concept_id: '', overtime_50_hours: 0, overtime_100_hours: 0, plant_id: '', notes: '' }]);
  };

  const removeBlock = (id: string) => {
    setIndividualBlocks(individualBlocks.filter(b => b.id !== id));
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

  const isMonthlySelected = selectedEmployees.length === 1 && selectedEmployees[0].pay_type === 'monthly';

  if (loading) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px"><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Typography variant="h4" fontWeight="bold" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>Carga de Horas</Typography>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadEntries} size="small">Actualizar</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { resetForm(); setOpenCreateDialog(true); }} size="small">Nuevo Registro</Button>
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
          <DateField label="Desde" size="small" value={filterDateFrom} onChange={(val) => setFilterDateFrom(val)} InputLabelProps={{ shrink: true }} />
          <DateField label="Hasta" size="small" value={filterDateTo} onChange={(val) => setFilterDateTo(val)} InputLabelProps={{ shrink: true }} />
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
                            {entry.concept && <Chip label={entry.concept.name} size="small" color="primary" variant="outlined" sx={{ ml: 1, height: 20 }} />}
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
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Nuevo Registro de Horas</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* Header info */}
            <Box display="flex" gap={2} flexWrap="wrap">
              <Box flex={1} minWidth={250}>
                <Autocomplete
                  multiple
                  options={employees}
                  getOptionLabel={(e) => `${e.lastname}, ${e.name} ${e.pay_type === 'monthly' ? '(Mensualizado)' : ''}`}
                  value={selectedEmployees}
                  onChange={(_, val) => {
                    setSelectedEmployees(val);
                    if (val.length > 1) setEntryMode('massive');
                  }}
                  renderInput={(params) => <TextField {...params} label="Trabajadores *" placeholder="Seleccionar..." />}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => {
                      const { key, ...rest } = getTagProps({ index });
                      return <Chip key={key} label={`${option.name} ${option.lastname}`} size="small" color={option.pay_type === 'monthly' ? 'secondary' : 'default'} {...rest} />;
                    })
                  }
                />
              </Box>
              <DateField label="Fecha *" value={formDate}
                onChange={(val) => setFormDate(val)} InputLabelProps={{ shrink: true }} sx={{ minWidth: 150 }} />
            </Box>

            {/* Mode Switch */}
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <FormControlLabel
                control={
                  <Switch 
                    checked={entryMode === 'massive'} 
                    onChange={(e) => setEntryMode(e.target.checked ? 'massive' : 'individual')} 
                    disabled={selectedEmployees.length > 1}
                  />
                }
                label={entryMode === 'massive' ? 'Carga Masiva / Único Bloque' : 'Carga Individual / Multi-bloque'}
              />
              <FormControlLabel
                control={<Checkbox checked={isLate} onChange={(e) => setIsLate(e.target.checked)} />}
                label="Llegada tarde (General)"
              />
            </Box>

            <Divider />

            {/* Block Input UI */}
            {entryMode === 'massive' || isMonthlySelected ? (
              // MASSIVE OR MONTHLY MODE (Single Block)
              <Box>
                {isMonthlySelected ? (
                  <Typography variant="subtitle2" color="secondary" gutterBottom>
                    Modo Mensualizado: Solo carga de horas extras.
                  </Typography>
                ) : null}
                <Grid container spacing={2} alignItems="center">
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField label="Ingreso *" type="time" fullWidth value={massiveBlock.check_in}
                      onChange={(e) => setMassiveBlock({ ...massiveBlock, check_in: e.target.value })} InputLabelProps={{ shrink: true }} 
                      disabled={isMonthlySelected} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField label="Egreso *" type="time" fullWidth value={massiveBlock.check_out}
                      onChange={(e) => setMassiveBlock({ ...massiveBlock, check_out: e.target.value })} InputLabelProps={{ shrink: true }} 
                      disabled={isMonthlySelected} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField label="Concepto (Opcional)" select fullWidth value={massiveBlock.concept_id}
                      onChange={(e) => setMassiveBlock({ ...massiveBlock, concept_id: e.target.value ? Number(e.target.value) : '' })} 
                      SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}
                      disabled={isMonthlySelected}>
                      <option value="">— General —</option>
                      {concepts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField label="Extras 50%" type="number" fullWidth value={massiveBlock.overtime_50_hours}
                      onChange={(e) => setMassiveBlock({ ...massiveBlock, overtime_50_hours: Number(e.target.value) })}
                      inputProps={{ min: 0, step: 0.5 }} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField label="Extras 100%" type="number" fullWidth value={massiveBlock.overtime_100_hours}
                      onChange={(e) => setMassiveBlock({ ...massiveBlock, overtime_100_hours: Number(e.target.value) })}
                      inputProps={{ min: 0, step: 0.5 }} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField label="Planta" select fullWidth value={massiveBlock.plant_id}
                      onChange={(e) => setMassiveBlock({ ...massiveBlock, plant_id: e.target.value ? Number(e.target.value) : '' })} 
                      SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
                      <option value="">— Ninguna —</option>
                      {plants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField label="Observaciones" fullWidth value={massiveBlock.notes}
                      onChange={(e) => setMassiveBlock({ ...massiveBlock, notes: e.target.value })} size="small" />
                  </Grid>
                </Grid>
              </Box>
            ) : (
              // INDIVIDUAL MODE (Multi-block)
              <Box>
                <Typography variant="subtitle2" gutterBottom>Bloques de Horas para {selectedEmployees[0]?.name} {selectedEmployees[0]?.lastname}</Typography>
                <Stack spacing={2}>
                  {individualBlocks.map((block, index) => (
                    <Paper key={block.id} variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="subtitle2">Bloque {index + 1} — {calculateHours(block.check_in, block.check_out)}hs</Typography>
                        {individualBlocks.length > 1 && (
                          <IconButton size="small" color="error" onClick={() => removeBlock(block.id)}><DeleteIcon fontSize="small" /></IconButton>
                        )}
                      </Box>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 6, md: 2 }}>
                          <TextField label="Ingreso *" type="time" fullWidth value={block.check_in}
                            onChange={(e) => {
                              const newBlocks = [...individualBlocks];
                              newBlocks[index].check_in = e.target.value;
                              setIndividualBlocks(newBlocks);
                            }} InputLabelProps={{ shrink: true }} size="small" />
                        </Grid>
                        <Grid size={{ xs: 6, md: 2 }}>
                          <TextField label="Egreso *" type="time" fullWidth value={block.check_out}
                            onChange={(e) => {
                              const newBlocks = [...individualBlocks];
                              newBlocks[index].check_out = e.target.value;
                              setIndividualBlocks(newBlocks);
                            }} InputLabelProps={{ shrink: true }} size="small" />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <TextField label="Concepto" select fullWidth value={block.concept_id}
                            onChange={(e) => {
                              const newBlocks = [...individualBlocks];
                              newBlocks[index].concept_id = e.target.value ? Number(e.target.value) : '';
                              setIndividualBlocks(newBlocks);
                            }} SelectProps={{ native: true }} InputLabelProps={{ shrink: true }} size="small">
                            <option value="">— General —</option>
                            {concepts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </TextField>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <TextField label="Planta" select fullWidth value={block.plant_id}
                            onChange={(e) => {
                              const newBlocks = [...individualBlocks];
                              newBlocks[index].plant_id = e.target.value ? Number(e.target.value) : '';
                              setIndividualBlocks(newBlocks);
                            }} SelectProps={{ native: true }} InputLabelProps={{ shrink: true }} size="small">
                            <option value="">— Ninguna —</option>
                            {plants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </TextField>
                        </Grid>
                        <Grid size={{ xs: 6, md: 2 }}>
                          <TextField label="Ext 50%" type="number" fullWidth value={block.overtime_50_hours}
                            onChange={(e) => {
                              const newBlocks = [...individualBlocks];
                              newBlocks[index].overtime_50_hours = Number(e.target.value);
                              setIndividualBlocks(newBlocks);
                            }} inputProps={{ min: 0, step: 0.5 }} size="small" />
                        </Grid>
                        <Grid size={{ xs: 6, md: 2 }}>
                          <TextField label="Ext 100%" type="number" fullWidth value={block.overtime_100_hours}
                            onChange={(e) => {
                              const newBlocks = [...individualBlocks];
                              newBlocks[index].overtime_100_hours = Number(e.target.value);
                              setIndividualBlocks(newBlocks);
                            }} inputProps={{ min: 0, step: 0.5 }} size="small" />
                        </Grid>
                        <Grid size={{ xs: 12, md: 8 }}>
                          <TextField label="Observaciones" fullWidth value={block.notes}
                            onChange={(e) => {
                              const newBlocks = [...individualBlocks];
                              newBlocks[index].notes = e.target.value;
                              setIndividualBlocks(newBlocks);
                            }} size="small" />
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                  <Button variant="outlined" startIcon={<AddIcon />} onClick={addBlock} sx={{ alignSelf: 'flex-start' }}>
                    Añadir otro bloque de horas
                  </Button>
                </Stack>
              </Box>
            )}

            {/* Total Preview */}
            {entryMode === 'individual' && !isMonthlySelected && (
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'primary.50' }}>
                <Typography variant="body1" fontWeight="bold">
                  Total de horas a registrar: {individualBlocks.reduce((acc, b) => acc + calculateHours(b.check_in, b.check_out), 0).toFixed(1)}h
                </Typography>
              </Paper>
            )}

          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancelar</Button>
          <Button onClick={handleCreate} variant="contained" size="large">Guardar Registro</Button>
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
