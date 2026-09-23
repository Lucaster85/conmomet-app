'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box, Typography, Paper, Card, Tabs, Tab, Chip, LinearProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button,
  Grid, Divider, Stack, TextField, Autocomplete, Tooltip, Alert, Snackbar,
  Dialog, DialogTitle, DialogContent, DialogActions, RadioGroup, Radio,
  FormControlLabel, FormControl, FormLabel, IconButton,
} from '@mui/material';
import {
  ArrowBackOutlined as BackIcon, AddOutlined as AddIcon, PrintOutlined as PrintIcon, SaveOutlined as SaveIcon,
  ChevronLeftOutlined as PrevIcon, ChevronRightOutlined as NextIcon, InfoOutlined as InfoIcon,
  TodayOutlined as TodayIcon, RefreshOutlined as RefreshIcon, AccountTreeOutlined as SubprojectsIcon,
  AccessTimeOutlined as HoursIcon, EventNoteOutlined as DailyLogIcon, RequestQuoteOutlined as BudgetTabIcon,
  BuildOutlined as PanolIcon, OpenInNewOutlined as OpenIcon,
} from '@mui/icons-material';
import { useAuth } from '../../../../utils/auth';
import IconTileGrid, { IconTileItem } from '../../../../components/common/IconTileGrid';
import GearSpinner from '../../../../components/GearSpinner';
import {
  Project, ProjectService, TimeEntry, TimeEntryService, BudgetCurrency,
  WorkDayLog, WorkDayLogWeek, AssetAssignment, AssetAssignmentService, AssetAssignmentStatus,
} from '../../../../utils/api';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador', active: 'Activo', paused: 'Pausado', completed: 'Completado', cancelled: 'Cancelado',
};

const ASSIGNMENT_STATUS_LABELS: Record<AssetAssignmentStatus, string> = { reserved: 'Reservada', delivered: 'Entregada', returned: 'Devuelta' };
const ASSIGNMENT_STATUS_COLORS: Record<AssetAssignmentStatus, 'info' | 'warning' | 'success'> = { reserved: 'info', delivered: 'warning', returned: 'success' };

const PRESET_SUSPENSION_REASONS = [
  'Lluvias',
  'Vientos fuertes',
  'Tormenta eléctrica',
  'Corte de luz',
  'SEH',
  'Mantenimiento',
  'Feriado',
  'Otro',
];

function formatMoney(value: number, currency: BudgetCurrency) {
  const symbol = currency === 'USD' ? 'US$' : '$';
  return `${symbol}${value.toLocaleString('es-AR', { maximumFractionDigits: 2 })}`;
}

function formatTotals(totals?: Record<BudgetCurrency, number>) {
  if (!totals) return '—';
  const parts: string[] = [];
  if (totals.ARS) parts.push(formatMoney(totals.ARS, 'ARS'));
  if (totals.USD) parts.push(formatMoney(totals.USD, 'USD'));
  return parts.length > 0 ? parts.join(' + ') : formatMoney(0, 'ARS');
}

function getMondayStr(dString?: string): string {
  const d = dString ? new Date(dString + 'T00:00:00') : new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  return monday.toISOString().split('T')[0];
}

