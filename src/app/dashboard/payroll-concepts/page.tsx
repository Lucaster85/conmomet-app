'use client';
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, CircularProgress, TextField, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import FeedbackModal from '../../../components/FeedbackModal';
import {
  Add as AddIcon, Refresh as RefreshIcon, Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { PayrollConcept, PayrollConceptService } from '../../../utils/api';

export default function PayrollConceptsPage() {
  const [concepts, setConcepts] = useState<PayrollConcept[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState<PayrollConcept | null>(null);
  const [form, setForm] = useState<{ name: string; code: string; calc_type: 'hourly' | 'fixed'; sort_order: number }>({ name: '', code: '', calc_type: 'hourly', sort_order: 0 });

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await PayrollConceptService.getAll();
      setConcepts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleOpen = (concept?: PayrollConcept) => {
    if (concept) {
      setEditing(concept);
      setForm({ name: concept.name, code: concept.code, calc_type: concept.calc_type, sort_order: concept.sort_order });
    } else {
      setEditing(null);
      setForm({ name: '', code: '', calc_type: 'hourly', sort_order: 0 });
    }
    setOpenDialog(true);
  };

  const handleSave = async () => {
    try {
      if (!form.name || !form.code) {
        setError('Nombre y código son obligatorios');
        return;
      }
      if (editing) {
        await PayrollConceptService.update(editing.id, form);
        setSuccess('Concepto actualizado');
      } else {
        await PayrollConceptService.create(form);
        setSuccess('Concepto creado');
      }
      setOpenDialog(false);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await PayrollConceptService.delete(id);
      setSuccess('Concepto eliminado');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  const generateCode = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  };

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px"><CircularProgress /></Box>;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h4" fontWeight={700} letterSpacing="-0.02em" color="#1E293B">
            Conceptos de Liquidación
          </Typography>
          <Typography variant="body2" color="#64748B">
            Administrá los conceptos para el cálculo de sueldos y jornales.
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadData} size="small">
            Actualizar
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()} size="small">
            Nuevo Concepto
          </Button>
        </Box>
      </Box>

      <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />
      <FeedbackModal open={!!success} onClose={() => setSuccess('')} message={success} type="success" />

      {/* Mobile Cards */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {concepts.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={4}>No hay conceptos cargados</Typography>
        ) : (
          <Stack spacing={2}>
            {concepts.map((c) => (
              <Paper key={c.id} sx={{ p: 2, borderRadius: 2, boxShadow: '0 2px 4px rgb(0 0 0 / 0.05)', borderLeft: c.is_active ? '4px solid #10B981' : '4px solid #94A3B8' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography fontWeight={600}>{c.name}</Typography>
                    <Box display="flex" gap={1} alignItems="center" mt={0.5} flexWrap="wrap">
                      <Chip label={c.code} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                      <Typography variant="caption" color="text.secondary">
                        {c.calc_type === 'hourly' ? 'Por hora' : 'Monto fijo'} • Orden: {c.sort_order}
                      </Typography>
                    </Box>
                  </Box>
                  <Box>
                    <IconButton size="small" color="primary" onClick={() => handleOpen(c)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(c.id)}>
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
                <TableCell><strong>Tipo</strong></TableCell>
                <TableCell><strong>Orden</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell align="right"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {concepts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">No hay conceptos cargados</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                concepts.map((c) => (
                  <TableRow key={c.id} hover>
                    <TableCell>
                      <Typography fontWeight={600}>{c.name}</Typography>
                    </TableCell>
                    <TableCell><Chip label={c.code} size="small" variant="outlined" /></TableCell>
                    <TableCell>{c.calc_type === 'hourly' ? 'Por hora' : 'Monto fijo'}</TableCell>
                    <TableCell>{c.sort_order}</TableCell>
                    <TableCell>
                      <Chip label={c.is_active ? 'Activo' : 'Inactivo'} color={c.is_active ? 'success' : 'default'} size="small" />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Editar">
                        <IconButton size="small" color="primary" onClick={() => handleOpen(c)}><EditIcon fontSize="small" /></IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton size="small" color="error" onClick={() => handleDelete(c.id)}><DeleteIcon fontSize="small" /></IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Editar Concepto' : 'Nuevo Concepto'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Nombre *"
              fullWidth
              value={form.name}
              onChange={(e) => {
                const name = e.target.value;
                setForm({ ...form, name, code: editing ? form.code : generateCode(name) });
              }}
              placeholder="Ej: Hs comunes, Hs grúa, Hs Quequén"
            />
            <TextField label="Código *" fullWidth value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              helperText="Identificador único. Se genera automáticamente."
            />
            <TextField label="Tipo de cálculo" select fullWidth value={form.calc_type}
              onChange={(e) => setForm({ ...form, calc_type: e.target.value as 'hourly' | 'fixed' })}
              SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
              <option value="hourly">Por hora</option>
              <option value="fixed">Monto fijo</option>
            </TextField>
            <TextField label="Orden" type="number" fullWidth value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
              helperText="Define el orden de aparición en la liquidación."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained">{editing ? 'Guardar' : 'Crear'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
