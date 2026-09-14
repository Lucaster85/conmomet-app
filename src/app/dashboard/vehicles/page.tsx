'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  Paper,
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
  CircularProgress,
  Tooltip,
  TextField,
  Stack,
  Grid,
  Divider,
  Chip,
  Switch,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  AddOutlined as AddIcon,
  EditOutlined as EditIcon,
  DeleteOutlined as DeleteIcon,
  RefreshOutlined as RefreshIcon,
  LocalShippingOutlined as TruckIcon,
  FolderOpenOutlined as FolderIcon,
  SearchOutlined as SearchIcon,
  BuildOutlined as CraneIcon,
  DirectionsCarOutlined as OtherVehicleIcon,
  LocalShippingOutlined as TitleIcon,
  SwapHorizOutlined as StatusIcon,
  HistoryOutlined as HistoryIcon,
  VisibilityOutlined as ViewIcon,
  AssignmentIndOutlined as AssignIcon,
} from '@mui/icons-material';
import { Vehicle, VehicleService, CreateVehicleData, VehicleStatus, VehicleStatusLogEntry } from '../../../utils/api';
import VehicleDocumentsDialog from './VehicleDocumentsDialog';
import FeedbackModal from '../../../components/FeedbackModal';

const VEHICLE_TYPES = {
  crane: { label: 'Grúa', color: 'warning', icon: <CraneIcon fontSize="small" /> },
  truck: { label: 'Camión', color: 'info', icon: <TruckIcon fontSize="small" /> },
  other: { label: 'Otro / Utilitario', color: 'default', icon: <OtherVehicleIcon fontSize="small" /> },
} as const;

const STATUS_LABELS: Record<VehicleStatus, string> = {
  available: 'Disponible',
  reserved: 'Reservada',
  delivered: 'Entregada',
  in_repair: 'En reparación',
  retired: 'De baja',
};

const STATUS_COLORS: Record<VehicleStatus, 'success' | 'info' | 'warning' | 'default'> = {
  available: 'success',
  reserved: 'info',
  delivered: 'warning',
  in_repair: 'warning',
  retired: 'default',
};

// "delivered" solo lo maneja el flujo de asignaciones (asset-assignments), igual que en Tools.
const CHANGEABLE_STATUSES: VehicleStatus[] = ['available', 'reserved', 'in_repair', 'retired'];

