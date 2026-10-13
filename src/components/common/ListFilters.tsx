'use client';
import React from 'react';
import {
  Box, Grid, Paper, TextField, InputAdornment, Button,
} from '@mui/material';
import { SearchOutlined as SearchIcon, ClearOutlined as ClearIcon } from '@mui/icons-material';

interface ListFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  // Se muestra solo si hay al menos un filtro activo (search u otro) — único precedente:
  // safety-equipment/page.tsx.
  onClear?: () => void;
  hasActiveFilters?: boolean;
  children?: React.ReactNode;
}

// Panel de filtros estándar de la app: look de Card (mismo radio y sombra que
// theme.ts#MuiCard) pero sin el translateY del hover, que hace saltar el panel mientras
// se tipea o se elige un select. Ver conmomet-app/CLAUDE.md.
export default function ListFilters({
  search, onSearchChange, searchPlaceholder, onClear, hasActiveFilters, children,
}: ListFiltersProps) {
  const filterFields = React.Children.toArray(children);

  return (
    <Paper
      sx={{
        p: 2, mb: 2, borderRadius: 4,
        boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
      }}
    >
      <Grid container spacing={2} alignItems="center">
        <Grid size={{ xs: 12 }}>
          <TextField
            size="small"
            fullWidth
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
          />
        </Grid>
        {filterFields.map((field, i) => (
          <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
            {field}
          </Grid>
        ))}
        {onClear && hasActiveFilters && (
          <Grid size={{ xs: 12 }}>
            <Box display="flex" justifyContent="flex-end">
              <Button size="small" startIcon={<ClearIcon />} onClick={onClear}>
                Limpiar filtros
              </Button>
            </Box>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
}

interface FilterSelectOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  emptyLabel: string;
  options: FilterSelectOption[];
  disabled?: boolean;
}

// Select estándar de los paneles de filtro: TextField select native, sin el prefijo
// "Filtrar" en el label (la etiqueta sola ya dice qué filtra) y con la opción vacía en
// plural ("Todos los clientes", no "Todos" ni "").
export function FilterSelect({ label, value, onChange, emptyLabel, options, disabled }: FilterSelectProps) {
  return (
    <TextField
      label={label}
      select
      size="small"
      fullWidth
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      SelectProps={{ native: true }}
      InputLabelProps={{ shrink: true }}
    >
      <option value="">{emptyLabel}</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </TextField>
  );
}
