'use client';
import React from 'react';
import { Box, Typography } from '@mui/material';
import { formatCuit } from '../../utils/cuit';

interface Props {
  name?: string | null;
  cuit?: string | null;
  // Dato de apoyo en una segunda línea (condición frente al IVA, comprobante sobre el que se trabaja…).
  detail?: React.ReactNode;
}

// A quién se le factura, bien visible arriba de los diálogos de Facturación: nombre grande y en azul, CUIT al lado. Antes salía en un renglón chico y gris
// y costaba ver que el cliente estaba bien elegido.
export default function ClientBanner({ name, cuit, detail }: Props) {
  if (!name) return null;
  return (
    <Box sx={{ borderLeft: 4, borderColor: 'primary.main', bgcolor: 'action.hover', borderRadius: 1, px: 2, py: 1 }}>
      <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 0.6, color: 'text.primary', fontWeight: 600 }}>Cliente</Typography>
      <Typography variant="h6" component="div" sx={{ color: 'primary.main', fontWeight: 700, lineHeight: 1.25 }}>
        {name}
        {cuit ? <Typography component="span" variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 500, ml: 1.5 }}>CUIT {formatCuit(cuit)}</Typography> : null}
      </Typography>
      {detail ? <Typography variant="body2" sx={{ color: 'text.primary', mt: 0.25 }}>{detail}</Typography> : null}
    </Box>
  );
}
