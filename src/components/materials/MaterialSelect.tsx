'use client';
import React from 'react';
import { Typography } from '@mui/material';
import CreatableSelect from '../common/CreatableSelect';
import { Material } from '../../utils/api';

interface Props {
  materials: Material[];
  value: number | null;
  onChange: (material: Material | null) => void;
  // Crear un material pide más que un nombre (unidad, proveedor, costo): el padre abre su
  // diálogo de alta y, al confirmar, elige el material creado. Por eso no devuelve nada acá.
  onCreateRequest: (name: string) => void;
  label?: string;
  helperText?: React.ReactNode;
  placeholder?: string;
  error?: boolean;
  size?: 'small' | 'medium';
  disabled?: boolean;
}

export default function MaterialSelect({
  materials, value, onChange, onCreateRequest, label = 'Material', helperText, placeholder, error, size = 'small', disabled,
}: Props) {
  return (
    <CreatableSelect<Material>
      options={materials}
      getLabel={(m) => m.description}
      renderSecondary={(m) => m.materialUnit?.label
        ? <Typography variant="caption" color="text.secondary">{m.materialUnit.label}</Typography>
        : null}
      value={value}
      onChange={onChange}
      onCreate={async (name) => { onCreateRequest(name); return null; }}
      label={label}
      helperText={helperText}
      placeholder={placeholder}
      error={error}
      size={size}
      disabled={disabled}
      noOptionsText="Escribí para crear un material"
    />
  );
}
