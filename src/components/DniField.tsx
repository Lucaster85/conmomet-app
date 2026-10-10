'use client';
import React, { useState } from 'react';
import { TextField, TextFieldProps } from '@mui/material';
import { digitsOnly } from '../utils/cuit';
import { maskDni, validateDni } from '../utils/validators';

export interface DniFieldProps extends Omit<TextFieldProps, 'value' | 'onChange' | 'error' | 'helperText'> {
  value: string; // solo dígitos — es el formato que se guarda
  onChange: (value: string) => void; // emite solo dígitos, nunca el string con puntos
  required?: boolean;
  forceShowError?: boolean;
  helperText?: string;
}

// DNI argentino: bloquea letras, agrega puntos de miles al mostrar ("12345678" -> "12.345.678")
// y exige 7 u 8 dígitos (el rango real de DNI vigentes). El valor que maneja el formulario son
// solo dígitos.
export default function DniField({ value, onChange, required, forceShowError, helperText, onBlur, ...rest }: DniFieldProps) {
  const [touched, setTouched] = useState(false);
  const errorMessage = validateDni(value, { required });
  const showError = !!errorMessage && (touched || !!forceShowError);

  return (
    <TextField
      {...rest}
      value={maskDni(value)}
      onChange={(e) => onChange(digitsOnly(e.target.value).slice(0, 8))}
      onBlur={(e) => {
        setTouched(true);
        onBlur?.(e);
      }}
      inputProps={{ inputMode: 'numeric', maxLength: 10, ...rest.inputProps }}
      error={showError}
      helperText={showError ? errorMessage : helperText}
    />
  );
}
