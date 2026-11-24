'use client';
import React from 'react';
import { Box } from '@mui/material';
import { useAppEnvironment } from '../EnvironmentProvider';

// Distintivo de ambiente (FLOWS.md §80). Todo devuelve null si no hay APP_ENV_LABEL, así que en
// producción estos componentes no dibujan nada.

const STRIPE_HEIGHT = 4;

/**
 * Chip con el nombre del ambiente. Va dentro del flujo del header (junto al logo, en el login).
 * `sx` permite que cada lugar ajuste márgenes o visibilidad por breakpoint.
 */
export function EnvironmentChip({ sx }: { sx?: object }) {
  const { label, color, textColor } = useAppEnvironment();
  if (!label) return null;
  return (
    <Box
      component="span"
      role="status"
      aria-label={`Ambiente ${label}`}
      className="no-print"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        px: 1.25,
        py: 0.25,
        borderRadius: 1,
        bgcolor: color,
        color: textColor,
        fontSize: '0.75rem',
        fontWeight: 800,
        letterSpacing: '0.08em',
        lineHeight: 1.6,
        flexShrink: 0,
        userSelect: 'none',
        ...sx,
      }}
    >
      {label}
    </Box>
  );
}

/**
 * Franja de color pegada al borde superior del AppBar (que es `position: fixed`, así que sirve de
 * contenedor). Va en `absolute` para no sumar alto al header y no mover los spacers del layout.
 * En pantallas chicas, donde el chip del header no entra junto al logo centrado, lleva además una
 * etiqueta en la esquina izquierda.
 */
export function EnvironmentStripe() {
  const { label, color, textColor } = useAppEnvironment();
  if (!label) return null;
  return (
    <Box
      aria-hidden
      className="no-print"
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: STRIPE_HEIGHT,
        bgcolor: color,
        zIndex: 1,
        pointerEvents: 'none',
      }}
    >
      <Box
        component="span"
        sx={{
          display: { xs: 'block', sm: 'none' },
          position: 'absolute',
          top: STRIPE_HEIGHT,
          left: 0,
          px: 1,
          borderBottomRightRadius: 6,
          bgcolor: color,
          color: textColor,
          fontSize: '0.625rem',
          fontWeight: 800,
          letterSpacing: '0.08em',
          lineHeight: '14px',
        }}
      >
        {label}
      </Box>
    </Box>
  );
}
