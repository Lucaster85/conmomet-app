'use client';
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, CircularProgress, Tooltip, TextField, Switch,
  FormControlLabel, Stack,
} from '@mui/material';
import FeedbackModal from '../../../components/FeedbackModal';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { Plant, PlantService, Client, ClientService } from '../../../utils/api';

export default function PlantsPage() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPlant, setEditingPlant] = useState<Plant | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; plant: Plant | null }>({ open: false, plant: null });
  const [clients, setClients] = useState<Client[]>([]);

  // Form state
  const [form, setForm] = useState({ name: '', address: '', client_id: '', is_active: true, notes: '' });

  const loadPlants = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await PlantService.getAll();
      setPlants(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar plantas');
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const data = await ClientService.getAll();
      setClients(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    loadPlants();
    loadClients();
  }, []);

  const handleOpenCreate = () => {
    setEditingPlant(null);
    setForm({ name: '', address: '', client_id: '', is_active: true, notes: '' });
    setOpenDialog(true);
  };

  const handleOpenEdit = (plant: Plant) => {
    setEditingPlant(plant);
    setForm({
      name: plant.name,
      address: plant.address || '',
      client_id: plant.client_id ? String(plant.client_id) : '',
      is_active: plant.is_active,
      notes: plant.notes || '',
    });
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    try {
      const payload = {
        name: form.name,
        address: form.address || undefined,
        client_id: form.client_id ? Number(form.client_id) : undefined,
        is_active: form.is_active,
        notes: form.notes || undefined,
      };

      if (editingPlant) {
        await PlantService.update(editingPlant.id, payload);
        setSuccess('Planta actualizada correctamente');
      } else {
        await PlantService.create(payload);
        setSuccess('Planta creada correctamente');
      }
      setOpenDialog(false);
      loadPlants();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.plant) return;
    try {
      await PlantService.delete(deleteDialog.plant.id);
      setDeleteDialog({ open: false, plant: null });
      setSuccess('Planta eliminada');
      loadPlants();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={1}>
        <Typography variant="h4" fontWeight="bold">Plantas</Typography>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadPlants} size="small">Actualizar</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate} size="small">Nueva Planta</Button>
        </Box>
      </Box>

      <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />
      <FeedbackModal open={!!success} onClose={() => setSuccess('')} message={success} type="success" />

      {/* Mobile: Cards / Desktop: Table */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {plants.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={4}>No hay plantas registradas</Typography>
        ) : (
          <Stack spacing={2}>
            {plants.map((plant) => (
              <Paper key={plant.id} sx={{ p: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">{plant.name}</Typography>
                    {plant.address && <Typography variant="body2" color="text.secondary">{plant.address}</Typography>}
                    {plant.client && <Typography variant="body2">Cliente: {plant.client.razonSocial}</Typography>}
                    <Typography variant="body2" color={plant.is_active ? 'success.main' : 'error.main'}>
                      {plant.is_active ? '● Activa' : '● Inactiva'}
                    </Typography>
                  </Box>
                  <Box>
                    <IconButton size="small" color="primary" onClick={() => handleOpenEdit(plant)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, plant })}><DeleteIcon fontSize="small" /></IconButton>
                  </Box>
                </Box>
              </Paper>
            ))}
          </Stack>
        )}
      </Box>

      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <TableContainer component={Paper} elevation={2}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell><strong>Nombre</strong></TableCell>
                <TableCell><strong>Dirección</strong></TableCell>
                <TableCell><strong>Cliente</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell align="center"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {plants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">No hay plantas registradas</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                plants.map((plant) => (
                  <TableRow key={plant.id} hover>
                    <TableCell><Typography fontWeight="medium">{plant.name}</Typography></TableCell>
                    <TableCell>{plant.address || '—'}</TableCell>
                    <TableCell>{plant.client?.razonSocial || '—'}</TableCell>
                    <TableCell>
                      <Typography color={plant.is_active ? 'success.main' : 'error.main'} variant="body2">
                        {plant.is_active ? '● Activa' : '● Inactiva'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Editar"><IconButton size="small" color="primary" onClick={() => handleOpenEdit(plant)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Eliminar"><IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, plant })}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingPlant ? 'Editar Planta' : 'Nueva Planta'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Nombre *" fullWidth value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextField label="Dirección" fullWidth value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <TextField label="Cliente" select fullWidth value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })}
              SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
              <option value="">Sin cliente</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.razonSocial}</option>)}
            </TextField>
            <TextField label="Notas" fullWidth multiline rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            {editingPlant && (
              <FormControlLabel control={<Switch checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />} label="Activa" />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">{editingPlant ? 'Guardar' : 'Crear'}</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, plant: null })}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>¿Eliminar la planta <strong>{deleteDialog.plant?.name}</strong>?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, plant: null })}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Eliminar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
