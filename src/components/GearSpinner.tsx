'use client';
import React from 'react';
import { Box } from '@mui/material';

interface GearSpinnerProps {
  size?: number;
}

// Recorta el engranaje de la franja izquierda del logo (sin el texto "Conmomet")
// vía background-position, y lo hace girar — usado como indicador de carga.
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
        backgroundImage: 'url(/img/logos/logo-conmomet-ROJO.png)',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'left center',
        backgroundSize: 'auto 100%',
        animation: 'gear-spin 1.2s linear infinite',
        '@keyframes gear-spin': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
      }}
    />
  );
}
