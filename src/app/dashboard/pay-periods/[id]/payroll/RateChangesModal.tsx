import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Typography, Box, Paper, TextField, MenuItem, CircularProgress, Select, InputLabel, FormControl, Chip, Tooltip
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { RateChange, RateChangeService, CreateRateChangeData, Guild, GuildService, PayPeriod, PayPeriodService, PayrollConcept, PayrollConceptService } from '../../../../../utils/api';

interface Props {
  open: boolean;
  onClose: () => void;
  payPeriodId: number;
}

export default function RateChangesModal({ open, onClose, payPeriodId }: Props) {
  const [rateChanges, setRateChanges] = useState<RateChange[]>([]);
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [periods, setPeriods] = useState<PayPeriod[]>([]);
  const [concepts, setConcepts] = useState<PayrollConcept[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [form, setForm] = useState<Partial<CreateRateChangeData>>({});

  const loadData = React.useCallback(async () => {
    if (!payPeriodId) return;
    try {
      setLoading(true);
      const [rcData, gData, pData, cData] = await Promise.all([
        RateChangeService.getByAppliedPeriod(payPeriodId),
        GuildService.getAll(),
        PayPeriodService.getAll(),
        PayrollConceptService.getAll()
      ]);
      setRateChanges(rcData);
      setGuilds(gData.filter(g => g.is_active));
      setPeriods(pData);
      setConcepts(cData.filter(c => c.is_active));
    } catch {
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [payPeriodId]);

  useEffect(() => {
    if (open) {
      loadData();
      setForm({ percentage: 0, applies_from_period: 0, applied_in_period: payPeriodId, guild_id: 0, concept_id: 0 });
    }
  }, [open, payPeriodId, loadData]);

  const handleAdd = async () => {
    if (!form.guild_id) return setError('El gremio es requerido');
    if (!form.applies_from_period) return setError('El período de inicio es requerido');
    if (!form.percentage || form.percentage <= 0) return setError('El porcentaje debe ser mayor a cero');

    try {
      setLoading(true);
      await RateChangeService.create({
        guild_id: form.guild_id,
        concept_id: form.concept_id === 0 ? null : form.concept_id,
        percentage: form.percentage,
        applies_from_period: form.applies_from_period,
        applied_in_period: payPeriodId,
        notes: form.notes
      });
      setForm({ percentage: 0, applies_from_period: 0, applied_in_period: payPeriodId, guild_id: 0, concept_id: 0, notes: '' });
      await loadData();
    } catch {
      setError('Error al crear retroactivo');
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setLoading(true);
      await RateChangeService.delete(id);
      await loadData();
    } catch {
      setError('Error al eliminar');
      setLoading(false);
    }
  };

  const getPeriodName = (id: number) => {
    const p = periods.find(p => p.id === id);
    if (!p) return 'Desconocido';
    const half = p.type === 'first_half' ? '1ª Q.' : '2ª Q.';
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${half} ${monthNames[(p.month ?? 1) - 1]} ${p.year}`;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Gestión de Aumentos y Retroactivos</DialogTitle>
      <DialogContent>
        {error && <Typography color="error" variant="body2" mb={2}>{error}</Typography>}
        
        <Box component={Paper} variant="outlined" p={2} mb={3} mt={1} sx={{ bgcolor: 'grey.50' }}>
          <Typography variant="subtitle2" mb={2}>Registrar Nuevo Aumento / Retroactivo</Typography>
          <Box display="flex" gap={2} alignItems="flex-start" flexWrap="wrap">
            <FormControl sx={{ minWidth: 150 }} size="small">
              <InputLabel>Gremio *</InputLabel>
              <Select
                value={form.guild_id || 0}
                label="Gremio *"
                onChange={(e) => setForm({ ...form, guild_id: Number(e.target.value) })}
              >
                <MenuItem value={0} disabled>Seleccione Gremio</MenuItem>
                {guilds.map(g => <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 180 }} size="small">
              <InputLabel>Aplica desde Quincena *</InputLabel>
              <Select
                value={form.applies_from_period || 0}
                label="Aplica desde Quincena *"
                onChange={(e) => setForm({ ...form, applies_from_period: Number(e.target.value) })}
              >
                <MenuItem value={0} disabled>Seleccione Período</MenuItem>
                {periods.map(p => <MenuItem key={p.id} value={p.id}>{getPeriodName(p.id)}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 180 }} size="small">
              <InputLabel>Concepto Específico</InputLabel>
              <Select
                value={form.concept_id || 0}
                label="Concepto Específico"
                onChange={(e) => setForm({ ...form, concept_id: Number(e.target.value) })}
              >
                <MenuItem value={0}>Todos los conceptos</MenuItem>
                {concepts.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>

            <TextField
              label="Porcentaje (%) *"
              type="number"
              value={form.percentage || ''}
              onChange={(e) => setForm({ ...form, percentage: Number(e.target.value) })}
              sx={{ width: 150 }}
              size="small"
              InputProps={{
                endAdornment: <Typography variant="body2" sx={{ ml: 1, color: 'text.secondary' }}>%</Typography>
              }}
            />
            
            <TextField
              label="Notas / Acta"
              size="small"
              value={form.notes || ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Ej: Acta Mayo 2026"
            />

            <Button variant="contained" onClick={handleAdd} disabled={loading} startIcon={<AddIcon />}>
              Registrar
            </Button>
          </Box>
          <Typography variant="caption" color="text.secondary" display="block" mt={1}>
            Al registrar un retroactivo, el sistema calculará las diferencias salariales desde la quincena indicada hasta la actual, aplicando el % sobre las horas y tarifas reales de esos períodos, para todos los empleados del gremio seleccionado.
          </Typography>
        </Box>

        <Typography variant="subtitle2" mb={1}>Aumentos / Retroactivos definidos en esta liquidación</Typography>
        
        {loading && rateChanges.length === 0 ? (
          <Box display="flex" justifyContent="center" p={3}><CircularProgress /></Box>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell>Gremio</TableCell>
                  <TableCell>Concepto</TableCell>
                  <TableCell>Aplica Desde</TableCell>
                  <TableCell align="right">Porcentaje</TableCell>
                  <TableCell>Notas</TableCell>
                  <TableCell align="center">Estado</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rateChanges.length === 0 ? (
                  <TableRow><TableCell colSpan={7} align="center">No hay retroactivos registrados</TableCell></TableRow>
                ) : (
                  rateChanges.map((rc) => (
                    <TableRow key={rc.id}>
                      <TableCell sx={{ fontWeight: 'bold' }}>{rc.guild?.name}</TableCell>
                      <TableCell>{rc.concept?.name || 'Todos'}</TableCell>
                      <TableCell>{getPeriodName(rc.applies_from_period)}</TableCell>
                      <TableCell align="right" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                        +{Number(rc.percentage).toFixed(2)}%
                      </TableCell>
                      <TableCell>{rc.notes}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={rc.status === 'confirmed' ? 'Confirmado' : rc.status === 'applied' ? 'Aplicado' : rc.status === 'pending' ? 'Pendiente' : 'Cancelado'}
                          size="small"
                          color={rc.status === 'confirmed' ? 'info' : rc.status === 'applied' ? 'success' : rc.status === 'pending' ? 'warning' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title={rc.status === 'confirmed' ? "Retroactivo confirmado (quincena cerrada). No se puede modificar." : rc.status === 'applied' ? "Eliminar (se recalculará al regenerar la liquidación)" : "Eliminar"}>
                          <span>
                            <IconButton size="small" color="error" onClick={() => handleDelete(rc.id)} disabled={rc.status === 'confirmed'}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
