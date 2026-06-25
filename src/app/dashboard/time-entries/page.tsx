'use client';
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, CircularProgress, TextField, Stack,
  Chip, Checkbox, FormControlLabel, Autocomplete, Dialog, DialogTitle,
  DialogContent, DialogActions, Divider, IconButton, Tooltip, Switch, Grid
} from '@mui/material';
import dayjs from 'dayjs';
import { TimeField } from '@mui/x-date-pickers/TimeField';
import FeedbackModal from '../../../components/FeedbackModal';
import DateField from '../../../components/DateField';
import {
  Add as AddIcon, Refresh as RefreshIcon, Block as VoidIcon,
  CheckCircle as ApproveIcon, Delete as DeleteIcon
} from '@mui/icons-material';
import {
  Employee, EmployeeService, Plant, PlantService,
  Project, ProjectService,
  TimeEntry, TimeEntryService, CreateTimeEntryData,
  PayrollConcept, PayrollConceptService,
  Vehicle, VehicleService,
  ClientSupervisor, ClientSupervisorService,
  PayPeriod, PayPeriodService
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
  check_in: dayjs.Dayjs | null | string;
  check_out: dayjs.Dayjs | null | string;
  concept_id: number | '';
  overtime_50_hours: number;
  overtime_100_hours: number;
  plant_id: number | '';
  project_id: number | '';
  notes: string;
  is_plant_hours?: boolean;
  generates_oca?: boolean;
  supervisor_id?: number | '';
  vehicle_id?: number | '';
}

