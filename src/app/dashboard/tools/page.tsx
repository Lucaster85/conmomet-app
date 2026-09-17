'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Typography, Button, Paper, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Tooltip, TextField, Stack, Chip, Autocomplete,
  InputAdornment,
} from '@mui/material';
import FeedbackModal from '../../../components/FeedbackModal';
import GearSpinner from '../../../components/GearSpinner';
import {
  AddOutlined as AddIcon, EditOutlined as EditIcon, DeleteOutlined as DeleteIcon,
  RefreshOutlined as RefreshIcon, SearchOutlined as SearchIcon, HistoryOutlined as HistoryIcon,
  SwapHorizOutlined as StatusIcon, VisibilityOutlined as ViewIcon, BuildOutlined as TitleIcon,
  AssignmentIndOutlined as AssignIcon,
} from '@mui/icons-material';
import {
  Tool, ToolService, CreateToolData, ToolStatus, ToolStatusLogEntry,
  ToolType, ToolTypeService,
} from '../../../utils/api';

const STATUS_LABELS: Record<ToolStatus, string> = {
  available: 'Disponible',
  reserved: 'Reservada',
  delivered: 'Entregada',
  in_repair: 'En reparación',
  retired: 'De baja',
  lost: 'Extraviada',
};

const STATUS_COLORS: Record<ToolStatus, 'success' | 'info' | 'warning' | 'default' | 'error'> = {
  available: 'success',
  reserved: 'info',
  delivered: 'warning',
  in_repair: 'warning',
  retired: 'default',
  lost: 'error',
};

// El backend bloquea "delivered" como destino manual — eso solo lo maneja el flujo de
// asignaciones (asset-assignments), no el cambio de estado directo.
const CHANGEABLE_STATUSES: ToolStatus[] = ['available', 'reserved', 'in_repair', 'retired', 'lost'];

interface ToolTypeOption { id?: number; name: string; inputValue?: string }

const emptyForm = (): CreateToolData => ({ tool_type_id: 0, name: '', reference_code: '', brand: '', model: '', serial_number: '', notes: '' });

