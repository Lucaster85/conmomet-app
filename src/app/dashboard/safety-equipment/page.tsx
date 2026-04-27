'use client';
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Dialog, DialogTitle, DialogContent,
  DialogActions, CircularProgress, TextField, Stack, Chip, IconButton, Tooltip
} from '@mui/material';
import FeedbackModal from '../../../components/FeedbackModal';
import {
  Add as AddIcon, Refresh as RefreshIcon, Settings as SettingsIcon,
  Edit as EditIcon, ToggleOn as ToggleOnIcon, ToggleOff as ToggleOffIcon,
} from '@mui/icons-material';
import {
  SafetyEquipment, SafetyEquipmentService,
  Employee, EmployeeService,
  EppItem, EppItemService, EppCategory, EppSizeType,
} from '../../../utils/api';

const CONDITION_COLORS: Record<string, "success" | "info" | "warning" | "error"> = {
  new: 'success',
  good: 'info',
  worn: 'warning',
  damaged: 'error',
};

const CONDITION_LABELS: Record<string, string> = {
  new: 'Nuevo',
  good: 'Buen estado',
  worn: 'Desgastado',
  damaged: 'Dañado',
};

const CATEGORY_LABELS: Record<EppCategory, string> = {
  footwear: 'Calzado',
  clothing: 'Indumentaria',
  head_protection: 'Protección Cabeza',
  hand_protection: 'Protección Manos',
  eye_protection: 'Protección Ocular',
  other: 'Otros',
};

const SIZE_TYPE_LABELS: Record<EppSizeType, string> = {
  none: 'Sin talle',
  numeric: 'Numérico',
  alpha: 'Alfabético',
};