export default function TimeEntriesPage() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [concepts, setConcepts] = useState<PayrollConcept[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [payPeriods, setPayPeriods] = useState<PayPeriod[]>([]);
  const [supervisorsCache, setSupervisorsCache] = useState<Record<number, ClientSupervisor[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [voidDialog, setVoidDialog] = useState<{ open: boolean; entry: TimeEntry | null }>({ open: false, entry: null });
  const [voidReason, setVoidReason] = useState('');

  // Filters
  const [filterEmployee, setFilterEmployee] = useState<number | ''>('');
  const [filterPreset, setFilterPreset] = useState('this_fortnight');
  const [showVoided, setShowVoided] = useState(false);
  const [filterDateFrom, setFilterDateFrom] = useState(() => {
    const today = dayjs();
    return today.date() <= 15 
      ? today.startOf('month').format('YYYY-MM-DD')
      : today.date(16).format('YYYY-MM-DD');
  });
  const [filterDateTo, setFilterDateTo] = useState(() => {
    const today = dayjs();
    return today.date() <= 15 
      ? today.date(15).format('YYYY-MM-DD')
      : today.endOf('month').format('YYYY-MM-DD');
  });

  const getPresetDates = (preset: string) => {
    const today = dayjs();
    let from = '';
    let to = '';

    switch (preset) {
      case 'this_fortnight': {
        if (today.date() <= 15) {
          from = today.startOf('month').format('YYYY-MM-DD');
          to = today.date(15).format('YYYY-MM-DD');
        } else {
          from = today.date(16).format('YYYY-MM-DD');
          to = today.endOf('month').format('YYYY-MM-DD');
        }
        break;
      }
      case 'last_fortnight': {
        const lastFortnight = today.date() <= 15 
          ? today.subtract(1, 'month')
          : today;
        
        if (today.date() <= 15) {
          from = lastFortnight.date(16).format('YYYY-MM-DD');
          to = lastFortnight.endOf('month').format('YYYY-MM-DD');
        } else {
          from = today.startOf('month').format('YYYY-MM-DD');
          to = today.date(15).format('YYYY-MM-DD');
        }
        break;
      }
      case 'this_month': {
        from = today.startOf('month').format('YYYY-MM-DD');
        to = today.endOf('month').format('YYYY-MM-DD');
        break;
      }
      case 'last_month': {
        const lastMonth = today.subtract(1, 'month');
        from = lastMonth.startOf('month').format('YYYY-MM-DD');
        to = lastMonth.endOf('month').format('YYYY-MM-DD');
        break;
      }
      case 'all':
      default: {
        from = '';
        to = '';
        break;
      }
    }
    return { from, to };
  };

  const handlePresetChange = (preset: string) => {
    setFilterPreset(preset);
    if (preset !== 'custom') {
      const { from, to } = getPresetDates(preset);
      setFilterDateFrom(from);
      setFilterDateTo(to);
    }
  };

  // Create form state
  const [entryMode, setEntryMode] = useState<'individual' | 'massive'>('individual');
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLate, setIsLate] = useState(false);
  
  // Masivo state
  const [massiveBlock, setMassiveBlock] = useState<TimeBlock>({
    id: 'massive', check_in: dayjs('2026-01-01T08:00'), check_out: dayjs('2026-01-01T17:00'), concept_id: '', overtime_50_hours: 0, overtime_100_hours: 0, plant_id: '', project_id: '', notes: '',
    is_plant_hours: false, generates_oca: false, supervisor_id: '', vehicle_id: ''
  });

  // Individual state
  const [individualBlocks, setIndividualBlocks] = useState<TimeBlock[]>([{
    id: Date.now().toString(), check_in: dayjs('2026-01-01T08:00'), check_out: dayjs('2026-01-01T17:00'), concept_id: '', overtime_50_hours: 0, overtime_100_hours: 0, plant_id: '', project_id: '', notes: '',
    is_plant_hours: false, generates_oca: false, supervisor_id: '', vehicle_id: ''
  }]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [emps, plts, projs, concs, vehs, periods] = await Promise.all([
        EmployeeService.getAll('active'),
        PlantService.getAll(),
        ProjectService.getAll({ status: 'active' }),
        PayrollConceptService.getAll(true), // active only
        VehicleService.getAll({ is_active: true }), // active only
        PayPeriodService.getAll(),
      ]);
      setEmployees(emps);
      setPlants(plts);
      setProjects(projs);
      setConcepts(concs);
      setVehicles(vehs);
      setPayPeriods(periods);
      await loadEntries();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const isPeriodClosedOrPaid = (dateStr: string) => {
    const period = payPeriods.find(p => dateStr >= p.start_date && dateStr <= p.end_date);
    return period ? (period.status === 'closed' || period.status === 'paid') : false;
  };

  const loadSupervisorsForProject = async (projectId: number) => {
    if (supervisorsCache[projectId]) return;
    try {
      const proj = projects.find(p => p.id === projectId);
      if (!proj) return;

      // Get project supervisors
      let sups = await ProjectService.getSupervisors(projectId);

      // Fallback: If no supervisors are assigned to this project, load all client supervisors
      if ((!sups || sups.length === 0) && proj.client_id) {
        sups = await ClientSupervisorService.getAll(proj.client_id);
      }

      setSupervisorsCache(prev => ({ ...prev, [projectId]: sups || [] }));
    } catch (err) {
      console.error('Error loading supervisors for project:', err);
    }
  };

  const handleMassiveProjectChange = async (projId: number | '') => {
    setMassiveBlock(prev => ({
      ...prev,
      project_id: projId,
      supervisor_id: '',
      is_plant_hours: false,
      generates_oca: false,
    }));
    if (projId) {
      await loadSupervisorsForProject(projId);
    }
  };

  const handleMassiveSupervisorChange = (supId: number | '') => {
    setMassiveBlock(prev => ({
      ...prev,
      supervisor_id: supId,
      is_plant_hours: supId ? prev.is_plant_hours : false,
      generates_oca: supId ? prev.generates_oca : false,
    }));
  };

  const handleMassiveConceptChange = (conceptId: number | '') => {
    const isCrane = concepts.find(c => c.id === Number(conceptId))?.is_crane_hours;
    setMassiveBlock(prev => ({
      ...prev,
      concept_id: conceptId,
      vehicle_id: isCrane ? prev.vehicle_id : '',
    }));
  };

  const handleIndividualProjectChange = async (index: number, projId: number | '') => {
    const newBlocks = [...individualBlocks];
    newBlocks[index].project_id = projId;
    newBlocks[index].supervisor_id = '';
    newBlocks[index].is_plant_hours = false;
    newBlocks[index].generates_oca = false;
    setIndividualBlocks(newBlocks);
    if (projId) {
      await loadSupervisorsForProject(projId);
    }
  };

  const handleIndividualSupervisorChange = (index: number, supId: number | '') => {
    const newBlocks = [...individualBlocks];
    newBlocks[index].supervisor_id = supId;
    if (!supId) {
      newBlocks[index].is_plant_hours = false;
      newBlocks[index].generates_oca = false;
    }
    setIndividualBlocks(newBlocks);
  };

  const handleIndividualConceptChange = (index: number, conceptId: number | '') => {
    const newBlocks = [...individualBlocks];
    newBlocks[index].concept_id = conceptId;
    const isCrane = concepts.find(c => c.id === Number(conceptId))?.is_crane_hours;
    if (!isCrane) {
      newBlocks[index].vehicle_id = '';
    }
    setIndividualBlocks(newBlocks);
  };

  const loadEntries = async () => {
    try {
      const filters: Record<string, string | number | boolean> = {};
      if (filterEmployee) filters.employee_id = filterEmployee;
      if (filterDateFrom) filters.date_from = filterDateFrom;
      if (filterDateTo) filters.date_to = filterDateTo;
      if (showVoided) filters.include_voided = true;
      const data = await TimeEntryService.getAll(filters as never);
      setEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar horas');
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData(); }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (!loading) loadEntries(); }, [filterEmployee, filterDateFrom, filterDateTo, showVoided]);

  const formatTime = (timeVal: dayjs.Dayjs | null | string | undefined) => {
    if (!timeVal) return '';
    if (dayjs.isDayjs(timeVal)) {
      return timeVal.isValid() ? timeVal.format('HH:mm') : '';
    }
    return String(timeVal);
  };

  const calculateHours = (inTime: dayjs.Dayjs | null | string | undefined, outTime: dayjs.Dayjs | null | string | undefined) => {
    if (!inTime || !outTime) return 0;
    const tIn = dayjs.isDayjs(inTime) ? inTime : dayjs(`2026-01-01T${inTime}`);
    const tOut = dayjs.isDayjs(outTime) ? outTime : dayjs(`2026-01-01T${outTime}`);
    if (!tIn.isValid() || !tOut.isValid()) return 0;
    const hours = tOut.diff(tIn, 'minute') / 60;
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

      if (entryMode === 'massive' || isMonthlySelected) {
        const formattedIn = formatTime(massiveBlock.check_in);
        const formattedOut = formatTime(massiveBlock.check_out);
        if (!formattedIn || !formattedOut) { setError('Ingreso y egreso obligatorios'); return; }
        
        const concept = concepts.find(c => c.id === Number(massiveBlock.concept_id));
        if (concept?.is_crane_hours && !massiveBlock.vehicle_id) {
          setError('Debe seleccionar la grúa asociada para registrar horas de grúa');
          return;
        }

        payloads.push({
          employee_ids: selectedEmployees.map(e => e.id),
          date: formDate,
          check_in: formattedIn,
          check_out: formattedOut,
          concept_id: massiveBlock.concept_id ? Number(massiveBlock.concept_id) : undefined,
          overtime_50_hours: massiveBlock.overtime_50_hours || 0,
          overtime_100_hours: massiveBlock.overtime_100_hours || 0,
          is_late: isLate,
          notes: massiveBlock.notes,
          plant_id: massiveBlock.plant_id ? Number(massiveBlock.plant_id) : undefined,
          project_id: massiveBlock.project_id ? Number(massiveBlock.project_id) : undefined,
          is_plant_hours: massiveBlock.is_plant_hours || false,
          generates_oca: massiveBlock.generates_oca || false,
          supervisor_id: massiveBlock.supervisor_id ? Number(massiveBlock.supervisor_id) : undefined,
          vehicle_id: massiveBlock.vehicle_id ? Number(massiveBlock.vehicle_id) : undefined,
        });
      } else {
        // Individual blocks (only 1 employee allowed)
        if (selectedEmployees.length !== 1) { setError('El modo bloques es para un solo empleado a la vez'); return; }
        
        for (const block of individualBlocks) {
          const formattedIn = formatTime(block.check_in);
          const formattedOut = formatTime(block.check_out);
          if (!formattedIn || !formattedOut) { setError('Ingreso y egreso obligatorios en todos los bloques'); return; }
          
          const concept = concepts.find(c => c.id === Number(block.concept_id));
          if (concept?.is_crane_hours && !block.vehicle_id) {
            setError('Debe seleccionar la grúa asociada en todos los bloques que registren horas de grúa');
            return;
          }

          payloads.push({
            employee_ids: [selectedEmployees[0].id],
            date: formDate,
            check_in: formattedIn,
            check_out: formattedOut,
            concept_id: block.concept_id ? Number(block.concept_id) : undefined,
            overtime_50_hours: block.overtime_50_hours || 0,
            overtime_100_hours: block.overtime_100_hours || 0,
            is_late: isLate,
            notes: block.notes,
            plant_id: block.plant_id ? Number(block.plant_id) : undefined,
            project_id: block.project_id ? Number(block.project_id) : undefined,
            is_plant_hours: block.is_plant_hours || false,
            generates_oca: block.generates_oca || false,
            supervisor_id: block.supervisor_id ? Number(block.supervisor_id) : undefined,
            vehicle_id: block.vehicle_id ? Number(block.vehicle_id) : undefined,
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
    setMassiveBlock({
      id: 'massive', check_in: dayjs('2026-01-01T08:00'), check_out: dayjs('2026-01-01T17:00'), concept_id: '', overtime_50_hours: 0, overtime_100_hours: 0, plant_id: '', project_id: '', notes: '',
      is_plant_hours: false, generates_oca: false, supervisor_id: '', vehicle_id: ''
    });
    setIndividualBlocks([{
      id: Date.now().toString(), check_in: dayjs('2026-01-01T08:00'), check_out: dayjs('2026-01-01T17:00'), concept_id: '', overtime_50_hours: 0, overtime_100_hours: 0, plant_id: '', project_id: '', notes: '',
      is_plant_hours: false, generates_oca: false, supervisor_id: '', vehicle_id: ''
    }]);
  };

  const addBlock = () => {
    setIndividualBlocks([...individualBlocks, {
      id: Date.now().toString(), check_in: dayjs('2026-01-01T13:00'), check_out: dayjs('2026-01-01T17:00'), concept_id: '', overtime_50_hours: 0, overtime_100_hours: 0, plant_id: '', project_id: '', notes: '',
      is_plant_hours: false, generates_oca: false, supervisor_id: '', vehicle_id: ''
    }]);
  };

  const removeBlock = (id: string) => {
    setIndividualBlocks(individualBlocks.filter(b => b.id !== id));
  };

  const handleVoid = async () => {
    const entryToCopy = voidDialog.entry;
    if (!entryToCopy) return;
    try {
      await TimeEntryService.void(entryToCopy.id, voidReason.trim() || undefined);
      
      // Find the corresponding employee
      let emp = employees.find(e => e.id === entryToCopy.employee_id);
      
      // If the employee is not in the active list (e.g. inactive or recently deleted),
      // temporarily add it so the Autocomplete component works and displays it.
      if (!emp && entryToCopy.employee) {
        emp = entryToCopy.employee as unknown as Employee;
        setEmployees(prev => [...prev, emp!]);
      }
      
      // Preload data into creation form
      setEntryMode('individual');
      setFormDate(entryToCopy.date);
      setIsLate(entryToCopy.is_late || false);
      
      if (emp) {
        setSelectedEmployees([emp]);
      } else {
        setSelectedEmployees([]);
      }
      
      if (entryToCopy.project_id) {
        loadSupervisorsForProject(entryToCopy.project_id);
      }

      setIndividualBlocks([{
        id: Date.now().toString(),
        check_in: entryToCopy.check_in ? dayjs(`2026-01-01T${entryToCopy.check_in}`) : dayjs('2026-01-01T08:00'),
        check_out: entryToCopy.check_out ? dayjs(`2026-01-01T${entryToCopy.check_out}`) : dayjs('2026-01-01T17:00'),
        concept_id: entryToCopy.concept_id ?? '',
        overtime_50_hours: entryToCopy.overtime_50_hours || 0,
        overtime_100_hours: entryToCopy.overtime_100_hours || 0,
        plant_id: entryToCopy.plant_id ?? '',
        project_id: entryToCopy.project_id ?? '',
        notes: entryToCopy.notes || '',
        is_plant_hours: entryToCopy.is_plant_hours || false,
        generates_oca: entryToCopy.generates_oca || false,
        supervisor_id: entryToCopy.supervisor_id ?? '',
        vehicle_id: entryToCopy.vehicle_id ?? ''
      }]);

      setVoidDialog({ open: false, entry: null });
      setVoidReason('');
      setSuccess('Registro anulado. Cargando plantilla para corrección...');
      
      // Open the creation modal pre-filled with this data
      // Delay opening to prevent MUI FocusTrap collision from the closing void dialog
      setTimeout(() => {
        setOpenCreateDialog(true);
      }, 150);
      
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
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: filterPreset === 'custom' ? 3 : 6 }}>
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
          
          <Grid size={{ xs: 12, md: filterPreset === 'custom' ? 3 : 6 }}>
            <TextField
              label="Período"
              select
              size="small"
              fullWidth
              value={filterPreset}
              onChange={(e) => handlePresetChange(e.target.value)}
              SelectProps={{ native: true }}
              InputLabelProps={{ shrink: true }}
            >
              <option value="this_fortnight">Esta Quincena</option>
              <option value="last_fortnight">Quincena Anterior</option>
              <option value="this_month">Este Mes</option>
              <option value="last_month">Mes Anterior</option>
              <option value="all">Ver Todos (Sin filtro de fecha)</option>
              <option value="custom">Rango Personalizado</option>
            </TextField>
          </Grid>

          {filterPreset === 'custom' && (
            <>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <DateField
                  label="Desde"
                  size="small"
                  fullWidth
                  value={filterDateFrom}
                  onChange={(val) => setFilterDateFrom(val)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <DateField
                  label="Hasta"
                  size="small"
                  fullWidth
                  value={filterDateTo}
                  onChange={(val) => setFilterDateTo(val)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </>
          )}

          <Grid size={{ xs: 12 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={showVoided}
                  onChange={(e) => setShowVoided(e.target.checked)}
                  size="small"
                  color="error"
                />
              }
              label={<Typography variant="body2" color={showVoided ? 'error' : 'text.secondary'}>Ver anuladas</Typography>}
            />
          </Grid>
        </Grid>
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
                            {entry.is_plant_hours && (
                              <Chip
                                label={entry.generates_oca ? "PEP OCA" : "PEP Regular"}
                                size="small"
                                color="success"
                                variant="outlined"
                                sx={{ ml: 0.5, height: 20 }}
                              />
                            )}
                            {entry.oca_id && (
                              <Chip 
                                label={`OCA #${entry.oca?.number || entry.oca_id}`} 
                                size="small" 
                                color="secondary" 
                                variant="filled" 
                                sx={{ ml: 0.5, height: 20 }} 
                              />
                            )}
                          </Typography>
                          {entry.employee?.pay_type !== 'monthly' && (
                            <Typography variant="body2">
                              🕐 {entry.check_in?.substring(0, 5)} → {entry.check_out?.substring(0, 5)} — <strong>{Number(entry.regular_hours).toFixed(1)}h</strong>
                            </Typography>
                          )}
                          {(Number(entry.overtime_50_hours) > 0 || Number(entry.overtime_100_hours) > 0) && (
                            <Typography variant="body2" color="warning.main">
                              {Number(entry.overtime_50_hours) > 0 && `Recargo 50%: ${Number(entry.overtime_50_hours).toFixed(1)}h `}
                              {Number(entry.overtime_100_hours) > 0 && `Recargo 100%: ${Number(entry.overtime_100_hours).toFixed(1)}h`}
                            </Typography>
                          )}
                          {entry.project && <Typography variant="body2">📁 Proyecto: {entry.project.code} - {entry.project.name}</Typography>}
                          {entry.plant && <Typography variant="body2">🏭 Planta: {entry.plant.name}</Typography>}
                          {entry.supervisor && (
                            <Typography variant="body2" color="text.secondary">
                              👤 Supervisor: {entry.supervisor.lastname}, {entry.supervisor.name}
                            </Typography>
                          )}
                          {entry.vehicle && (
                            <Typography variant="body2" color="text.secondary">
                              🏗️ Grúa: {entry.vehicle.brand} {entry.vehicle.model} ({entry.vehicle.plate})
                            </Typography>
                          )}
                          {entry.is_late && <Chip label="Llegada tarde" size="small" color="warning" sx={{ mt: 0.5, mr: 0.5 }} />}
                          {entry.void_reason && <Typography variant="body2" color="error">Motivo: {entry.void_reason}</Typography>}
                          {entry.notes && <Typography variant="caption" color="text.secondary">{entry.notes}</Typography>}
                        </Box>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <Chip label={STATUS_LABELS[entry.status] || entry.status} color={STATUS_COLORS[entry.status] || 'default'} size="small" />
                          {entry.status === 'pending' &&  (
                            <Tooltip title="Aprobar">
                              <IconButton size="small" color="success" onClick={() => handleApprove(entry)}><ApproveIcon fontSize="small" /></IconButton>
                            </Tooltip>
                          )}
                          {entry.status !== 'voided' && (
                            <Tooltip title={entry.oca_id ? "Asignado a OCA (No se puede anular)" : isPeriodClosedOrPaid(entry.date) ? "Quincena cerrada o pagada (No se puede anular)" : "Anular"}>
                              <span>
                                <IconButton 
                                  size="small" 
                                  color="error" 
                                  disabled={!!entry.oca_id || isPeriodClosedOrPaid(entry.date)}
                                  onClick={() => { setVoidDialog({ open: true, entry }); setVoidReason(''); }}
                                >
                                  <VoidIcon fontSize="small" />
                                </IconButton>
                              </span>
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
                    <TimeField
                      label="Ingreso *"
                      ampm={false}
                      value={massiveBlock.check_in ? (dayjs.isDayjs(massiveBlock.check_in) ? massiveBlock.check_in : dayjs(`2026-01-01T${massiveBlock.check_in}`)) : null}
                      onChange={(val) => {
                        setMassiveBlock({ ...massiveBlock, check_in: val });
                      }}
                      fullWidth
                      disabled={isMonthlySelected}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TimeField
                      label="Egreso *"
                      ampm={false}
                      value={massiveBlock.check_out ? (dayjs.isDayjs(massiveBlock.check_out) ? massiveBlock.check_out : dayjs(`2026-01-01T${massiveBlock.check_out}`)) : null}
                      onChange={(val) => {
                        setMassiveBlock({ ...massiveBlock, check_out: val });
                      }}
                      fullWidth
                      disabled={isMonthlySelected}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField label="Concepto (Opcional)" select fullWidth value={massiveBlock.concept_id}
                      onChange={(e) => handleMassiveConceptChange(e.target.value ? Number(e.target.value) : '')} 
                      SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}
                      disabled={isMonthlySelected}>
                      <option value="">— General —</option>
                      {concepts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField label="Recargo 50%" type="number" fullWidth value={massiveBlock.overtime_50_hours}
                      onChange={(e) => setMassiveBlock({ ...massiveBlock, overtime_50_hours: Number(e.target.value) })}
                      inputProps={{ min: 0, step: 0.5 }} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField label="Recargo 100%" type="number" fullWidth value={massiveBlock.overtime_100_hours}
                      onChange={(e) => setMassiveBlock({ ...massiveBlock, overtime_100_hours: Number(e.target.value) })}
                      inputProps={{ min: 0, step: 0.5 }} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField label="Planta" select fullWidth value={massiveBlock.plant_id}
                      onChange={(e) => setMassiveBlock({ ...massiveBlock, plant_id: e.target.value ? Number(e.target.value) : '', project_id: '' })} 
                      SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
                      <option value="">— Ninguna —</option>
                      {plants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField label="Proyecto" select fullWidth value={massiveBlock.project_id}
                      onChange={(e) => handleMassiveProjectChange(e.target.value ? Number(e.target.value) : '')} 
                      SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
                      <option value="">— Ninguno —</option>
                      {projects
                        .filter(p => !massiveBlock.plant_id || p.plant_id === massiveBlock.plant_id)
                        .map(p => <option key={p.id} value={p.id}>{p.code} - {p.name}</option>)}
                    </TextField>
                  </Grid>
                  {massiveBlock.project_id && (
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        label="Supervisor de Cliente"
                        select
                        fullWidth
                        value={massiveBlock.supervisor_id}
                        onChange={(e) => handleMassiveSupervisorChange(e.target.value ? Number(e.target.value) : '')}
                        SelectProps={{ native: true }}
                        InputLabelProps={{ shrink: true }}
                      >
                        <option value="">— Ninguno —</option>
                        {(supervisorsCache[Number(massiveBlock.project_id)] || []).map(s => (
                          <option key={s.id} value={s.id}>{s.lastname}, {s.name}</option>
                        ))}
                      </TextField>
                    </Grid>
                  )}
                  {massiveBlock.project_id && (
                    <Grid size={{ xs: 12, md: 6 }} display="flex" gap={2} alignItems="center">
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={!!massiveBlock.is_plant_hours && !!massiveBlock.generates_oca}
                            disabled={!massiveBlock.supervisor_id}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setMassiveBlock({
                                ...massiveBlock,
                                is_plant_hours: checked,
                                generates_oca: checked ? true : false
                              });
                            }}
                          />
                        }
                        label="PEP OCA (genera remito)"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={!!massiveBlock.is_plant_hours && !massiveBlock.generates_oca}
                            disabled={!massiveBlock.supervisor_id}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setMassiveBlock({
                                ...massiveBlock,
                                is_plant_hours: checked,
                                generates_oca: false
                              });
                            }}
                          />
                        }
                        label="PEP Regular (no genera remito)"
                      />
                    </Grid>
                  )}
                  {concepts.find(c => c.id === Number(massiveBlock.concept_id))?.is_crane_hours && (
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        label="Grúa / Vehículo *"
                        select
                        required
                        fullWidth
                        value={massiveBlock.vehicle_id}
                        onChange={(e) => setMassiveBlock({ ...massiveBlock, vehicle_id: e.target.value ? Number(e.target.value) : '' })}
                        SelectProps={{ native: true }}
                        InputLabelProps={{ shrink: true }}
                      >
                        <option value="">— Seleccionar Vehículo —</option>
                        {vehicles.map(v => (
                          <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.plate})</option>
                        ))}
                      </TextField>
                    </Grid>
                  )}
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
                          <TimeField
                            label="Ingreso *"
                            ampm={false}
                            value={block.check_in ? (dayjs.isDayjs(block.check_in) ? block.check_in : dayjs(`2026-01-01T${block.check_in}`)) : null}
                            onChange={(val) => {
                              const newBlocks = [...individualBlocks];
                              newBlocks[index].check_in = val;
                              setIndividualBlocks(newBlocks);
                            }}
                            fullWidth
                            size="small"
                          />
                        </Grid>
                        <Grid size={{ xs: 6, md: 2 }}>
                          <TimeField
                            label="Egreso *"
                            ampm={false}
                            value={block.check_out ? (dayjs.isDayjs(block.check_out) ? block.check_out : dayjs(`2026-01-01T${block.check_out}`)) : null}
                            onChange={(val) => {
                              const newBlocks = [...individualBlocks];
                              newBlocks[index].check_out = val;
                              setIndividualBlocks(newBlocks);
                            }}
                            fullWidth
                            size="small"
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <TextField label="Concepto" select fullWidth value={block.concept_id}
                            onChange={(e) => handleIndividualConceptChange(index, e.target.value ? Number(e.target.value) : '')} 
                            SelectProps={{ native: true }} InputLabelProps={{ shrink: true }} size="small">
                            <option value="">— General —</option>
                            {concepts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </TextField>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <TextField label="Planta" select fullWidth value={block.plant_id}
                            onChange={(e) => {
                              const newBlocks = [...individualBlocks];
                              newBlocks[index].plant_id = e.target.value ? Number(e.target.value) : '';
                              newBlocks[index].project_id = ''; // Reset project when plant changes
                              newBlocks[index].supervisor_id = '';
                              newBlocks[index].is_plant_hours = false;
                              setIndividualBlocks(newBlocks);
                            }} SelectProps={{ native: true }} InputLabelProps={{ shrink: true }} size="small">
                            <option value="">— Ninguna —</option>
                            {plants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </TextField>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <TextField label="Proyecto" select fullWidth value={block.project_id}
                            onChange={(e) => handleIndividualProjectChange(index, e.target.value ? Number(e.target.value) : '')} 
                            SelectProps={{ native: true }} InputLabelProps={{ shrink: true }} size="small">
                            <option value="">— Ninguno —</option>
                            {projects
                              .filter(p => !block.plant_id || p.plant_id === block.plant_id)
                              .map(p => <option key={p.id} value={p.id}>{p.code} - {p.name}</option>)}
                          </TextField>
                        </Grid>
                        {block.project_id && (
                          <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                              label="Supervisor de Cliente"
                              select
                              fullWidth
                              value={block.supervisor_id}
                              onChange={(e) => handleIndividualSupervisorChange(index, e.target.value ? Number(e.target.value) : '')}
                              SelectProps={{ native: true }}
                              InputLabelProps={{ shrink: true }}
                              size="small"
                            >
                              <option value="">— Ninguno —</option>
                              {(supervisorsCache[Number(block.project_id)] || []).map(s => (
                                <option key={s.id} value={s.id}>{s.lastname}, {s.name}</option>
                              ))}
                            </TextField>
                          </Grid>
                        )}
                        {block.project_id && (
                          <Grid size={{ xs: 12, md: 4 }} display="flex" gap={1} alignItems="center">
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={!!block.is_plant_hours && !!block.generates_oca}
                                  disabled={!block.supervisor_id}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    const newBlocks = [...individualBlocks];
                                    newBlocks[index].is_plant_hours = checked;
                                    newBlocks[index].generates_oca = checked ? true : false;
                                    setIndividualBlocks(newBlocks);
                                  }}
                                />
                              }
                              label="PEP OCA"
                            />
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={!!block.is_plant_hours && !block.generates_oca}
                                  disabled={!block.supervisor_id}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    const newBlocks = [...individualBlocks];
                                    newBlocks[index].is_plant_hours = checked;
                                    newBlocks[index].generates_oca = false;
                                    setIndividualBlocks(newBlocks);
                                  }}
                                />
                              }
                              label="PEP Reg."
                            />
                          </Grid>
                        )}
                        {concepts.find(c => c.id === Number(block.concept_id))?.is_crane_hours && (
                          <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                              label="Grúa / Vehículo *"
                              select
                              required
                              fullWidth
                              value={block.vehicle_id}
                              onChange={(e) => {
                                const newBlocks = [...individualBlocks];
                                newBlocks[index].vehicle_id = e.target.value ? Number(e.target.value) : '';
                                setIndividualBlocks(newBlocks);
                              }}
                              SelectProps={{ native: true }}
                              InputLabelProps={{ shrink: true }}
                              size="small"
                            >
                              <option value="">— Seleccionar Vehículo —</option>
                              {vehicles.map(v => (
                                <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.plate})</option>
                              ))}
                            </TextField>
                          </Grid>
                        )}
                        <Grid size={{ xs: 6, md: 2 }}>
                          <TextField label="Rec 50%" type="number" fullWidth value={block.overtime_50_hours}
                            onChange={(e) => {
                              const newBlocks = [...individualBlocks];
                              newBlocks[index].overtime_50_hours = Number(e.target.value);
                              setIndividualBlocks(newBlocks);
                            }} inputProps={{ min: 0, step: 0.5 }} size="small" />
                        </Grid>
                        <Grid size={{ xs: 6, md: 2 }}>
                          <TextField label="Rec 100%" type="number" fullWidth value={block.overtime_100_hours}
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
      <Dialog open={voidDialog.open} onClose={() => setVoidDialog({ open: false, entry: null })} disableRestoreFocus maxWidth="sm" fullWidth>
        <DialogTitle>Anular Registro</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Anular el registro de <strong>{voidDialog.entry?.employee?.name} {voidDialog.entry?.employee?.lastname}</strong> del {voidDialog.entry?.date}
          </Typography>
          <TextField label="Motivo de anulación (Opcional)" fullWidth multiline rows={2} value={voidReason} onChange={(e) => setVoidReason(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVoidDialog({ open: false, entry: null })}>Cancelar</Button>
          <Button onClick={handleVoid} color="error" variant="contained">Anular</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
