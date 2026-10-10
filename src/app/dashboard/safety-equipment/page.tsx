'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Box, Typography, Button, Paper, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Stack, Chip, IconButton, Tooltip, FormControlLabel, Checkbox, Grid,
  Tabs, Tab, InputAdornment,
} from '@mui/material';
import FeedbackModal from '../../../components/FeedbackModal';
import GearSpinner from '../../../components/GearSpinner';
import {
  AddOutlined as AddIcon, RefreshOutlined as RefreshIcon, SettingsOutlined as SettingsIcon,
  EditOutlined as EditIcon, ToggleOnOutlined as ToggleOnIcon, ToggleOffOutlined as ToggleOffIcon,
  SecurityOutlined as TitleIcon, ClearOutlined as ClearIcon, SearchOutlined as SearchIcon,
  WarningAmberOutlined as WarningIcon, ChevronRightOutlined as ChevronRightIcon,
} from '@mui/icons-material';
import DateField from '../../../components/DateField';
import SignaturePad from '../../../components/SignaturePad';
import EppDeliveriesList from '../../../components/safety-equipment/EppDeliveriesList';
import EmployeeSizesPanel from '../../../components/safety-equipment/EmployeeSizesPanel';
import {
  SafetyEquipment, SafetyEquipmentService, SafetyEquipmentStatusFilter,
  Employee, EmployeeService,
  EmployeeSize, EmployeeSizeService,
  EppItem, EppItemService, EppCategory, EppSizeType,
} from '../../../utils/api';
import { CATEGORY_LABELS, SIZE_TYPE_LABELS } from '../../../utils/epp';

