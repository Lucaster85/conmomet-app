'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Tooltip,
  TextField,
  Stack,
  Grid,
  Divider,
  Chip,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Alert,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Print as PrintIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Send as PresentIcon,
  Autorenew as CorrectIcon,
  Delete as RemoveIcon,
  CloudUpload as UploadIcon,
  HelpOutline as HelpIcon,
  ChevronRight as ChevronRightIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import {
  Oca,
  OcaService,
  TimeEntry,
  Client,
  ClientService,
  Employee,
  EmployeeService,
  Vehicle,
  VehicleService,
  OcaLine,
  Project,
  ProjectService,
} from '../../../utils/api';
import FeedbackModal from '../../../components/FeedbackModal';

const STATUS_COLORS: Record<Oca['status'], 'warning' | 'info' | 'success' | 'error' | 'default'> = {
  pendiente: 'warning',
  presentado: 'info',
  aprobado: 'success',
  rechazado: 'error',
  anulado: 'default',
};

const STATUS_LABELS: Record<Oca['status'], string> = {
  pendiente: 'Pendiente',
  presentado: 'Presentado',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
  anulado: 'Anulado',
};

export default function OcasPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Tab State: 0 = Horas Hombre (man_hours), 1 = Horas Grúa (crane_hours)
  const [tabValue, setTabValue] = useState(0);
  const typeKey: Oca['type'] = tabValue === 0 ? 'man_hours' : 'crane_hours';

  const [ocas, setOcas] = useState<Oca[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters State
  const [filterClient, setFilterClient] = useState<number | ''>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Creation State
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [createClientId, setCreateClientId] = useState<number | ''>('');
  const [filterSupervisorId, setFilterSupervisorId] = useState<number | ''>('');
  const [pendingEntries, setPendingEntries] = useState<TimeEntry[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [selectedEntryIds, setSelectedEntryIds] = useState<number[]>([]);
  const [notes, setNotes] = useState('');

  // Dialog Action States
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; ocaId: number | null }>({ open: false, ocaId: null });
  const [rejectionReason, setRejectionReason] = useState('');
  const [approveDialog, setApproveDialog] = useState<{ open: boolean; ocaId: number | null }>({ open: false, ocaId: null });
  const [signedFile, setSignedFile] = useState<File | null>(null);

  // Expanded Accordion state
  const [expandedOcaId, setExpandedOcaId] = useState<number | null>(null);

  // Line modification state
  const [modifiedLines, setModifiedLines] = useState<Record<number, string>>({}); // lineId -> task description
  const [savingLines, setSavingLines] = useState(false);

  // Add more entries to existing pending OCA dialog state
  const [openAddEntriesDialog, setOpenAddEntriesDialog] = useState(false);
  const [addEntriesOca, setAddEntriesOca] = useState<Oca | null>(null);

  // Print State
  const [printOca, setPrintOca] = useState<Oca | null>(null);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  // Manual Line Dialog State
  const [openManualLineDialog, setOpenManualLineDialog] = useState(false);
  const [manualLineOca, setManualLineOca] = useState<Oca | null>(null);
  const [manualEmployeeId, setManualEmployeeId] = useState<number | ''>('');
  const [manualVehicleId, setManualVehicleId] = useState<number | ''>('');
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualCheckIn, setManualCheckIn] = useState('08:00');
  const [manualCheckOut, setManualCheckOut] = useState('17:00');
  const [manualRegularHours, setManualRegularHours] = useState<number>(9);
  const [manualOvertime50, setManualOvertime50] = useState<number>(0);
  const [manualOvertime100, setManualOvertime100] = useState<number>(0);
  const [manualTask, setManualTask] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [manualProjectId, setManualProjectId] = useState<number | ''>('');
  const [supervisorProjects, setSupervisorProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (manualCheckIn && manualCheckOut) {
      const [inH, inM] = manualCheckIn.split(':').map(Number);
      const [outH, outM] = manualCheckOut.split(':').map(Number);
      const diff = (outH * 60 + outM) - (inH * 60 + inM);
      if (diff > 0) {
        setManualRegularHours(Math.round((diff / 60) * 100) / 100);
      } else {
        setManualRegularHours(0);
      }
    }
  }, [manualCheckIn, manualCheckOut]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [clis, list, emps, vehs] = await Promise.all([
        ClientService.getAll(),
        OcaService.getAll({ type: typeKey }),
        EmployeeService.getAll('active'),
        VehicleService.getAll({ is_active: true }),
      ]);
      setClients(clis);
      setOcas(list);
      setEmployees(emps);
      setVehicles(vehs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los remitos / OCAs');
    } finally {
      setLoading(false);
    }
  }, [typeKey]);

  useEffect(() => {
    loadData();
    setExpandedOcaId(null);
    setModifiedLines({});
  }, [loadData]);

  // Load pending time entries for OCA generation
  const handleClientChangeForCreate = async (clientId: number | '') => {
    setCreateClientId(clientId);
    setSelectedEntryIds([]);
    setFilterSupervisorId('');
    if (!clientId) {
      setPendingEntries([]);
      return;
    }

    try {
      setLoadingPending(true);
      setError('');
      const data = await OcaService.getPendingEntries(clientId, typeKey);
      setPendingEntries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar horas pendientes');
      setPendingEntries([]);
    } finally {
      setLoadingPending(false);
    }
  };

  const handleSelectEntry = (id: number) => {
    setSelectedEntryIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const visibleEntries = pendingEntries.filter(entry => {
    if (typeKey === 'man_hours' && filterSupervisorId !== '') {
      return entry.supervisor_id === filterSupervisorId;
    }
    return true;
  });

  const allVisibleSelected = visibleEntries.length > 0 && visibleEntries.every(e => selectedEntryIds.includes(e.id));

  const handleSelectAllEntries = () => {
    if (allVisibleSelected) {
      const visibleIds = visibleEntries.map(e => e.id);
      setSelectedEntryIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      const visibleIds = visibleEntries.map(e => e.id);
      setSelectedEntryIds(prev => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleCreateOca = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createClientId) {
      setError('Debe seleccionar un cliente');
      return;
    }
    if (selectedEntryIds.length === 0) {
      setError('Debe seleccionar al menos un registro de horas');
      return;
    }

    // Dynamic Grouping Constraints check
    const selectedEntries = pendingEntries.filter(e => selectedEntryIds.includes(e.id));
    if (typeKey === 'man_hours') {
      // Group by supervisor constraint (no mixed supervisors)
      const supervisorIds = selectedEntries.map(e => e.supervisor_id);
      const uniqueSupervisors = Array.from(new Set(supervisorIds));
      if (uniqueSupervisors.length > 1) {
        setError('Las OCAs de Horas Hombre deben agruparse por un único Supervisor. Hay varios seleccionados.');
        return;
      }
      if (uniqueSupervisors[0] === undefined || uniqueSupervisors[0] === null) {
        setError('Los registros seleccionados deben tener un supervisor asignado.');
        return;
      }
    } else {
      // Group by project constraint (no mixed projects)
      const projectIds = selectedEntries.map(e => e.project_id);
      const uniqueProjects = Array.from(new Set(projectIds));
      if (uniqueProjects.length > 1) {
        setError('Las OCAs de Grúas deben agruparse por un único Proyecto. Hay varios seleccionados.');
        return;
      }
    }

    try {
      setError('');
      setSuccess('');
      const newOca = await OcaService.create({
        type: typeKey,
        client_id: Number(createClientId),
        time_entry_ids: selectedEntryIds,
        notes: notes.trim() || undefined,
      });
      setSuccess(`Remito / OCA ${newOca.number} generado correctamente`);
      setOpenCreateDialog(false);
      setCreateClientId('');
      setSelectedEntryIds([]);
      setNotes('');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar la OCA');
    }
  };

  // Billing states flows
  const handlePresent = async (id: number) => {
    if (!window.confirm('¿Confirmar que presentará este remito al supervisor/cliente?')) return;
    try {
      setError('');
      setSuccess('');
      await OcaService.present(id);
      setSuccess('Remito marcado como Presentado');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al presentar el remito');
    }
  };

  const handleOpenReject = (id: number) => {
    setRejectionReason('');
    setRejectDialog({ open: true, ocaId: id });
  };

  const handleReject = async () => {
    if (!rejectDialog.ocaId || !rejectionReason.trim()) {
      setError('Debe ingresar un motivo de rechazo');
      return;
    }
    try {
      setError('');
      setSuccess('');
      await OcaService.reject(rejectDialog.ocaId, rejectionReason.trim());
      setSuccess('Remito rechazado correctamente');
      setRejectDialog({ open: false, ocaId: null });
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al rechazar el remito');
    }
  };

  const handleOpenApprove = (id: number) => {
    setSignedFile(null);
    setApproveDialog({ open: true, ocaId: id });
  };

  const handleApprove = async () => {
    if (!approveDialog.ocaId) return;
    try {
      setError('');
      setSuccess('');
      await OcaService.approve(approveDialog.ocaId, signedFile || undefined);
      setSuccess('Remito aprobado y cerrado correctamente');
      setApproveDialog({ open: false, ocaId: null });
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al aprobar el remito');
    }
  };

  const handleCorrect = async (id: number) => {
    if (!window.confirm('¿Generar un duplicado editable corregido para este remito rechazado?\nSe liberarán las horas del original y el nuevo quedará en estado Pendiente.')) return;
    try {
      setError('');
      setSuccess('');
      const corrected = await OcaService.correct(id);
      setSuccess(`Nuevo remito duplicado editable generado: ${corrected.number}`);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al corregir el remito');
    }
  };

  // Line editing
  const handleLineTaskChange = (lineId: number, value: string) => {
    setModifiedLines(prev => ({ ...prev, [lineId]: value }));
  };

  const handleSaveLines = async (ocaId: number) => {
    const oca = ocas.find(o => o.id === ocaId);
    if (!oca || !oca.lines) return;

    // Filter lines that have actual changes
    const linesToUpdate = oca.lines
      .filter(l => modifiedLines[l.id] !== undefined && modifiedLines[l.id] !== l.task)
      .map(l => ({ id: l.id, task: modifiedLines[l.id] }));

    if (linesToUpdate.length === 0) {
      setModifiedLines({});
      return;
    }

    try {
      setSavingLines(true);
      setError('');
      setSuccess('');
      await OcaService.updateLines(ocaId, linesToUpdate);
      setSuccess('Líneas actualizadas correctamente');
      setModifiedLines({});
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar líneas');
    } finally {
      setSavingLines(false);
    }
  };

  // Remove line from pending OCA (handles both manual and real entries)
  const handleRemoveLine = async (ocaId: number, lineId: number) => {
    if (!window.confirm('¿Seguro que desea remover este registro de horas del remito?')) return;
    try {
      setError('');
      setSuccess('');
      await OcaService.removeLine(ocaId, lineId);
      setSuccess('Registro de horas removido del remito');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al remover registro');
    }
  };

  const handleOpenAddManualLine = async (oca: Oca) => {
    setManualLineOca(oca);
    setManualEmployeeId('');
    setManualVehicleId('');
    setManualDate(new Date().toISOString().split('T')[0]);
    setManualCheckIn('08:00');
    setManualCheckOut('17:00');
    setManualRegularHours(9);
    setManualOvertime50(0);
    setManualOvertime100(0);
    setManualTask('');
    setManualNotes('');
    setManualProjectId('');
    setSupervisorProjects([]);

    if (oca.type === 'man_hours') {
      try {
        const allProjects = await ProjectService.getAll({ client_id: oca.client_id });
        const filteredProjects = allProjects.filter(p =>
          p.supervisors?.some(s => s.id === oca.supervisor_id)
        );
        setSupervisorProjects(filteredProjects);
      } catch (err) {
        console.error('Error al cargar proyectos del supervisor:', err);
        setError('Error al cargar proyectos del supervisor');
      }
    }

    setOpenManualLineDialog(true);
  };

  const handleManualLineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualLineOca) return;

    try {
      setError('');
      setSuccess('');
      
      const payload: Partial<OcaLine> = {
        employee_id: manualEmployeeId ? Number(manualEmployeeId) : undefined,
        project_id: manualLineOca.type === 'man_hours' && manualProjectId ? Number(manualProjectId) : undefined,
        vehicle_id: manualVehicleId ? Number(manualVehicleId) : undefined,
        date: manualDate,
        check_in: manualLineOca.type === 'man_hours' ? manualCheckIn : undefined,
        check_out: manualLineOca.type === 'man_hours' ? manualCheckOut : undefined,
        regular_hours: manualRegularHours,
        overtime_50_hours: manualOvertime50,
        overtime_100_hours: manualOvertime100,
        task: manualTask,
        notes: manualNotes,
      };

      await OcaService.addLine(manualLineOca.id, payload);
      setSuccess('Línea manual agregada correctamente al remito');
      setOpenManualLineDialog(false);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al agregar línea');
    }
  };

  // Add more time entries to pending OCA dialog
  const handleOpenAddEntries = async (oca: Oca) => {
    setAddEntriesOca(oca);
    setSelectedEntryIds([]);
    try {
      setLoadingPending(true);
      setError('');
      const data = await OcaService.getPendingEntries(oca.client_id, typeKey);
      
      // Filter out only entries that match supervisor (for man_hours) or project (for crane_hours)
      const filtered = data.filter(e => {
        if (typeKey === 'man_hours') {
          return e.supervisor_id === oca.supervisor_id;
        } else {
          return e.project_id === oca.project_id;
        }
      });
      
      setPendingEntries(filtered);
      setOpenAddEntriesDialog(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar horas pendientes');
    } finally {
      setLoadingPending(false);
    }
  };

  const handleAddEntriesSubmit = async () => {
    if (!addEntriesOca || selectedEntryIds.length === 0) return;
    try {
      setError('');
      setSuccess('');
      await OcaService.addEntries(addEntriesOca.id, selectedEntryIds);
      setSuccess('Registros de horas agregados al remito');
      setOpenAddEntriesDialog(false);
      setAddEntriesOca(null);
      setSelectedEntryIds([]);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al agregar registros');
    }
  };

  const triggerPrint = (oca: Oca) => {
    setPrintOca(oca);
  };

  // Filter OCAs
  const filteredOcas = ocas.filter(oca => {
    const matchesClient = filterClient === '' || oca.client_id === filterClient;
    const matchesStatus = filterStatus === 'all' || oca.status === filterStatus;
    return matchesClient && matchesStatus;
  });

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      {/* Printable Area overlay */}
      {/* Dialog de Vista Previa e Impresión de Remito */}
      <Dialog open={!!printOca} onClose={() => setPrintOca(null)} maxWidth="md" fullWidth>
        {printOca && (
          <>
            <DialogTitle className="no-print" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight="bold">Vista Previa de Impresión</Typography>
              <IconButton onClick={() => setPrintOca(null)} size="small">
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <Box
                className="print-area"
                sx={{
                  bgcolor: 'white',
                  color: 'black',
                  p: { xs: 1, sm: 3 },
                  fontFamily: 'sans-serif',
                }}
              >
                {printOca.type === 'man_hours' ? (
                  /* Parte Diario (Horas Hombre) Printable Template */
                  <Box>
                    {/* Header */}
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" borderBottom="2px solid black" pb={2} mb={2}>
                      <Box>
                        <Typography variant="h5" fontWeight="bold" sx={{ color: 'black' }}>CONMOMET S.A.</Typography>
                        <Typography variant="caption" sx={{ color: 'black' }}>Servicios Metalúrgicos e Industriales</Typography>
                      </Box>
                      <Box textAlign="right">
                        <Typography variant="h6" fontWeight="bold" sx={{ color: 'black' }}>PARTE DIARIO DE PERSONAL</Typography>
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ fontFamily: 'monospace', color: 'black' }}>OCA Nº: {printOca.number}</Typography>
                      </Box>
                    </Box>

                    {/* Metadata */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="body2" sx={{ color: 'black' }}><strong>Cliente:</strong> {printOca.client?.razonSocial}</Typography>
                        <Typography variant="body2" sx={{ color: 'black' }}><strong>Sector / Planta:</strong> {printOca.project?.plant?.name || '—'}</Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }} sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" sx={{ color: 'black' }}><strong>Solicitante (Supervisor):</strong> {printOca.supervisor?.lastname}, {printOca.supervisor?.name}</Typography>
                        <Typography variant="body2" sx={{ color: 'black' }}><strong>Fecha de Presentación:</strong> {new Date(printOca.date).toLocaleDateString('es-AR')}</Typography>
                      </Grid>
                    </Grid>

                    {/* Lines Table */}
                    <TableContainer component={Paper} variant="outlined" sx={{ mb: 4, borderRadius: 0 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ borderBottom: '2px solid black' }}>
                            <TableCell sx={{ fontWeight: 'bold', color: 'black' }}>Empleado</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: 'black' }}>Fecha</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: 'black' }}>Horario (Entrada - Salida)</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: 'black', align: 'center' }}>Hs Simples</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: 'black', align: 'center' }}>50%</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: 'black', align: 'center' }}>100%</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: 'black' }}>Tarea Realizada</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: 'black', width: '120px' }}>Firma Sup.</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {printOca.lines?.map((line) => (
                            <TableRow key={line.id} sx={{ borderBottom: '1px solid grey' }}>
                              <TableCell sx={{ color: 'black' }}>{line.employee?.lastname}, {line.employee?.name}</TableCell>
                              <TableCell sx={{ color: 'black' }}>{new Date(line.date + 'T12:00:00').toLocaleDateString('es-AR')}</TableCell>
                              <TableCell sx={{ color: 'black' }}>{line.check_in?.substring(0, 5) || '—'} a {line.check_out?.substring(0, 5) || '—'}</TableCell>
                              <TableCell align="center" sx={{ color: 'black' }}>{Number(line.regular_hours).toFixed(1)}</TableCell>
                              <TableCell align="center" sx={{ color: 'black' }}>{Number(line.overtime_50_hours).toFixed(1)}</TableCell>
                              <TableCell align="center" sx={{ color: 'black' }}>{Number(line.overtime_100_hours).toFixed(1)}</TableCell>
                              <TableCell sx={{ color: 'black' }}>{modifiedLines[line.id] !== undefined ? modifiedLines[line.id] : (line.task || '—')}</TableCell>
                              <TableCell sx={{ borderLeft: '1px solid grey', height: '40px' }}></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                ) : (
                  /* Remito de Horas Grúa Printable Template */
                  <Box>
                    {/* Header */}
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" borderBottom="2px solid black" pb={2} mb={3}>
                      <Box>
                        <Typography variant="h5" fontWeight="bold" sx={{ color: 'black' }}>CONMOMET S.A.</Typography>
                        <Typography variant="caption" sx={{ color: 'black' }}>Servicios Metalúrgicos e Industriales</Typography>
                      </Box>
                      <Box textAlign="right">
                        <Typography variant="h6" fontWeight="bold" sx={{ color: 'black' }}>REMITO DE SERVICIO DE GRÚA</Typography>
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ fontFamily: 'monospace', color: 'black' }}>OCA Nº: {printOca.number}</Typography>
                      </Box>
                    </Box>

                    {/* Data Summary Grid */}
                    <Card variant="outlined" sx={{ borderRadius: 0, p: 3, mb: 4, bgcolor: '#fafafa', border: '1px solid black' }}>
                      <Stack spacing={2}>
                        <Typography variant="body1" sx={{ color: 'black' }}><strong>Cliente:</strong> {printOca.client?.razonSocial}</Typography>
                        <Typography variant="body1" sx={{ color: 'black' }}><strong>Dirección Planta / Obra:</strong> {printOca.project?.plant?.address || '—'}</Typography>
                        <Typography variant="body1" sx={{ color: 'black' }}><strong>Detalle Servicio (Proyecto):</strong> {printOca.project?.name || '—'}</Typography>
                        <Typography variant="body1" sx={{ color: 'black' }}><strong>Cantidad de Horas Totales:</strong> {printOca.lines?.reduce((acc, l) => acc + Number(l.regular_hours) + Number(l.overtime_50_hours) + Number(l.overtime_100_hours), 0).toFixed(1)} hs</Typography>
                        <Typography variant="body1" sx={{ color: 'black' }}><strong>Fecha Emisión:</strong> {new Date(printOca.date).toLocaleDateString('es-AR')}</Typography>
                      </Stack>
                    </Card>

                    {/* Detailed lines */}
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, color: 'black' }}>Detalle de Servicios Diarios:</Typography>
                    <TableContainer component={Paper} variant="outlined" sx={{ mb: 5, borderRadius: 0 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ borderBottom: '2px solid black' }}>
                            <TableCell sx={{ fontWeight: 'bold', color: 'black' }}>Fecha</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: 'black' }}>Vehículo / Grúa</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: 'black' }}>Patente</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', color: 'black' }}>Horas Operación</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: 'black' }}>Detalle de Tarea</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {printOca.lines?.map((line) => {
                            const totalLineHours = Number(line.regular_hours) + Number(line.overtime_50_hours) + Number(line.overtime_100_hours);
                            return (
                              <TableRow key={line.id} sx={{ borderBottom: '1px solid grey' }}>
                                <TableCell sx={{ color: 'black' }}>{new Date(line.date + 'T12:00:00').toLocaleDateString('es-AR')}</TableCell>
                                <TableCell sx={{ color: 'black' }}>{line.vehicle?.brand} {line.vehicle?.model}</TableCell>
                                <TableCell sx={{ color: 'black', fontFamily: 'monospace' }}>{line.vehicle?.plate}</TableCell>
                                <TableCell align="center" sx={{ color: 'black' }}>{totalLineHours.toFixed(1)} hs</TableCell>
                                <TableCell sx={{ color: 'black' }}>{modifiedLines[line.id] !== undefined ? modifiedLines[line.id] : (line.task || '—')}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {/* Footer / Signatures */}
                    <Box mt={8} display="flex" justifyContent="center">
                      <Box width="250px" borderTop="1px solid black" textAlign="center" pt={1}>
                        <Typography variant="caption" display="block" sx={{ color: 'black' }}>Firma Conformidad Supervisor</Typography>
                      </Box>
                    </Box>
                  </Box>
                )}
              </Box>
            </DialogContent>
            <DialogActions className="no-print">
              <Button onClick={() => setPrintOca(null)}>Cerrar</Button>
              <Button variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()}>
                Imprimir
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Main Screen Layout (hides when printing) */}
      <Box sx={{ '@media print': { display: 'none' } }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
              Gestión de Remitos y OCAs
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Agrupe y presente las horas registradas en plantas para la facturación ante los supervisores de clientes.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setCreateClientId('');
              setPendingEntries([]);
              setSelectedEntryIds([]);
              setOpenCreateDialog(true);
            }}
            sx={{ borderRadius: 2, px: 3 }}
          >
            Generar Remito / OCA
          </Button>
        </Box>

        {/* Tabs navigation */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={(_, val) => setTabValue(val)}>
            <Tab label="Horas Hombre" />
            <Tab label="Horas Grúa / Equipos" />
          </Tabs>
        </Box>

        {/* Filters Card */}
        <Card sx={{ mb: 4, borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Filtrar Cliente</InputLabel>
                  <Select
                    value={filterClient}
                    label="Filtrar Cliente"
                    onChange={(e) => setFilterClient(e.target.value ? Number(e.target.value) : '')}
                  >
                    <MenuItem value="">Todos los clientes</MenuItem>
                    {clients.map(c => (
                      <MenuItem key={c.id} value={c.id}>{c.razonSocial}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Filtrar Estado</InputLabel>
                  <Select
                    value={filterStatus}
                    label="Filtrar Estado"
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <MenuItem value="all">Todos los estados</MenuItem>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <MenuItem key={k} value={k}>{v}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }} display="flex" justifyContent="flex-end">
                <Button
                  variant="outlined"
                  onClick={loadData}
                  startIcon={<RefreshIcon />}
                  fullWidth
                  sx={{ borderRadius: 2 }}
                >
                  Actualizar Listado
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* OCA List */}
        {loading ? (
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress />
          </Box>
        ) : filteredOcas.length === 0 ? (
          <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 2 }} elevation={1}>
            <Typography variant="body1" color="text.secondary">
              No hay remitos ni OCAs registradas para los filtros aplicados.
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={2}>
            {filteredOcas.map((oca) => {
              const isExpanded = expandedOcaId === oca.id;
              const hasModifications = oca.lines?.some(l => modifiedLines[l.id] !== undefined && modifiedLines[l.id] !== l.task);

              return (
                <Accordion
                  key={oca.id}
                  expanded={isExpanded}
                  onChange={() => setExpandedOcaId(isExpanded ? null : oca.id)}
                  sx={{
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: 'none',
                    '&::before': { display: 'none' },
                    '&.Mui-expanded': { m: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} justifyContent="space-between" width="100%" alignItems={{ xs: 'flex-start', md: 'center' }} gap={1.5} pr={2}>
                      <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={{ xs: 1, md: 2 }} alignItems={{ xs: 'flex-start', md: 'center' }} width="100%">
                        <Box display="flex" gap={1.5} alignItems="center" width={{ xs: '100%', md: 'auto' }}>
                          <Typography variant="subtitle1" fontWeight="bold" sx={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                            {oca.number}
                          </Typography>
                          <Chip
                            label={STATUS_LABELS[oca.status]}
                            color={STATUS_COLORS[oca.status]}
                            size="small"
                          />
                          <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ display: { xs: 'block', md: 'none' }, ml: 'auto' }}>
                            {oca.lines?.length || 0} líns.
                          </Typography>
                        </Box>
                        <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={{ xs: 0.5, md: 2 }} alignItems={{ xs: 'flex-start', md: 'center' }}>
                          <Typography variant="body2" color="text.secondary">
                            📅 {new Date(oca.date).toLocaleDateString('es-AR')}
                          </Typography>
                          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />
                          <Typography variant="body2" fontWeight="medium">
                            🏢 {oca.client?.razonSocial}
                          </Typography>
                          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />
                          <Typography variant="body2" color="primary.main">
                            {oca.type === 'man_hours'
                              ? `👤 Sup: ${oca.supervisor?.lastname || '—'}, ${oca.supervisor?.name || ''}`
                              : `📁 Proy: ${oca.project?.code || '—'} - ${oca.project?.name || ''}`}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="body2" fontWeight="bold" color="text.secondary" sx={{ display: { xs: 'none', md: 'block' } }}>
                        {oca.lines?.length || 0} línea(s)
                      </Typography>
                    </Box>
                  </AccordionSummary>

                  <AccordionDetails sx={{ borderTop: '1px solid', borderColor: 'divider', bgcolor: 'grey.50', p: 3 }}>
                    {/* Action Flow Panel */}
                    <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} justifyContent="space-between" mb={3} gap={2} alignItems={{ xs: 'stretch', md: 'center' }}>
                      <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                        {oca.status === 'pendiente' && (
                          <Button
                            variant="contained"
                            color="info"
                            startIcon={<PresentIcon />}
                            onClick={() => handlePresent(oca.id)}
                            size="small"
                          >
                            Presentar a Cliente
                          </Button>
                        )}
                        {oca.status === 'presentado' && (
                          <>
                            <Button
                              variant="contained"
                              color="success"
                              startIcon={<ApproveIcon />}
                              onClick={() => handleOpenApprove(oca.id)}
                              size="small"
                            >
                              Aprobar / Cargar Remito
                            </Button>
                            <Button
                              variant="contained"
                              color="error"
                              startIcon={<RejectIcon />}
                              onClick={() => handleOpenReject(oca.id)}
                              size="small"
                            >
                              Rechazar Remito
                            </Button>
                          </>
                        )}
                        {oca.status === 'rechazado' && (
                          <Button
                            variant="contained"
                            color="warning"
                            startIcon={<CorrectIcon />}
                            onClick={() => handleCorrect(oca.id)}
                            size="small"
                          >
                            Corregir y Duplicar
                          </Button>
                        )}
                        <Button
                          variant="outlined"
                          startIcon={<PrintIcon />}
                          onClick={() => triggerPrint(oca)}
                          size="small"
                        >
                          Imprimir Remito
                        </Button>
                      </Stack>
                      {oca.status === 'pendiente' && (
                        <Stack direction="row" spacing={1}>
                          <Button
                            variant="outlined"
                            color="primary"
                            startIcon={<AddIcon />}
                            onClick={() => handleOpenAddEntries(oca)}
                            size="small"
                          >
                            Agregar Horas Pendientes
                          </Button>
                          <Button
                            variant="outlined"
                            color="secondary"
                            startIcon={<AddIcon />}
                            onClick={() => handleOpenAddManualLine(oca)}
                            size="small"
                          >
                            Agregar Línea Manual
                          </Button>
                        </Stack>
                      )}
                    </Box>

                    {/* Alerts/Status information */}
                    {oca.status === 'rechazado' && oca.rejection_reason && (
                      <Alert severity="error" sx={{ mb: 3 }}>
                        <strong>Rechazado por el cliente/supervisor:</strong> {oca.rejection_reason}
                      </Alert>
                    )}

                    {oca.status === 'aprobado' && (
                      <Alert severity="success" sx={{ mb: 3 }}>
                        <strong>Aprobado y Firmado</strong>
                        {oca.approved_img_url && (
                          <Box mt={1}>
                            <Button
                              variant="outlined"
                              size="small"
                              color="success"
                              onClick={() => window.open(oca.approved_img_url, '_blank')}
                            >
                              Ver Comprobante Digital
                            </Button>
                          </Box>
                        )}
                      </Alert>
                    )}

                    {oca.source_oca_id && (
                      <Alert severity="info" icon={<ChevronRightIcon />} sx={{ mb: 3 }}>
                        Este remito fue corregido a partir del remito rechazado original.
                      </Alert>
                    )}

                    {/* Lines list */}
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      Registros de Horas del Remito
                    </Typography>

                    {!isMobile ? (
                      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mb: 2 }}>
                        <Table size="small">
                          <TableHead sx={{ bgcolor: 'grey.100' }}>
                            <TableRow>
                              {oca.type === 'man_hours' ? (
                                <>
                                  <TableCell><strong>Empleado</strong></TableCell>
                                  <TableCell><strong>Fecha</strong></TableCell>
                                  <TableCell align="center"><strong>Horas Simples</strong></TableCell>
                                  <TableCell align="center"><strong>Extra 50%</strong></TableCell>
                                  <TableCell align="center"><strong>Extra 100%</strong></TableCell>
                                </>
                              ) : (
                                <>
                                  <TableCell><strong>Equipo / Vehículo</strong></TableCell>
                                  <TableCell><strong>Fecha</strong></TableCell>
                                  <TableCell align="center"><strong>Horas Operación</strong></TableCell>
                                </>
                              )}
                              <TableCell><strong>Tarea / Descripción</strong></TableCell>
                              {oca.status === 'pendiente' && <TableCell align="center"><strong>Acciones</strong></TableCell>}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {oca.lines?.map((line) => {
                              const totalCraneHours = Number(line.regular_hours) + Number(line.overtime_50_hours) + Number(line.overtime_100_hours);
                              return (
                                <TableRow key={line.id} hover>
                                  {oca.type === 'man_hours' ? (
                                    <>
                                      <TableCell>{line.employee?.lastname}, {line.employee?.name}</TableCell>
                                      <TableCell>{new Date(line.date + 'T12:00:00').toLocaleDateString('es-AR')}</TableCell>
                                      <TableCell align="center">{Number(line.regular_hours).toFixed(1)} h</TableCell>
                                      <TableCell align="center">{Number(line.overtime_50_hours).toFixed(1)} h</TableCell>
                                      <TableCell align="center">{Number(line.overtime_100_hours).toFixed(1)} h</TableCell>
                                    </>
                                  ) : (
                                    <>
                                      <TableCell>
                                        <Typography variant="body2" fontWeight="medium">
                                          {line.vehicle?.brand} {line.vehicle?.model}
                                        </Typography>
                                        <Typography variant="caption" sx={{ fontFamily: 'monospace' }} color="text.secondary">
                                          Patente: {line.vehicle?.plate}
                                        </Typography>
                                      </TableCell>
                                      <TableCell>{new Date(line.date + 'T12:00:00').toLocaleDateString('es-AR')}</TableCell>
                                      <TableCell align="center">{totalCraneHours.toFixed(1)} h</TableCell>
                                    </>
                                  )}
                                  <TableCell sx={{ minWidth: 250 }}>
                                    {oca.status === 'pendiente' || oca.status === 'rechazado' ? (
                                      <TextField
                                        fullWidth
                                        size="small"
                                        placeholder="Detallar tarea realizada..."
                                        value={modifiedLines[line.id] !== undefined ? modifiedLines[line.id] : (line.task || '')}
                                        onChange={(e) => handleLineTaskChange(line.id, e.target.value)}
                                      />
                                    ) : (
                                      line.task || '—'
                                    )}
                                  </TableCell>
                                  {oca.status === 'pendiente' && (
                                    <TableCell align="center">
                                      <Tooltip title="Remover del Remito">
                                        <IconButton
                                          color="error"
                                          size="small"
                                          onClick={() => handleRemoveLine(oca.id, line.id)}
                                        >
                                          <RemoveIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    </TableCell>
                                  )}
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Box display="flex" flexDirection="column" gap={1.5} sx={{ mb: 2 }}>
                        {oca.lines?.map((line) => {
                          const totalCraneHours = Number(line.regular_hours) + Number(line.overtime_50_hours) + Number(line.overtime_100_hours);
                          return (
                            <Paper key={line.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                                <Box>
                                  {oca.type === 'man_hours' ? (
                                    <>
                                      <Typography variant="body2" fontWeight="bold">
                                        {line.employee?.lastname}, {line.employee?.name}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        📅 {new Date(line.date + 'T12:00:00').toLocaleDateString('es-AR')}
                                      </Typography>
                                    </>
                                  ) : (
                                    <>
                                      <Typography variant="body2" fontWeight="bold">
                                        {line.vehicle?.brand} {line.vehicle?.model}
                                      </Typography>
                                      <Typography variant="caption" sx={{ fontFamily: 'monospace', display: 'block' }} color="text.secondary">
                                        Patente: {line.vehicle?.plate}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                                        📅 {new Date(line.date + 'T12:00:00').toLocaleDateString('es-AR')}
                                      </Typography>
</>
                                  )}
                                </Box>
                                {oca.status === 'pendiente' && (
                                  <IconButton
                                    color="error"
                                    size="small"
                                    onClick={() => handleRemoveLine(oca.id, line.id)}
                                    sx={{ p: 0.5 }}
                                  >
                                    <RemoveIcon fontSize="small" />
                                  </IconButton>
                                )}
                              </Box>
                              
                              <Divider sx={{ my: 1 }} />
                              
                              {oca.type === 'man_hours' ? (
                                <Grid container spacing={1} sx={{ mb: 1.5 }}>
                                  <Grid size={{ xs: 4 }}>
                                    <Typography variant="caption" color="text.secondary" display="block">Simples</Typography>
                                    <Typography variant="body2" fontWeight="medium">{Number(line.regular_hours).toFixed(1)}h</Typography>
                                  </Grid>
                                  <Grid size={{ xs: 4 }}>
                                    <Typography variant="caption" color="text.secondary" display="block">Extra 50%</Typography>
                                    <Typography variant="body2" fontWeight="medium">{Number(line.overtime_50_hours).toFixed(1)}h</Typography>
                                  </Grid>
                                  <Grid size={{ xs: 4 }}>
                                    <Typography variant="caption" color="text.secondary" display="block">Extra 100%</Typography>
                                    <Typography variant="body2" fontWeight="medium">{Number(line.overtime_100_hours).toFixed(1)}h</Typography>
                                  </Grid>
                                </Grid>
                              ) : (
                                <Box sx={{ mb: 1.5 }}>
                                  <Typography variant="caption" color="text.secondary" display="block">Horas Operación</Typography>
                                  <Typography variant="body2" fontWeight="bold" color="primary.main">{totalCraneHours.toFixed(1)}h</Typography>
                                </Box>
                              )}

                              <Box>
                                <Typography variant="caption" color="text.secondary" display="block">Tarea / Descripción</Typography>
                                {oca.status === 'pendiente' || oca.status === 'rechazado' ? (
                                  <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Detallar tarea realizada..."
                                    value={modifiedLines[line.id] !== undefined ? modifiedLines[line.id] : (line.task || '')}
                                    onChange={(e) => handleLineTaskChange(line.id, e.target.value)}
                                    sx={{ mt: 0.5 }}
                                  />
                                ) : (
                                  <Typography variant="body2" sx={{ mt: 0.5 }}>{line.task || '—'}</Typography>
                                )}
                              </Box>
                            </Paper>
                          );
                        })}
                      </Box>
                    )}

                    {/* Saving lines actions */}
                    {hasModifications && (
                      <Box display="flex" justifyContent="flex-end" mt={1}>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => handleSaveLines(oca.id)}
                          disabled={savingLines}
                          size="small"
                        >
                          {savingLines ? 'Guardando...' : 'Guardar Cambios de Tareas'}
                        </Button>
                      </Box>
                    )}

                    {/* Brief notes if any */}
                    {oca.notes && (
                      <Box mt={2}>
                        <Typography variant="caption" color="text.secondary">
                          <strong>Observaciones internas:</strong> {oca.notes}
                        </Typography>
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Stack>
        )}

        {/* Generate OCA Dialog */}
        <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="md" fullWidth>
          <form onSubmit={handleCreateOca}>
            <DialogTitle>Generar Nuevo Remito / OCA</DialogTitle>
            <DialogContent dividers>
              <Stack spacing={3}>
                <Typography variant="body2" color="text.secondary">
                  Seleccione el cliente para listar las horas en planta aprobadas y pendientes de facturación de esta quincena.
                </Typography>
                
                <FormControl fullWidth size="small">
                  <InputLabel>Cliente *</InputLabel>
                  <Select
                    value={createClientId}
                    label="Cliente *"
                    required
                    onChange={(e) => handleClientChangeForCreate(e.target.value as number | '')}
                  >
                    <MenuItem value="">— Seleccionar Cliente —</MenuItem>
                    {clients.map(c => (
                      <MenuItem key={c.id} value={c.id}>{c.razonSocial}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {createClientId && typeKey === 'man_hours' && pendingEntries.length > 0 && (
                  <FormControl fullWidth size="small">
                    <InputLabel>Filtrar por Supervisor</InputLabel>
                    <Select
                      value={filterSupervisorId}
                      label="Filtrar por Supervisor"
                      onChange={(e) => {
                        setFilterSupervisorId(e.target.value as number | '');
                        setSelectedEntryIds([]);
                      }}
                    >
                      <MenuItem value="">— Todos los Supervisores —</MenuItem>
                      {Array.from(
                        new Map(
                          pendingEntries
                            .filter(entry => entry.supervisor)
                            .map(entry => [entry.supervisor!.id, entry.supervisor!])
                        ).values()
                      ).map(s => (
                        <MenuItem key={s.id} value={s.id}>{s.lastname}, {s.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

                {loadingPending ? (
                  <Box display="flex" justifyContent="center" py={4}>
                    <CircularProgress />
                  </Box>
                ) : createClientId && pendingEntries.length === 0 ? (
                  <Alert severity="info">
                    No se encontraron horas en planta aprobadas y pendientes de remito para el cliente seleccionado en esta pestaña.
                  </Alert>
                ) : createClientId ? (
                  <Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="subtitle2" fontWeight="bold">
                        Seleccionar Horas ({selectedEntryIds.length} de {visibleEntries.length} visibles)
                      </Typography>
                      <Button size="small" onClick={handleSelectAllEntries}>
                        {allVisibleSelected ? 'Deseleccionar Todas' : 'Seleccionar Todas'}
                      </Button>
                    </Box>

                    {!isMobile ? (
                      <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
                        <Table size="small" stickyHeader>
                          <TableHead>
                            <TableRow>
                              <TableCell padding="checkbox">
                                <Checkbox
                                  checked={allVisibleSelected}
                                  indeterminate={!allVisibleSelected && visibleEntries.some(e => selectedEntryIds.includes(e.id))}
                                  onChange={handleSelectAllEntries}
                                />
                              </TableCell>
                              <TableCell><strong>Fecha</strong></TableCell>
                              {typeKey === 'man_hours' ? (
                                <>
                                  <TableCell><strong>Empleado</strong></TableCell>
                                  <TableCell><strong>Supervisor</strong></TableCell>
                                </>
                              ) : (
                                <>
                                  <TableCell><strong>Proyecto</strong></TableCell>
                                  <TableCell><strong>Grúa / Vehículo</strong></TableCell>
                                </>
                              )}
                              <TableCell align="center"><strong>Horas</strong></TableCell>
                              <TableCell><strong>Concepto</strong></TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {visibleEntries.map((entry) => {
                              const isSelected = selectedEntryIds.includes(entry.id);
                              return (
                                <TableRow
                                  key={entry.id}
                                  hover
                                  onClick={() => handleSelectEntry(entry.id)}
                                  role="checkbox"
                                  selected={isSelected}
                                  sx={{ cursor: 'pointer' }}
                                >
                                  <TableCell padding="checkbox">
                                    <Checkbox checked={isSelected} />
                                  </TableCell>
                                  <TableCell>{new Date(entry.date + 'T12:00:00').toLocaleDateString('es-AR')}</TableCell>
                                  {typeKey === 'man_hours' ? (
                                    <>
                                      <TableCell>{entry.employee?.lastname}, {entry.employee?.name}</TableCell>
                                      <TableCell>
                                        {entry.supervisor
                                          ? `${entry.supervisor.lastname}, ${entry.supervisor.name}`
                                          : '—'}
                                      </TableCell>
                                    </>
                                  ) : (
                                    <>
                                      <TableCell>{entry.project?.name}</TableCell>
                                      <TableCell>
                                        {entry.vehicle
                                          ? `${entry.vehicle.brand} (${entry.vehicle.plate})`
                                          : '—'}
                                      </TableCell>
                                    </>
                                  )}
                                  <TableCell align="center">
                                    {typeKey === 'man_hours'
                                      ? `${Number(entry.regular_hours).toFixed(1)}h`
                                      : `${(Number(entry.regular_hours) + Number(entry.overtime_50_hours) + Number(entry.overtime_100_hours)).toFixed(1)}h`
                                    }
                                  </TableCell>
                                  <TableCell>{entry.concept?.name}</TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Box display="flex" flexDirection="column" gap={1.5} sx={{ maxHeight: 300, overflow: 'auto', p: 0.5 }}>
                        {visibleEntries.map((entry) => {
                          const isSelected = selectedEntryIds.includes(entry.id);
                          const displayHours = typeKey === 'man_hours'
                            ? `${Number(entry.regular_hours).toFixed(1)}h`
                            : `${(Number(entry.regular_hours) + Number(entry.overtime_50_hours) + Number(entry.overtime_100_hours)).toFixed(1)}h`;
                          
                          return (
                            <Paper
                              key={entry.id}
                              variant="outlined"
                              onClick={() => handleSelectEntry(entry.id)}
                              sx={{
                                p: 1.5,
                                borderRadius: 2,
                                cursor: 'pointer',
                                borderColor: isSelected ? 'primary.main' : 'divider',
                                bgcolor: isSelected ? 'action.selected' : 'background.paper',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 1
                              }}
                            >
                              <Checkbox checked={isSelected} sx={{ p: 0, mt: 0.5 }} />
                              <Box flex={1}>
                                <Box display="flex" justifyContent="space-between" mb={0.5}>
                                  <Typography variant="caption" color="text.secondary">
                                    📅 {new Date(entry.date + 'T12:00:00').toLocaleDateString('es-AR')}
                                  </Typography>
                                  <Chip label={displayHours} size="small" color="primary" variant="outlined" sx={{ height: 20, fontSize: '0.75rem' }} />
                                </Box>
                                
                                {typeKey === 'man_hours' ? (
                                  <>
                                    <Typography variant="body2" fontWeight="bold">
                                      {entry.employee?.lastname}, {entry.employee?.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" display="block">
                                      👤 Sup: {entry.supervisor ? `${entry.supervisor.lastname}, ${entry.supervisor.name}` : '—'}
                                    </Typography>
                                  </>
                                ) : (
                                  <>
                                    <Typography variant="body2" fontWeight="bold">
                                      📁 Proy: {entry.project?.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" display="block">
                                      🚜 Grúa: {entry.vehicle ? `${entry.vehicle.brand} (${entry.vehicle.plate})` : '—'}
                                    </Typography>
                                  </>
                                )}
                                <Typography variant="caption" color="text.secondary" display="block" sx={{ fontStyle: 'italic', mt: 0.5 }}>
                                  Concepto: {entry.concept?.name || '—'}
                                </Typography>
                              </Box>
                            </Paper>
                          );
                        })}
                      </Box>
                    )}

                    <Box mt={2}>
                      <TextField
                        label="Observaciones Internas (Opcional)"
                        fullWidth
                        multiline
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </Box>

                    {/* Constraint Alert Info */}
                    <Box mt={2}>
                      <Alert severity="info" icon={<HelpIcon />}>
                        {typeKey === 'man_hours' 
                          ? 'Información: Las horas se agruparán en un remito bajo el Supervisor seleccionado. Solo se permite seleccionar horas de un mismo supervisor a la vez.'
                          : 'Información: Las horas de grúa se agruparán bajo el Proyecto seleccionado. Solo se permite seleccionar horas de un mismo proyecto a la vez.'
                        }
                      </Alert>
                    </Box>
                  </Box>
                ) : null}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenCreateDialog(false)}>Cancelar</Button>
              <Button
                type="submit"
                variant="contained"
                disabled={selectedEntryIds.length === 0}
              >
                Generar OCA
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Add Entries to existing Dialog */}
        <Dialog open={openAddEntriesDialog} onClose={() => setOpenAddEntriesDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Agregar Horas al Remito {addEntriesOca?.number}</DialogTitle>
          <DialogContent dividers>
            {loadingPending ? (
              <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
            ) : pendingEntries.length === 0 ? (
              <Alert severity="info">No se encontraron más horas compatibles pendientes de facturación para este cliente/supervisor.</Alert>
            ) : (
              <Stack spacing={2}>
                <Typography variant="body2" color="text.secondary">
                  Seleccione los registros de horas en planta compatibles para sumar a esta OCA.
                </Typography>
                {!isMobile ? (
                  <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 250 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedEntryIds.length === pendingEntries.length && pendingEntries.length > 0}
                              onChange={handleSelectAllEntries}
                            />
                          </TableCell>
                          <TableCell><strong>Fecha</strong></TableCell>
                          {typeKey === 'man_hours' ? (
                            <TableCell><strong>Empleado</strong></TableCell>
                          ) : (
                            <TableCell><strong>Grúa / Vehículo</strong></TableCell>
                          )}
                          <TableCell align="center"><strong>Horas</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {pendingEntries.map((entry) => {
                          const isSelected = selectedEntryIds.includes(entry.id);
                          return (
                            <TableRow key={entry.id} hover onClick={() => handleSelectEntry(entry.id)} sx={{ cursor: 'pointer' }}>
                              <TableCell padding="checkbox"><Checkbox checked={isSelected} /></TableCell>
                              <TableCell>{new Date(entry.date + 'T12:00:00').toLocaleDateString('es-AR')}</TableCell>
                              {typeKey === 'man_hours' ? (
                                <TableCell>{entry.employee?.lastname}, {entry.employee?.name}</TableCell>
                              ) : (
                                <TableCell>{entry.vehicle?.brand} ({entry.vehicle?.plate})</TableCell>
                              )}
                              <TableCell align="center">
                                {typeKey === 'man_hours'
                                  ? `${Number(entry.regular_hours).toFixed(1)}h`
                                  : `${(Number(entry.regular_hours) + Number(entry.overtime_50_hours) + Number(entry.overtime_100_hours)).toFixed(1)}h`
                                }
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Box display="flex" flexDirection="column" gap={1.5} sx={{ maxHeight: 250, overflow: 'auto', p: 0.5 }}>
                    {pendingEntries.map((entry) => {
                      const isSelected = selectedEntryIds.includes(entry.id);
                      const displayHours = typeKey === 'man_hours'
                        ? `${Number(entry.regular_hours).toFixed(1)}h`
                        : `${(Number(entry.regular_hours) + Number(entry.overtime_50_hours) + Number(entry.overtime_100_hours)).toFixed(1)}h`;
                      
                      return (
                        <Paper
                          key={entry.id}
                          variant="outlined"
                          onClick={() => handleSelectEntry(entry.id)}
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            cursor: 'pointer',
                            borderColor: isSelected ? 'primary.main' : 'divider',
                            bgcolor: isSelected ? 'action.selected' : 'background.paper',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 1
                          }}
                        >
                          <Checkbox checked={isSelected} sx={{ p: 0, mt: 0.5 }} />
                          <Box flex={1}>
                            <Box display="flex" justifyContent="space-between" mb={0.5}>
                              <Typography variant="caption" color="text.secondary">
                                📅 {new Date(entry.date + 'T12:00:00').toLocaleDateString('es-AR')}
                              </Typography>
                              <Chip label={displayHours} size="small" color="primary" variant="outlined" sx={{ height: 20, fontSize: '0.75rem' }} />
                            </Box>
                            
                            {typeKey === 'man_hours' ? (
                              <Typography variant="body2" fontWeight="bold">
                                {entry.employee?.lastname}, {entry.employee?.name}
                              </Typography>
                            ) : (
                              <Typography variant="body2" fontWeight="bold">
                                {entry.vehicle?.brand} ({entry.vehicle?.plate})
                              </Typography>
                            )}
                          </Box>
                        </Paper>
                      );
                    })}
                  </Box>
                )}
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenAddEntriesDialog(false)}>Cancelar</Button>
            <Button onClick={handleAddEntriesSubmit} variant="contained" disabled={selectedEntryIds.length === 0}>
              Agregar Seleccionados
            </Button>
          </DialogActions>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={rejectDialog.open} onClose={() => setRejectDialog({ open: false, ocaId: null })} maxWidth="xs" fullWidth>
          <DialogTitle>Rechazar Remito / OCA</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                Por favor, ingrese el motivo del rechazo del supervisor de cliente. Esto liberará los registros de horas del remito para que puedan ser modificados si fuera necesario.
              </Typography>
              <TextField
                label="Motivo del Rechazo *"
                required
                fullWidth
                multiline
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRejectDialog({ open: false, ocaId: null })}>Cancelar</Button>
            <Button onClick={handleReject} variant="contained" color="error">Rechazar</Button>
          </DialogActions>
        </Dialog>

        {/* Approve Dialog */}
        <Dialog open={approveDialog.open} onClose={() => setApproveDialog({ open: false, ocaId: null })} maxWidth="xs" fullWidth>
          <DialogTitle>Aprobar y Registrar Remito Firmado</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                Suba una copia digitalizada del remito físico firmado por el supervisor del cliente para dar conformidad final al servicio.
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Button variant="outlined" component="label" startIcon={<UploadIcon />} size="small">
                  {signedFile ? signedFile.name : 'Seleccionar Archivo (Imagen / PDF)'}
                  <input type="file" hidden onChange={(e) => setSignedFile(e.target.files?.[0] || null)} />
                </Button>
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setApproveDialog({ open: false, ocaId: null })}>Cancelar</Button>
            <Button onClick={handleApprove} variant="contained" color="success">Aprobar Remito</Button>
          </DialogActions>
        </Dialog>

        {/* Add Manual Line Dialog */}
        <Dialog open={openManualLineDialog} onClose={() => setOpenManualLineDialog(false)} maxWidth="sm" fullWidth>
          <form onSubmit={handleManualLineSubmit}>
            <DialogTitle>Agregar Línea Manual al Remito {manualLineOca?.number}</DialogTitle>
            <DialogContent dividers>
              <Stack spacing={2}>
                {manualLineOca?.type === 'man_hours' ? (
                  <>
                    <FormControl fullWidth size="small">
                      <InputLabel>Empleado *</InputLabel>
                      <Select
                        value={manualEmployeeId}
                        label="Empleado *"
                        required
                        onChange={(e) => setManualEmployeeId(e.target.value as number | '')}
                      >
                        <MenuItem value="">— Seleccionar Empleado —</MenuItem>
                        {employees.map(e => (
                          <MenuItem key={e.id} value={e.id}>{e.lastname}, {e.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl fullWidth size="small">
                      <InputLabel>Proyecto *</InputLabel>
                      <Select
                        value={manualProjectId}
                        label="Proyecto *"
                        required
                        onChange={(e) => setManualProjectId(e.target.value as number | '')}
                      >
                        <MenuItem value="">— Seleccionar Proyecto —</MenuItem>
                        {supervisorProjects.map(p => (
                          <MenuItem key={p.id} value={p.id}>[{p.code}] {p.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </>
                ) : (
                  <FormControl fullWidth size="small">
                    <InputLabel>Vehículo / Grúa *</InputLabel>
                    <Select
                      value={manualVehicleId}
                      label="Vehículo / Grúa *"
                      required
                      onChange={(e) => setManualVehicleId(e.target.value as number | '')}
                    >
                      <MenuItem value="">— Seleccionar Vehículo —</MenuItem>
                      {vehicles.map(v => (
                        <MenuItem key={v.id} value={v.id}>{v.brand} {v.model} ({v.plate})</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

                <TextField
                  label="Fecha *"
                  type="date"
                  fullWidth
                  size="small"
                  required
                  InputLabelProps={{ shrink: true }}
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                />

                {manualLineOca?.type === 'man_hours' && (
                  <Box display="flex" gap={2}>
                    <TextField
                      label="Entrada *"
                      type="time"
                      fullWidth
                      size="small"
                      required
                      InputLabelProps={{ shrink: true }}
                      value={manualCheckIn}
                      onChange={(e) => setManualCheckIn(e.target.value)}
                    />
                    <TextField
                      label="Salida *"
                      type="time"
                      fullWidth
                      size="small"
                      required
                      InputLabelProps={{ shrink: true }}
                      value={manualCheckOut}
                      onChange={(e) => setManualCheckOut(e.target.value)}
                    />
                  </Box>
                )}

                <Box display="flex" gap={2}>
                  <TextField
                    label={manualLineOca?.type === 'man_hours' ? "Hs Regulares (Auto)" : "Horas Trabajadas *"}
                    type="number"
                    fullWidth
                    size="small"
                    required
                    slotProps={{ htmlInput: { step: 0.1 } }}
                    value={manualRegularHours}
                    disabled={manualLineOca?.type === 'man_hours'}
                    onChange={(e) => setManualRegularHours(Number(e.target.value))}
                  />
                  <TextField
                    label="Extras 50%"
                    type="number"
                    fullWidth
                    size="small"
                    slotProps={{ htmlInput: { step: 0.1 } }}
                    value={manualOvertime50}
                    onChange={(e) => setManualOvertime50(Number(e.target.value))}
                  />
                  <TextField
                    label="Extras 100%"
                    type="number"
                    fullWidth
                    size="small"
                    slotProps={{ htmlInput: { step: 0.1 } }}
                    value={manualOvertime100}
                    onChange={(e) => setManualOvertime100(Number(e.target.value))}
                  />
                </Box>

                <TextField
                  label="Tarea Realizada"
                  fullWidth
                  size="small"
                  value={manualTask}
                  onChange={(e) => setManualTask(e.target.value)}
                />

                <TextField
                  label="Notas (Opcional)"
                  fullWidth
                  multiline
                  rows={2}
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenManualLineDialog(false)}>Cancelar</Button>
              <Button type="submit" variant="contained">Agregar Línea</Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Feedback Alerts */}
        <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />
        <FeedbackModal open={!!success} onClose={() => setSuccess('')} message={success} type="success" />
      </Box>
    </Box>
  );
}