export default function VehiclesPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const router = useRouter();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals State
  const [openDialog, setOpenDialog] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; vehicle: Vehicle | null }>({
    open: false,
    vehicle: null,
  });
  const [docDialog, setDocDialog] = useState<{ open: boolean; vehicle: Vehicle | null }>({
    open: false,
    vehicle: null,
  });
  const [statusDialog, setStatusDialog] = useState<{ open: boolean; vehicle: Vehicle | null; status: VehicleStatus; notes: string }>(
    { open: false, vehicle: null, status: 'available', notes: '' }
  );
  const [historyDialog, setHistoryDialog] = useState<{ open: boolean; vehicle: Vehicle | null; entries: VehicleStatusLogEntry[]; loading: boolean }>(
    { open: false, vehicle: null, entries: [], loading: false }
  );

  // Form State
  const [form, setForm] = useState({
    brand: '',
    model: '',
    plate: '',
    type: 'crane' as 'crane' | 'truck' | 'other',
    is_active: true,
  });

  const loadVehicles = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await VehicleService.getAll();
      setVehicles(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar la flota de vehículos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  const handleOpenCreate = () => {
    setEditingVehicle(null);
    setForm({
      brand: '',
      model: '',
      plate: '',
      type: 'crane',
      is_active: true,
    });
    setOpenDialog(true);
  };

  const handleOpenEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setForm({
      brand: vehicle.brand || '',
      model: vehicle.model || '',
      plate: vehicle.plate,
      type: vehicle.type,
      is_active: vehicle.is_active,
    });
    setOpenDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.plate.trim()) {
      setError('La patente es obligatoria');
      return;
    }

    try {
      setError('');
      setSuccess('');

      const payload: CreateVehicleData = {
        brand: form.brand.trim() || undefined,
        model: form.model.trim() || undefined,
        plate: form.plate.toUpperCase().trim(),
        type: form.type,
        is_active: form.is_active,
      };

      if (editingVehicle) {
        await VehicleService.update(editingVehicle.id, payload);
        setSuccess('Vehículo actualizado correctamente');
      } else {
        await VehicleService.create(payload);
        setSuccess('Vehículo registrado correctamente');
      }

      setOpenDialog(false);
      loadVehicles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el vehículo');
    }
  };

  const handleToggleActive = async (vehicle: Vehicle) => {
    try {
      setError('');
      setSuccess('');
      const newStatus = !vehicle.is_active;
      await VehicleService.update(vehicle.id, { is_active: newStatus });
      setVehicles(prev =>
        prev.map(v => (v.id === vehicle.id ? { ...v, is_active: newStatus } : v))
      );
      setSuccess(`Vehículo ${newStatus ? 'activado' : 'desactivado'} correctamente`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar estado del vehículo');
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.vehicle) return;
    try {
      setError('');
      setSuccess('');
      await VehicleService.delete(deleteDialog.vehicle.id);
      setSuccess('Vehículo eliminado de la flota');
      setDeleteDialog({ open: false, vehicle: null });
      loadVehicles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar el vehículo');
    }
  };

  const handleOpenStatus = (vehicle: Vehicle) => {
    setStatusDialog({ open: true, vehicle, status: vehicle.status === 'delivered' ? 'available' : vehicle.status, notes: '' });
  };

  const handleSubmitStatus = async () => {
    if (!statusDialog.vehicle) return;
    try {
      await VehicleService.changeStatus(statusDialog.vehicle.id, statusDialog.status, statusDialog.notes || undefined);
      setSuccess('Estado actualizado');
      setStatusDialog({ open: false, vehicle: null, status: 'available', notes: '' });
      loadVehicles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar el estado');
    }
  };

  const handleOpenHistory = async (vehicle: Vehicle) => {
    setHistoryDialog({ open: true, vehicle, entries: [], loading: true });
    try {
      const entries = await VehicleService.getStatusHistory(vehicle.id);
      setHistoryDialog({ open: true, vehicle, entries, loading: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el historial');
      setHistoryDialog({ open: false, vehicle: null, entries: [], loading: false });
    }
  };

  // Filter vehicles logic
  const filteredVehicles = vehicles.filter(v => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      v.plate.toLowerCase().includes(searchLower) ||
      (v.brand && v.brand.toLowerCase().includes(searchLower)) ||
      (v.model && v.model.toLowerCase().includes(searchLower));

    const matchesType = typeFilter === 'all' || v.type === typeFilter;
    
    let matchesStatus = true;
    if (statusFilter === 'active') matchesStatus = v.is_active;
    if (statusFilter === 'inactive') matchesStatus = !v.is_active;

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Box display="flex" alignItems="center" gap={1}>
            <TitleIcon color="primary" sx={{ fontSize: 32 }} />
            <Typography variant="h4" fontWeight={700} letterSpacing="-0.02em" color="#1E293B">
              Control de Flota y Vehículos
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Administre las grúas, camiones y utilitarios de la empresa junto con sus seguros y habilitaciones VTV.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          sx={{ borderRadius: 2, px: 3 }}
        >
          Nuevo Vehículo
        </Button>
      </Box>

      {/* Filters Card */}
      <Card sx={{ mb: 4, borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Buscar por marca, modelo o patente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo de Vehículo</InputLabel>
                <Select
                  value={typeFilter}
                  label="Tipo de Vehículo"
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <MenuItem value="all">Todos los tipos</MenuItem>
                  <MenuItem value="crane">Grúas</MenuItem>
                  <MenuItem value="truck">Camiones</MenuItem>
                  <MenuItem value="other">Otros / Utilitarios</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Estado</InputLabel>
                <Select
                  value={statusFilter}
                  label="Estado"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">Todos los estados</MenuItem>
                  <MenuItem value="active">Activos</MenuItem>
                  <MenuItem value="inactive">Inactivos</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 2 }} display="flex" justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={loadVehicles}
                startIcon={<RefreshIcon />}
                fullWidth
                sx={{ borderRadius: 2 }}
              >
                Actualizar
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Vehicles list */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : filteredVehicles.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 2 }} elevation={1}>
          <Typography variant="body1" color="text.secondary">
            No se encontraron vehículos registrados con los filtros seleccionados.
          </Typography>
        </Paper>
      ) : isMobile ? (
        /* Mobile View (Cards) */
        <Stack spacing={2}>
          {filteredVehicles.map((vehicle) => {
            const typeConfig = VEHICLE_TYPES[vehicle.type as keyof typeof VEHICLE_TYPES] || VEHICLE_TYPES.other;
            return (
              <Card
                key={vehicle.id}
                sx={{
                  borderRadius: 3,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  borderLeft: `6px solid ${
                    typeConfig.color === 'default'
                      ? theme.palette.grey[300]
                      : theme.palette[typeConfig.color as 'warning' | 'info'].main
                  }`,
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 16px rgba(0,0,0,0.1)',
                  },
                }}
              >
                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {vehicle.brand || 'Sin marca'} {vehicle.model || ''}
                      </Typography>
                      <Box display="flex" gap={1} mt={0.5} alignItems="center">
                        <Chip
                          icon={typeConfig.icon}
                          label={typeConfig.label}
                          color={typeConfig.color}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={vehicle.plate}
                          size="small"
                          sx={{
                            fontFamily: 'monospace',
                            fontWeight: 'bold',
                            letterSpacing: '0.05em',
                            bgcolor: 'grey.100',
                            border: '1px solid',
                            borderColor: 'grey.300',
                          }}
                        />
                        <Chip label={STATUS_LABELS[vehicle.status]} color={STATUS_COLORS[vehicle.status]} size="small" />
                      </Box>
                    </Box>
                    <Box display="flex" flexDirection="column" alignItems="flex-end">
                      <Typography variant="caption" color="text.secondary" gutterBottom>
                        Activo
                      </Typography>
                      <Switch
                        size="small"
                        checked={vehicle.is_active}
                        onChange={() => handleToggleActive(vehicle)}
                      />
                    </Box>
                  </Box>

                  <Divider sx={{ my: 1.5 }} />

                  <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<FolderIcon />}
                      onClick={() => setDocDialog({ open: true, vehicle })}
                      sx={{ borderRadius: 2 }}
                    >
                      Legajo Digital
                    </Button>
                    <Box display="flex" gap={0.5}>
                      <Tooltip title="Ver ficha / QR">
                        <IconButton size="small" color="secondary" onClick={() => router.push(`/dashboard/vehicles/${vehicle.id}`)} sx={{ p: 1 }}>
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Asignar a proyecto/responsable">
                        <span>
                          <IconButton size="small" disabled={vehicle.status !== 'available'} onClick={() => router.push(`/dashboard/asset-assignments?vehicle_id=${vehicle.id}`)} sx={{ p: 1 }}>
                            <AssignIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Cambiar estado">
                        <span>
                          <IconButton size="small" color="primary" disabled={vehicle.status === 'delivered'} onClick={() => handleOpenStatus(vehicle)} sx={{ bgcolor: 'primary.lighter', p: 1 }}>
                            <StatusIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <IconButton
                        color="primary"
                        size="small"
                        onClick={() => handleOpenEdit(vehicle)}
                        sx={{ bgcolor: 'primary.lighter', p: 1 }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => setDeleteDialog({ open: true, vehicle })}
                        sx={{ bgcolor: 'error.lighter', p: 1 }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      ) : (
        /* Desktop View (Table) */
        <TableContainer component={Paper} elevation={1} sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                <TableCell><strong>Marca y Modelo</strong></TableCell>
                <TableCell><strong>Patente</strong></TableCell>
                <TableCell><strong>Tipo</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell align="center"><strong>Legajo (Seguros / VTV)</strong></TableCell>
                <TableCell align="center"><strong>Habilitado</strong></TableCell>
                <TableCell align="center"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredVehicles.map((vehicle) => {
                const typeConfig = VEHICLE_TYPES[vehicle.type as keyof typeof VEHICLE_TYPES] || VEHICLE_TYPES.other;
                return (
                  <TableRow key={vehicle.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {vehicle.brand || '—'} {vehicle.model || ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={vehicle.plate}
                        size="small"
                        sx={{
                          fontFamily: 'monospace',
                          fontWeight: 'bold',
                          letterSpacing: '0.05em',
                          bgcolor: 'grey.100',
                          color: 'grey.800',
                          border: '1px solid',
                          borderColor: 'grey.300',
                          borderRadius: 1,
                          px: 0.5,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={typeConfig.icon}
                        label={typeConfig.label}
                        color={typeConfig.color}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip label={STATUS_LABELS[vehicle.status]} color={STATUS_COLORS[vehicle.status]} size="small" />
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<FolderIcon />}
                        onClick={() => setDocDialog({ open: true, vehicle })}
                        sx={{ borderRadius: 2 }}
                      >
                        Ver Documentos
                      </Button>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={vehicle.is_active ? 'Habilitado para registrar horas' : 'Deshabilitado'}>
                        <Switch
                          size="small"
                          checked={vehicle.is_active}
                          onChange={() => handleToggleActive(vehicle)}
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" justifyContent="center" gap={1}>
                        <Tooltip title="Ver ficha / QR">
                          <IconButton size="small" color="secondary" onClick={() => router.push(`/dashboard/vehicles/${vehicle.id}`)}>
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Asignar a proyecto/responsable">
                          <span>
                            <IconButton size="small" disabled={vehicle.status !== 'available'} onClick={() => router.push(`/dashboard/asset-assignments?vehicle_id=${vehicle.id}`)}>
                              <AssignIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Cambiar estado">
                          <span>
                            <IconButton size="small" color="primary" disabled={vehicle.status === 'delivered'} onClick={() => handleOpenStatus(vehicle)}>
                              <StatusIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Ver historial de estados">
                          <IconButton size="small" onClick={() => handleOpenHistory(vehicle)}>
                            <HistoryIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar Vehículo">
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => handleOpenEdit(vehicle)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar de la Flota">
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => setDeleteDialog({ open: true, vehicle })}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingVehicle ? 'Editar Vehículo' : 'Registrar Nuevo Vehículo'}
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Patente / Dominio"
                required
                fullWidth
                placeholder="ABC123D / AB123CD"
                value={form.plate}
                onChange={(e) => setForm({ ...form, plate: e.target.value })}
                inputProps={{ style: { textTransform: 'uppercase' } }}
              />
              <TextField
                label="Marca"
                fullWidth
                placeholder="Ej. Liebherr, Toyota, Mercedes-Benz"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
              />
              <TextField
                label="Modelo"
                fullWidth
                placeholder="Ej. LTM 1050, Hilux, Atego 1726"
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
              />
              <TextField
                label="Tipo de Vehículo"
                select
                required
                fullWidth
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as 'crane' | 'truck' | 'other' })}
              >
                <MenuItem value="crane">Grúa / Vehículo Elevador</MenuItem>
                <MenuItem value="truck">Camión / Transporte</MenuItem>
                <MenuItem value="other">Otro / Utilitario</MenuItem>
              </TextField>

              <Box display="flex" justifyContent="space-between" alignItems="center" pt={1}>
                <Typography variant="body2" color="text.secondary">
                  Habilitado para Carga de Horas
                </Typography>
                <Switch
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                />
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
            <Button type="submit" variant="contained">Guardar</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, vehicle: null })}
      >
        <DialogTitle>¿Confirmar eliminación?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Esta acción eliminará el vehículo <strong>{deleteDialog.vehicle?.brand} {deleteDialog.vehicle?.model} ({deleteDialog.vehicle?.plate})</strong> de la flota activa.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, vehicle: null })}>
            Cancelar
          </Button>
          <Button onClick={handleDelete} variant="contained" color="error">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Vehicle Documents Dialog / Legajo */}
      <VehicleDocumentsDialog
        open={docDialog.open}
        onClose={() => setDocDialog({ open: false, vehicle: null })}
        vehicle={docDialog.vehicle}
      />

      {/* Status Change Dialog */}
      <Dialog open={statusDialog.open} onClose={() => setStatusDialog({ open: false, vehicle: null, status: 'available', notes: '' })} maxWidth="xs" fullWidth>
        <DialogTitle>Cambiar estado — {statusDialog.vehicle?.brand} {statusDialog.vehicle?.model} ({statusDialog.vehicle?.plate})</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Nuevo estado" select fullWidth value={statusDialog.status}
              onChange={(e) => setStatusDialog({ ...statusDialog, status: e.target.value as VehicleStatus })}
              SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
              {CHANGEABLE_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </TextField>
            <TextField label="Notas" fullWidth multiline rows={2} value={statusDialog.notes}
              onChange={(e) => setStatusDialog({ ...statusDialog, notes: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog({ open: false, vehicle: null, status: 'available', notes: '' })}>Cancelar</Button>
          <Button onClick={handleSubmitStatus} variant="contained">Guardar</Button>
        </DialogActions>
      </Dialog>

      {/* Status History Dialog */}
      <Dialog open={historyDialog.open} onClose={() => setHistoryDialog({ open: false, vehicle: null, entries: [], loading: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Historial de estados — {historyDialog.vehicle?.brand} {historyDialog.vehicle?.model} ({historyDialog.vehicle?.plate})</DialogTitle>
        <DialogContent>
          {historyDialog.loading ? (
            <Box display="flex" justifyContent="center" py={3}><CircularProgress size={24} /></Box>
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
                    <TableCell>{entry.from_status ? `${STATUS_LABELS[entry.from_status as VehicleStatus] || entry.from_status} → ` : ''}{STATUS_LABELS[entry.to_status as VehicleStatus] || entry.to_status}</TableCell>
                    <TableCell>{entry.changedByUser ? `${entry.changedByUser.lastname}, ${entry.changedByUser.name}` : '—'}</TableCell>
                    <TableCell>{entry.notes || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDialog({ open: false, vehicle: null, entries: [], loading: false })}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Feedback Alerts */}
      <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />
      <FeedbackModal open={!!success} onClose={() => setSuccess('')} message={success} type="success" />
    </Box>
  );
}
