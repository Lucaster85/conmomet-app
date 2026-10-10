'use client';
import React, { useState } from 'react';
import { TextField, TextFieldProps } from '@mui/material';
import { digitsOnly, maskCuit } from '../utils/cuit';
import { validateCuit } from '../utils/validators';

export interface CuitFieldProps extends Omit<TextFieldProps, 'value' | 'onChange' | 'error' | 'helperText'> {
  value: string; // solo dígitos (sin guiones) — es el formato que se guarda
  onChange: (value: string) => void; // emite solo dígitos, nunca el string con guiones
  required?: boolean;
  forceShowError?: boolean;
  helperText?: string;
}

// CUIT/CUIL argentino: 11 dígitos con dígito verificador (módulo 11). Muestra "20-12345678-9"
// mientras se tipea (utils/cuit.ts#maskCuit), pero el valor que maneja el formulario son solo
// dígitos — mismo criterio que ya usa el backend (api_conmomet/helpers/cuit.js).
export default function CuitField({ value, onChange, required, forceShowError, helperText, onBlur, ...rest }: CuitFieldProps) {
  const [touched, setTouched] = useState(false);
  const errorMessage = validateCuit(value, { required });
  const showError = !!errorMessage && (touched || !!forceShowError);

  return (
    <TextField
      {...rest}
      value={maskCuit(value)}
      onChange={(e) => onChange(digitsOnly(e.target.value).slice(0, 11))}
      onBlur={(e) => {
        setTouched(true);
        onBlur?.(e);
      }}
      placeholder={rest.placeholder ?? '20-12345678-9'}
      inputProps={{ inputMode: 'numeric', maxLength: 13, ...rest.inputProps }}
      error={showError}
      helperText={showError ? errorMessage : helperText}
    />
  );
}
