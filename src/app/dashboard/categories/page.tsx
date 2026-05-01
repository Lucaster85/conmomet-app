'use client';
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, CircularProgress, Tooltip, Stack, TextField, InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Refresh as RefreshIcon, Search as SearchIcon,
} from '@mui/icons-material';
import FeedbackModal from '@/components/FeedbackModal';
import CurrencyInput from '@/components/CurrencyInput';
import { Category, CategoryService } from '@/utils/api';

const emptyForm = { name: '', guild_hourly_rate: 0 };

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; item: Category | null }>({ open: false, item: null });
  const [form, setForm] = useState(emptyForm);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await CategoryService.getAll();
      setCategories(data);
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

  const handleOpenEdit = (item: Category) => {
    setEditing(item);
    setForm({ name: item.name, guild_hourly_rate: item.guild_hourly_rate });
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return setError('El nombre es obligatorio');
    if (!form.guild_hourly_rate || form.guild_hourly_rate <= 0) return setError('El valor hora gremio debe ser mayor a 0');
    try {
      if (editing) {
        await CategoryService.update(editing.id, form);
        setSuccess('Categoría actualizada');
      } else {
        await CategoryService.create(form);
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
      await CategoryService.delete(deleteDialog.item.id);
      setDeleteDialog({ open: false, item: null });
      setSuccess('Categoría eliminada');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  const formatCurrency = (val: number) =>
    `$${Number(val).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

  const filtered = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
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
            Categorías
          </Typography>
          <Typography variant="body2" color="#64748B">
            Administrá las categorías laborales y su valor hora gremio (CCT)
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
        placeholder="Buscar por nombre..."
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
            {filtered.map((cat) => (
              <Paper key={cat.id} sx={{ p: 2, borderRadius: 2, boxShadow: '0 2px 4px rgb(0 0 0 / 0.05)' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography fontWeight={600}>{cat.name}</Typography>
                    <Typography variant="body2" color="primary.main" fontWeight={600}>
                      {formatCurrency(cat.guild_hourly_rate)} / hora (gremio)
                    </Typography>
                  </Box>
                  <Box>
                    <IconButton size="small" color="primary" onClick={() => handleOpenEdit(cat)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, item: cat })}>
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
                <TableCell><strong>Categoría</strong></TableCell>
                <TableCell><strong>Valor Hora Gremio (CCT)</strong></TableCell>
                <TableCell align="center"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">No hay categorías</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((cat) => (
                  <TableRow key={cat.id} hover>
                    <TableCell>
                      <Typography fontWeight={600}>{cat.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography color="primary.main" fontWeight={600}>
                        {formatCurrency(cat.guild_hourly_rate)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">por hora</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Editar">
                        <IconButton size="small" color="primary" onClick={() => handleOpenEdit(cat)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, item: cat })}>
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
              placeholder="Ej: Oficial, Medio Oficial, Ayudante"
            />
            <CurrencyInput
              label="Valor Hora Gremio (CCT) *"
              fullWidth
              value={form.guild_hourly_rate}
              onChange={(val) => setForm({ ...form, guild_hourly_rate: val ?? 0 })}
            />
            <Typography variant="caption" color="text.secondary">
              Este es el valor hora según el convenio colectivo de trabajo. Se usará para calcular feriados y como base de la liquidación.
            </Typography>
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
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Los empleados asignados a esta categoría quedarán sin categoría.
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
