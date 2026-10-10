'use client';
import React, { useState } from 'react';
import { TextField, TextFieldProps } from '@mui/material';
import { validateEmail } from '../utils/validators';

export interface EmailFieldProps extends Omit<TextFieldProps, 'value' | 'onChange' | 'error' | 'helperText' | 'type'> {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  // El formulario lo prende al intentar guardar, para revelar todos los errores de una — hasta
  // entonces, el error solo se muestra una vez que el usuario tocó el campo (onBlur).
  forceShowError?: boolean;
  helperText?: string;
}

export default function EmailField({ value, onChange, required, forceShowError, helperText, onBlur, ...rest }: EmailFieldProps) {
  const [touched, setTouched] = useState(false);
  const errorMessage = validateEmail(value, { required });
  const showError = !!errorMessage && (touched || !!forceShowError);

  return (
    <TextField
      {...rest}
      type="email"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={(e) => {
        setTouched(true);
        onBlur?.(e);
      }}
      error={showError}
      helperText={showError ? errorMessage : helperText}
    />
  );
}
