'use client';
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, CircularProgress, Tooltip, TextField, Stack, Chip,
  FormControlLabel, Switch,
} from '@mui/material';
import FeedbackModal from '../../../components/FeedbackModal';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { DocumentCategory, DocumentCategoryService, CreateDocumentCategoryData } from '../../../utils/api';

const APPLIES_TO_LABELS: Record<string, string> = {
  employee: 'Empleados',
  vehicle: 'Vehículos',
  project: 'Proyectos',
  company: 'Empresa',
};

const APPLIES_TO_COLORS: Record<string, 'primary' | 'secondary' | 'success' | 'warning'> = {
  employee: 'primary',
  vehicle: 'secondary',
  project: 'success',
  company: 'warning',
};

export default function DocumentCategoriesPage() {
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<DocumentCategory | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; category: DocumentCategory | null }>({ open: false, category: null });

  const [form, setForm] = useState({
    name: '',
    description: '',
    applies_to: 'employee' as CreateDocumentCategoryData['applies_to'],
    is_plant_specific: false,
  });

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await DocumentCategoryService.getAll();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar categorías');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCategories(); }, []);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setForm({ name: '', description: '', applies_to: 'employee', is_plant_specific: false });
    setOpenDialog(true);
  };

  const handleOpenEdit = (cat: DocumentCategory) => {
    setEditingCategory(cat);
    setForm({
      name: cat.name,
      description: cat.description || '',
      applies_to: cat.applies_to,
      is_plant_specific: cat.is_plant_specific,
    });
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    try {
      const payload: CreateDocumentCategoryData = {
        name: form.name,
        description: form.description || undefined,
        applies_to: form.applies_to,
        is_plant_specific: form.is_plant_specific,
      };

      if (editingCategory) {
        await DocumentCategoryService.update(editingCategory.id, payload);
        setSuccess('Categoría actualizada');
      } else {
        await DocumentCategoryService.create(payload);
        setSuccess('Categoría creada');
      }
      setOpenDialog(false);
      loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.category) return;
    try {
      await DocumentCategoryService.delete(deleteDialog.category.id);
      setDeleteDialog({ open: false, category: null });
      setSuccess('Categoría eliminada');
      loadCategories();
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
        <Box>
          <Typography variant="h4" fontWeight="bold">Categorías de Documentos</Typography>
          <Typography variant="body2" color="text.secondary">
            Define los tipos de documentos que el sistema reconoce para el motor de habilitaciones.
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadCategories} size="small">Actualizar</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate} size="small">Nueva Categoría</Button>
        </Box>
      </Box>

      <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />
      <FeedbackModal open={!!success} onClose={() => setSuccess('')} message={success} type="success" />

      {/* Mobile view */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {categories.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={4}>No hay categorías registradas</Typography>
        ) : (
          <Stack spacing={2}>
            {categories.map((cat) => (
              <Paper key={cat.id} sx={{ p: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">{cat.name}</Typography>
                    <Box display="flex" gap={1} mt={0.5} flexWrap="wrap">
                      <Chip label={APPLIES_TO_LABELS[cat.applies_to]} size="small" color={APPLIES_TO_COLORS[cat.applies_to]} variant="outlined" />
                      {cat.is_plant_specific && <Chip label="Específico de Planta" size="small" color="info" />}
                    </Box>
                    {cat.description && <Typography variant="body2" color="text.secondary" mt={1}>{cat.description}</Typography>}
                  </Box>
                  <Box>
                    <IconButton size="small" color="primary" onClick={() => handleOpenEdit(cat)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, category: cat })}><DeleteIcon fontSize="small" /></IconButton>
                  </Box>
                </Box>
              </Paper>
            ))}
          </Stack>
        )}
      </Box>

      {/* Desktop view */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <TableContainer component={Paper} elevation={2}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell><strong>Nombre</strong></TableCell>
                <TableCell><strong>Descripción</strong></TableCell>
                <TableCell><strong>Aplica a</strong></TableCell>
                <TableCell><strong>Específico de Planta</strong></TableCell>
                <TableCell align="center"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">No hay categorías registradas</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((cat) => (
                  <TableRow key={cat.id} hover>
                    <TableCell><Typography fontWeight="medium">{cat.name}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{cat.description || '—'}</Typography></TableCell>
                    <TableCell>
                      <Chip label={APPLIES_TO_LABELS[cat.applies_to]} size="small" color={APPLIES_TO_COLORS[cat.applies_to]} variant="outlined" />
                    </TableCell>
                    <TableCell>
                      {cat.is_plant_specific ? (
                        <Chip label="Sí" size="small" color="info" />
                      ) : (
                        <Typography variant="body2" color="text.secondary">No</Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Editar"><IconButton size="small" color="primary" onClick={() => handleOpenEdit(cat)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Eliminar"><IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, category: cat })}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
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
        <DialogTitle>{editingCategory ? 'Editar Categoría' : 'Nueva Categoría de Documento'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Nombre *" fullWidth value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ej: Inducción de Seguridad, Examen Médico, ART" />
            <TextField label="Descripción" fullWidth multiline rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Descripción o instrucciones para esta categoría" />
            <TextField label="Aplica a" select fullWidth value={form.applies_to}
              onChange={(e) => setForm({ ...form, applies_to: e.target.value as CreateDocumentCategoryData['applies_to'] })}
              SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
              <option value="employee">Empleados</option>
              <option value="vehicle">Vehículos</option>
              <option value="project">Proyectos</option>
              <option value="company">Empresa</option>
            </TextField>
            <FormControlLabel
              control={<Switch checked={form.is_plant_specific} onChange={(e) => setForm({ ...form, is_plant_specific: e.target.checked })} />}
              label="Específico de Planta"
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: -1 }}>
              {form.is_plant_specific
                ? '✅ Al cargar este documento para un empleado, se le pedirá indicar a qué planta aplica (ej: curso de inducción específico de una planta).'
                : 'Este documento aplica de forma general sin estar vinculado a una planta específica (ej: ART, licencia de conducir).'}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">{editingCategory ? 'Guardar' : 'Crear'}</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, category: null })}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>¿Eliminar la categoría <strong>{deleteDialog.category?.name}</strong>?</Typography>
          <Typography variant="body2" color="error" mt={1}>
            Solo se pueden eliminar categorías que no estén en uso (sin documentos clasificados ni requisitos de planta asociados).
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, category: null })}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Eliminar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
