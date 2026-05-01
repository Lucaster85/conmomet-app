'use client';
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, CircularProgress, TextField, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  Chip,
} from '@mui/material';
import FeedbackModal from '../../../components/FeedbackModal';
import {
  Add as AddIcon, Refresh as RefreshIcon, Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import DateField from '../../../components/DateField';
import { Holiday, HolidayService } from '../../../utils/api';

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState<Holiday | null>(null);
  const [form, setForm] = useState({ date: '', name: '' });
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await HolidayService.getAll(yearFilter);
      setHolidays(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData(); }, [yearFilter]);

  const handleOpen = (holiday?: Holiday) => {
    if (holiday) {
      setEditing(holiday);
      setForm({ date: holiday.date, name: holiday.name });
    } else {
      setEditing(null);
      setForm({ date: '', name: '' });
    }
    setOpenDialog(true);
  };

  const handleSave = async () => {
    try {
      if (!form.date || !form.name) {
        setError('Fecha y nombre son obligatorios');
        return;
      }
      if (editing) {
        await HolidayService.update(editing.id, form);
        setSuccess('Feriado actualizado');
      } else {
        await HolidayService.create(form);
        setSuccess('Feriado creado');
      }
      setOpenDialog(false);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await HolidayService.delete(id);
      setSuccess('Feriado eliminado');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  const formatDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });

  const isPast = (d: string) => new Date(d) < new Date(new Date().toISOString().split('T')[0]);

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px"><CircularProgress /></Box>;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Typography variant="h4" fontWeight="bold" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
          Feriados Nacionales
        </Typography>
        <Box display="flex" gap={1} alignItems="center">
          <TextField label="Año" type="number" size="small" value={yearFilter}
            onChange={(e) => setYearFilter(Number(e.target.value))} sx={{ width: 100 }} />
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadData} size="small">Actualizar</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()} size="small">Agregar</Button>
        </Box>
      </Box>

      <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />
      <FeedbackModal open={!!success} onClose={() => setSuccess('')} message={success} type="success" />

      <Paper sx={{ p: 0.5 }}>
        <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
          {holidays.length} feriado{holidays.length !== 1 ? 's' : ''} cargados para {yearFilter}
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>Fecha</strong></TableCell>
                <TableCell><strong>Nombre</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell align="right"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {holidays.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">No hay feriados cargados para {yearFilter}</TableCell>
                </TableRow>
              ) : (
                holidays.map((h) => (
                  <TableRow key={h.id} sx={{ opacity: isPast(h.date) ? 0.6 : 1 }}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold" sx={{ textTransform: 'capitalize' }}>
                        {formatDate(h.date)}
                      </Typography>
                    </TableCell>
                    <TableCell>{h.name}</TableCell>
                    <TableCell>
                      <Chip
                        label={isPast(h.date) ? 'Pasado' : 'Próximo'}
                        color={isPast(h.date) ? 'default' : 'success'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => handleOpen(h)}><EditIcon fontSize="small" /></IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton size="small" color="error" onClick={() => handleDelete(h.id)}><DeleteIcon fontSize="small" /></IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editing ? 'Editar Feriado' : 'Agregar Feriado'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <DateField label="Fecha *" fullWidth value={form.date}
              onChange={(val) => setForm({ ...form, date: val })}
              InputLabelProps={{ shrink: true }} />
            <TextField label="Nombre *" fullWidth value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ej: Día del Trabajador" />
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
