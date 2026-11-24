'use client';
import React from 'react';
import { Box } from '@mui/material';

interface GearSpinnerProps {
  size?: number;
}

// Gira el isotipo de la marca (/brand/mark.png: solo el engranaje, sin el texto "Conmomet") — usado
// como indicador de carga. Cada marca/ambiente trae su propio mark.png (FLOWS.md §81).
export default function GearSpinner({ size = 40 }: GearSpinnerProps) {
  return (
    <Box
      component="span"
      role="progressbar"
      aria-label="Cargando"
      sx={{
        display: 'inline-block',
        width: size,
        height: size,
        backgroundImage: 'url(/brand/mark.png)',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundSize: 'contain',
        animation: 'gear-spin 1.2s linear infinite',
        '@keyframes gear-spin': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
      }}
    />
  );
}
