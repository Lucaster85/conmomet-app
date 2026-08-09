'use client';
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, CircularProgress, Tooltip, TextField, Stack, Chip, Switch, FormControlLabel,
} from '@mui/material';
import FeedbackModal from '../../../components/FeedbackModal';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { MaterialUnit, MaterialUnitService, CreateMaterialUnitData } from '../../../utils/api';

const emptyForm = (): CreateMaterialUnitData => ({ label: '', display_order: 0, is_active: true });

export default function MaterialUnitsPage() {
  const [items, setItems] = useState<MaterialUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<MaterialUnit | null>(null);
  const [form, setForm] = useState<CreateMaterialUnitData>(emptyForm());
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; item: MaterialUnit | null }>({ open: false, item: null });

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await MaterialUnitService.getAll();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar unidades de medida');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setForm(emptyForm());
    setOpenDialog(true);
  };

  const handleOpenEdit = (item: MaterialUnit) => {
    setEditingItem(item);
    setForm({ label: item.label, display_order: item.display_order, is_active: item.is_active });
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    if (!form.label.trim()) {
      setError('La etiqueta es obligatoria');
      return;
    }
    try {
      if (editingItem) {
        await MaterialUnitService.update(editingItem.id, form);
        setSuccess('Unidad actualizada');
      } else {
        await MaterialUnitService.create(form);
        setSuccess('Unidad creada');
      }
      setOpenDialog(false);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.item) return;
    try {
      await MaterialUnitService.delete(deleteDialog.item.id);
      setDeleteDialog({ open: false, item: null });
      setSuccess('Unidad eliminada');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  if (loading) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px"><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={1}>
        <Typography variant="h4" fontWeight="bold">Unidades de Medida</Typography>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadData} size="small">Actualizar</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate} size="small">Nueva Unidad</Button>
        </Box>
      </Box>

      <Typography variant="body2" color="text.secondary" mb={2}>
        Catálogo de unidades usadas en las líneas de materiales de los Presupuestos (ej. kg, L, m²).
        También se pueden dar de alta al vuelo desde el mismo formulario de Presupuesto.
      </Typography>

      <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />
      <FeedbackModal open={!!success} onClose={() => setSuccess('')} message={success} type="success" />

      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell><strong>Etiqueta</strong></TableCell>
              <TableCell><strong>Orden</strong></TableCell>
              <TableCell><strong>Estado</strong></TableCell>
              <TableCell align="center"><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">No hay unidades registradas</Typography>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell><Typography fontWeight="medium">{item.label}</Typography></TableCell>
                  <TableCell>{item.display_order}</TableCell>
                  <TableCell><Chip size="small" label={item.is_active ? 'Activo' : 'Inactivo'} color={item.is_active ? 'success' : 'default'} /></TableCell>
                  <TableCell align="center">
                    <Tooltip title="Editar"><IconButton size="small" color="primary" onClick={() => handleOpenEdit(item)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Eliminar"><IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, item })}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editingItem ? 'Editar Unidad' : 'Nueva Unidad'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Etiqueta *" fullWidth value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} helperText='Ej: "kg", "L", "m²"' />
            <TextField label="Orden" type="number" fullWidth value={form.display_order} onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })} />
            <FormControlLabel control={<Switch checked={!!form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />} label="Activo" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">{editingItem ? 'Guardar' : 'Crear'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, item: null })}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>¿Eliminar la unidad <strong>{deleteDialog.item?.label}</strong>?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, item: null })}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Eliminar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
