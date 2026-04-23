'use client';
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, CircularProgress, TextField, Stack,
  Chip, Grid
} from '@mui/material';
import {
  Add as AddIcon, Refresh as RefreshIcon, Payment as PaymentIcon,
  CheckCircle as ConfirmIcon, AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { PayPeriod, PayPeriodService } from '../../../utils/api';
import { useRouter } from 'next/navigation';

const STATUS_CONFIG: Record<string, { label: string; color: 'success' | 'warning' | 'info' }> = {
  open: { label: 'Abierta', color: 'success' },
  closed: { label: 'Cerrada', color: 'warning' },
  paid: { label: 'Pagada', color: 'info' },
};

export default function PayPeriodsPage() {
  const [periods, setPeriods] = useState<PayPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const router = useRouter();

  const currentDate = new Date();
  const [form, setForm] = useState({
    month: currentDate.getMonth() + 1,
    year: currentDate.getFullYear(),
    type: currentDate.getDate() <= 15 ? 'first_half' : 'second_half'
  });

  const loadPeriods = async () => {
    try {
      setLoading(true);
      const data = await PayPeriodService.getAll();
      setPeriods(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar quincenas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPeriods(); }, []);

  const handleCreate = async () => {
    try {
      await PayPeriodService.create({
        month: Number(form.month),
        year: Number(form.year),
        type: form.type
      });
      setSuccess('Quincena aperturada');
      setOpenDialog(false);
      loadPeriods();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear');
    }
  };

  const handleClose = async (id: number) => {
    if (!window.confirm('¿Estás seguro de cerrar esta quincena? Ya no se podrán cargar más horas.')) return;
    try {
      await PayPeriodService.close(id);
      setSuccess('Quincena cerrada');
      loadPeriods();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cerrar');
    }
  };

  const handlePay = async (id: number) => {
    if (!window.confirm('¿Marcar como pagada? Las liquidaciones se marcarán como pagadas.')) return;
    try {
      await PayPeriodService.pay(id);
      setSuccess('Quincena marcada como pagada');
      loadPeriods();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al pagar');
    }
  };

  const formatPeriod = (p: PayPeriod) => {
    const typeLabel = p.type === 'first_half' ? '1ra Quincena' : '2da Quincena';
    return `${typeLabel} - ${p.month}/${p.year}`;
  };

  const formatDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('es-AR');

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px"><CircularProgress /></Box>;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Typography variant="h4" fontWeight="bold">Quincenas</Typography>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadPeriods} size="small">Actualizar</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenDialog(true)} size="small">Abrir Quincena</Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Grid container spacing={3}>
        {periods.map((p) => (
          <Grid size={{ xs: 12, md: 6, lg: 4 }} key={p.id}>
            <Paper sx={{ p: 3, position: 'relative', overflow: 'hidden' }}>
              <Box sx={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', bgcolor: `${STATUS_CONFIG[p.status].color}.main` }} />
              
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Typography variant="h6" fontWeight="bold">{formatPeriod(p)}</Typography>
                <Chip label={STATUS_CONFIG[p.status].label} color={STATUS_CONFIG[p.status].color} size="small" />
              </Box>

              <Typography variant="body2" color="text.secondary" mb={2}>
                Período: {formatDate(p.start_date)} al {formatDate(p.end_date)}
              </Typography>

              <Stack direction="row" spacing={1} mt={2}>
                <Button 
                  variant="outlined" 
                  size="small" 
                  fullWidth
                  onClick={() => router.push(`/dashboard/pay-periods/${p.id}/payroll`)}
                  startIcon={<MoneyIcon />}
                >
                  Liquidación
                </Button>
                
                {p.status === 'open' && (
                  <Button variant="contained" color="warning" size="small" fullWidth onClick={() => handleClose(p.id)} startIcon={<ConfirmIcon />}>
                    Cerrar
                  </Button>
                )}
                
                {p.status === 'closed' && (
                  <Button variant="contained" color="info" size="small" fullWidth onClick={() => handlePay(p.id)} startIcon={<PaymentIcon />}>
                    Marcar Pagada
                  </Button>
                )}
              </Stack>
            </Paper>
          </Grid>
        ))}
        {periods.length === 0 && (
          <Grid size={{ xs: 12 }}>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">No hay quincenas registradas</Typography>
            </Paper>
          </Grid>
        )}
      </Grid>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Abrir Nueva Quincena</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Mes" type="number" fullWidth value={form.month} onChange={(e) => setForm({ ...form, month: Number(e.target.value) })}
              inputProps={{ min: 1, max: 12 }} InputLabelProps={{ shrink: true }} />
            <TextField label="Año" type="number" fullWidth value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
              InputLabelProps={{ shrink: true }} />
            <TextField label="Tipo de quincena" select fullWidth value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
              SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
              <option value="first_half">1ra Quincena (1 al 15)</option>
              <option value="second_half">2da Quincena (16 al fin de mes)</option>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={handleCreate} variant="contained">Abrir Quincena</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
