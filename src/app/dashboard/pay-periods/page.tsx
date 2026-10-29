'use client';
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Card, DialogTitle, DialogContent,
  DialogActions, TextField, Stack,
  Chip, Grid
} from '@mui/material';
import Alert from '@mui/material/Alert';
import AppDialog from '@/components/common/AppDialog';
import FeedbackModal from '../../../components/FeedbackModal';
import GearSpinner from '../../../components/GearSpinner';
import CurrencyInput from '@/components/CurrencyInput';
import {
  AddOutlined as AddIcon, RefreshOutlined as RefreshIcon, PaymentOutlined as PaymentIcon,
  CheckCircleOutlined as ConfirmIcon, AttachMoneyOutlined as MoneyIcon,
  PaymentsOutlined as TitleIcon,
} from '@mui/icons-material';
import { PayPeriod, PayPeriodService, UsdRatePreview } from '../../../utils/api';
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
  const [confirmModal, setConfirmModal] = useState<{ message: string; action: () => void } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [closingPeriod, setClosingPeriod] = useState<PayPeriod | null>(null);
  const [usdPreview, setUsdPreview] = useState<UsdRatePreview | null>(null);
  const [usdPreviewLoading, setUsdPreviewLoading] = useState(false);
  const [rateInput, setRateInput] = useState<number | null>(null);
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
    if (processing) return;
    setProcessing(true);
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
    } finally {
      setProcessing(false);
    }
  };

  // Antes de cerrar, el diálogo muestra el preview de la cotización USD que se va a congelar
  // (si hay cuotas de préstamo en dólares descontadas en esta quincena) — ver
  // GET /pay-periods/:id/usd-rate-preview.
  const handleOpenClose = async (period: PayPeriod) => {
    setClosingPeriod(period);
    setUsdPreview(null);
    setRateInput(null);
    setUsdPreviewLoading(true);
    try {
      const preview = await PayPeriodService.getUsdRatePreview(period.id);
      setUsdPreview(preview);
      setRateInput(preview.suggested_rate);
    } catch {
      // Si falla el preview no bloqueamos el cierre: close() igual resuelve la cotización del
      // lado del servidor — simplemente no se muestra la sección informativa de USD.
    } finally {
      setUsdPreviewLoading(false);
    }
  };

  const handleConfirmClose = async () => {
    if (!closingPeriod) return;
    const needsUsdRate = !!usdPreview && usdPreview.affected_entries > 0;
    if (needsUsdRate && (!rateInput || rateInput <= 0)) {
      setError('La cotización es obligatoria para cerrar esta quincena.');
      return;
    }
    // Solo se manda la cotización en el body si el usuario la editó respecto de la sugerida, o si
    // no había ninguna sugerida (la API no respondió) — para no marcar como "manual" una
    // cotización que en realidad vino sola de la API.
    const body = needsUsdRate && (usdPreview!.suggested_rate == null || rateInput !== usdPreview!.suggested_rate)
      ? { usd_exchange_rate: rateInput as number }
      : undefined;

    setProcessing(true);
    try {
      await PayPeriodService.close(closingPeriod.id, body);
      setSuccess('Quincena cerrada');
      setClosingPeriod(null);
      loadPeriods();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cerrar');
    } finally {
      setProcessing(false);
    }
  };

  const handlePay = (id: number) => {
    setConfirmModal({
      message: '¿Marcar como pagada? Las liquidaciones se marcarán como pagadas.',
      action: async () => {
        try {
          await PayPeriodService.pay(id);
          setSuccess('Quincena marcada como pagada');
          loadPeriods();
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Error al pagar');
        }
      },
    });
  };

  const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const formatPeriod = (p: PayPeriod) => {
    const typeLabel = p.type === 'first_half' ? '1ra Q.' : '2da Q.';
    const monthLabel = MONTHS[(p.month ?? 1) - 1] || 'Enero';
    return `${typeLabel} - ${monthLabel} ${p.year}`;
  };

  const formatDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('es-AR');
  const formatCurrency = (val: number) => `$${Number(val).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px"><GearSpinner /></Box>;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Box display="flex" alignItems="center" gap={1}>
          <TitleIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" fontWeight={700} letterSpacing="-0.02em" color="#1E293B">Quincenas</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadPeriods} size="small">Actualizar</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenDialog(true)} size="small">Abrir Quincena</Button>
        </Box>
      </Box>

      <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />
      <FeedbackModal open={!!success} onClose={() => setSuccess('')} message={success} type="success" />
      <FeedbackModal
        open={!!confirmModal}
        onClose={() => setConfirmModal(null)}
        message={confirmModal?.message || ''}
        type="warning"
        title="Confirmar acción"
        onConfirm={confirmModal?.action}
        confirmLabel="Confirmar"
      />

      <Grid container spacing={3}>
        {periods.map((p) => (
          <Grid size={{ xs: 12, md: 6, lg: 4 }} key={p.id}>
            <Card sx={{ p: 3, position: 'relative', overflow: 'hidden' }}>
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
                  <Button variant="contained" color="warning" size="small" fullWidth onClick={() => handleOpenClose(p)} startIcon={<ConfirmIcon />}>
                    Cerrar
                  </Button>
                )}
                
                {p.status === 'closed' && (
                  <Button variant="contained" color="info" size="small" fullWidth onClick={() => handlePay(p.id)} startIcon={<PaymentIcon />}>
                    Marcar Pagada
                  </Button>
                )}
              </Stack>
            </Card>
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

      <AppDialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth>
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
          <Button onClick={handleCreate} variant="contained" disabled={processing}>
            {processing ? <GearSpinner size={20} /> : 'Abrir Quincena'}
          </Button>
        </DialogActions>
      </AppDialog>

      <AppDialog open={!!closingPeriod} onClose={() => setClosingPeriod(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Cerrar Quincena</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Al cerrar, ya no se podrán cargar más horas ni regenerar la liquidación de esta quincena.
            </Typography>

            {usdPreviewLoading && (
              <Box display="flex" justifyContent="center" py={2}><GearSpinner size={24} /></Box>
            )}

            {usdPreview && usdPreview.affected_entries > 0 && (
              <>
                <Alert severity="info">
                  Cotización del <strong>{formatDate(usdPreview.rate_date)}</strong>, día siguiente al cierre de la quincena.
                </Alert>
                {!usdPreview.rate_date_published && (
                  <Alert severity="warning">
                    La cotización del {formatDate(usdPreview.rate_date)} todavía no está publicada — podés esperar o cargarla a mano.
                  </Alert>
                )}
                <CurrencyInput
                  label="Cotización a congelar ($) *"
                  value={rateInput}
                  onChange={setRateInput}
                  fullWidth
                  size="small"
                />
                <Typography variant="body2" color="text.secondary">
                  {usdPreview.affected_entries} empleado(s) con cuota en dólares — total USD{' '}
                  {usdPreview.affected_total_usd.toLocaleString('en-US', { minimumFractionDigits: 2 })}.
                </Typography>
                {usdPreview.estimated_delta_ars !== 0 && (
                  <Alert severity="warning">
                    Al cerrar, el neto de {usdPreview.affected_entries} empleado(s) se recalcula con esta
                    cotización ({usdPreview.estimated_delta_ars > 0 ? '+' : ''}{formatCurrency(usdPreview.estimated_delta_ars)} respecto de la provisoria).
                  </Alert>
                )}
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClosingPeriod(null)}>Cancelar</Button>
          <Button onClick={handleConfirmClose} variant="contained" color="warning" disabled={processing || usdPreviewLoading}>
            {processing ? <GearSpinner size={20} /> : 'Cerrar Quincena'}
          </Button>
        </DialogActions>
      </AppDialog>
    </Box>
  );
}