// Vida útil del artículo -> fecha de vencimiento sugerida (mismo cálculo que
// helpers/eppExpiration.js en el backend, para que el valor mostrado antes de guardar coincida
// con el que el servidor va a persistir).
function addMonths(dateOnly: string, months: number): string {
  const [year, month, day] = dateOnly.split('-').map(Number);
  const targetMonthIndex = month - 1 + months;
  const lastDayOfTargetMonth = new Date(year, targetMonthIndex + 1, 0).getDate();
  const clampedDay = Math.min(day, lastDayOfTargetMonth);
  const result = new Date(year, targetMonthIndex, clampedDay);
  const yyyy = result.getFullYear();
  const mm = String(result.getMonth() + 1).padStart(2, '0');
  const dd = String(result.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

const STATUS_FILTER_LABELS: Record<SafetyEquipmentStatusFilter, string> = {
  current: 'Vigentes',
  renewed: 'Renovadas',
  permanent: 'Sin vencimiento',
  expiring_soon: 'Por vencer',
  expired: 'Vencidos',
  alert: 'Vencidos o por vencer',
};

export default function SafetyEquipmentPage() {
  const searchParams = useSearchParams();

  // Si se llega con ?employee_id= (desde el tab EPP del legajo, o desde el aviso de la
  // portada), el destino es la pestaña de Entregas ya filtrada por ese empleado — no la de
  // Por Empleado, que es para navegar libremente.
  const [activeTab, setActiveTab] = useState(() => (searchParams.get('employee_id') ? 1 : 0));

  const [equipment, setEquipment] = useState<SafetyEquipment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  // Catálogo completo (activos e inactivos): hace falta para poder filtrar entregas históricas
  // de un artículo que ya se desactivó. `activeEppItems` (derivado) es el que se ofrece para
  // entregas nuevas.
  const [allEppItems, setAllEppItems] = useState<EppItem[]>([]);
  // Entregas vigentes (status=current) de TODOS los empleados — alimenta el resumen de la
  // pestaña "Por Empleado" (cantidad entregada y aviso de vencimiento). Independiente de los
  // filtros de la pestaña "Entregas".
  const [currentHoldings, setCurrentHoldings] = useState<SafetyEquipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processing, setProcessing] = useState(false);

  // Employee tab
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyEmployee, setHistoryEmployee] = useState<Employee | null>(null);
  const [employeeHistory, setEmployeeHistory] = useState<SafetyEquipment[]>([]);
  const [employeeSizesInDialog, setEmployeeSizesInDialog] = useState<EmployeeSize[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Filters
  const [filterEmployee, setFilterEmployee] = useState<number | ''>(() => {
    const qp = searchParams.get('employee_id');
    return qp ? Number(qp) : '';
  });
  const [filterEppItem, setFilterEppItem] = useState<number | ''>('');
  const [filterCategory, setFilterCategory] = useState<EppCategory | ''>('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterStatus, setFilterStatus] = useState<SafetyEquipmentStatusFilter | ''>('current');

  // Delivery dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState({
    employee_id: '',
    epp_item_id: '',
    size_delivered: '',
    quantity: 1,
    delivered_date: new Date().toISOString().split('T')[0],
    expiration_date: '',
    no_expiration: false,
    condition: 'new',
    notes: '',
  });
  // Entrega vigente que se está renovando (si se abrió el diálogo desde el botón "Renovar").
  const [renewingFrom, setRenewingFrom] = useState<SafetyEquipment | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);

  // Catalog dialog
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [catalogForm, setCatalogForm] = useState({
    name: '', category: 'other' as EppCategory, size_type: 'none' as EppSizeType,
    lifespan_months: '', notify_days_before: '15',
  });
  const [editingCatalogItem, setEditingCatalogItem] = useState<EppItem | null>(null);
  const [catalogDialogOpen, setCatalogDialogOpen] = useState(false);

  // Solo los artículos activos se ofrecen para entregas nuevas; el catálogo completo
  // (allEppItems) sigue disponible para filtrar entregas históricas y para administrarlo.
  const activeEppItems = useMemo(() => allEppItems.filter(i => i.is_active), [allEppItems]);

  const buildEquipmentFilters = () => ({
    employee_id: filterEmployee || undefined,
    epp_item_id: filterEppItem || undefined,
    category: filterCategory || undefined,
    date_from: filterDateFrom || undefined,
    date_to: filterDateTo || undefined,
    status: filterStatus || undefined,
  });

  const loadEquipment = async () => {
    try {
      const eqs = await SafetyEquipmentService.getAll(buildEquipmentFilters());
      setEquipment(eqs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar');
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [emps, items, holdings] = await Promise.all([
        EmployeeService.getAll('active'),
        EppItemService.getAll(true),
        SafetyEquipmentService.getAll({ status: 'current' }),
      ]);
      setEmployees(emps);
      setAllEppItems(items);
      setCurrentHoldings(holdings);
      await loadEquipment();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData(); }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (!loading) loadEquipment(); }, [filterEmployee, filterEppItem, filterCategory, filterDateFrom, filterDateTo, filterStatus]);

  const clearFilters = () => {
    setFilterEmployee('');
    setFilterEppItem('');
    setFilterCategory('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterStatus('current');
  };

  // Resumen por empleado para la pestaña "Por Empleado": cantidad de artículos que tiene
  // actualmente (vigentes, no renovados) y si alguno está vencido o por vencer.
  const employeeEppSummary = useMemo(() => {
    const map = new Map<number, { count: number; hasAlert: boolean }>();
    for (const item of currentHoldings) {
      const entry = map.get(item.employee_id) || { count: 0, hasAlert: false };
      entry.count += 1;
      if (item.computed_status === 'expired' || item.computed_status === 'expiring_soon') entry.hasAlert = true;
      map.set(item.employee_id, entry);
    }
    return map;
  }, [currentHoldings]);

  const filteredEmployeesForEpp = useMemo(() => {
    const q = employeeSearch.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(e => `${e.name} ${e.lastname} ${e.dni}`.toLowerCase().includes(q));
  }, [employees, employeeSearch]);

  const handleOpenEmployeeHistory = async (emp: Employee) => {
    setHistoryEmployee(emp);
    setHistoryOpen(true);
    setLoadingHistory(true);
    try {
      const [history, sizes] = await Promise.all([
        SafetyEquipmentService.getAll({ employee_id: emp.id }),
        EmployeeSizeService.list(emp.id),
      ]);
      setEmployeeHistory(history);
      setEmployeeSizesInDialog(sizes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar historial');
    } finally {
      setLoadingHistory(false);
    }
  };

  // Get the selected EPP item to determine size behavior
  const selectedEppItem = useMemo(() => {
    if (!form.epp_item_id) return null;
    return activeEppItems.find(i => i.id === Number(form.epp_item_id)) || null;
  }, [form.epp_item_id, activeEppItems]);

  // Get the selected employee for size pre-fill
  const selectedEmployee = useMemo(() => {
    if (!form.employee_id) return null;
    return employees.find(e => e.id === Number(form.employee_id)) || null;
  }, [form.employee_id, employees]);

  // Talles adicionales del empleado seleccionado (cargados aparte porque el listado de
  // empleados no los trae, para no abultar ese fetch).
  const [selectedEmployeeSizes, setSelectedEmployeeSizes] = useState<EmployeeSize[]>([]);
  useEffect(() => {
    if (!form.employee_id) {
      setSelectedEmployeeSizes([]);
      return;
    }
    EmployeeSizeService.list(Number(form.employee_id))
      .then(setSelectedEmployeeSizes)
      .catch(() => setSelectedEmployeeSizes([]));
  }, [form.employee_id]);

  // Auto pre-fill size when employee or item changes. Match exacto contra EmployeeSizes — ya
  // cubre los talles básicos (Botín/Camiseta/Pantalón) desde que se backfillearon, así que no
  // hace falta ninguna heurística por categoría.
  useEffect(() => {
    if (!selectedEppItem || !selectedEmployee) return;
    if (selectedEppItem.size_type === 'none') {
      setForm(f => ({ ...f, size_delivered: '' }));
      return;
    }

    const exactMatch = selectedEmployeeSizes.find(s => s.epp_item_id === selectedEppItem.id)?.size;
    if (exactMatch) {
      setForm(f => ({ ...f, size_delivered: exactMatch }));
    }
  }, [selectedEppItem, selectedEmployee, selectedEmployeeSizes]);

  // Sugiere el vencimiento (fecha de entrega + vida útil del artículo), editable por el usuario.
  useEffect(() => {
    if (!selectedEppItem) return;
    if (form.no_expiration) return;
    if (!selectedEppItem.lifespan_months) {
      setForm(f => ({ ...f, expiration_date: '' }));
      return;
    }
    if (!form.delivered_date) return;
    const suggested = addMonths(form.delivered_date, selectedEppItem.lifespan_months);
    setForm(f => ({ ...f, expiration_date: suggested }));
  }, [selectedEppItem, form.delivered_date, form.no_expiration]);

  const resetForm = () => {
    setForm({
      employee_id: '', epp_item_id: '', size_delivered: '', quantity: 1,
      delivered_date: new Date().toISOString().split('T')[0], expiration_date: '', no_expiration: false,
      condition: 'new', notes: '',
    });
    setRenewingFrom(null);
    setSignatureFile(null);
  };

  const handleOpenDeliveryDialog = () => {
    resetForm();
    setOpenDialog(true);
  };

  const handleRenew = (eq: SafetyEquipment) => {
    setHistoryOpen(false);
    setRenewingFrom(eq);
    setSignatureFile(null);
    setForm({
      employee_id: String(eq.employee_id),
      epp_item_id: String(eq.epp_item_id),
      size_delivered: eq.size_delivered || '',
      quantity: eq.quantity || 1,
      delivered_date: new Date().toISOString().split('T')[0],
      expiration_date: '',
      no_expiration: false,
      condition: 'new',
      notes: '',
    });
    setOpenDialog(true);
  };

  // Atajo desde el diálogo de historial de la pestaña "Por Empleado": abre el formulario de
  // entrega con el empleado ya elegido.
  const handleRegisterForEmployee = (emp: Employee) => {
    setHistoryOpen(false);
    resetForm();
    setForm(f => ({ ...f, employee_id: String(emp.id) }));
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    if (!form.employee_id || !form.epp_item_id || !form.delivered_date) {
      setError('Empleado, artículo y fecha son obligatorios');
      return;
    }
    if (processing) return;
    setProcessing(true);
    try {
      await SafetyEquipmentService.create({
        employee_id: Number(form.employee_id),
        epp_item_id: Number(form.epp_item_id),
        size_delivered: form.size_delivered || undefined,
        quantity: form.quantity,
        delivered_date: form.delivered_date,
        expiration_date: form.no_expiration ? null : (form.expiration_date || null),
        condition: form.condition,
        notes: form.notes,
      }, signatureFile);
      setSuccess(renewingFrom ? 'Entrega renovada' : 'Entrega de EPP registrada');
      setOpenDialog(false);
      resetForm();
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setProcessing(false);
    }
  };

  // ─── Catalog Management ───
  const loadCatalog = async () => {
    try {
      const items = await EppItemService.getAll(true);
      setAllEppItems(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar catálogo');
    }
  };

  const handleOpenCatalog = () => {
    loadCatalog();
    setCatalogOpen(true);
  };

  const handleCatalogSubmit = async () => {
    if (!catalogForm.name || !catalogForm.category) {
      setError('Nombre y categoría son obligatorios');
      return;
    }
    if (processing) return;
    setProcessing(true);
    try {
      const payload = {
        name: catalogForm.name,
        category: catalogForm.category,
        size_type: catalogForm.size_type,
        lifespan_months: catalogForm.lifespan_months ? Number(catalogForm.lifespan_months) : null,
        notify_days_before: catalogForm.notify_days_before ? Number(catalogForm.notify_days_before) : 15,
      };
      if (editingCatalogItem) {
        await EppItemService.update(editingCatalogItem.id, payload);
        setSuccess('Artículo actualizado');
      } else {
        await EppItemService.create(payload);
        setSuccess('Artículo creado');
      }
      setCatalogDialogOpen(false);
      setEditingCatalogItem(null);
      setCatalogForm({ name: '', category: 'other', size_type: 'none', lifespan_months: '', notify_days_before: '15' });
      loadCatalog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar artículo');
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleCatalogItem = async (item: EppItem) => {
    try {
      await EppItemService.toggleActive(item.id);
      setSuccess(item.is_active ? 'Artículo desactivado' : 'Artículo activado');
      loadCatalog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar estado');
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px"><GearSpinner /></Box>;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Box display="flex" alignItems="center" gap={1}>
          <TitleIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" fontWeight={700} letterSpacing="-0.02em" color="#1E293B">Entrega de EPP</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<SettingsIcon />} onClick={handleOpenCatalog} size="small">Catálogo</Button>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadData} size="small">Actualizar</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenDeliveryDialog} size="small">Registrar Entrega</Button>
        </Box>
      </Box>

      <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />
      <FeedbackModal open={!!success} onClose={() => setSuccess('')} message={success} type="success" />

      <Paper sx={{ mb: 2 }}>
        <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)}>
          <Tab label="Por Empleado" />
          <Tab label="Entregas" />
        </Tabs>
      </Paper>

      {/* ─── Tab 0: Por Empleado ─── */}
      {activeTab === 0 && (
        <Box>
          <TextField
            placeholder="Buscar por nombre, apellido o DNI..."
            fullWidth size="small" sx={{ mb: 2 }}
            value={employeeSearch} onChange={(e) => setEmployeeSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
          />

          {/* Mobile Cards */}
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            {filteredEmployeesForEpp.length === 0 ? (
              <Typography color="text.secondary" textAlign="center" py={4}>No se encontraron empleados</Typography>
            ) : (
              <Stack spacing={2}>
                {filteredEmployeesForEpp.map(emp => {
                  const summary = employeeEppSummary.get(emp.id);
                  return (
                    <Card key={emp.id} sx={{ p: 2, cursor: 'pointer' }} onClick={() => handleOpenEmployeeHistory(emp)}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" gap={1}>
                        <Box>
                          <Typography fontWeight="bold">{emp.lastname}, {emp.name}</Typography>
                          <Typography variant="body2" color="text.secondary">DNI {emp.dni}</Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          {summary?.hasAlert && <WarningIcon color="warning" fontSize="small" />}
                          <Typography variant="body2" color="text.secondary">{summary?.count || 0} artículo{(summary?.count || 0) === 1 ? '' : 's'}</Typography>
                          <ChevronRightIcon color="action" />
                        </Box>
                      </Box>
                    </Card>
                  );
                })}
              </Stack>
            )}
          </Box>

          {/* Desktop Table */}
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell><strong>Empleado</strong></TableCell>
                    <TableCell><strong>DNI</strong></TableCell>
                    <TableCell align="center"><strong>Artículos Entregados</strong></TableCell>
                    <TableCell align="center"><strong>Aviso</strong></TableCell>
                    <TableCell align="center"></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredEmployeesForEpp.length === 0 ? (
                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}><Typography variant="body2" color="text.secondary">No se encontraron empleados</Typography></TableCell></TableRow>
                  ) : (
                    filteredEmployeesForEpp.map(emp => {
                      const summary = employeeEppSummary.get(emp.id);
                      return (
                        <TableRow key={emp.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleOpenEmployeeHistory(emp)}>
                          <TableCell>{emp.lastname}, {emp.name}</TableCell>
                          <TableCell>{emp.dni}</TableCell>
                          <TableCell align="center">{summary?.count || 0}</TableCell>
                          <TableCell align="center">{summary?.hasAlert && <WarningIcon color="warning" fontSize="small" />}</TableCell>
                          <TableCell align="center"><ChevronRightIcon color="action" fontSize="small" /></TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Box>
      )}

      {/* ─── Tab 1: Entregas ─── */}
      {activeTab === 1 && (
      <Box>
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField label="Empleado" select size="small" fullWidth
              value={filterEmployee}
              onChange={(e) => setFilterEmployee(e.target.value ? Number(e.target.value) : '')}
              SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
              <option value="">Todos los empleados</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.lastname}, {e.name}</option>)}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField label="Categoría" select size="small" fullWidth
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as EppCategory | '')}
              SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
              <option value="">Todas las categorías</option>
              {Object.entries(CATEGORY_LABELS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField label="Artículo" select size="small" fullWidth
              value={filterEppItem}
              onChange={(e) => setFilterEppItem(e.target.value ? Number(e.target.value) : '')}
              SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
              <option value="">Todos los artículos</option>
              {allEppItems.map(i => <option key={i.id} value={i.id}>{i.name}{!i.is_active ? ' (inactivo)' : ''}</option>)}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField label="Estado" select size="small" fullWidth
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as SafetyEquipmentStatusFilter | '')}
              SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
              <option value="">Todos los estados</option>
              {Object.entries(STATUS_FILTER_LABELS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <DateField label="Entregado desde" size="small" fullWidth
              value={filterDateFrom} onChange={setFilterDateFrom}
              InputLabelProps={{ shrink: true }} />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <DateField label="Entregado hasta" size="small" fullWidth
              value={filterDateTo} onChange={setFilterDateTo}
              InputLabelProps={{ shrink: true }} />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Button startIcon={<ClearIcon />} onClick={clearFilters} size="small">Limpiar filtros</Button>
          </Grid>
        </Grid>
      </Paper>

      <EppDeliveriesList deliveries={equipment} variant="full" onRenew={handleRenew} />
      </Box>
      )}

      {/* ─── Employee History Dialog ─── */}
      <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center" gap={1} flexWrap="wrap">
            <Typography variant="h6">
              {historyEmployee ? `${historyEmployee.lastname}, ${historyEmployee.name} — Historial EPP` : 'Historial EPP'}
            </Typography>
            {historyEmployee && (
              <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => handleRegisterForEmployee(historyEmployee)}>
                Registrar Entrega
              </Button>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {loadingHistory ? (
            <Box display="flex" justifyContent="center" py={4}><GearSpinner /></Box>
          ) : (
            <Stack spacing={3}>
              <Box>
                <Typography variant="subtitle1" fontWeight={600} mb={1}>Talles</Typography>
                {historyEmployee && (
                  <EmployeeSizesPanel
                    employeeId={historyEmployee.id}
                    sizes={employeeSizesInDialog}
                    catalog={allEppItems}
                    onChanged={() => handleOpenEmployeeHistory(historyEmployee)}
                    onError={setError}
                  />
                )}
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={600} mb={1}>Entregas</Typography>
                <EppDeliveriesList
                  deliveries={employeeHistory}
                  variant="compact"
                  onRenew={handleRenew}
                  emptyMessage="Este empleado no tiene entregas de EPP registradas"
                />
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* ─── Delivery Dialog ─── */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{renewingFrom ? 'Renovar Entrega de EPP' : 'Registrar Entrega de EPP'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Empleado *" select fullWidth value={form.employee_id}
              onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
              SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
              <option value="">Seleccionar empleado</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.lastname}, {e.name}</option>)}
            </TextField>

            <TextField label="Artículo EPP *" select fullWidth value={form.epp_item_id}
              onChange={(e) => setForm({ ...form, epp_item_id: e.target.value, size_delivered: '' })}
              SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
              <option value="">Seleccionar artículo</option>
              {Object.entries(CATEGORY_LABELS).map(([cat, label]) => {
                const items = activeEppItems.filter(i => i.category === cat);
                if (items.length === 0) return null;
                return (
                  <optgroup key={cat} label={label}>
                    {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </optgroup>
                );
              })}
            </TextField>

            {selectedEppItem && selectedEppItem.size_type !== 'none' && (
              <TextField
                label={`Talle entregado (${SIZE_TYPE_LABELS[selectedEppItem.size_type]})`}
                fullWidth
                value={form.size_delivered}
                onChange={(e) => setForm({ ...form, size_delivered: e.target.value })}
                placeholder={selectedEppItem.size_type === 'numeric' ? 'Ej: 42' : 'Ej: XL'}
                helperText={
                  form.size_delivered && selectedEmployee
                    ? `Pre-completado del legajo de ${selectedEmployee.name}`
                    : selectedEppItem.size_type === 'numeric' ? 'Talle numérico' : 'Talle S/M/L/XL/XXL'
                }
              />
            )}

            <TextField label="Cantidad" type="number" fullWidth value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: Math.max(1, Number(e.target.value)) })}
              inputProps={{ min: 1 }} />

            <DateField label="Fecha de entrega *" fullWidth value={form.delivered_date}
              onChange={(val) => setForm({ ...form, delivered_date: val })}
              InputLabelProps={{ shrink: true }} />

            <FormControlLabel
              control={
                <Checkbox
                  checked={form.no_expiration}
                  onChange={(e) => setForm({ ...form, no_expiration: e.target.checked, expiration_date: e.target.checked ? '' : form.expiration_date })}
                />
              }
              label="Sin vencimiento (se entrega a demanda)"
            />

            {!form.no_expiration && (
              <DateField label="Vencimiento" fullWidth value={form.expiration_date}
                onChange={(val) => setForm({ ...form, expiration_date: val })}
                InputLabelProps={{ shrink: true }}
                helperText={
                  selectedEppItem?.lifespan_months
                    ? `Sugerido: ${selectedEppItem.lifespan_months} mes${selectedEppItem.lifespan_months === 1 ? '' : 'es'} de vida útil`
                    : 'Este artículo no tiene vida útil configurada en el catálogo'
                } />
            )}

            <TextField label="Estado del artículo" select fullWidth value={form.condition}
              onChange={(e) => setForm({ ...form, condition: e.target.value })}
              SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
              <option value="new">Nuevo</option>
              <option value="good">Buen estado (Usado)</option>
              <option value="worn">Desgastado</option>
            </TextField>

            <TextField label="Notas" fullWidth multiline rows={2} value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })} />

            <SignaturePad label="Firma del empleado (opcional)" onChange={setSignatureFile} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={processing}>
            {processing ? <GearSpinner size={20} /> : 'Registrar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Catalog Management Dialog ─── */}
      <Dialog open={catalogOpen} onClose={() => setCatalogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Catálogo de Artículos EPP</Typography>
            <Button variant="contained" size="small" startIcon={<AddIcon />}
              onClick={() => { setEditingCatalogItem(null); setCatalogForm({ name: '', category: 'other', size_type: 'none', lifespan_months: '', notify_days_before: '15' }); setCatalogDialogOpen(true); }}>
              Nuevo Artículo
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell><strong>Nombre</strong></TableCell>
                  <TableCell><strong>Categoría</strong></TableCell>
                  <TableCell><strong>Tipo de Talle</strong></TableCell>
                  <TableCell><strong>Vida útil</strong></TableCell>
                  <TableCell><strong>Estado</strong></TableCell>
                  <TableCell align="center"><strong>Acciones</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {allEppItems.map(item => (
                  <TableRow key={item.id} hover sx={{ opacity: item.is_active ? 1 : 0.5 }}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell><Chip label={CATEGORY_LABELS[item.category]} size="small" variant="outlined" /></TableCell>
                    <TableCell>{SIZE_TYPE_LABELS[item.size_type]}</TableCell>
                    <TableCell>{item.lifespan_months ? `${item.lifespan_months} mes${item.lifespan_months === 1 ? '' : 'es'}` : 'Sin vencimiento'}</TableCell>
                    <TableCell>
                      <Chip label={item.is_active ? 'Activo' : 'Inactivo'} size="small"
                        color={item.is_active ? 'success' : 'default'} />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Editar">
                        <IconButton size="small" color="primary" onClick={() => {
                          setEditingCatalogItem(item);
                          setCatalogForm({
                            name: item.name, category: item.category, size_type: item.size_type,
                            lifespan_months: item.lifespan_months != null ? String(item.lifespan_months) : '',
                            notify_days_before: item.notify_days_before != null ? String(item.notify_days_before) : '15',
                          });
                          setCatalogDialogOpen(true);
                        }}><EditIcon fontSize="small" /></IconButton>
                      </Tooltip>
                      <Tooltip title={item.is_active ? 'Desactivar' : 'Activar'}>
                        <IconButton size="small" color={item.is_active ? 'warning' : 'success'}
                          onClick={() => handleToggleCatalogItem(item)}>
                          {item.is_active ? <ToggleOffIcon fontSize="small" /> : <ToggleOnIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCatalogOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* ─── Catalog Create/Edit Sub-dialog ─── */}
      <Dialog open={catalogDialogOpen} onClose={() => setCatalogDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editingCatalogItem ? 'Editar Artículo' : 'Nuevo Artículo'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Nombre *" fullWidth value={catalogForm.name}
              onChange={(e) => setCatalogForm({ ...catalogForm, name: e.target.value })}
              placeholder="Ej: Botín de Seguridad" />

            <TextField label="Categoría *" select fullWidth value={catalogForm.category}
              onChange={(e) => setCatalogForm({ ...catalogForm, category: e.target.value as EppCategory })}
              SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
              {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </TextField>

            <TextField label="Tipo de Talle" select fullWidth value={catalogForm.size_type}
              onChange={(e) => setCatalogForm({ ...catalogForm, size_type: e.target.value as EppSizeType })}
              SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
              {Object.entries(SIZE_TYPE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </TextField>

            <TextField label="Vida útil (meses)" type="number" fullWidth value={catalogForm.lifespan_months}
              onChange={(e) => setCatalogForm({ ...catalogForm, lifespan_months: e.target.value })}
              placeholder="Ej: 4" inputProps={{ min: 1 }}
              helperText="Vacío = sin vencimiento, se entrega a demanda (ej. guantes)" />

            <TextField label="Avisar días antes" type="number" fullWidth value={catalogForm.notify_days_before}
              onChange={(e) => setCatalogForm({ ...catalogForm, notify_days_before: e.target.value })}
              inputProps={{ min: 1 }} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCatalogDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleCatalogSubmit} variant="contained" disabled={processing}>
            {processing ? <GearSpinner size={20} /> : (editingCatalogItem ? 'Guardar' : 'Crear')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
