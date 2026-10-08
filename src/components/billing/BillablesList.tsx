'use client';
import React from 'react';
import {
  Box, Card, Chip, LinearProgress, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Typography,
} from '@mui/material';
import { BillableBudget, BudgetCurrency } from '../../utils/api';
import {
  BILLING_STATUS_LABELS, formatDate, formatHours, formatMoney, formatPercent, ivaOf, roundMoney,
} from '../../utils/billing';
import { formatCuit } from '../../utils/cuit';
import ProjectCodeLabel from '../projects/ProjectCodeLabel';

interface BillablesListProps {
  rows: BillableBudget[];
  // Alícuota con la que se muestra el IVA del saldo (la de por defecto de Configuración General).
  ivaRate: number;
  onOpen: (row: BillableBudget) => void;
}

const CURRENCIES: BudgetCurrency[] = ['ARS', 'USD'];

// Monedas en las que el presupuesto tiene algo para facturar.
const currenciesOf = (row: BillableBudget): BudgetCurrency[] =>
  CURRENCIES.filter((c) => row.billing.bases[c].materials.net > 0 || row.billing.bases[c].labor.net > 0);

export default function BillablesList({ rows, ivaRate, onOpen }: BillablesListProps) {
  const identification = (row: BillableBudget) => (
    <Box>
      <Typography variant="subtitle2" fontWeight={700}>{row.number}</Typography>
      <Typography variant="body2" noWrap sx={{ maxWidth: 260 }}>{row.title}</Typography>
      {row.quoteRequest && (
        <Typography variant="caption" color="text.secondary" display="block">
          {row.quoteRequest.number}{row.quoteRequest.client_quote_number ? ` · N° cliente ${row.quoteRequest.client_quote_number}` : ''}
        </Typography>
      )}
      <Typography variant="caption" display="block">
        {row.project ? <ProjectCodeLabel project={row.project} linkParent={false} /> : <span style={{ opacity: 0.7 }}>Sin proyecto todavía</span>}
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block">
        {row.client?.razonSocial}{row.client?.cuit ? ` · CUIT ${formatCuit(row.client.cuit)}` : ''}
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block">Aprobado el {formatDate(row.approved_at)}</Typography>
    </Box>
  );

  const concept = (row: BillableBudget, which: 'materials' | 'labor') => {
    const currencies = currenciesOf(row).filter((c) => row.billing.bases[c][which].net > 0);
    if (currencies.length === 0) return <Typography variant="caption" color="text.secondary">—</Typography>;
    const progress = row.billing.project_progress;
    return (
      <Stack spacing={1}>
        {currencies.map((c) => {
          const base = row.billing.bases[c][which];
          const pct = row.billing.billed_percent[c][which];
          const balance = row.billing.balances[c][which];
          return (
            <Box key={c}>
              <Typography variant="body2" fontWeight={600}>
                {formatMoney(base.net, c)}
                {base.discount_percent > 0 && (
                  <Typography component="span" variant="caption" color="text.secondary"> (−{formatPercent(base.discount_percent)})</Typography>
                )}
              </Typography>
              <LinearProgress variant="determinate" value={Math.min(pct, 100)} sx={{ height: 6, borderRadius: 3, my: 0.5 }} />
              <Typography variant="caption" color="text.secondary" display="block">
                Facturado {formatPercent(pct)} · Saldo {formatMoney(balance, c)}
              </Typography>
              {row.billing.covered_by_reserved[c][which] && (
                <Typography variant="caption" color="text.secondary" display="block">Incluye un registro reservado</Typography>
              )}
            </Box>
          );
        })}
        {which === 'labor' && (
          progress ? (
            <Typography variant="caption" color="text.secondary">
              {formatHours(progress.consumed_hours_own)} de {formatHours(progress.budgeted_hours_own)}
              {progress.progress_percent != null ? ` (${formatPercent(progress.progress_percent)})` : ''}
            </Typography>
          ) : (
            <Typography variant="caption" color="text.secondary">Sin proyecto todavía</Typography>
          )
        )}
        {which === 'labor' && row.billing.overbilled_labor && (
          <Chip size="small" color="warning" label="Facturado > avance" sx={{ alignSelf: 'flex-start' }} />
        )}
      </Stack>
    );
  };

  const totalBalance = (row: BillableBudget) => {
    const currencies = currenciesOf(row);
    return (
      <Stack spacing={0.5}>
        {currencies.map((c) => {
          const balance = roundMoney(row.billing.balances[c].materials + row.billing.balances[c].labor);
          return (
            <Box key={c}>
              <Typography variant="body2" fontWeight={700}>{formatMoney(balance, c)} <Typography component="span" variant="caption">+ IVA</Typography></Typography>
              <Typography variant="caption" color="text.secondary">IVA {formatPercent(ivaRate)}: {formatMoney(ivaOf(balance, ivaRate), c)}</Typography>
            </Box>
          );
        })}
      </Stack>
    );
  };

  const statusChips = (row: BillableBudget) => {
    const status = BILLING_STATUS_LABELS[row.billing.billing_status];
    return (
      <Stack spacing={0.5} alignItems="flex-start">
        <Chip size="small" color={status.color} label={status.label} />
        {row.billing.has_pending_payment && (
          <Chip
            size="small" variant="outlined" color="warning"
            label={`${row.billing.pending_invoices_count} pendiente${row.billing.pending_invoices_count === 1 ? '' : 's'} de cobro`}
          />
        )}
      </Stack>
    );
  };

  return (
    <>
      {/* Mobile Cards */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {rows.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={4}>No hay presupuestos aprobados para facturar</Typography>
        ) : (
          <Stack spacing={2}>
            {rows.map((row) => (
              <Card key={row.id} sx={{ p: 2, borderRadius: 2, cursor: 'pointer' }} onClick={() => onOpen(row)}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1} mb={1.5}>
                  {identification(row)}
                  {statusChips(row)}
                </Box>
                <Stack spacing={1.5}>
                  <Box><Typography variant="overline" color="text.secondary">Materiales</Typography>{concept(row, 'materials')}</Box>
                  <Box><Typography variant="overline" color="text.secondary">Mano de obra</Typography>{concept(row, 'labor')}</Box>
                  <Box><Typography variant="overline" color="text.secondary">Saldo total</Typography>{totalBalance(row)}</Box>
                </Stack>
              </Card>
            ))}
          </Stack>
        )}
      </Box>

      {/* Desktop Table */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <TableContainer component={Paper} elevation={2}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Presupuesto</TableCell>
                <TableCell>Materiales</TableCell>
                <TableCell>Mano de obra</TableCell>
                <TableCell>Saldo total</TableCell>
                <TableCell>Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center">No hay presupuestos aprobados para facturar</TableCell></TableRow>
              ) : rows.map((row) => (
                <TableRow key={row.id} hover sx={{ cursor: 'pointer', verticalAlign: 'top' }} onClick={() => onOpen(row)}>
                  <TableCell>{identification(row)}</TableCell>
                  <TableCell sx={{ minWidth: 190 }}>{concept(row, 'materials')}</TableCell>
                  <TableCell sx={{ minWidth: 190 }}>{concept(row, 'labor')}</TableCell>
                  <TableCell>{totalBalance(row)}</TableCell>
                  <TableCell>{statusChips(row)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </>
  );
}
