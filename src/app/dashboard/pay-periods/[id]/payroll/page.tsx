'use client';
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, CircularProgress, TextField, Stack, Chip, Tooltip,
} from '@mui/material';
import { Refresh as RefreshIcon, Edit as EditIcon, CheckCircle as ConfirmIcon, Calculate as CalcIcon, ArrowBack as BackIcon, Payment as PaymentIcon } from '@mui/icons-material';
import { PayrollEntry, PayrollService, PayPeriod } from '../../../../../utils/api';
import { TokenManager } from '../../../../../utils/auth';
import { useParams, useRouter } from 'next/navigation';

export default function PayrollPage() {
  const params = useParams();
  const router = useRouter();
  const payPeriodId = Number(params.id);

  const [entries, setEntries] = useState<PayrollEntry[]>([]);
  const [period, setPeriod] = useState<PayPeriod | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [openEdit, setOpenEdit] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PayrollEntry | null>(null);
  const [form, setForm] = useState({ extra_payments: 0, extra_payments_notes: '', deductions: 0, deductions_notes: '' });

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await TokenManager.authenticatedFetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/payroll/${payPeriodId}`);
      if (!res.ok) throw new Error('Error al cargar');
      const json = await res.json();
      setEntries(json.data || []);
      setPeriod(json.period || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData(); }, [payPeriodId]);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      await PayrollService.generate(payPeriodId);
      setSuccess('Liquidación generada/actualizada');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar');
      setLoading(false);
    }
  };

  const handleConfirm = async (id: number) => {
    try {
      await PayrollService.confirm(id);
      setSuccess('Liquidación confirmada');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al confirmar');
    }
  };

  const handlePayItem = async (id: number) => {
    try {
      await PayrollService.pay(id);
      setSuccess('Liquidación pagada');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al pagar');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingEntry) return;
    try {
      await PayrollService.update(editingEntry.id, form);
      setSuccess('Actualizado');
      setOpenEdit(false);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  const formatCurrency = (v: number) => `$${Number(v).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px"><CircularProgress /></Box>;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton onClick={() => router.push('/dashboard/pay-periods')}><BackIcon /></IconButton>
          <Typography variant="h4" fontWeight="bold">Liquidación</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadData} size="small">Actualizar</Button>
          {period?.status === 'open' && (
            <Button variant="contained" color="secondary" startIcon={<CalcIcon />} onClick={handleGenerate} size="small">Generar Liquidación</Button>
          )}
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {entries.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary" mb={2}>No se ha generado la liquidación para esta quincena aún.</Typography>
          {period?.status === 'open' && (
            <Button variant="contained" color="secondary" startIcon={<CalcIcon />} onClick={handleGenerate}>Generar Ahora</Button>
          )}
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell><strong>Empleado</strong></TableCell>
                <TableCell align="right"><strong>Hs Normales</strong></TableCell>
                <TableCell align="right"><strong>Hs Extras</strong></TableCell>
                <TableCell align="right"><strong>Sueldo Bruto</strong></TableCell>
                <TableCell align="right"><strong>Adelantos</strong></TableCell>
                <TableCell align="right"><strong>Otros / Ret.</strong></TableCell>
                <TableCell align="right"><strong>Sueldo Neto</strong></TableCell>
                <TableCell align="center"><strong>Estado</strong></TableCell>
                <TableCell align="center"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entries.map(e => (
                <TableRow key={e.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">{e.employee?.lastname}, {e.employee?.name}</Typography>
                    <Typography variant="caption" color="text.secondary">DNI: {e.employee?.dni}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">{e.total_regular_hours}h</Typography>
                    <Typography variant="caption" color="text.secondary">{formatCurrency(e.regular_amount)}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">{Number(e.total_overtime_50_hours) + Number(e.total_overtime_100_hours)}h</Typography>
                    <Typography variant="caption" color="text.secondary">{formatCurrency(Number(e.overtime_50_amount) + Number(e.overtime_100_amount))}</Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ bgcolor: 'grey.50' }}><strong>{formatCurrency(e.gross_amount)}</strong></TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="error">-{formatCurrency(e.advances_deducted)}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    {Number(e.extra_payments) > 0 && <Typography variant="caption" color="success.main" display="block">+{formatCurrency(e.extra_payments)}</Typography>}
                    {Number(e.deductions) > 0 && <Typography variant="caption" color="error.main" display="block">-{formatCurrency(e.deductions)}</Typography>}
                    {Number(e.extra_payments) === 0 && Number(e.deductions) === 0 && '—'}
                  </TableCell>
                  <TableCell align="right" sx={{ bgcolor: 'success.50' }}>
                    <Typography fontWeight="bold" color="success.dark">{formatCurrency(e.net_amount)}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={e.status} size="small" color={e.status === 'paid' ? 'info' : e.status === 'confirmed' ? 'success' : 'warning'} />
                  </TableCell>
                  <TableCell align="center">
                    <Box display="flex" justifyContent="center">
                      {e.status === 'draft' && (
                        <>
                          <Tooltip title="Ajustes (Extras/Retenciones)"><IconButton size="small" color="primary" onClick={() => {
                            setEditingEntry(e);
                            setForm({ extra_payments: e.extra_payments, extra_payments_notes: e.extra_payments_notes || '', deductions: e.deductions, deductions_notes: e.deductions_notes || '' });
                            setOpenEdit(true);
                          }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title="Confirmar liquidación"><IconButton size="small" color="success" onClick={() => handleConfirm(e.id)}><ConfirmIcon fontSize="small" /></IconButton></Tooltip>
                        </>
                      )}
                      {e.status === 'confirmed' && (
                        <Tooltip title="Marcar como pagado"><IconButton size="small" color="info" onClick={() => handlePayItem(e.id)}><PaymentIcon fontSize="small" /></IconButton></Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Edit Adjustments Dialog */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Ajustes Manuales - {editingEntry?.employee?.name} {editingEntry?.employee?.lastname}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Box display="flex" gap={2}>
              <TextField label="Pagos Extra ($)" type="number" fullWidth value={form.extra_payments} onChange={(e) => setForm({ ...form, extra_payments: Number(e.target.value) })} />
              <TextField label="Motivo (Pagos Extra)" fullWidth value={form.extra_payments_notes} onChange={(e) => setForm({ ...form, extra_payments_notes: e.target.value })} />
            </Box>
            <Box display="flex" gap={2}>
              <TextField label="Deducciones ($)" type="number" fullWidth value={form.deductions} onChange={(e) => setForm({ ...form, deductions: Number(e.target.value) })} />
              <TextField label="Motivo (Deducciones)" fullWidth value={form.deductions_notes} onChange={(e) => setForm({ ...form, deductions_notes: e.target.value })} />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)}>Cancelar</Button>
          <Button onClick={handleSaveEdit} variant="contained">Guardar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
