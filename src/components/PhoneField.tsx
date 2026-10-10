'use client';
import React, { useState } from 'react';
import { TextField, TextFieldProps } from '@mui/material';
import { digitsOnly } from '../utils/cuit';
import { validatePhone } from '../utils/validators';

export interface PhoneFieldProps extends Omit<TextFieldProps, 'value' | 'onChange' | 'error' | 'helperText'> {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  forceShowError?: boolean;
  helperText?: string;
}

// Teléfono: bloquea letras, exige entre 8 y 15 dígitos. Sin máscara a propósito — los formatos
// argentinos varían demasiado (con/sin 0, con/sin 15, característica de 2 a 4 dígitos) y una
// máscara fija terminaría estorbando más de lo que ayuda.
export default function PhoneField({ value, onChange, required, forceShowError, helperText, onBlur, ...rest }: PhoneFieldProps) {
  const [touched, setTouched] = useState(false);
  const errorMessage = validatePhone(value, { required });
  const showError = !!errorMessage && (touched || !!forceShowError);

  return (
    <TextField
      {...rest}
      value={value}
      onChange={(e) => onChange(digitsOnly(e.target.value).slice(0, 15))}
      onBlur={(e) => {
        setTouched(true);
        onBlur?.(e);
      }}
      inputProps={{ inputMode: 'tel', maxLength: 15, ...rest.inputProps }}
      error={showError}
      helperText={showError ? errorMessage : helperText}
    />
  );
}
