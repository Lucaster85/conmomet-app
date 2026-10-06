'use client';
import React, { useMemo, useState } from 'react';
import { Autocomplete, Box, TextField, Typography } from '@mui/material';

// Select con búsqueda y alta inline ("Agregar «X»" al final de la lista). Es genérico a
// propósito: no sabe de proveedores ni materiales — el padre pasa las opciones y qué hacer al
// crear. Ejemplos de uso en components/materials/ (ProviderPriceAutocomplete, MaterialSelect).

type Opt<T> = { kind: 'item'; item: T } | { kind: 'create'; name: string };

export interface CreatableSelectProps<T extends { id: number }> {
  // Ya ordenadas como se quieren ver.
  options: T[];
  getLabel: (option: T) => string;
  // Dato alineado a la derecha de cada opción (ej. el precio de un proveedor).
  renderSecondary?: (option: T) => React.ReactNode;
  value: number | null;
  // Opción elegida que puede no estar (todavía) en `options` — ej. un proveedor dado de baja.
  valueFallback?: T | null;
  onChange: (option: T | null) => void;
  // Alta inline. Devuelve la opción creada (queda elegida), o null/undefined si el alta se
  // resuelve por otro lado (ej. un diálogo que pide más datos) y el padre elige después.
  onCreate?: (name: string) => Promise<T | null | void>;
  onError?: (message: string) => void;
  excludeIds?: number[];
  label?: string;
  helperText?: React.ReactNode;
  placeholder?: string;
  error?: boolean;
  size?: 'small' | 'medium';
  disabled?: boolean;
  disableClearable?: boolean;
  fullWidth?: boolean;
  createLabel?: (name: string) => string;
  noOptionsText?: string;
}

const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

export default function CreatableSelect<T extends { id: number }>({
  options, getLabel, renderSecondary, value, valueFallback, onChange, onCreate, onError,
  excludeIds = [], label, helperText, placeholder, error, size = 'small', disabled, disableClearable, fullWidth = true,
  createLabel = (name) => `Agregar «${name}»`, noOptionsText = 'Sin resultados',
}: CreatableSelectProps<T>) {
  const [busy, setBusy] = useState(false);
  // Lo recién creado puede tardar un render en llegar a `options` (el padre recarga la lista).
  const [created, setCreated] = useState<T | null>(null);

  const items = useMemo(() => {
    const list = options.filter((o) => !excludeIds.includes(o.id) || o.id === value);
    if (value && !list.some((o) => o.id === value)) {
      const extra = valueFallback?.id === value ? valueFallback : created?.id === value ? created : null;
      if (extra) list.push(extra);
    }
    return list;
  }, [options, excludeIds, value, valueFallback, created]);

  const selectedItem = items.find((o) => o.id === value);
  const selected: Opt<T> | null = selectedItem ? { kind: 'item', item: selectedItem } : null;

  const handleChange = async (_e: React.SyntheticEvent, option: Opt<T> | null) => {
    if (!option) {
      onChange(null);
      return;
    }
    if (option.kind === 'item') {
      onChange(option.item);
      return;
    }
    if (!onCreate) return;
    setBusy(true);
    try {
      const result = await onCreate(option.name);
      if (result) {
        setCreated(result);
        onChange(result);
      }
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'No se pudo crear');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Autocomplete<Opt<T>, false, boolean, false>
      size={size}
      fullWidth={fullWidth}
      disabled={disabled || busy}
      disableClearable={disableClearable as false}
      options={items.map((item): Opt<T> => ({ kind: 'item', item }))}
      value={selected}
      onChange={handleChange}
      getOptionLabel={(o) => (o.kind === 'item' ? getLabel(o.item) : o.kind === 'create' ? o.name : '')}
      isOptionEqualToValue={(a, b) => a.kind === 'item' && b.kind === 'item' && a.item.id === b.item.id}
      noOptionsText={noOptionsText}
      filterOptions={(opts, state) => {
        const query = normalize(state.inputValue);
        const filtered = query ? opts.filter((o) => o.kind === 'item' && normalize(getLabel(o.item)).includes(query)) : opts;
        const result: Opt<T>[] = [...filtered];
        const typed = state.inputValue.trim();
        if (onCreate && typed && !opts.some((o) => o.kind === 'item' && normalize(getLabel(o.item)) === query)) {
          result.push({ kind: 'create', name: typed });
        }
        return result;
      }}
      renderOption={(props, option) => {
        const { key, ...rest } = props as React.HTMLAttributes<HTMLLIElement> & { key: string };
        if (option.kind === 'create') {
          return (
            <li key={key} {...rest}>
              <Typography variant="body2" color="primary" fontWeight={600}>{createLabel(option.name)}</Typography>
            </li>
          );
        }
        return (
          <li key={key} {...rest}>
            <Box display="flex" justifyContent="space-between" alignItems="center" width="100%" gap={2}>
              <Typography variant="body2">{getLabel(option.item)}</Typography>
              {renderSecondary?.(option.item)}
            </Box>
          </li>
        );
      }}
      renderInput={(params) => <TextField {...params} label={label} placeholder={placeholder} error={error} helperText={helperText} />}
    />
  );
}