function addDaysStr(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y.slice(2)}`;
}

function renderProgress(consumed: number, budgeted: number) {
  if (!budgeted || budgeted <= 0) return <Typography variant="body2">{consumed.toFixed(1)} hs</Typography>;
  const percentage = Math.min((consumed / budgeted) * 100, 100);
  const isOverBudget = consumed > budgeted;
  return (
    <Box sx={{ width: '100%', maxWidth: 320 }}>
      <Box display="flex" justifyContent="space-between" mb={0.5}>
        <Typography variant="caption" fontWeight="bold" color={isOverBudget ? 'error.main' : 'text.primary'}>{consumed.toFixed(1)} hs</Typography>
        <Typography variant="caption" color="text.secondary">/ {budgeted} hs ({Math.round((consumed / budgeted) * 100)}%)</Typography>
      </Box>
      <LinearProgress variant="determinate" value={percentage} color={isOverBudget ? 'error' : (percentage > 80 ? 'warning' : 'success')} sx={{ height: 6, borderRadius: 3 }} />
    </Box>
  );
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = Number(params.id);
  const { user } = useAuth();
  const permissions: string[] = Array.isArray((user as unknown as Record<string, unknown>)?.permissions)
    ? ((user as unknown as Record<string, unknown>).permissions as string[])
    : [];
  const hasBudgetsRead = permissions.includes('admin_granted') || permissions.includes('budgets_read');
  const hasPricesRead = permissions.includes('admin_granted') || permissions.includes('budget_prices_read');
  const hasToolsRead = permissions.includes('admin_granted') || permissions.includes('asset_assignments_read');
  // Mismo truco de "índice inalcanzable" que ya usa este archivo para Presupuesto (línea de
  // abajo con hasBudgetsRead ? 4 : 99): evita romper la numeración de tabs cuando falta el
  // permiso, sin tener que recalcular todos los índices a mano.
  const panolTabIndex = hasToolsRead ? (hasBudgetsRead ? 5 : 4) : 99;

  const [project, setProject] = useState<Project | null>(null);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [includeChildrenHours, setIncludeChildrenHours] = useState(true);

  // Planilla Diaria state
  const [selectedMonday, setSelectedMonday] = useState<string>(getMondayStr());
  const [weekLogs, setWeekLogs] = useState<WorkDayLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [savingLogs, setSavingLogs] = useState(false);
  // Fila de "Detalles / Observaciones" con foco en la tabla desktop — se expande a textarea
  // mientras se edita (el texto de tareas concatenado no entra cómodo en un input de una línea).
  const [focusedObsRow, setFocusedObsRow] = useState<number | null>(null);

  // Toast notification
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  // Pañol tab state
  const [toolAssignments, setToolAssignments] = useState<AssetAssignment[]>([]);
  const [vehicleAssignments, setVehicleAssignments] = useState<AssetAssignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  // Print Dialog state
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [printMode, setPrintMode] = useState<'all' | 'custom'>('all');
  const [printFrom, setPrintFrom] = useState<string>(getMondayStr());
  const [printTo, setPrintTo] = useState<string>(getMondayStr());
  const [printWeeks, setPrintWeeks] = useState<WorkDayLogWeek[]>([]);
  const [loadingPrint, setLoadingPrint] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const proj = await ProjectService.getById(projectId);
      setProject(proj);
      if (proj.start_date) {
        setPrintFrom(getMondayStr(proj.start_date));
      }
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  // Load TimeEntries for Horas tab
  useEffect(() => {
    if (tab !== 2 || !project) return;
    const childIds = (project.subprojects || []).map(sp => sp.id);
    const idsToLoad = includeChildrenHours ? [project.id, ...childIds] : [project.id];
    Promise.all(idsToLoad.map(id => TimeEntryService.getAll({ project_id: id })))
      .then(results => setEntries(results.flat()));
  }, [tab, project, includeChildrenHours]);

  // Load Planilla Diaria logs
  const loadWeekLogs = useCallback(async (monday: string) => {
    try {
      setLoadingLogs(true);
      const data = await ProjectService.getWorkDayLogs(projectId, monday);
      setWeekLogs(data.days || []);
    } catch (err) {
      setSnackbar({ open: true, message: err instanceof Error ? err.message : 'Error al cargar planilla', severity: 'error' });
    } finally {
      setLoadingLogs(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (tab === 3 && project) {
      loadWeekLogs(selectedMonday);
    }
  }, [tab, project, selectedMonday, loadWeekLogs]);

  // Load Pañol (herramientas/grúas asignadas) — historial completo, no solo lo activo.
  useEffect(() => {
    if (tab !== panolTabIndex || !project) return;
    setLoadingAssignments(true);
    AssetAssignmentService.getAll({ project_id: project.id })
      .then(all => {
        setToolAssignments(all.filter(a => !!a.tool_id));
        setVehicleAssignments(all.filter(a => !!a.vehicle_id));
      })
      .catch(err => setSnackbar({ open: true, message: err instanceof Error ? err.message : 'Error al cargar el pañol del proyecto', severity: 'error' }))
      .finally(() => setLoadingAssignments(false));
  }, [tab, project, panolTabIndex]);

  // Save Planilla Diaria
  const handleSaveWeekLogs = async () => {
    try {
      setSavingLogs(true);
      await ProjectService.saveWorkDayLogs(projectId, weekLogs);
      setSnackbar({ open: true, message: 'Planilla diaria guardada correctamente', severity: 'success' });
      await loadWeekLogs(selectedMonday);
    } catch (err) {
      setSnackbar({ open: true, message: err instanceof Error ? err.message : 'Error al guardar planilla', severity: 'error' });
    } finally {
      setSavingLogs(false);
    }
  };

  // Update a single log entry in local state
  const handleLogChange = (index: number, field: keyof WorkDayLog, value: string | null) => {
    setWeekLogs(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Print Dialog actions
  const fetchPrintData = useCallback(async (mode: 'all' | 'custom', from?: string, to?: string) => {
    try {
      setLoadingPrint(true);
      const data = mode === 'all'
        ? await ProjectService.getWorkDayLogsAll(projectId)
        : await ProjectService.getWorkDayLogsAll(projectId, from, to);
      setPrintWeeks(data);
    } catch (err) {
      setSnackbar({ open: true, message: err instanceof Error ? err.message : 'Error al cargar datos de impresión', severity: 'error' });
    } finally {
      setLoadingPrint(false);
    }
  }, [projectId]);

  const handleOpenPrintDialog = () => {
    setPrintDialogOpen(true);
    const initialFrom = project?.start_date ? getMondayStr(project.start_date) : getMondayStr();
    const initialTo = getMondayStr();
    setPrintFrom(initialFrom);
    setPrintTo(initialTo);
    fetchPrintData('all');
  };

  const handleTriggerPrint = () => {
    if (!project) return;
    const originalTitle = document.title;
    document.title = `Planilla Diaria - ${project.code} ${project.name}`;
    const restore = () => {
      document.title = originalTitle;
      window.removeEventListener('afterprint', restore);
    };
    window.addEventListener('afterprint', restore);
    window.print();
  };

  if (loading || !project) {
    return <Box display="flex" justifyContent="center" py={8}><GearSpinner /></Box>;
  }

  const tabs = [
    { label: 'Resumen' },
    { label: `Adicionales (${project.subproject_count ?? project.subprojects?.length ?? 0})` },
    { label: 'Horas' },
    { label: 'Planilla Diaria' },
    ...(hasBudgetsRead ? [{ label: 'Presupuesto' }] : []),
    ...(hasToolsRead ? [{ label: 'Pañol' }] : []),
  ];

  // Mismo orden/condiciones que `tabs` — navegación con íconos para mobile en vez del strip de
  // Tabs (que con hasta 6 pestañas queda apretado en pantallas chicas), mismo patrón que el
  // home del dashboard y el portal del empleado (IconTileGrid).
  const mobileNavItems: IconTileItem[] = [
    { key: 'resumen', label: 'Resumen', icon: <InfoIcon />, onClick: () => setTab(0) },
    { key: 'adicionales', label: 'Adicionales', icon: <SubprojectsIcon />, badge: project.subproject_count ?? project.subprojects?.length ?? 0, onClick: () => setTab(1) },
    { key: 'horas', label: 'Horas', icon: <HoursIcon />, onClick: () => setTab(2) },
    { key: 'planilla', label: 'Planilla', icon: <DailyLogIcon />, onClick: () => setTab(3) },
    ...(hasBudgetsRead ? [{ key: 'presupuesto', label: 'Presupuesto', icon: <BudgetTabIcon />, onClick: () => setTab(4) }] : []),
    ...(hasToolsRead ? [{ key: 'panol', label: 'Pañol', icon: <PanolIcon />, onClick: () => setTab(panolTabIndex) }] : []),
  ];
  const activeMobileKey = mobileNavItems[tab]?.key;

  return (
    <Box>
      <Button startIcon={<BackIcon />} onClick={() => router.push('/dashboard/projects')} sx={{ mb: 2 }}>Volver a Proyectos</Button>

      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2} flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h4" fontWeight="bold">[{project.code}] {project.name}</Typography>
          <Typography variant="body2" color="text.secondary">{project.client?.razonSocial}{project.plant ? ` · ${project.plant.name}` : ''}</Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          {hasBudgetsRead && !project.budget && !project.parent_id && (
            <Button
              variant="outlined" size="small" startIcon={<AddIcon />}
              onClick={() => router.push(`/dashboard/budgets?existing_project_id=${project.id}`)}
            >
              Vincular Presupuesto
            </Button>
          )}
          <Chip label={STATUS_LABELS[project.status]} color={project.status === 'active' ? 'success' : 'default'} />
        </Box>
      </Box>

      {/* Mobile: íconos en vez de pestañas, mismo patrón que el home del dashboard y el portal */}
      <Box sx={{ display: { xs: 'block', sm: 'none' }, mb: 3 }}>
        <IconTileGrid items={mobileNavItems} columns={{ xs: 3, sm: 3 }} activeKey={activeMobileKey} />
      </Box>

      {/* Desktop/Tablet: se mantiene el strip de pestañas de siempre */}
      <Paper elevation={1} sx={{ mb: 3, display: { xs: 'none', sm: 'block' } }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile>
          {tabs.map((t, i) => <Tab key={i} label={t.label} />)}
        </Tabs>
      </Paper>

      {/* Tab 0: Resumen */}
      {tab === 0 && (
        <Paper sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" color="text.secondary">Horas propias</Typography>
              {renderProgress(project.consumed_hours_own || 0, project.budgeted_hours || 0)}
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" color="text.secondary">Horas consolidadas (propias + adicionales)</Typography>
              {renderProgress(project.consumed_hours_total || 0, project.budgeted_hours || 0)}
            </Grid>
          </Grid>
          <Divider sx={{ my: 3 }} />
          <Stack spacing={1}>
            <Typography variant="body2"><strong>Descripción:</strong> {project.description || '—'}</Typography>
            <Typography variant="body2"><strong>Fecha de inicio:</strong> {project.start_date || '—'}</Typography>
            <Typography variant="body2"><strong>Fecha de fin:</strong> {project.end_date || '—'}</Typography>
            {project.parent && (
              <Typography variant="body2"><strong>Es adicional de:</strong> {project.parent.code} - {project.parent.name}</Typography>
            )}
            {project.supervisors && project.supervisors.length > 0 && (
              <Typography variant="body2"><strong>Supervisores:</strong> {project.supervisors.map(s => `${s.lastname}, ${s.name}`).join(' · ')}</Typography>
            )}
          </Stack>
        </Paper>
      )}

      {/* Tab 1: Adicionales */}
      {tab === 1 && (
        <Paper sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Adicionales / Subproyectos</Typography>
            <Button
              variant="contained" size="small" startIcon={<AddIcon />}
              onClick={() => router.push(`/dashboard/budgets?parent_project_id=${project.id}`)}
            >
              Nuevo Adicional
            </Button>
          </Box>
          {(!project.subprojects || project.subprojects.length === 0) ? (
            <Typography color="text.secondary" textAlign="center" py={3}>No hay adicionales/subproyectos asociados.</Typography>
          ) : (
            <>
              {/* Mobile Cards */}
              <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                <Stack spacing={2}>
                  {project.subprojects.map((sp) => (
                    <Card key={sp.id} sx={{ p: 2, borderRadius: 2, cursor: 'pointer' }} onClick={() => router.push(`/dashboard/projects/${sp.id}`)}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1}>
                        <Box flex={1}>
                          <Typography fontWeight={600}>{sp.code} — {sp.name}</Typography>
                          <Chip size="small" label={STATUS_LABELS[sp.status]} sx={{ mt: 0.5 }} />
                        </Box>
                      </Box>
                      <Box mt={1.5}>{renderProgress(sp.consumed_hours_own || 0, sp.budgeted_hours || 0)}</Box>
                    </Card>
                  ))}
                </Stack>
              </Box>
              {/* Desktop Table */}
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell><strong>Código</strong></TableCell>
                        <TableCell><strong>Nombre</strong></TableCell>
                        <TableCell><strong>Estado</strong></TableCell>
                        <TableCell><strong>Horas</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {project.subprojects.map((sp) => (
                        <TableRow key={sp.id} hover sx={{ cursor: 'pointer' }} onClick={() => router.push(`/dashboard/projects/${sp.id}`)}>
                          <TableCell>{sp.code}</TableCell>
                          <TableCell>{sp.name}</TableCell>
                          <TableCell>{STATUS_LABELS[sp.status]}</TableCell>
                          <TableCell>{renderProgress(sp.consumed_hours_own || 0, sp.budgeted_hours || 0)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </>
          )}
        </Paper>
      )}

      {/* Tab 2: Horas */}
      {tab === 2 && (
        <Paper sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Horas Cargadas</Typography>
            {project.subprojects && project.subprojects.length > 0 && (
              <Button size="small" onClick={() => setIncludeChildrenHours(!includeChildrenHours)}>
                {includeChildrenHours ? 'Ver solo horas propias' : 'Incluir horas de adicionales'}
              </Button>
            )}
          </Box>
          {entries.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={3}>No hay registros de horas.</Typography>
          ) : (
            <>
              {/* Mobile Cards */}
              <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                <Stack spacing={2}>
                  {entries.map((e) => (
                    <Card key={e.id} sx={{ p: 2, borderRadius: 2 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1}>
                        <Box>
                          <Typography fontWeight={600}>{e.employee ? `${e.employee.lastname}, ${e.employee.name}` : '—'}</Typography>
                          <Typography variant="body2" color="text.secondary">{e.date}{e.project ? ` · ${e.project.code}` : ''}</Typography>
                        </Box>
                        <Chip size="small" label={e.status} />
                      </Box>
                      <Stack direction="row" spacing={2} mt={1}>
                        <Typography variant="body2">Reg.: <strong>{e.regular_hours}</strong></Typography>
                        <Typography variant="body2">50%: <strong>{e.overtime_50_hours}</strong></Typography>
                        <Typography variant="body2">100%: <strong>{e.overtime_100_hours}</strong></Typography>
                      </Stack>
                      {e.notes && (
                        <Typography variant="body2" color="text.secondary" mt={1}>
                          <strong>Tarea:</strong> {e.notes}
                        </Typography>
                      )}
                    </Card>
                  ))}
                </Stack>
              </Box>
              {/* Desktop Table */}
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell><strong>Fecha</strong></TableCell>
                        <TableCell><strong>Empleado</strong></TableCell>
                        <TableCell><strong>Proyecto</strong></TableCell>
                        <TableCell align="right"><strong>Reg.</strong></TableCell>
                        <TableCell align="right"><strong>50%</strong></TableCell>
                        <TableCell align="right"><strong>100%</strong></TableCell>
                        <TableCell><strong>Tarea</strong></TableCell>
                        <TableCell><strong>Estado</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {entries.map((e) => (
                        <TableRow key={e.id} hover>
                          <TableCell>{e.date}</TableCell>
                          <TableCell>{e.employee ? `${e.employee.lastname}, ${e.employee.name}` : '—'}</TableCell>
                          <TableCell>{e.project ? `${e.project.code}` : '—'}</TableCell>
                          <TableCell align="right">{e.regular_hours}</TableCell>
                          <TableCell align="right">{e.overtime_50_hours}</TableCell>
                          <TableCell align="right">{e.overtime_100_hours}</TableCell>
                          <TableCell>{e.notes || '—'}</TableCell>
                          <TableCell>{e.status}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </>
          )}
        </Paper>
      )}

      {/* Tab 3: Planilla Diaria */}
      {tab === 3 && (
        <Paper sx={{ p: 3 }}>
          {/* Header controls */}
          <Stack spacing={2} mb={3}>
            <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
              <IconButton onClick={() => setSelectedMonday(prev => addDaysStr(prev, -7))} title="Semana anterior">
                <PrevIcon />
              </IconButton>
              <TextField
                type="date"
                label="Semana del (Lunes)"
                value={selectedMonday}
                onChange={(e) => {
                  if (e.target.value) setSelectedMonday(getMondayStr(e.target.value));
                }}
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ width: 170 }}
              />
              <IconButton onClick={() => setSelectedMonday(prev => addDaysStr(prev, 7))} title="Semana siguiente">
                <NextIcon />
              </IconButton>
              <Button
                variant="outlined"
                size="small"
                startIcon={<TodayIcon />}
                onClick={() => setSelectedMonday(getMondayStr())}
              >
                Esta semana
              </Button>
              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                ({formatDateDisplay(selectedMonday)} al {formatDateDisplay(addDaysStr(selectedMonday, 6))})
              </Typography>
            </Box>

            <Box display="flex" gap={1} flexDirection={{ xs: 'column', sm: 'row' }}>
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={handleOpenPrintDialog}
                fullWidth={false}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                Imprimir Planilla
              </Button>
              <Button
                variant="contained"
                startIcon={savingLogs ? <GearSpinner size={20} /> : <SaveIcon />}
                onClick={handleSaveWeekLogs}
                disabled={savingLogs || loadingLogs}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                Guardar Semana
              </Button>
            </Box>
          </Stack>

          {loadingLogs ? (
            <Box display="flex" justifyContent="center" py={6}><GearSpinner /></Box>
          ) : (
            <>
              {/* Mobile Cards — un Card por día */}
              <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                <Stack spacing={2}>
                  {weekLogs.map((log, index) => {
                    const isWeekend = log.day_name === 'Sábado' || log.day_name === 'Domingo';
                    const hasComputedDiff =
                      log.is_saved &&
                      (
                        (log.computed_start_time && log.computed_start_time !== log.start_time) ||
                        (log.computed_end_time && log.computed_end_time !== log.end_time)
                      );
                    return (
                      <Card key={log.date} sx={{ p: 2, borderRadius: 2, bgcolor: log.is_holiday ? 'warning.50' : (isWeekend ? 'grey.50' : 'background.paper') }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">{log.day_name}</Typography>
                            <Typography variant="caption" color="text.secondary">{formatDateDisplay(log.date)}</Typography>
                          </Box>
                          {log.is_holiday && <Chip label={log.holiday_name || 'Feriado'} size="small" color="warning" />}
                        </Box>
                        <Stack spacing={1.5}>
                          <Autocomplete
                            freeSolo
                            options={PRESET_SUSPENSION_REASONS}
                            value={log.suspension_reason || ''}
                            onInputChange={(_, newValue) => handleLogChange(index, 'suspension_reason', newValue || null)}
                            renderInput={(params) => (
                              <TextField {...params} label="Suspendido por" placeholder="Motivo de suspensión..." size="small" fullWidth />
                            )}
                          />
                          <TextField
                            label="Firma de" size="small" fullWidth placeholder="Nombre / Autorizó"
                            value={log.suspended_by || ''}
                            onChange={(e) => handleLogChange(index, 'suspended_by', e.target.value || null)}
                          />
                          <Stack direction="row" spacing={1.5}>
                            <Box flex={1}>
                              <TextField
                                type="time" label="Hora inicio" size="small" fullWidth
                                value={log.start_time || ''}
                                onChange={(e) => handleLogChange(index, 'start_time', e.target.value || null)}
                                slotProps={{ inputLabel: { shrink: true } }}
                              />
                              {hasComputedDiff && (
                                <Typography variant="caption" color="info.main" display="block" mt={0.5}>
                                  Fichajes: {log.computed_start_time || '—'} a {log.computed_end_time || '—'}
                                </Typography>
                              )}
                            </Box>
                            <Box flex={1}>
                              <TextField
                                type="time" label="Hora fin" size="small" fullWidth
                                value={log.end_time || ''}
                                onChange={(e) => handleLogChange(index, 'end_time', e.target.value || null)}
                                slotProps={{ inputLabel: { shrink: true } }}
                              />
                            </Box>
                          </Stack>
                          <TextField
                            label="Observaciones" size="small" fullWidth multiline minRows={2}
                            placeholder="Observaciones..."
                            value={log.observations || ''}
                            onChange={(e) => handleLogChange(index, 'observations', e.target.value || null)}
                          />
                        </Stack>
                      </Card>
                    );
                  })}
                </Stack>
              </Box>
              {/* Desktop Table */}
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell sx={{ fontWeight: 'bold', width: '13%' }}>Día / Fecha</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', width: '20%' }}>Suspendido Por</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', width: '17%' }}>Firma De</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', width: '13%' }}>Hora Inicio</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', width: '13%' }}>Hora Fin</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Detalles / Observaciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {weekLogs.map((log, index) => {
                    const isWeekend = log.day_name === 'Sábado' || log.day_name === 'Domingo';
                    const hasComputedDiff =
                      log.is_saved &&
                      (
                        (log.computed_start_time && log.computed_start_time !== log.start_time) ||
                        (log.computed_end_time && log.computed_end_time !== log.end_time)
                      );

                    return (
                      <TableRow
                        key={log.date}
                        sx={{
                          bgcolor: log.is_holiday
                            ? 'warning.50'
                            : isWeekend
                            ? 'grey.50'
                            : 'background.paper',
                        }}
                      >
                        {/* Day / Date column */}
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {log.day_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDateDisplay(log.date)}
                          </Typography>
                          {log.is_holiday && (
                            <Chip label={log.holiday_name || 'Feriado'} size="small" color="warning" sx={{ display: 'block', mt: 0.5, height: 18, fontSize: '0.65rem' }} />
                          )}
                        </TableCell>

                        {/* Suspendido Por */}
                        <TableCell>
                          <Autocomplete
                            freeSolo
                            options={PRESET_SUSPENSION_REASONS}
                            value={log.suspension_reason || ''}
                            onInputChange={(_, newValue) => handleLogChange(index, 'suspension_reason', newValue || null)}
                            renderInput={(params) => (
                              <TextField {...params} placeholder="Motivo de suspensión..." size="small" fullWidth />
                            )}
                          />
                        </TableCell>

                        {/* Firma De */}
                        <TableCell>
                          <TextField
                            size="small"
                            fullWidth
                            placeholder="Nombre / Autorizó"
                            value={log.suspended_by || ''}
                            onChange={(e) => handleLogChange(index, 'suspended_by', e.target.value || null)}
                          />
                        </TableCell>

                        {/* Hora Inicio */}
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <TextField
                              type="time"
                              size="small"
                              fullWidth
                              value={log.start_time || ''}
                              onChange={(e) => handleLogChange(index, 'start_time', e.target.value || null)}
                              slotProps={{ inputLabel: { shrink: true } }}
                            />
                            {hasComputedDiff && (
                              <Tooltip title={`Fichajes registrados: ${log.computed_start_time || '—'} a ${log.computed_end_time || '—'}`}>
                                <InfoIcon color="info" fontSize="small" />
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>

                        {/* Hora Fin */}
                        <TableCell>
                          <TextField
                            type="time"
                            size="small"
                            fullWidth
                            value={log.end_time || ''}
                            onChange={(e) => handleLogChange(index, 'end_time', e.target.value || null)}
                            slotProps={{ inputLabel: { shrink: true } }}
                          />
                        </TableCell>

                        {/* Detalles / Observaciones — se expande a textarea al hacer foco, para
                            editar cómodo el texto de tareas concatenado (puede ser largo) */}
                        <TableCell>
                          <TextField
                            size="small"
                            fullWidth
                            placeholder="Observaciones..."
                            value={log.observations || ''}
                            onChange={(e) => handleLogChange(index, 'observations', e.target.value || null)}
                            onFocus={() => setFocusedObsRow(index)}
                            onBlur={() => setFocusedObsRow(null)}
                            multiline={focusedObsRow === index}
                            minRows={focusedObsRow === index ? 3 : 1}
                            maxRows={focusedObsRow === index ? 8 : 1}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
              </Box>
            </>
          )}
        </Paper>
      )}

      {/* Tab 4 (o 3 si no tiene presupuesto): Presupuesto */}
      {tab === (hasBudgetsRead ? 4 : 99) && (
        <Paper sx={{ p: 3 }}>
          {!project.budget ? (
            <Typography color="text.secondary" textAlign="center" py={3}>Este proyecto no tiene un presupuesto vinculado.</Typography>
          ) : (
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Presupuesto {project.budget.number}</Typography>
                <Button size="small" onClick={() => router.push('/dashboard/budgets')}>Ver en módulo de Presupuestos</Button>
              </Box>
              <Typography variant="body2" color="text.secondary">{project.budget.title}</Typography>
              {project.budget.work_order_number && (
                <Typography variant="body2" color="text.secondary" mb={2}>N° OT: {project.budget.work_order_number}</Typography>
              )}

              <Typography variant="subtitle2" sx={{ mt: 2 }}>Mano de Obra</Typography>
              {/* Mobile Cards */}
              <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 2 }}>
                <Stack spacing={1}>
                  {(project.budget.laborLines || []).map((line, i) => (
                    <Card key={i} sx={{ p: 1.5, borderRadius: 2 }}>
                      <Typography variant="body2" fontWeight={600}>{line.itemType?.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {line.quantity} {line.itemType?.unit_label}
                        {hasPricesRead && ` · ${line.currency || project.budget?.currency} ${line.estimated_total}`}
                      </Typography>
                    </Card>
                  ))}
                </Stack>
              </Box>
              {/* Desktop Table */}
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <TableContainer sx={{ mb: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Rubro</TableCell>
                        <TableCell align="right">Cantidad</TableCell>
                        {hasPricesRead && <TableCell align="right">Estimado</TableCell>}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(project.budget.laborLines || []).map((line, i) => (
                        <TableRow key={i}>
                          <TableCell>{line.itemType?.name}</TableCell>
                          <TableCell align="right">{line.quantity} {line.itemType?.unit_label}</TableCell>
                          {hasPricesRead && <TableCell align="right">{line.currency || project.budget?.currency} {line.estimated_total}</TableCell>}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              <Typography variant="subtitle2">Materiales</Typography>
              {/* Mobile Cards */}
              <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                <Stack spacing={1}>
                  {(project.budget.materialItems || []).map((item, i) => (
                    <Card key={i} sx={{ p: 1.5, borderRadius: 2 }}>
                      <Typography variant="body2" fontWeight={600}>{item.description}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.quantity} {item.materialUnit?.label}
                        {hasPricesRead && ` · ${item.currency || project.budget?.currency} ${item.total_price}`}
                      </Typography>
                    </Card>
                  ))}
                </Stack>
              </Box>
              {/* Desktop Table */}
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Descripción</TableCell>
                        <TableCell align="right">Cantidad</TableCell>
                        {hasPricesRead && <TableCell align="right">Total</TableCell>}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(project.budget.materialItems || []).map((item, i) => (
                        <TableRow key={i}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell align="right">{item.quantity} {item.materialUnit?.label}</TableCell>
                          {hasPricesRead && <TableCell align="right">{item.currency || project.budget?.currency} {item.total_price}</TableCell>}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              {hasPricesRead && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box textAlign="right">
                    {(project.budget.labor_discount_percent ?? 0) > 0 && (
                      <Typography variant="body2" color="text.secondary">Bonificación mano de obra: {project.budget.labor_discount_percent}%</Typography>
                    )}
                    {(project.budget.material_discount_percent ?? 0) > 0 && (
                      <Typography variant="body2" color="text.secondary">Bonificación material: {project.budget.material_discount_percent}%</Typography>
                    )}
                    <Typography variant="h6" fontWeight="bold">Total: {formatTotals(project.budget.totals_by_currency)}</Typography>
                  </Box>
                </>
              )}
            </Box>
          )}
        </Paper>
      )}

      {/* Tab Pañol: Herramientas y grúas/vehículos asignados a este proyecto */}
      {tab === panolTabIndex && (
        <Paper sx={{ p: 3 }}>
          {loadingAssignments ? (
            <Box display="flex" justifyContent="center" py={3}><GearSpinner size={24} /></Box>
          ) : (
            <>
              <Typography variant="h6" fontWeight={700} mb={2}>Herramientas asignadas</Typography>
              {toolAssignments.length === 0 ? (
                <Typography color="text.secondary" mb={3}>No se asignó ninguna herramienta a este proyecto todavía.</Typography>
              ) : (
                <Box mb={4}>
                  {/* Mobile Cards */}
                  <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                    <Stack spacing={1}>
                      {toolAssignments.map(a => (
                        <Card key={a.id} sx={{ p: 1.5, borderRadius: 2 }}>
                          {a.tool ? (
                            <Typography variant="body2" fontWeight={600} display="flex" alignItems="center" gap={0.5}
                              sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                              onClick={() => router.push(`/dashboard/tools/${a.tool!.id}`)}>
                              {a.tool.name} ({a.tool.reference_code}) <OpenIcon fontSize="inherit" />
                            </Typography>
                          ) : (
                            <Typography variant="body2" fontWeight={600}>Herramienta eliminada</Typography>
                          )}
                          <Typography variant="body2">{a.employee ? `${a.employee.lastname}, ${a.employee.name}` : 'Sin responsable'}</Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Entrega: {a.delivered_date || '—'} · Devolución: {a.returned_date || '—'}
                          </Typography>
                          <Chip size="small" label={ASSIGNMENT_STATUS_LABELS[a.status]} color={ASSIGNMENT_STATUS_COLORS[a.status]} sx={{ mt: 0.5 }} />
                        </Card>
                      ))}
                    </Stack>
                  </Box>
                  {/* Desktop Table */}
                  <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'grey.50' }}>
                            <TableCell>Herramienta</TableCell><TableCell>Responsable</TableCell>
                            <TableCell>Entrega</TableCell><TableCell>Devolución</TableCell><TableCell>Estado</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {toolAssignments.map(a => (
                            <TableRow key={a.id} hover sx={{ cursor: a.tool ? 'pointer' : 'default' }} onClick={() => a.tool && router.push(`/dashboard/tools/${a.tool.id}`)}>
                              <TableCell>
                                {a.tool ? (
                                  <Box display="flex" alignItems="center" gap={0.5}>
                                    {a.tool.name} ({a.tool.reference_code}) <OpenIcon fontSize="inherit" />
                                  </Box>
                                ) : 'Herramienta eliminada'}
                              </TableCell>
                              <TableCell>{a.employee ? `${a.employee.lastname}, ${a.employee.name}` : '—'}</TableCell>
                              <TableCell>{a.delivered_date || '—'}</TableCell>
                              <TableCell>{a.returned_date || '—'}</TableCell>
                              <TableCell><Chip size="small" label={ASSIGNMENT_STATUS_LABELS[a.status]} color={ASSIGNMENT_STATUS_COLORS[a.status]} /></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                </Box>
              )}

              <Divider sx={{ mb: 3 }} />

              <Typography variant="h6" fontWeight={700} mb={2}>Grúas y vehículos asignados</Typography>
              {vehicleAssignments.length === 0 ? (
                <Typography color="text.secondary">No se asignó ninguna grúa/vehículo a este proyecto todavía.</Typography>
              ) : (
                <Box>
                  {/* Mobile Cards */}
                  <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                    <Stack spacing={1}>
                      {vehicleAssignments.map(a => (
                        <Card key={a.id} sx={{ p: 1.5, borderRadius: 2 }}>
                          {a.vehicle ? (
                            <Typography variant="body2" fontWeight={600} display="flex" alignItems="center" gap={0.5}
                              sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                              onClick={() => router.push(`/dashboard/vehicles/${a.vehicle!.id}`)}>
                              {[a.vehicle.brand, a.vehicle.model].filter(Boolean).join(' ')} — {a.vehicle.plate} <OpenIcon fontSize="inherit" />
                            </Typography>
                          ) : (
                            <Typography variant="body2" fontWeight={600}>Vehículo eliminado</Typography>
                          )}
                          <Typography variant="body2">{a.employee ? `${a.employee.lastname}, ${a.employee.name}` : 'Sin responsable'}</Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Entrega: {a.delivered_date || '—'} · Devolución: {a.returned_date || '—'}
                          </Typography>
                          <Chip size="small" label={ASSIGNMENT_STATUS_LABELS[a.status]} color={ASSIGNMENT_STATUS_COLORS[a.status]} sx={{ mt: 0.5 }} />
                        </Card>
                      ))}
                    </Stack>
                  </Box>
                  {/* Desktop Table */}
                  <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'grey.50' }}>
                            <TableCell>Grúa/Vehículo</TableCell><TableCell>Responsable</TableCell>
                            <TableCell>Entrega</TableCell><TableCell>Devolución</TableCell><TableCell>Estado</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {vehicleAssignments.map(a => (
                            <TableRow key={a.id} hover sx={{ cursor: a.vehicle ? 'pointer' : 'default' }} onClick={() => a.vehicle && router.push(`/dashboard/vehicles/${a.vehicle.id}`)}>
                              <TableCell>
                                {a.vehicle ? (
                                  <Box display="flex" alignItems="center" gap={0.5}>
                                    {[a.vehicle.brand, a.vehicle.model].filter(Boolean).join(' ')} — {a.vehicle.plate} <OpenIcon fontSize="inherit" />
                                  </Box>
                                ) : 'Vehículo eliminado'}
                              </TableCell>
                              <TableCell>{a.employee ? `${a.employee.lastname}, ${a.employee.name}` : '—'}</TableCell>
                              <TableCell>{a.delivered_date || '—'}</TableCell>
                              <TableCell>{a.returned_date || '—'}</TableCell>
                              <TableCell><Chip size="small" label={ASSIGNMENT_STATUS_LABELS[a.status]} color={ASSIGNMENT_STATUS_COLORS[a.status]} /></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                </Box>
              )}
            </>
          )}
        </Paper>
      )}

      {/* PRINT DIALOG */}
      <Dialog
        open={printDialogOpen}
        onClose={() => setPrintDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { overflow: 'visible' } }}
      >
        <DialogTitle className="no-print" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight="bold">Imprimir Planilla de Días Laborales</Typography>
          <Box display="flex" gap={1}>
            <Button
              variant="contained"
              startIcon={<PrintIcon />}
              onClick={handleTriggerPrint}
              disabled={loadingPrint || printWeeks.length === 0}
            >
              Imprimir / PDF
            </Button>
            <Button onClick={() => setPrintDialogOpen(false)}>Cerrar</Button>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {/* Print options control bar (hidden in print) */}
          <Paper className="no-print" variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
            <FormControl component="fieldset">
              <FormLabel component="legend" sx={{ fontWeight: 'bold', mb: 1 }}>Rango a Imprimir</FormLabel>
              <RadioGroup
                row
                value={printMode}
                onChange={(e) => {
                  const mode = e.target.value as 'all' | 'custom';
                  setPrintMode(mode);
                  fetchPrintData(mode, printFrom, printTo);
                }}
              >
                <FormControlLabel value="all" control={<Radio />} label="Proyecto Completo (Todas las semanas)" />
                <FormControlLabel value="custom" control={<Radio />} label="Rango Personalizado de Semanas" />
              </RadioGroup>
            </FormControl>

            {printMode === 'custom' && (
              <Box display="flex" alignItems="center" gap={2} mt={2}>
                <TextField
                  type="date"
                  label="Desde (Semana del)"
                  value={printFrom}
                  onChange={(e) => setPrintFrom(getMondayStr(e.target.value))}
                  size="small"
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  type="date"
                  label="Hasta (Semana del)"
                  value={printTo}
                  onChange={(e) => setPrintTo(getMondayStr(e.target.value))}
                  size="small"
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<RefreshIcon />}
                  onClick={() => fetchPrintData('custom', printFrom, printTo)}
                >
                  Actualizar Vista Previa
                </Button>
              </Box>
            )}
          </Paper>

          {/* Printable Container matching client's paper design */}
          {loadingPrint ? (
            <Box display="flex" justifyContent="center" py={6} className="no-print">
              <GearSpinner />
            </Box>
          ) : printWeeks.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={4} className="no-print">
              No hay planillas disponibles para el rango seleccionado.
            </Typography>
          ) : (
            <Box className="print-area">
              {printWeeks.map((week, weekIndex) => (
                <Box
                  key={week.week_start}
                  sx={{
                    mb: 4,
                    pageBreakAfter: weekIndex < printWeeks.length - 1 ? 'always' : 'auto',
                    breakAfter: weekIndex < printWeeks.length - 1 ? 'page' : 'auto',
                  }}
                >
                  {/* Paper Header */}
                  <Box textAlign="center" mb={1}>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ letterSpacing: 0.5 }}>
                      SEMANA DEL {formatDateDisplay(week.week_start)} AL {formatDateDisplay(week.week_end)}
                    </Typography>
                    <Typography variant="h5" fontWeight="bold" sx={{ textTransform: 'uppercase', mt: 0.5 }}>
                      {project.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      CÓDIGO: {project.code} {project.client ? ` | CLIENTE: ${project.client.razonSocial}` : ''} {project.plant ? ` | PLANTA: ${project.plant.name}` : ''}
                    </Typography>
                  </Box>

                  {/* Black header paper table */}
                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 0, border: '2px solid black' }}>
                    <Table size="small" sx={{ borderCollapse: 'collapse' }}>
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'black' }}>
                          <TableCell sx={{ color: 'white', fontWeight: 'bold', border: '1px solid black', width: '12%', textAlign: 'center' }}>
                            DÍA
                          </TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 'bold', border: '1px solid black', width: '18%', textAlign: 'center' }}>
                            SUSPENDIDO POR
                          </TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 'bold', border: '1px solid black', width: '16%', textAlign: 'center' }}>
                            FIRMA DE
                          </TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 'bold', border: '1px solid black', width: '12%', textAlign: 'center' }}>
                            HORA DE INICIO
                          </TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 'bold', border: '1px solid black', width: '14%', textAlign: 'center' }}>
                            HORA DE FINALIZACIÓN
                          </TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 'bold', border: '1px solid black', textAlign: 'center' }}>
                            DETALLES / OBSERVACIONES
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {week.days.map((day) => {
                          const hasData = day.start_time || day.end_time || day.suspension_reason || day.suspended_by || day.observations;
                          return (
                            <TableRow key={day.date} sx={{ height: 48 }}>
                              {/* Día */}
                              <TableCell sx={{ border: '1px solid black', verticalAlign: 'middle' }}>
                                <Typography variant="body2" fontWeight="bold">
                                  {day.day_name}
                                </Typography>
                                <Typography variant="caption" display="block">
                                  {formatDateDisplay(day.date)}
                                </Typography>
                              </TableCell>

                              {/* Suspendido por */}
                              <TableCell sx={{ border: '1px solid black', verticalAlign: 'middle', textAlign: day.suspension_reason ? 'left' : 'center' }}>
                                {day.suspension_reason || '—'}
                              </TableCell>

                              {/* Firma de */}
                              <TableCell sx={{ border: '1px solid black', verticalAlign: 'middle', textAlign: day.suspended_by ? 'left' : 'center' }}>
                                {day.suspended_by || '—'}
                              </TableCell>

                              {/* Hora Inicio */}
                              <TableCell sx={{ border: '1px solid black', verticalAlign: 'middle', textAlign: 'center' }}>
                                {day.start_time || '—'}
                              </TableCell>

                              {/* Hora Fin */}
                              <TableCell sx={{ border: '1px solid black', verticalAlign: 'middle', textAlign: 'center' }}>
                                {day.end_time || '—'}
                              </TableCell>

                              {/* Observaciones */}
                              <TableCell sx={{ border: '1px solid black', verticalAlign: 'middle' }}>
                                {day.observations || (hasData ? '' : '—')}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>

        <DialogActions className="no-print" sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPrintDialogOpen(false)}>Cerrar</Button>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={handleTriggerPrint}
            disabled={loadingPrint || printWeeks.length === 0}
          >
            Imprimir / Exportar PDF
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast Notification */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
