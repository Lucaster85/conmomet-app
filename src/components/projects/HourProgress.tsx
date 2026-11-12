'use client';
import React from 'react';
import { Box, LinearProgress, Typography } from '@mui/material';

interface Props {
  consumed: number;
  // Sin presupuestado (o 0) solo se muestra lo consumido: el usuario no ve el presupuesto o el rubro no tiene bolsa.
  budgeted?: number;
  // La parte manual de `consumed` (FLOWS.md §56): si hay, se muestra el desglose "N hs empleados + M hs manuales".
  manual?: number;
}

const fmt = (n: number) => n.toLocaleString('es-AR', { maximumFractionDigits: 1 });

// Barra de avance de horas de un rubro (consumido / presupuestado) con el desglose empleados + manuales.
export default function HourProgress({ consumed, budgeted, manual = 0 }: Props) {
  const breakdown = manual > 0 ? (
    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25 }}>
      {fmt(Math.max(0, consumed - manual))} hs empleados + {fmt(manual)} hs manuales
    </Typography>
  ) : null;

  if (!budgeted || budgeted <= 0) {
    return (
      <Box>
        <Typography variant="body2">{fmt(consumed)} hs</Typography>
        {breakdown}
      </Box>
    );
  }

  const percentage = Math.min((consumed / budgeted) * 100, 100);
  const isOverBudget = consumed > budgeted;
  return (
    <Box sx={{ width: '100%', maxWidth: 320 }}>
      <Box display="flex" justifyContent="space-between" mb={0.5}>
        <Typography variant="caption" fontWeight="bold" color={isOverBudget ? 'error.main' : 'text.primary'}>{fmt(consumed)} hs</Typography>
        <Typography variant="caption" color="text.secondary">/ {fmt(budgeted)} hs ({Math.round((consumed / budgeted) * 100)}%)</Typography>
      </Box>
      <LinearProgress variant="determinate" value={percentage} color={isOverBudget ? 'error' : (percentage > 80 ? 'warning' : 'success')} sx={{ height: 6, borderRadius: 3 }} />
      {breakdown}
    </Box>
  );
}
