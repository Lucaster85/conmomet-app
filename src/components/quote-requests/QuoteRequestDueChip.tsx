'use client';
import React from 'react';
import { Chip, ChipProps } from '@mui/material';
import {
  quoteRequestDueInfo,
  QuoteRequestDueBudget,
  QuoteRequestDueSource,
} from '@/utils/quoteRequestDue';

interface QuoteRequestDueChipProps extends Omit<ChipProps, 'label' | 'color'> {
  quoteRequest: QuoteRequestDueSource;
  // Presupuesto que se está mirando, si lo hay: un PC cuyo presupuesto ya salió no muestra
  // vencimiento aunque el estado del PC todavía no lo refleje.
  budget?: QuoteRequestDueBudget | null;
  // Texto fijo delante, ej. el número del PC en el listado de Presupuestos.
  prefix?: string;
}

// Chip único del vencimiento del PC (listado de PC y de Presupuestos, cards y tablas). Mientras
// el PC está en curso muestra el vencimiento; al enviarse el presupuesto, "Enviado el dd/mm";
// en un PC cancelado no muestra nada (salvo el prefijo, si lo hay).
export default function QuoteRequestDueChip({ quoteRequest, budget, prefix, ...chipProps }: QuoteRequestDueChipProps) {
  const info = quoteRequestDueInfo(quoteRequest, budget);
  if (info.kind === 'none' && !prefix) return null;

  const label = info.kind === 'none' ? prefix! : prefix ? `${prefix} · ${info.label}` : info.label;
  return <Chip size="small" {...chipProps} label={label} color={info.color} />;
}
