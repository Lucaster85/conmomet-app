'use client';
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Tooltip, TextField, Stack, Chip, Switch, FormControlLabel,
} from '@mui/material';
import FeedbackModal from '../../../components/FeedbackModal';
import GearSpinner from '../../../components/GearSpinner';
import { AddOutlined as AddIcon, EditOutlined as EditIcon, DeleteOutlined as DeleteIcon, RefreshOutlined as RefreshIcon, ConstructionOutlined as TitleIcon } from '@mui/icons-material';
import { ToolType, ToolTypeService, CreateToolTypeData } from '../../../utils/api';

const emptyForm = (): CreateToolTypeData => ({ name: '', is_active: true });

export default function ToolTypesPage() {
  const [items, setItems] = useState<ToolType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<ToolType | null>(null);
  const [form, setForm] = useState<CreateToolTypeData>(emptyForm());
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; item: ToolType | null }>({ open: false, item: null });
  const [processing, setProcessing] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await ToolTypeService.getAll();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar tipos de herramienta');
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

  const handleOpenEdit = (item: ToolType) => {
    setEditingItem(item);
    setForm({ name: item.name, is_active: item.is_active });
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    if (processing) return;
    setProcessing(true);
    try {
      if (editingItem) {
        await ToolTypeService.update(editingItem.id, form);
        setSuccess('Tipo actualizado');
      } else {
        await ToolTypeService.create(form);
        setSuccess('Tipo creado');
      }
      setOpenDialog(false);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.item) return;
    try {
      await ToolTypeService.delete(deleteDialog.item.id);
      setDeleteDialog({ open: false, item: null });
      setSuccess('Tipo eliminado');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  if (loading) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px"><GearSpinner /></Box>;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={1}>
        <Box display="flex" alignItems="center" gap={1}>
          <TitleIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" fontWeight={700} letterSpacing="-0.02em" color="#1E293B">Tipos de Herramienta</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadData} size="small">Actualizar</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate} size="small">Nuevo Tipo</Button>
        </Box>
      </Box>

      <Typography variant="body2" color="text.secondary" mb={2}>
        Catálogo de tipos de herramienta (ej. &quot;Amoladora&quot;, &quot;Soldadora&quot;, &quot;Pala&quot;). Cada herramienta física
        individual (con su propio código de referencia) pertenece a uno de estos tipos. También se pueden dar de
        alta al vuelo desde el mismo formulario de Herramientas.
      </Typography>

      <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />
      <FeedbackModal open={!!success} onClose={() => setSuccess('')} message={success} type="success" />

      {/* Mobile Cards */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {items.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={4}>No hay tipos registrados</Typography>
        ) : (
          <Stack spacing={2}>
            {items.map((item) => (
              <Card key={item.id} sx={{ p: 2, borderRadius: 2, borderLeft: item.is_active ? '4px solid #10B981' : '4px solid #94A3B8' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography fontWeight={600}>{item.name}</Typography>
                    <Chip size="small" label={item.is_active ? 'Activo' : 'Inactivo'} color={item.is_active ? 'success' : 'default'} sx={{ mt: 0.5 }} />
                  </Box>
                  <Box>
                    <Tooltip title="Editar"><IconButton size="small" color="primary" onClick={() => handleOpenEdit(item)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Eliminar"><IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, item })}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                  </Box>
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
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell align="center"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">No hay tipos registrados</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell><Typography fontWeight="medium">{item.name}</Typography></TableCell>
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
      </Box>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editingItem ? 'Editar Tipo' : 'Nuevo Tipo'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Nombre *" fullWidth value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} helperText='Ej: "Amoladora", "Soldadora"' />
            <FormControlLabel control={<Switch checked={!!form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />} label="Activo" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={processing}>{processing ? <GearSpinner size={20} /> : (editingItem ? 'Guardar' : 'Crear')}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, item: null })}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>¿Eliminar el tipo <strong>{deleteDialog.item?.name}</strong>?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, item: null })}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Eliminar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
