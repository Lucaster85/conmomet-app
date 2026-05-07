'use client';
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, CircularProgress, Tooltip, Stack, TextField, InputAdornment,
  MenuItem, FormControl, InputLabel, Select
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Refresh as RefreshIcon, Search as SearchIcon, AttachFile as AttachFileIcon,
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material';
import FeedbackModal from '@/components/FeedbackModal';
import CurrencyInput from '@/components/CurrencyInput';
import { EmployerCost, EmployerCostCategory, EmployerCostService, EmployerCostCategoryService } from '@/utils/api';

const emptyForm = { category_id: 0, month: new Date().getMonth() + 1, year: new Date().getFullYear(), amount: 0, notes: '' };

export default function EmployerCostsPage() {
  const [costs, setCosts] = useState<EmployerCost[]>([]);
  const [categories, setCategories] = useState<EmployerCostCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState<EmployerCost | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; item: EmployerCost | null }>({ open: false, item: null });
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [costsData, catsData] = await Promise.all([
        EmployerCostService.getAll(),
        EmployerCostCategoryService.getAll()
      ]);
      setCosts(costsData);
      setCategories(catsData.filter(c => c.is_active));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar costos patronales');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleOpenCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFile(null);
    setOpenDialog(true);
  };

  const handleOpenEdit = (item: EmployerCost) => {
    setEditing(item);
    setForm({
      category_id: item.category_id,
      month: item.month,
      year: item.year,
      amount: item.amount,
      notes: item.notes || ''
    });
    setFile(null);
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    if (!form.category_id) return setError('La categoría es obligatoria');
    if (!form.month || !form.year) return setError('El período es obligatorio');
    if (!form.amount || form.amount <= 0) return setError('El monto debe ser mayor a 0');
    
    try {
      if (editing) {
        await EmployerCostService.update(editing.id, form, file);
        setSuccess('Costo patronal actualizado');
      } else {
        await EmployerCostService.create(form, file);
        setSuccess('Costo patronal registrado');
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
      await EmployerCostService.delete(deleteDialog.item.id);
      setDeleteDialog({ open: false, item: null });
      setSuccess('Costo patronal eliminado');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  const formatCurrency = (val: number) =>
    `$${Number(val).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

  const filtered = costs.filter(c => {
    const term = search.toLowerCase();
    const catName = c.category?.name.toLowerCase() || '';
    const notes = c.notes?.toLowerCase() || '';
    return catName.includes(term) || notes.includes(term);
  });

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
            Gastos Patronales
          </Typography>
          <Typography variant="body2" color="#64748B">
            Registrá y consultá los gastos de la empresa (F931, Sindicatos, Seguros)
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadData} size="small">
            Actualizar
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate} size="small">
            Registrar Gasto
          </Button>
        </Box>
      </Box>

      {/* Search */}
      <TextField
        placeholder="Buscar por categoría o notas..."
        fullWidth size="small" sx={{ mb: 2 }}
        value={search} onChange={(e) => setSearch(e.target.value)}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
      />

      {/* Mobile Cards */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {filtered.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={4}>No hay gastos registrados</Typography>
        ) : (
          <Stack spacing={2}>
            {filtered.map((cost) => (
              <Paper key={cost.id} sx={{ p: 2, borderRadius: 2, boxShadow: '0 2px 4px rgb(0 0 0 / 0.05)' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography fontWeight={600}>{cost.category?.name || 'Desconocido'}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Período: {String(cost.month).padStart(2, '0')}/{cost.year}
                    </Typography>
                    <Typography variant="body2" color="error.main" fontWeight={600}>
                      {formatCurrency(cost.amount)}
                    </Typography>
                  </Box>
                  <Box>
                    <IconButton size="small" color="primary" onClick={() => handleOpenEdit(cost)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, item: cost })}>
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
                <TableCell><strong>Período</strong></TableCell>
                <TableCell><strong>Categoría de Gasto</strong></TableCell>
                <TableCell><strong>Monto</strong></TableCell>
                <TableCell><strong>Notas / Doc</strong></TableCell>
                <TableCell align="center"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">No hay gastos registrados</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((cost) => (
                  <TableRow key={cost.id} hover>
                    <TableCell>
                      <Typography fontWeight={600} color="text.secondary">
                        {String(cost.month).padStart(2, '0')}/{cost.year}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight={600}>{cost.category?.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight={700} color="error.main">
                        {formatCurrency(cost.amount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
                        {cost.notes || '-'}
                      </Typography>
                      {cost.file_url && (
                        <Button 
                          size="small" 
                          startIcon={<OpenInNewIcon fontSize="small" />} 
                          href={cost.file_url} 
                          target="_blank"
                          sx={{ mt: 0.5, p: 0, minWidth: 'auto', textTransform: 'none' }}
                        >
                          Ver Adjunto
                        </Button>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Editar">
                        <IconButton size="small" color="primary" onClick={() => handleOpenEdit(cost)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, item: cost })}>
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
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Editar Gasto Patronal' : 'Registrar Gasto Patronal'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Categoría de Gasto *</InputLabel>
              <Select
                value={form.category_id || ''}
                label="Categoría de Gasto *"
                onChange={(e) => setForm({ ...form, category_id: Number(e.target.value) })}
              >
                {categories.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Período (Mes/Año) *"
              type="month"
              fullWidth
              value={`${form.year}-${String(form.month).padStart(2, '0')}`}
              onChange={(e) => {
                const [y, m] = e.target.value.split('-');
                if (y && m) setForm({ ...form, year: parseInt(y), month: parseInt(m) });
              }}
              InputLabelProps={{ shrink: true }}
            />

            <CurrencyInput
              label="Monto Pagado (ARS) *"
              fullWidth
              value={form.amount}
              onChange={(val) => setForm({ ...form, amount: val ?? 0 })}
            />

            <TextField
              label="Notas o Referencia"
              fullWidth
              multiline
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Ej: Comprobante Nro..."
            />

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Adjuntar Comprobante (PDF o Imagen)
              </Typography>
              {editing?.file_url && !file && (
                <Typography variant="body2" color="text.secondary" mb={1}>
                  Ya existe un archivo subido. Subir uno nuevo lo reemplazará.
                </Typography>
              )}
              <Button
                variant="outlined"
                component="label"
                startIcon={<AttachFileIcon />}
                fullWidth
                sx={{
                  borderStyle: 'dashed',
                  borderWidth: 2,
                  py: 3,
                  color: file ? 'success.main' : 'text.secondary',
                  borderColor: file ? 'success.main' : 'divider'
                }}
              >
                {file ? file.name : 'Haga clic para seleccionar o arrastre el archivo aquí'}
                <input
                  type="file"
                  hidden
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFile(e.target.files[0]);
                    }
                  }}
                  accept="application/pdf,image/*"
                />
              </Button>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {editing ? 'Guardar' : 'Registrar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, item: null })}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Eliminar el gasto de <strong>{deleteDialog.item?.category?.name}</strong> por <strong>{deleteDialog.item ? formatCurrency(deleteDialog.item.amount) : ''}</strong>?
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
