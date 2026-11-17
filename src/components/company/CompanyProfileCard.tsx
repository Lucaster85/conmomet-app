'use client';
import React, { useEffect, useState } from 'react';
import { Box, Button, Card, CardContent, MenuItem, Stack, TextField, Typography } from '@mui/material';
import GearSpinner from '../GearSpinner';
import CuitField from '../CuitField';
import DateField from '../DateField';
import { CompanyProfile, CompanyProfileInput, CompanySettingsService, CompanyVatCondition, FceTransferOption } from '../../utils/api';
import { validateCuit, validateEmail } from '../../utils/validators';

const VAT_LABELS: Record<CompanyVatCondition, string> = {
  responsable_inscripto: 'IVA Responsable Inscripto',
  monotributo: 'Monotributo',
  exento: 'IVA Exento',
};

interface FormState {
  legal_name: string; display_name: string; cuit: string;
  address_street: string; address_number: string; address_locality: string; address_province: string;
  vat_condition: CompanyVatCondition; iibb_number: string; activity_start_date: string;
  email: string; phone: string; fce_transfer_option: FceTransferOption;
}

const toForm = (p: CompanyProfile): FormState => ({
  legal_name: p.legal_name || '', display_name: p.display_name || '', cuit: p.cuit || '',
  address_street: p.address_street || '', address_number: p.address_number || '',
  address_locality: p.address_locality || '', address_province: p.address_province || '',
  vat_condition: p.vat_condition, iibb_number: p.iibb_number || '', activity_start_date: p.activity_start_date || '',
  email: p.email || '', phone: p.phone || '', fce_transfer_option: p.fce_transfer_option,
});

interface Props {
  profile: CompanyProfile;
  onSaved: (profile: CompanyProfile) => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export default function CompanyProfileCard({ profile, onSaved, onSuccess, onError }: Props) {
  const [form, setForm] = useState<FormState>(toForm(profile));
  const [saving, setSaving] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => { setForm(toForm(profile)); }, [profile]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    setShowErrors(true);
    if (validateCuit(form.cuit) || validateEmail(form.email)) {
      onError('Revisá los campos marcados antes de guardar.');
      return;
    }
    setSaving(true);
    try {
      const payload: CompanyProfileInput = { ...form, cuit: form.cuit || null, activity_start_date: form.activity_start_date || null };
      const updated = await CompanySettingsService.updateProfile(payload);
      onSaved(updated);
      onSuccess('Datos de la empresa guardados.');
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Error al guardar los datos de la empresa');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card sx={{ borderRadius: 3, mb: 3 }}>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="h6" fontWeight={600} mb={0.5}>Emisor de las facturas</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Estos datos salen impresos en las facturas y se mandan a ARCA. Al emitir una factura se guardan junto con ella:
          cambiarlos después no modifica las facturas ya emitidas.
        </Typography>

        <Stack spacing={2}>
          <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={2}>
            <TextField label="Razón social" value={form.legal_name} onChange={(e) => set('legal_name', e.target.value)} fullWidth />
            <TextField label="Nombre para el encabezado" value={form.display_name} onChange={(e) => set('display_name', e.target.value)} fullWidth />
            <CuitField label="CUIT" value={form.cuit} onChange={(v) => set('cuit', v)} forceShowError={showErrors} fullWidth />
            <TextField select label="Condición frente al IVA" value={form.vat_condition} onChange={(e) => set('vat_condition', e.target.value as CompanyVatCondition)} fullWidth>
              {(Object.keys(VAT_LABELS) as CompanyVatCondition[]).map((k) => <MenuItem key={k} value={k}>{VAT_LABELS[k]}</MenuItem>)}
            </TextField>
            <TextField label="Ingresos Brutos (N°)" value={form.iibb_number} onChange={(e) => set('iibb_number', e.target.value)} fullWidth />
            <DateField label="Inicio de actividades" value={form.activity_start_date} onChange={(v) => set('activity_start_date', v)} fullWidth />
          </Box>

          <Typography variant="subtitle2" color="text.secondary">Domicilio comercial</Typography>
          <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '2fr 1fr' }} gap={2}>
            <TextField label="Calle" value={form.address_street} onChange={(e) => set('address_street', e.target.value)} fullWidth />
            <TextField label="Número" value={form.address_number} onChange={(e) => set('address_number', e.target.value)} fullWidth />
          </Box>
          <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={2}>
            <TextField label="Localidad" value={form.address_locality} onChange={(e) => set('address_locality', e.target.value)} fullWidth />
            <TextField label="Provincia" value={form.address_province} onChange={(e) => set('address_province', e.target.value)} fullWidth />
          </Box>

          <Typography variant="subtitle2" color="text.secondary">Contacto y Factura de Crédito Electrónica (FCE)</Typography>
          <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={2}>
            <TextField
              label="Email de contacto" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} fullWidth
              error={showErrors && !!validateEmail(form.email)} helperText={showErrors ? validateEmail(form.email) || undefined : undefined}
            />
            <TextField label="Teléfono" value={form.phone} onChange={(e) => set('phone', e.target.value)} fullWidth />
            <TextField
              select label="Opción de transferencia de la FCE (por defecto)" value={form.fce_transfer_option}
              onChange={(e) => set('fce_transfer_option', e.target.value as FceTransferOption)} fullWidth
              helperText="SCA: sistema de circulación abierta · ADC: agente de depósito colectivo. Cada cliente puede tener la suya."
            >
              <MenuItem value="SCA">SCA — Circulación abierta</MenuItem>
              <MenuItem value="ADC">ADC — Agente de depósito colectivo</MenuItem>
            </TextField>
          </Box>

          <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ alignSelf: 'flex-start' }}>
            {saving ? <GearSpinner size={20} /> : 'Guardar'}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
