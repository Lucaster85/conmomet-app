'use client';
import React, { useEffect, useState } from 'react';
import {
  Box, Card, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography,
} from '@mui/material';
import {
  BudgetHistoryEntry, BudgetHistoryFieldsContext, BudgetHistoryLine, BudgetHistoryLinesContext, BudgetService,
} from '../../utils/api';

// Historial de cambios de un presupuesto (ver FLOWS.md §35, Etapa 3) — se usa tanto en el
// diálogo de edición como en Ver/Imprimir, para que sea visible aunque no se tenga permiso de
// edición (el responsable que armó el presupuesto tiene que poder ver que le borraron
// materiales sin poder editar nada).
const FIELD_LABELS: Record<string, string> = {
  fields: 'Datos generales',
  labor_lines: 'Mano de obra',
  material_items: 'Materiales',
  status: 'Estado',
  totals_by_currency: 'Totales',
  discount_percent: 'Bonificación',
};

const STATUS_VALUE_LABELS: Record<string, string> = {
  draft: 'Borrador', sent: 'Enviado', approved: 'Aprobado', rejected: 'Rechazado',
};

function formatMoneyShort(value: number, currency?: string | null) {
  const symbol = currency === 'USD' ? 'US$' : '$';
  return `${symbol}${Number(value).toLocaleString('es-AR', { maximumFractionDigits: 2 })}`;
}

// Una línea de mano de obra o de material, ya pelada por permiso (ver BudgetHistoryLine) — el
// nombre viene de item_type (mano de obra) o description (materiales), nunca los dos.
function formatLine(line: BudgetHistoryLine): string {
  const name = line.item_type || line.description || 'línea';
  const qty = `${line.quantity}${line.material_unit ? ` ${line.material_unit}` : ''}`;
  const price = line.unit_price != null ? ` · ${formatMoneyShort(line.unit_price, line.currency)}` : '';
  return `${name} (${qty}${price})`;
}

// Resume el `context` ya pelado de una entrada en líneas de texto cortas — null cuando el
// campo entero está redactado por permiso (totals_by_currency/discount_percent).
function summarize(entry: BudgetHistoryEntry): string[] {
  if (entry.context === null) {
    return entry.field_changed === 'status' ? [] : ['Sin detalle visible con tu permiso actual.'];
  }

  if (entry.field_changed === 'fields') {
    const ctx = entry.context as BudgetHistoryFieldsContext;
    return (ctx.changes || []).map((c) => `${c.field}: "${c.before ?? '—'}" → "${c.after ?? '—'}"`);
  }

  if (entry.field_changed === 'labor_lines' || entry.field_changed === 'material_items') {
    const ctx = entry.context as BudgetHistoryLinesContext;
    const lines: string[] = [];
    (ctx.added || []).forEach((l) => lines.push(`+ ${formatLine(l)}`));
    (ctx.removed || []).forEach((l) => lines.push(`− ${formatLine(l)}`));
    (ctx.changed || []).forEach((c) => lines.push(`~ ${formatLine(c.before)} → ${formatLine(c.after)}`));
    return lines;
  }

  if (entry.field_changed === 'totals_by_currency') {
    const ctx = entry.context as { totals_before: Record<string, number>; totals_after: Record<string, number> };
    return Object.keys(ctx.totals_after || {})
      .filter((cur) => (ctx.totals_before?.[cur] || 0) !== (ctx.totals_after?.[cur] || 0))
      .map((cur) => `${cur}: ${formatMoneyShort(ctx.totals_before?.[cur] || 0, cur)} → ${formatMoneyShort(ctx.totals_after?.[cur] || 0, cur)}`);
  }

  if (entry.field_changed === 'discount_percent') {
    const ctx = entry.context as { labor_before: number; labor_after: number; material_before: number; material_after: number };
    const lines: string[] = [];
    if (ctx.labor_before !== ctx.labor_after) lines.push(`Mano de obra: ${ctx.labor_before}% → ${ctx.labor_after}%`);
    if (ctx.material_before !== ctx.material_after) lines.push(`Material: ${ctx.material_before}% → ${ctx.material_after}%`);
    return lines;
  }

  return [];
}

function headline(entry: BudgetHistoryEntry): string {
  if (entry.field_changed === 'status') {
    const from = entry.previous_value ? STATUS_VALUE_LABELS[entry.previous_value] || entry.previous_value : null;
    const to = STATUS_VALUE_LABELS[entry.new_value || ''] || entry.new_value;
    return from ? `${from} → ${to}` : `${to}`;
  }
  return FIELD_LABELS[entry.field_changed || ''] || entry.field_changed || entry.action;
}

export default function BudgetHistoryPanel({ budgetId }: { budgetId: number }) {
  const [entries, setEntries] = useState<BudgetHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    BudgetService.getHistory(budgetId)
      .then((res) => { if (active) setEntries(res.data); })
      .catch(() => { if (active) setEntries([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [budgetId]);

  if (loading) return <Typography variant="body2" color="text.secondary">Cargando historial…</Typography>;
  if (entries.length === 0) return <Typography variant="body2" color="text.secondary">Sin cambios registrados todavía.</Typography>;

  return (
    <>
      {/* Mobile Cards */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        <Stack spacing={1}>
          {entries.map((e) => (
            <Card key={e.id} sx={{ p: 1.5 }}>
              <Typography variant="body2" fontWeight={600}>{headline(e)}</Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                {new Date(e.at).toLocaleString('es-AR')}
                {e.actor ? ` · ${e.actor.lastname}, ${e.actor.name}` : ''}
              </Typography>
              {e.notes && <Typography variant="body2" sx={{ mt: 0.5 }}>{e.notes}</Typography>}
              {summarize(e).map((line, i) => (
                <Typography key={i} variant="body2" sx={{ mt: 0.25 }}>{line}</Typography>
              ))}
            </Card>
          ))}
        </Stack>
      </Box>
      {/* Desktop Table */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow><TableCell>Fecha</TableCell><TableCell>Autor</TableCell><TableCell>Qué cambió</TableCell><TableCell>Detalle</TableCell></TableRow>
            </TableHead>
            <TableBody>
              {entries.map((e) => (
                <TableRow key={e.id}>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{new Date(e.at).toLocaleString('es-AR')}</TableCell>
                  <TableCell>{e.actor ? `${e.actor.lastname}, ${e.actor.name}` : '—'}</TableCell>
                  <TableCell>{headline(e)}</TableCell>
                  <TableCell>
                    {e.notes && <Typography variant="body2">{e.notes}</Typography>}
                    {summarize(e).map((line, i) => (
                      <Typography key={i} variant="body2">{line}</Typography>
                    ))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </>
  );
}
