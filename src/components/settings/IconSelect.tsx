'use client';
import React from 'react';
import { Box, ButtonBase, FormHelperText, Tooltip, Typography } from '@mui/material';
import { PUBLIC_ICONS, type PublicIconKey } from '../public/icons';

// Nombres en español de cada ícono, para el tooltip y el lector de pantalla.
export const ICON_LABELS: Record<PublicIconKey, string> = {
  phone: 'Teléfono',
  mail: 'Email',
  pin: 'Ubicación',
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  facebook: 'Facebook',
  briefcase: 'Maletín',
  shirt: 'Remera',
  crane: 'Grúa',
  lathe: 'Torno',
  'sheet-bend': 'Plegado de chapa',
  wrench: 'Llave',
  roof: 'Techo',
  weld: 'Soldadura',
  'paint-roller': 'Rodillo',
  container: 'Contenedor',
  blueprint: 'Plano',
  check: 'Tilde',
};

interface IconSelectProps {
  value: string;
  onChange: (key: PublicIconKey) => void;
  label?: string;
  error?: string;
}

/**
 * Grilla de íconos del sitio público. Dibuja los MISMOS SVG de src/components/public/icons.tsx que después se
 * ven en la web (son componentes React puros), así el que se elige acá es exactamente el que se publica.
 */
export default function IconSelect({ value, onChange, label = 'Ícono', error }: IconSelectProps) {
  return (
    <Box>
      <Typography variant="body2" color="text.secondary" mb={1}>{label}</Typography>
      <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(48px, 1fr))" gap={1} role="radiogroup" aria-label={label}>
        {(Object.keys(PUBLIC_ICONS) as PublicIconKey[]).map((key) => {
          const Icon = PUBLIC_ICONS[key];
          const selected = key === value;
          return (
            <Tooltip key={key} title={ICON_LABELS[key]}>
              <ButtonBase
                role="radio"
                aria-checked={selected}
                aria-label={ICON_LABELS[key]}
                onClick={() => onChange(key)}
                sx={{
                  height: 48,
                  borderRadius: 2,
                  border: '2px solid',
                  borderColor: selected ? 'primary.main' : 'divider',
                  bgcolor: selected ? 'action.selected' : 'background.paper',
                  color: selected ? 'primary.main' : 'text.secondary',
                  transition: 'border-color 0.15s, background-color 0.15s',
                  '&:hover': { borderColor: 'primary.light' },
                }}
              >
                <Icon width={24} height={24} />
              </ButtonBase>
            </Tooltip>
          );
        })}
      </Box>
      {error && <FormHelperText error>{error}</FormHelperText>}
    </Box>
  );
}
