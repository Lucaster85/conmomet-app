'use client';
import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, Stack, Button, InputAdornment, Autocomplete, TextField, Chip } from '@mui/material';
import GearSpinner from '@/components/GearSpinner';
import { SettingsOutlined as TitleIcon } from '@mui/icons-material';
import CurrencyInput from '@/components/CurrencyInput';
import FeedbackModal from '@/components/FeedbackModal';
import { SystemSettingService, UserService, User } from '@/utils/api';

export default function SystemSettingsPage() {
  const [maxLoanAmount, setMaxLoanAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [users, setUsers] = useState<User[]>([]);
  const [ocaBudgetUserId, setOcaBudgetUserId] = useState<number | null>(null);
  const [savingOcaBudgetUser, setSavingOcaBudgetUser] = useState(false);

  // Alícuotas de IVA de Facturación. Arranca solo con 21%; el cliente agrega las que necesite.
  const [ivaRates, setIvaRates] = useState<number[]>([21]);
  const [newIvaRate, setNewIvaRate] = useState('');
  const [savingIva, setSavingIva] = useState(false);

  useEffect(() => {
    SystemSettingService.get()
      .then((settings) => {
        setMaxLoanAmount(Number(settings.max_loan_amount_ars));
        setOcaBudgetUserId(settings.oca_budget_notification_user_id ?? null);
        setIvaRates(settings.invoice_iva_rates && settings.invoice_iva_rates.length > 0 ? settings.invoice_iva_rates : [21]);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar la configuración'))
      .finally(() => setLoading(false));
    UserService.getAll().then((list) => setUsers(Array.isArray(list) ? list : [])).catch(() => { /* ignore */ });
  }, []);

  const handleSave = async () => {
    if (!maxLoanAmount || maxLoanAmount <= 0) {
      setError('El tope debe ser mayor a cero.');
      return;
    }
    setSaving(true);
    try {
      const updated = await SystemSettingService.update({ max_loan_amount_ars: maxLoanAmount });
      setMaxLoanAmount(Number(updated.max_loan_amount_ars));
      setSuccess('Configuración actualizada correctamente.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOcaBudgetUser = async () => {
    setSavingOcaBudgetUser(true);
    try {
      await SystemSettingService.update({ oca_budget_notification_user_id: ocaBudgetUserId });
      setSuccess('Configuración actualizada correctamente.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la configuración');
    } finally {
      setSavingOcaBudgetUser(false);
    }
  };

  const handleAddIvaRate = () => {
    const rate = Number(newIvaRate.replace(',', '.'));
    if (newIvaRate.trim() === '' || !Number.isFinite(rate) || rate < 0 || rate > 100 || Math.abs(Math.round(rate * 100) - rate * 100) > 1e-9) {
      setError('Ingresá una alícuota entre 0 y 100, con hasta 2 decimales.');
      return;
    }
    if (ivaRates.includes(rate)) {
      setError('Esa alícuota ya está en la lista.');
      return;
    }
    setIvaRates([...ivaRates, rate].sort((a, b) => a - b));
    setNewIvaRate('');
  };

  const handleSaveIvaRates = async () => {
    setSavingIva(true);
    try {
      const updated = await SystemSettingService.update({ invoice_iva_rates: ivaRates });
      setIvaRates(updated.invoice_iva_rates && updated.invoice_iva_rates.length > 0 ? updated.invoice_iva_rates : [21]);
      setSuccess('Alícuotas de IVA actualizadas correctamente.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar las alícuotas de IVA');
    } finally {
      setSavingIva(false);
    }
  };

  if (loading) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px"><GearSpinner /></Box>;
  }

  return (
    <Box>
      <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />
      <FeedbackModal open={!!success} onClose={() => setSuccess('')} message={success} type="success" />

      <Box display="flex" alignItems="center" gap={1} mb={3}>
        <TitleIcon color="primary" sx={{ fontSize: 32 }} />
        <Typography variant="h4" fontWeight={700} letterSpacing="-0.02em" color="#1E293B">Configuración General</Typography>
      </Box>

      <Card sx={{ maxWidth: 480, borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} mb={0.5}>Préstamos</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Monto máximo permitido para un préstamo nuevo (de cuota fija), tanto al solicitarlo
            desde el portal como al otorgarlo/aprobarlo desde acá.
          </Typography>
          <Stack spacing={2}>
            <CurrencyInput
              label="Tope máximo de préstamo ($)"
              fullWidth
              value={maxLoanAmount}
              onChange={setMaxLoanAmount}
              InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
            />
            <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ alignSelf: 'flex-start' }}>
              {saving ? 'Guardando…' : 'Guardar'}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ maxWidth: 480, borderRadius: 3, mt: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} mb={0.5}>OCAs — Presupuestos</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Usuario que ve, arriba de todo en su dashboard, el aviso de OCAs aprobadas que
            requieren presupuesto y todavía no fueron presentadas a administración del cliente.
          </Typography>
          <Stack spacing={2}>
            <Autocomplete
              options={users}
              getOptionLabel={(u) => `${u.lastname}, ${u.name}`}
              value={users.find(u => u.id === ocaBudgetUserId) || null}
              onChange={(_, val) => setOcaBudgetUserId(val ? val.id : null)}
              renderInput={(params) => <TextField {...params} label="Usuario a avisar" placeholder="Buscar usuario..." />}
            />
            <Button variant="contained" onClick={handleSaveOcaBudgetUser} disabled={savingOcaBudgetUser} sx={{ alignSelf: 'flex-start' }}>
              {savingOcaBudgetUser ? 'Guardando…' : 'Guardar'}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ maxWidth: 480, borderRadius: 3, mt: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} mb={0.5}>Facturación — Alícuotas de IVA</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Alícuotas que se pueden elegir al cargar una factura. Las facturas ya cargadas guardan la
            que usaron, así que quitar una de la lista no las modifica.
          </Typography>
          <Stack spacing={2}>
            <Box display="flex" gap={1} flexWrap="wrap">
              {ivaRates.map((rate) => (
                <Chip
                  key={rate}
                  label={`${rate.toLocaleString('es-AR', { maximumFractionDigits: 2 })}%`}
                  onDelete={ivaRates.length > 1 ? () => setIvaRates(ivaRates.filter((r) => r !== rate)) : undefined}
                />
              ))}
            </Box>
            <Box display="flex" gap={1}>
              <TextField
                label="Nueva alícuota" size="small" value={newIvaRate}
                onChange={(e) => setNewIvaRate(e.target.value.replace(/[^\d.,]/g, ''))}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddIvaRate(); } }}
                InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                inputProps={{ inputMode: 'decimal' }}
                sx={{ maxWidth: 180 }}
              />
              <Button variant="outlined" onClick={handleAddIvaRate}>Agregar</Button>
            </Box>
            <Button variant="contained" onClick={handleSaveIvaRates} disabled={savingIva} sx={{ alignSelf: 'flex-start' }}>
              {savingIva ? 'Guardando…' : 'Guardar'}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