export default function SafetyEquipmentPage() {
  const [equipment, setEquipment] = useState<SafetyEquipment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [eppItems, setEppItems] = useState<EppItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Delivery dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState({
    employee_id: '',
    epp_item_id: '',
    size_delivered: '',
    quantity: 1,
    delivered_date: new Date().toISOString().split('T')[0],
    condition: 'new',
    notes: '',
  });

  // Catalog dialog
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [allEppItems, setAllEppItems] = useState<EppItem[]>([]);
  const [catalogForm, setCatalogForm] = useState({ name: '', category: 'other' as EppCategory, size_type: 'none' as EppSizeType });
  const [editingCatalogItem, setEditingCatalogItem] = useState<EppItem | null>(null);
  const [catalogDialogOpen, setCatalogDialogOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [eqs, emps, items] = await Promise.all([
        SafetyEquipmentService.getAll(),
        EmployeeService.getAll('active'),
        EppItemService.getAll(),
      ]);
      setEquipment(eqs);
      setEmployees(emps);
      setEppItems(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Get the selected EPP item to determine size behavior
  const selectedEppItem = useMemo(() => {
    if (!form.epp_item_id) return null;
    return eppItems.find(i => i.id === Number(form.epp_item_id)) || null;
  }, [form.epp_item_id, eppItems]);

  // Get the selected employee for size pre-fill
  const selectedEmployee = useMemo(() => {
    if (!form.employee_id) return null;
    return employees.find(e => e.id === Number(form.employee_id)) || null;
  }, [form.employee_id, employees]);

  // Auto pre-fill size when employee or item changes
  useEffect(() => {
    if (!selectedEppItem || !selectedEmployee) return;
    if (selectedEppItem.size_type === 'none') {
      setForm(f => ({ ...f, size_delivered: '' }));
      return;
    }

    let prefill = '';
    if (selectedEppItem.category === 'footwear' && selectedEmployee.shoe_size) {
      prefill = selectedEmployee.shoe_size;
    } else if (selectedEppItem.category === 'clothing' && selectedEppItem.size_type === 'alpha' && selectedEmployee.shirt_size) {
      prefill = selectedEmployee.shirt_size;
    } else if (selectedEppItem.category === 'hand_protection' && selectedEmployee.shirt_size) {
      prefill = selectedEmployee.shirt_size;
    }
    if (prefill) {
      setForm(f => ({ ...f, size_delivered: prefill }));
    }
  }, [selectedEppItem, selectedEmployee]);

  const handleSubmit = async () => {
    if (!form.employee_id || !form.epp_item_id || !form.delivered_date) {
      setError('Empleado, artículo y fecha son obligatorios');
      return;
    }
    try {
      await SafetyEquipmentService.create({
        employee_id: Number(form.employee_id),
        epp_item_id: Number(form.epp_item_id),
        size_delivered: form.size_delivered || undefined,
        quantity: form.quantity,
        delivered_date: form.delivered_date,
        condition: form.condition,
        notes: form.notes,
      });
      setSuccess('Entrega de EPP registrada');
      setOpenDialog(false);
      setForm({
        employee_id: '', epp_item_id: '', size_delivered: '', quantity: 1,
        delivered_date: new Date().toISOString().split('T')[0], condition: 'new', notes: '',
      });
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
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
    try {
      if (editingCatalogItem) {
        await EppItemService.update(editingCatalogItem.id, catalogForm);
        setSuccess('Artículo actualizado');
      } else {
        await EppItemService.create(catalogForm);
        setSuccess('Artículo creado');
      }
      setCatalogDialogOpen(false);
      setEditingCatalogItem(null);
      setCatalogForm({ name: '', category: 'other', size_type: 'none' });
      loadCatalog();
      // Also refresh the main EPP items list
      const items = await EppItemService.getAll();
      setEppItems(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar artículo');
    }
  };

  const handleToggleCatalogItem = async (item: EppItem) => {
    try {
      await EppItemService.toggleActive(item.id);
      setSuccess(item.is_active ? 'Artículo desactivado' : 'Artículo activado');
      loadCatalog();
      const items = await EppItemService.getAll();
      setEppItems(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar estado');
    }
  };

  const formatDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('es-AR');

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px"><CircularProgress /></Box>;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Typography variant="h4" fontWeight="bold">Entrega de EPP</Typography>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<SettingsIcon />} onClick={handleOpenCatalog} size="small">Catálogo</Button>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadData} size="small">Actualizar</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenDialog(true)} size="small">Registrar Entrega</Button>
        </Box>
      </Box>

      <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />
      <FeedbackModal open={!!success} onClose={() => setSuccess('')} message={success} type="success" />

      {/* Mobile Cards */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        <Stack spacing={2}>
          {equipment.map(e => (
            <Paper key={e.id} sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold">{e.employee?.lastname}, {e.employee?.name}</Typography>
              <Typography variant="body1">{e.eppItem?.name || '—'}</Typography>
              {e.size_delivered && <Typography variant="body2">Talle: {e.size_delivered}</Typography>}
              {e.quantity > 1 && <Typography variant="body2">Cantidad: {e.quantity}</Typography>}
              <Typography variant="body2">Entregado: {formatDate(e.delivered_date)}</Typography>
              <Chip label={CONDITION_LABELS[e.condition || 'new']} size="small" color={CONDITION_COLORS[e.condition || 'new']} sx={{ mt: 1 }} />
              {e.notes && <Typography variant="caption" display="block" mt={1} color="text.secondary">{e.notes}</Typography>}
            </Paper>
          ))}
        </Stack>
      </Box>

      {/* Desktop Table */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell><strong>Fecha Entrega</strong></TableCell>
                <TableCell><strong>Empleado</strong></TableCell>
                <TableCell><strong>Artículo</strong></TableCell>
                <TableCell><strong>Talle</strong></TableCell>
                <TableCell><strong>Cant.</strong></TableCell>
                <TableCell><strong>Condición</strong></TableCell>
                <TableCell><strong>Notas</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {equipment.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><Typography variant="body2" color="text.secondary">No hay entregas registradas</Typography></TableCell></TableRow>
              ) : (
                equipment.map(e => (
                  <TableRow key={e.id} hover>
                    <TableCell>{formatDate(e.delivered_date)}</TableCell>
                    <TableCell>{e.employee?.lastname}, {e.employee?.name}</TableCell>
                    <TableCell>
                      <Typography fontWeight="medium">{e.eppItem?.name || '—'}</Typography>
                      <Typography variant="caption" color="text.secondary">{e.eppItem ? CATEGORY_LABELS[e.eppItem.category] : ''}</Typography>
                    </TableCell>
                    <TableCell>{e.size_delivered || '—'}</TableCell>
                    <TableCell>{e.quantity}</TableCell>
                    <TableCell><Chip label={CONDITION_LABELS[e.condition || 'new']} size="small" color={CONDITION_COLORS[e.condition || 'new']} /></TableCell>
                    <TableCell>{e.notes || '—'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* ─── Delivery Dialog ─── */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Registrar Entrega de EPP</DialogTitle>
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
                const items = eppItems.filter(i => i.category === cat);
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

            <TextField label="Fecha de entrega *" type="date" fullWidth value={form.delivered_date}
              onChange={(e) => setForm({ ...form, delivered_date: e.target.value })}
              InputLabelProps={{ shrink: true }} />

            <TextField label="Estado del artículo" select fullWidth value={form.condition}
              onChange={(e) => setForm({ ...form, condition: e.target.value })}
              SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
              <option value="new">Nuevo</option>
              <option value="good">Buen estado (Usado)</option>
              <option value="worn">Desgastado</option>
            </TextField>

            <TextField label="Notas" fullWidth multiline rows={2} value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">Registrar</Button>
        </DialogActions>
      </Dialog>

      {/* ─── Catalog Management Dialog ─── */}
      <Dialog open={catalogOpen} onClose={() => setCatalogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Catálogo de Artículos EPP</Typography>
            <Button variant="contained" size="small" startIcon={<AddIcon />}
              onClick={() => { setEditingCatalogItem(null); setCatalogForm({ name: '', category: 'other', size_type: 'none' }); setCatalogDialogOpen(true); }}>
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
                    <TableCell>
                      <Chip label={item.is_active ? 'Activo' : 'Inactivo'} size="small"
                        color={item.is_active ? 'success' : 'default'} />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Editar">
                        <IconButton size="small" color="primary" onClick={() => {
                          setEditingCatalogItem(item);
                          setCatalogForm({ name: item.name, category: item.category, size_type: item.size_type });
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
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCatalogDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleCatalogSubmit} variant="contained">{editingCatalogItem ? 'Guardar' : 'Crear'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