export default function ToolsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Tool[]>([]);
  const [toolTypes, setToolTypes] = useState<ToolType[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<Tool | null>(null);
  const [form, setForm] = useState<CreateToolData>(emptyForm());
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; item: Tool | null }>({ open: false, item: null });

  const [statusDialog, setStatusDialog] = useState<{ open: boolean; item: Tool | null; status: ToolStatus; notes: string }>(
    { open: false, item: null, status: 'available', notes: '' }
  );
  const [historyDialog, setHistoryDialog] = useState<{ open: boolean; item: Tool | null; entries: ToolStatusLogEntry[]; loading: boolean }>(
    { open: false, item: null, entries: [], loading: false }
  );

  const loadData = async (q?: string) => {
    try {
      setLoading(true);
      setError('');
      const [tools, types] = await Promise.all([
        ToolService.getAll(q ? { q } : undefined),
        ToolTypeService.getAll(true),
      ]);
      setItems(Array.isArray(tools) ? tools : []);
      setToolTypes(Array.isArray(types) ? types : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar herramientas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const timeout = setTimeout(() => loadData(search || undefined), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setForm(emptyForm());
    setOpenDialog(true);
  };

  const handleOpenEdit = (item: Tool) => {
    setEditingItem(item);
    setForm({
      tool_type_id: item.tool_type_id,
      name: item.name,
      reference_code: item.reference_code,
      brand: item.brand || '',
      model: item.model || '',
      serial_number: item.serial_number || '',
      notes: item.notes || '',
    });
    setOpenDialog(true);
  };

  // Alta rápida de Tipo de Herramienta desde el mismo formulario, sin salir del diálogo.
  const handleToolTypeChange = async (newValue: ToolTypeOption | null) => {
    if (!newValue) return;
    if (newValue.inputValue) {
      try {
        const created = await ToolTypeService.create({ name: newValue.inputValue });
        setToolTypes(prev => [...prev, created]);
        setForm(f => ({ ...f, tool_type_id: created.id }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al crear el tipo de herramienta');
      }
      return;
    }
    if (newValue.id) setForm(f => ({ ...f, tool_type_id: newValue.id! }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.tool_type_id) {
      setError('Tipo y nombre son obligatorios');
      return;
    }
    if (!editingItem && !form.reference_code.trim()) {
      setError('El código de referencia es obligatorio');
      return;
    }
    if (processing) return;
    setProcessing(true);
    try {
      if (editingItem) {
        const { reference_code: _referenceCode, ...updateData } = form;
        void _referenceCode;
        await ToolService.update(editingItem.id, updateData);
        setSuccess('Herramienta actualizada');
      } else {
        await ToolService.create(form);
        setSuccess('Herramienta creada');
      }
      setOpenDialog(false);
      loadData(search || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.item) return;
    try {
      await ToolService.delete(deleteDialog.item.id);
      setDeleteDialog({ open: false, item: null });
      setSuccess('Herramienta eliminada');
      loadData(search || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  const handleOpenStatus = (item: Tool) => {
    setStatusDialog({ open: true, item, status: item.status === 'delivered' ? 'available' : item.status, notes: '' });
  };

  const handleSubmitStatus = async () => {
    if (!statusDialog.item) return;
    try {
      await ToolService.changeStatus(statusDialog.item.id, statusDialog.status, statusDialog.notes || undefined);
      setSuccess('Estado actualizado');
      setStatusDialog({ open: false, item: null, status: 'available', notes: '' });
      loadData(search || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar el estado');
    }
  };

  const handleOpenHistory = async (item: Tool) => {
    setHistoryDialog({ open: true, item, entries: [], loading: true });
    try {
      const entries = await ToolService.getStatusHistory(item.id);
      setHistoryDialog({ open: true, item, entries, loading: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el historial');
      setHistoryDialog({ open: false, item: null, entries: [], loading: false });
    }
  };

  if (loading && items.length === 0) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px"><GearSpinner /></Box>;
  }

  const renderActions = (item: Tool) => (
    <>
      <Tooltip title="Ver ficha / QR"><IconButton size="small" color="secondary" onClick={() => router.push(`/dashboard/tools/${item.id}`)}><ViewIcon fontSize="small" /></IconButton></Tooltip>
      <Tooltip title="Asignar a proyecto/responsable">
        <span>
          <IconButton size="small" disabled={item.status !== 'available'} onClick={() => router.push(`/dashboard/asset-assignments?tool_id=${item.id}`)}><AssignIcon fontSize="small" /></IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Cambiar estado">
        <span>
          <IconButton size="small" color="primary" disabled={item.status === 'delivered'} onClick={() => handleOpenStatus(item)}><StatusIcon fontSize="small" /></IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Ver historial de estados"><IconButton size="small" onClick={() => handleOpenHistory(item)}><HistoryIcon fontSize="small" /></IconButton></Tooltip>
      <Tooltip title="Editar"><IconButton size="small" color="primary" onClick={() => handleOpenEdit(item)}><EditIcon fontSize="small" /></IconButton></Tooltip>
      <Tooltip title="Eliminar"><IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, item })}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
    </>
  );

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={1}>
        <Box display="flex" alignItems="center" gap={1}>
          <TitleIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" fontWeight={700} letterSpacing="-0.02em" color="#1E293B">Herramientas</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => loadData(search || undefined)} size="small">Actualizar</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate} size="small">Nueva Herramienta</Button>
        </Box>
      </Box>

      <Typography variant="body2" color="text.secondary" mb={2}>
        Inventario del pañol. El código de referencia se carga a mano al crear la herramienta y no se puede editar
        después. Para entregar o recibir una herramienta usá la página de Asignaciones.
      </Typography>

      <TextField
        placeholder="Buscar por nombre, código, marca..."
        size="small"
        fullWidth
        sx={{ mb: 2 }}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
      />

      <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />
      <FeedbackModal open={!!success} onClose={() => setSuccess('')} message={success} type="success" />

      {/* Mobile Cards */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {items.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={4}>No hay herramientas que coincidan</Typography>
        ) : (
          <Stack spacing={2}>
            {items.map((item) => (
              <Card key={item.id} sx={{ p: 2, borderRadius: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box flex={1}>
                    <Typography variant="subtitle1" fontWeight="bold">{item.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{item.toolType?.name} · {item.reference_code}</Typography>
                    {(item.brand || item.model) && (
                      <Typography variant="body2" color="text.secondary">{[item.brand, item.model].filter(Boolean).join(' ')}</Typography>
                    )}
                    <Chip size="small" label={STATUS_LABELS[item.status]} color={STATUS_COLORS[item.status]} sx={{ mt: 0.5 }} />
                  </Box>
                  <Box display="flex" flexWrap="wrap" justifyContent="flex-end">{renderActions(item)}</Box>
                </Box>
              </Card>
            ))}
          </Stack>
        )}
      </Box>

      {/* Desktop Table */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <TableContainer component={Paper} elevation={2}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell><strong>Nombre</strong></TableCell>
                <TableCell><strong>Tipo</strong></TableCell>
                <TableCell><strong>Código</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell align="center"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">No hay herramientas que coincidan</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell><Typography fontWeight="medium">{item.name}</Typography></TableCell>
                    <TableCell>{item.toolType?.name}</TableCell>
                    <TableCell>{item.reference_code}</TableCell>
                    <TableCell><Chip size="small" label={STATUS_LABELS[item.status]} color={STATUS_COLORS[item.status]} /></TableCell>
                    <TableCell align="center">{renderActions(item)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* ─── Create/Edit Dialog ─── */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingItem ? 'Editar Herramienta' : 'Nueva Herramienta'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Autocomplete<ToolTypeOption>
              size="small"
              fullWidth
              options={toolTypes}
              value={toolTypes.find(t => t.id === form.tool_type_id) || null}
              onChange={(_, newValue) => handleToolTypeChange(newValue)}
              getOptionLabel={(option) => option.name}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              filterOptions={(options, params) => {
                const inputValue = params.inputValue.toLowerCase();
                const filtered = options.filter(o => o.name.toLowerCase().includes(inputValue));
                const exists = options.some((o) => o.name.toLowerCase() === inputValue);
                if (params.inputValue !== '' && !exists) {
                  filtered.push({ name: `Agregar "${params.inputValue}"`, inputValue: params.inputValue });
                }
                return filtered;
              }}
              selectOnFocus
              clearOnBlur
              handleHomeEndKeys
              renderInput={(params) => <TextField {...params} label="Tipo de herramienta *" />}
            />
            <TextField label="Nombre *" fullWidth value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} helperText='Ej: "Soldadora 500A", "Amoladora #1"' />
            <TextField
              label="Código de referencia *" fullWidth value={form.reference_code}
              disabled={!!editingItem}
              onChange={(e) => setForm({ ...form, reference_code: e.target.value })}
              helperText={editingItem ? 'No se puede editar una vez creada la herramienta' : 'Se carga a mano — no lo genera el sistema'}
            />
            <Stack direction="row" spacing={2}>
              <TextField label="Marca" fullWidth value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
              <TextField label="Modelo" fullWidth value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
            </Stack>
            <TextField label="Número de serie" fullWidth value={form.serial_number} onChange={(e) => setForm({ ...form, serial_number: e.target.value })} />
            <TextField label="Notas" fullWidth multiline rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={processing}>{processing ? <GearSpinner size={20} /> : (editingItem ? 'Guardar' : 'Crear')}</Button>
        </DialogActions>
      </Dialog>

      {/* ─── Delete Dialog ─── */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, item: null })}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>¿Eliminar la herramienta <strong>{deleteDialog.item?.name}</strong>?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, item: null })}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Eliminar</Button>
        </DialogActions>
      </Dialog>

      {/* ─── Status Change Dialog ─── */}
      <Dialog open={statusDialog.open} onClose={() => setStatusDialog({ open: false, item: null, status: 'available', notes: '' })} maxWidth="xs" fullWidth>
        <DialogTitle>Cambiar estado — {statusDialog.item?.name}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Nuevo estado" select fullWidth value={statusDialog.status}
              onChange={(e) => setStatusDialog({ ...statusDialog, status: e.target.value as ToolStatus })}
              SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
              {CHANGEABLE_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </TextField>
            <TextField label="Notas" fullWidth multiline rows={2} value={statusDialog.notes}
              onChange={(e) => setStatusDialog({ ...statusDialog, notes: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog({ open: false, item: null, status: 'available', notes: '' })}>Cancelar</Button>
          <Button onClick={handleSubmitStatus} variant="contained">Guardar</Button>
        </DialogActions>
      </Dialog>

      {/* ─── Status History Dialog ─── */}
      <Dialog open={historyDialog.open} onClose={() => setHistoryDialog({ open: false, item: null, entries: [], loading: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Historial de estados — {historyDialog.item?.name}</DialogTitle>
        <DialogContent>
          {historyDialog.loading ? (
            <Box display="flex" justifyContent="center" py={3}><GearSpinner size={24} /></Box>
          ) : historyDialog.entries.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={3}>Sin cambios de estado registrados todavía.</Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Cambio</TableCell>
                  <TableCell>Quién</TableCell>
                  <TableCell>Notas</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {historyDialog.entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{new Date(entry.changed_at).toLocaleString('es-AR')}</TableCell>
                    <TableCell>{entry.from_status ? `${STATUS_LABELS[entry.from_status as ToolStatus] || entry.from_status} → ` : ''}{STATUS_LABELS[entry.to_status as ToolStatus] || entry.to_status}</TableCell>
                    <TableCell>{entry.changedByUser ? `${entry.changedByUser.lastname}, ${entry.changedByUser.name}` : '—'}</TableCell>
                    <TableCell>{entry.notes || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDialog({ open: false, item: null, entries: [], loading: false })}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
