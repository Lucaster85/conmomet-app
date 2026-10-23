'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Paper, Chip, Box, Typography } from '@mui/material';
import { ALERT_ORDER } from '../../utils/alerts';
import { useAlertViews } from './AlertViewsProvider';

// La fila de contadores del tablero (ver FLOWS.md §36). Es la pieza que hace que marcar todo
// como visto NO haga perder de vista los pendientes: las tarjetas con detalle se esconden, pero
// el total de cada aviso sigue acá, siempre.
//
// Se arma con lo que cada tarjeta registró al terminar de cargar (useRegisterAlertSummary), así
// que los chips aparecen de a uno a medida que cargan — igual que hoy aparecen las tarjetas. El
// orden es fijo (ALERT_ORDER) para que no bailen de lugar según cuál llegue primero.
export default function DashboardAlertSummaryBar() {
  const router = useRouter();
  const alertViews = useAlertViews();

  if (!alertViews) return null;

  const chips = ALERT_ORDER
    .map((type) => alertViews.summaries.find((s) => s.type === type))
    .filter((s): s is NonNullable<typeof s> => !!s && s.total > 0);

  if (chips.length === 0) return null;

  return (
    <Paper sx={{ p: 2, borderRadius: 2, mb: 3 }}>
      <Typography variant="caption" color="text.secondary" display="block" mb={1}>
        Tus pendientes
      </Typography>
      <Box display="flex" flexWrap="wrap" gap={1}>
        {chips.map((chip) => (
          <Chip
            key={chip.type}
            label={`${chip.label}: ${chip.total}`}
            color={chip.color || 'default'}
            size="small"
            // Sin href (Vencimientos: los documentos no tienen módulo propio) el chip es solo
            // informativo, sin click.
            onClick={chip.href ? () => router.push(chip.href!) : undefined}
            sx={chip.href ? { cursor: 'pointer' } : undefined}
          />
        ))}
      </Box>
    </Paper>
  );
}
