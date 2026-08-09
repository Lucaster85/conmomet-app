'use client';
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, CircularProgress, Tooltip, TextField, Stack, Chip, Switch, FormControlLabel,
} from '@mui/material';
import FeedbackModal from '../../../components/FeedbackModal';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { BudgetItemType, BudgetItemTypeService, CreateBudgetItemTypeData } from '../../../utils/api';

const emptyForm = (): CreateBudgetItemTypeData => ({ name: '', unit_type: 'hours', unit_label: 'hs', display_order: 0, is_active: true });

export default function BudgetItemTypesPage() {
  const [items, setItems] = useState<BudgetItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetItemType | null>(null);
  const [form, setForm] = useState<CreateBudgetItemTypeData>(emptyForm());
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; item: BudgetItemType | null }>({ open: false, item: null });

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await BudgetItemTypeService.getAll();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar rubros');
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

  const handleOpenEdit = (item: BudgetItemType) => {
    setEditingItem(item);
    setForm({ name: item.name, unit_type: item.unit_type, unit_label: item.unit_label, display_order: item.display_order, is_active: item.is_active });
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    try {
      if (editingItem) {
        await BudgetItemTypeService.update(editingItem.id, form);
        setSuccess('Rubro actualizado');
      } else {
        await BudgetItemTypeService.create(form);
        setSuccess('Rubro creado');
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
      await BudgetItemTypeService.delete(deleteDialog.item.id);
      setDeleteDialog({ open: false, item: null });
      setSuccess('Rubro eliminado');
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
        <Typography variant="h4" fontWeight="bold">Rubros de Presupuesto</Typography>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadData} size="small">Actualizar</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate} size="small">Nuevo Rubro</Button>
        </Box>
      </Box>

      <Typography variant="body2" color="text.secondary" mb={2}>
        Catálogo de rubros usados en las líneas de mano de obra de los Presupuestos (ej. Hs Montaje, Hs Grúa).
        No debe confundirse con las Categorías (CCT) de empleados.
      </Typography>

      <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />
      <FeedbackModal open={!!success} onClose={() => setSuccess('')} message={success} type="success" />

      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell><strong>Nombre</strong></TableCell>
              <TableCell><strong>Tipo</strong></TableCell>
              <TableCell><strong>Etiqueta</strong></TableCell>
              <TableCell><strong>Orden</strong></TableCell>
              <TableCell><strong>Estado</strong></TableCell>
              <TableCell align="center"><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">No hay rubros registrados</Typography>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell><Typography fontWeight="medium">{item.name}</Typography></TableCell>
                  <TableCell>{item.unit_type === 'hours' ? 'Horas' : 'Unidades'}</TableCell>
                  <TableCell>{item.unit_label}</TableCell>
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
        <DialogTitle>{editingItem ? 'Editar Rubro' : 'Nuevo Rubro'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Nombre *" fullWidth value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextField label="Tipo de unidad" select fullWidth value={form.unit_type}
              onChange={(e) => setForm({ ...form, unit_type: e.target.value as 'hours' | 'units' })}
              SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
              <option value="hours">Horas</option>
              <option value="units">Unidades</option>
            </TextField>
            <TextField label="Etiqueta visible" fullWidth value={form.unit_label} onChange={(e) => setForm({ ...form, unit_label: e.target.value })} helperText='Ej: "hs", "u", "viajes"' />
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
          <Typography>¿Eliminar el rubro <strong>{deleteDialog.item?.name}</strong>?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, item: null })}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Eliminar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
