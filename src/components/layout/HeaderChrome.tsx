'use client';
import React from 'react';
import { Box, IconButton, IconButtonProps, Avatar } from '@mui/material';
import Image from 'next/image';

// Medidas compartidas entre el header del dashboard y el del portal — antes cada layout traía
// sus propios números (72/64 de alto, 46/38 vs 34 de avatar, 32 vs default de ícono) y se
// desalineaban solos con cada retoque. Un solo lugar para cambiarlas evita que vuelvan a divergir.
// Valores tomados tal cual del portal (el usuario pidió mantener ese tamaño como referencia).
export const HEADER_MIN_HEIGHT = { xs: 72, sm: 64 };
export const HEADER_TOGGLE_ICON_SIZE = 32;
export const HEADER_LOGO_HEIGHT = { xs: 42, sm: 44 };
export const HEADER_AVATAR_SIZE = { xs: 46, sm: 38 };

export function HeaderLogo({ sx }: { sx?: object }) {
  return (
    <Box sx={{ height: HEADER_LOGO_HEIGHT, display: 'flex', alignItems: 'center', ...sx }}>
      <Image
        src="/img/logos/logo-conmomet-ROJO.png"
        alt="Conmomet"
        width={192}
        height={58}
        style={{ objectFit: 'contain', width: 'auto', height: '100%' }}
        priority
      />
    </Box>
  );
}

interface HeaderAvatarButtonProps extends Omit<IconButtonProps, 'children'> {
  initials: string;
  gradient: string;
  shadowColor: string;
}

export function HeaderAvatarButton({ initials, gradient, shadowColor, sx, ...iconButtonProps }: HeaderAvatarButtonProps) {
  return (
    <IconButton color="inherit" sx={{ p: 0.5, ...sx }} {...iconButtonProps}>
      <Avatar
        sx={{
          width: HEADER_AVATAR_SIZE,
          height: HEADER_AVATAR_SIZE,
          fontSize: '0.9rem',
          fontWeight: 700,
          letterSpacing: '0.02em',
          color: 'white',
          background: gradient,
          boxShadow: `0 2px 8px ${shadowColor}`,
        }}
      >
        {initials}
      </Avatar>
    </IconButton>
  );
}
