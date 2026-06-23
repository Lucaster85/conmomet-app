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
import { Guild, GuildService } from '@/utils/api';
import ApplyIncreaseModal from './ApplyIncreaseModal';

const emptyForm = { name: '', code: '', is_active: true };

export default function GuildsPage() {
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState<Guild | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; item: Guild | null }>({ open: false, item: null });
  const [increaseDialog, setIncreaseDialog] = useState<{ open: boolean; item: Guild | null }>({ open: false, item: null });
  const [form, setForm] = useState(emptyForm);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await GuildService.getAll();
      setGuilds(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar gremios');
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

  const handleOpenEdit = (item: Guild) => {
    setEditing(item);
    setForm({ name: item.name, code: item.code, is_active: item.is_active });
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return setError('El nombre es obligatorio');
    if (!form.code.trim()) return setError('El código es obligatorio');
    
    try {
      if (editing) {
        await GuildService.update(editing.id, form);
        setSuccess('Gremio actualizado');
      } else {
        await GuildService.create(form);
        setSuccess('Gremio creado');
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
      await GuildService.delete(deleteDialog.item.id);
      setDeleteDialog({ open: false, item: null });
      setSuccess('Gremio eliminado');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  const filtered = guilds.filter(g =>
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
            Gremios (Sindicatos)
          </Typography>
          <Typography variant="body2" color="#64748B">
            Administrá los gremios laborales para agrupar categorías y aplicar aumentos retroactivos
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadData} size="small">
            Actualizar
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate} size="small">
            Nuevo Gremio
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
          <Typography color="text.secondary" textAlign="center" py={4}>No hay gremios</Typography>
        ) : (
          <Stack spacing={2}>
            {filtered.map((guild) => (
              <Paper key={guild.id} sx={{ p: 2, borderRadius: 2, boxShadow: '0 2px 4px rgb(0 0 0 / 0.05)', borderLeft: guild.is_active ? '4px solid #10B981' : '4px solid #94A3B8' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography fontWeight={600}>{guild.name}</Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                      Código: {guild.code}
                    </Typography>
                  </Box>
                  <Box>
                    <IconButton size="small" color="primary" onClick={() => handleOpenEdit(guild)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, item: guild })}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                {guild.is_active && (
                  <Button
                    size="small"
                    variant="outlined"
                    fullWidth
                    sx={{ mt: 1.5, textTransform: 'none' }}
                    onClick={() => setIncreaseDialog({ open: true, item: guild })}
                  >
                    Aplicar aumento
                  </Button>
                )}
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
                <TableCell><strong>Código</strong></TableCell>
                <TableCell><strong>Nombre del Gremio</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell align="center"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">No hay gremios</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((guild) => (
                  <TableRow key={guild.id} hover>
                    <TableCell>
                      <Typography fontWeight={600} color="text.secondary">{guild.code}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight={600}>{guild.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          display: 'inline-block',
                          px: 1, py: 0.5, borderRadius: 1,
                          bgcolor: guild.is_active ? '#DCFCE7' : '#F1F5F9',
                          color: guild.is_active ? '#166534' : '#475569',
                          fontSize: '0.75rem', fontWeight: 600
                        }}
                      >
                        {guild.is_active ? 'Activo' : 'Inactivo'}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      {guild.is_active && (
                        <Button
                          size="small"
                          variant="outlined"
                          sx={{ mr: 1, textTransform: 'none' }}
                          onClick={() => setIncreaseDialog({ open: true, item: guild })}
                        >
                          Aplicar aumento
                        </Button>
                      )}
                      <Tooltip title="Editar">
                        <IconButton size="small" color="primary" onClick={() => handleOpenEdit(guild)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, item: guild })}>
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
        <DialogTitle>{editing ? 'Editar Gremio' : 'Nuevo Gremio'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Código *"
              fullWidth
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="Ej: UOCRA"
            />
            <TextField
              label="Nombre *"
              fullWidth
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ej: Unión Obrera de la Construcción"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  color="primary"
                />
              }
              label="Gremio Activo"
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
            ¿Eliminar el gremio <strong>{deleteDialog.item?.name}</strong>?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            No se podrá eliminar si hay categorías o configuraciones vinculadas a este gremio.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, item: null })}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Eliminar</Button>
        </DialogActions>
      </Dialog>

      <ApplyIncreaseModal
        open={increaseDialog.open}
        guild={increaseDialog.item}
        onClose={() => setIncreaseDialog({ open: false, item: null })}
        onSuccess={(msg) => {
          setSuccess(msg);
          loadData();
        }}
      />
    </Box>
  );
}
