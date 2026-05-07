'use client';
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, CircularProgress, Tooltip, Stack, TextField, InputAdornment,
  Switch, FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Refresh as RefreshIcon, Search as SearchIcon,
} from '@mui/icons-material';
import FeedbackModal from '@/components/FeedbackModal';
import { EmployerCostCategory, EmployerCostCategoryService } from '@/utils/api';

const emptyForm = { name: '', code: '', is_active: true };

export default function EmployerCostCategorysPage() {
  const [categories, setEmployerCostCategorys] = useState<EmployerCostCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState<EmployerCostCategory | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; item: EmployerCostCategory | null }>({ open: false, item: null });
  const [form, setForm] = useState(emptyForm);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await EmployerCostCategoryService.getAll();
      setEmployerCostCategorys(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar categorías');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleOpenCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpenDialog(true);
  };

  const handleOpenEdit = (item: EmployerCostCategory) => {
    setEditing(item);
    setForm({ name: item.name, code: item.code, is_active: item.is_active });
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return setError('El nombre es obligatorio');
    if (!form.code.trim()) return setError('El código interno es obligatorio');
    
    
    try {
      if (editing) {
        await EmployerCostCategoryService.update(editing.id, form);
        setSuccess('Categoría actualizada');
      } else {
        await EmployerCostCategoryService.create(form);
        setSuccess('Categoría creada');
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
      await EmployerCostCategoryService.delete(deleteDialog.item.id);
      setDeleteDialog({ open: false, item: null });
      setSuccess('Categoría eliminada');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  const filtered = categories.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase()) || g.code.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />
      <FeedbackModal open={!!success} onClose={() => setSuccess('')} message={success} type="success" />

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h4" fontWeight={700} letterSpacing="-0.02em" color="#1E293B">
            Categorías de Costos Patronales
          </Typography>
          <Typography variant="body2" color="#64748B">
            Administrá las categorías de gastos patronales (F931, UOCRA, ART, etc.)
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadData} size="small">
            Actualizar
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate} size="small">
            Nueva Categoría
          </Button>
        </Box>
      </Box>

      {/* Search */}
      <TextField
        placeholder="Buscar por nombre o código..."
        fullWidth size="small" sx={{ mb: 2 }}
        value={search} onChange={(e) => setSearch(e.target.value)}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
      />

      {/* Mobile Cards */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {filtered.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={4}>No hay categorías</Typography>
        ) : (
          <Stack spacing={2}>
            {filtered.map((category) => (
              <Paper key={category.id} sx={{ p: 2, borderRadius: 2, boxShadow: '0 2px 4px rgb(0 0 0 / 0.05)', borderLeft: category.is_active ? '4px solid #10B981' : '4px solid #94A3B8' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography fontWeight={600}>{category.name}</Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                      Código: {category.code}
                    </Typography>
                  </Box>
                  <Box>
                    <IconButton size="small" color="primary" onClick={() => handleOpenEdit(category)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, item: category })}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              </Paper>
            ))}
          </Stack>
        )}
      </Box>

      {/* Desktop Table */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                <TableCell><strong>Nombre</strong></TableCell>
                <TableCell><strong>Código</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell align="center"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">No hay categorías</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((category) => (
                  <TableRow key={category.id} hover>
                    <TableCell>
                      <Typography fontWeight={600}>{category.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{category.code}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          display: 'inline-block',
                          px: 1, py: 0.5, borderRadius: 1,
                          bgcolor: category.is_active ? '#DCFCE7' : '#F1F5F9',
                          color: category.is_active ? '#166534' : '#475569',
                          fontSize: '0.75rem', fontWeight: 600
                        }}
                      >
                        {category.is_active ? 'Activo' : 'Inactivo'}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Editar">
                        <IconButton size="small" color="primary" onClick={() => handleOpenEdit(category)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, item: category })}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Create / Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editing ? 'Editar Categoría' : 'Nueva Categoría'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Nombre *"
              fullWidth
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ej: F931"
            />
            <TextField
              label="Código Interno *"
              fullWidth
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="Ej: f931"
              helperText="Identificador único (sin espacios)"
              disabled={!!editing}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  color="primary"
                />
              }
              label="Categoría Activa"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editing ? 'Guardar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, item: null })}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Eliminar la categoría <strong>{deleteDialog.item?.name}</strong>?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            No se podrá eliminar si hay categorías o configuraciones vinculadas a esta categoría.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, item: null })}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Eliminar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
