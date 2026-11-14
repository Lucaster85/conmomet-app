'use client';
import React from 'react';
import { Box, FormControlLabel, MenuItem, Stack, Switch, TextField } from '@mui/material';
import DniField from '../DniField';
import CuitField from '../CuitField';
import PhoneField from '../PhoneField';
import EmailField from '../EmailField';
import DateField from '../DateField';
import AddressAutocomplete from '../AddressAutocomplete';
import { CandidateFormValues, LookupCategory } from '../../utils/api';
import { INTERNAL_SOURCE_OPTIONS } from '../../utils/candidates';

export const emptyCandidateForm = (): CandidateFormValues => ({
  name: '',
  lastname: '',
  dni: '',
  cuil: '',
  email: '',
  phone: '',
  birth_date: '',
  address: '',
  locality: '',
  trade: '',
  category_id: '',
  years_experience: '',
  has_driver_license: false,
  notes: '',
  source: 'in_person',
});

interface Props {
  values: CandidateFormValues;
  onChange: (patch: Partial<CandidateFormValues>) => void;
  categories: LookupCategory[];
  // El formulario lo prende al intentar guardar, para revelar todos los errores de una.
  forceShowError?: boolean;
  // Un postulante que llegó por la web tiene origen "Web", que no se elige a mano: al editarlo se oculta el campo.
  showSource?: boolean;
}

// Los datos de la persona, compartidos entre el alta y la edición. Solo nombre y apellido son
// obligatorios: alguien que se presenta en la oficina puede no tener a mano el DNI o el CUIL.
export default function CandidateFormFields({ values, onChange, categories, forceShowError, showSource = true }: Props) {
  const nameError = forceShowError && !values.name.trim();
  const lastnameError = forceShowError && !values.lastname.trim();

  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
        <TextField label="Nombre *" fullWidth value={values.name} onChange={(e) => onChange({ name: e.target.value })}
          error={nameError} helperText={nameError ? 'Ingresá el nombre.' : undefined} autoComplete="off" />
        <TextField label="Apellido *" fullWidth value={values.lastname} onChange={(e) => onChange({ lastname: e.target.value })}
          error={lastnameError} helperText={lastnameError ? 'Ingresá el apellido.' : undefined} autoComplete="off" />
      </Box>
      <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
        <DniField label="DNI" fullWidth value={values.dni} onChange={(dni) => onChange({ dni })} forceShowError={forceShowError} />
        <CuitField label="CUIL" fullWidth value={values.cuil} onChange={(cuil) => onChange({ cuil })} forceShowError={forceShowError} />
      </Box>
      <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
        <PhoneField label="Teléfono" fullWidth value={values.phone} onChange={(phone) => onChange({ phone })} forceShowError={forceShowError} />
        <EmailField label="Email" fullWidth value={values.email} onChange={(email) => onChange({ email })} forceShowError={forceShowError} />
      </Box>
      <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
        <DateField label="Fecha de nacimiento" fullWidth value={values.birth_date} onChange={(birth_date) => onChange({ birth_date })} InputLabelProps={{ shrink: true }} />
        <TextField label="Localidad" fullWidth value={values.locality} onChange={(e) => onChange({ locality: e.target.value })} autoComplete="off" />
      </Box>
      <AddressAutocomplete label="Dirección" fullWidth value={values.address} onChange={(address) => onChange({ address })} />

      <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
        <TextField label="Oficio o puesto de interés" fullWidth value={values.trade} onChange={(e) => onChange({ trade: e.target.value })} autoComplete="off" />
        <TextField label="Categoría" select fullWidth value={values.category_id} onChange={(e) => onChange({ category_id: e.target.value })}>
          <MenuItem value=""><em>Sin definir</em></MenuItem>
          {categories.map((c) => <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>)}
        </TextField>
      </Box>
      <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' } }}>
        <TextField label="Años de experiencia" type="number" fullWidth value={values.years_experience}
          onChange={(e) => onChange({ years_experience: e.target.value })} inputProps={{ min: 0, max: 70 }} />
        {showSource && (
          <TextField label="Cómo llegó" select fullWidth value={values.source} onChange={(e) => onChange({ source: e.target.value as CandidateFormValues['source'] })}>
            {INTERNAL_SOURCE_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
          </TextField>
        )}
        <FormControlLabel sx={{ flexShrink: 0 }} label="Registro de conducir"
          control={<Switch checked={values.has_driver_license} onChange={(e) => onChange({ has_driver_license: e.target.checked })} />} />
      </Box>
      <TextField label="Notas" fullWidth multiline rows={2} value={values.notes} onChange={(e) => onChange({ notes: e.target.value })}
        helperText="Solo las ve el equipo." />
    </Stack>
  );
}
