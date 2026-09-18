'use client';
import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, Stack, Button, InputAdornment, Autocomplete, TextField } from '@mui/material';
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

  useEffect(() => {
    SystemSettingService.get()
      .then((settings) => {
        setMaxLoanAmount(Number(settings.max_loan_amount_ars));
        setOcaBudgetUserId(settings.oca_budget_notification_user_id ?? null);
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
    </Box>
  );
}
