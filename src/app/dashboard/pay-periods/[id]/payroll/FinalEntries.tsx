import React from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Stack, Chip, Tooltip, Card, Divider,
} from '@mui/material';
import {
  EditOutlined as EditIcon, CheckCircleOutlined as ConfirmIcon, PaymentOutlined as PaymentIcon,
  VisibilityOutlined as ViewIcon, DrawOutlined as SignatureIcon, PersonOffOutlined as TerminationIcon,
} from '@mui/icons-material';
import { PayrollEntry, PayrollLine, PayrollAdjustment, TERMINATION_TYPE_LABELS, TerminationType, TerminationStatus, TerminationPendingDebt } from '../../../../../utils/api';
import { FINAL_INDEMNITY_LINE_TYPES } from '../../../../../utils/payPeriods';

// Lo que arma GET /payroll/:id para un período `final` (ver payrollController#getFinalByPeriod).
export interface FinalEntry extends PayrollEntry {
  remunerative_total: number;
  indemnity_total: number;
  termination: { id: number; type: TerminationType; status: TerminationStatus; termination_date: string; debt_resolution: string | null } | null;
  pending_debt: TerminationPendingDebt | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

interface Props {
  entries: FinalEntry[];
  formatCurrency: (v: number) => string;
  onView: (entry: FinalEntry) => void;
  onEdit: (entry: FinalEntry) => void;
  onConfirm: (id: number) => void;
  onPay: (id: number) => void;
  onSign: (entry: FinalEntry) => void;
  onOpenTermination: (employeeId: number) => void;
  isMobile: boolean;
}

const STATUS_LABEL: Record<string, string> = { draft: 'Borrador', confirmed: 'Confirmado', paid: 'Pagado' };
const STATUS_COLOR: Record<string, 'warning' | 'success' | 'info'> = { draft: 'warning', confirmed: 'success', paid: 'info' };

const sumByType = (adjustments: PayrollAdjustment[] | undefined, type: PayrollAdjustment['type']) =>
  (adjustments || []).filter((a) => a.type === type).reduce((s, a) => s + Number(a.amount), 0);

const fmtDate = (d: string) => d.split('-').reverse().join('/');

export const isFinalEntry = (lines?: PayrollLine[]) =>
  !!lines && lines.some((l) => l.item_key != null || ['final_days', 'sac_proportional', 'vacation_unused'].includes(l.line_type));

/**
 * Recibo de la liquidación final: separa lo remunerativo (haberes, SAC, vacaciones) de lo
 * indemnizatorio / no remunerativo (preaviso, integración, art. 245 y sus SAC). Sin el desglose de
 * cálculo: eso queda en el egreso, solo para administración.
 */
export function FinalLinesBlock({ lines, adjustments, grossAmount, formatCurrency }: {
  lines: PayrollLine[]; adjustments?: PayrollAdjustment[]; grossAmount: number; formatCurrency: (v: number) => string;
}) {
  const remunerative = lines.filter((l) => !FINAL_INDEMNITY_LINE_TYPES.includes(l.line_type));
  const indemnity = lines.filter((l) => FINAL_INDEMNITY_LINE_TYPES.includes(l.line_type));
  const bonuses = (adjustments || []).filter((a) => a.type === 'bonus');

  const section = (title: string, rows: PayrollLine[], extra?: PayrollAdjustment[]) => {
    const items = [...rows.map((l) => ({ key: `l${l.id}`, label: l.label, amount: Number(l.subtotal) })), ...(extra || []).map((a) => ({ key: `a${a.id}`, label: `Pagos extra (${a.label})`, amount: Number(a.amount) }))];
    if (items.length === 0) return null;
    const subtotal = items.reduce((s, i) => s + i.amount, 0);
    return (
      <Box mb={1.5}>
        <Typography variant="caption" color="text.secondary" fontWeight={600}>{title}</Typography>
        {items.map((i) => (
          <Box key={i.key} display="flex" justifyContent="space-between" gap={2}>
            <Typography variant="body2" sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{i.label}</Typography>
            <Typography variant="body2" color={i.amount < 0 ? 'error.main' : undefined} sx={{ whiteSpace: 'nowrap' }}>{formatCurrency(i.amount)}</Typography>
          </Box>
        ))}
        <Divider sx={{ my: 0.5 }} />
        <Box display="flex" justifyContent="space-between">
          <Typography variant="body2" fontWeight={600}>Subtotal</Typography>
          <Typography variant="body2" fontWeight={600}>{formatCurrency(subtotal)}</Typography>
        </Box>
      </Box>
    );
  };

  return (
    <Box>
      {section('Remunerativo', remunerative, bonuses)}
      {section('Indemnizatorio / no remunerativo', indemnity)}
      <Box display="flex" justifyContent="space-between">
        <Typography variant="body2" fontWeight={700}>Total bruto</Typography>
        <Typography variant="body2" fontWeight={700}>{formatCurrency(grossAmount)}</Typography>
      </Box>
    </Box>
  );
}

export default function FinalEntries({ entries, formatCurrency, onView, onEdit, onConfirm, onPay, onSign, onOpenTermination, isMobile }: Props) {
  const hasDebt = (e: FinalEntry) => !!e.pending_debt && (e.pending_debt.total_ars > 0 || e.pending_debt.loans.has_usd);
  const deductions = (e: FinalEntry) => Number(e.advances_deducted || 0) + Number(e.loan_installments_deducted || 0) + sumByType(e.adjustments, 'deduction') + sumByType(e.adjustments, 'deposit');

  const actions = (e: FinalEntry) => (
    <Box display="flex" gap={0.5} justifyContent="flex-end">
      {e.termination && (
        <Tooltip title="Ver egreso">
          <IconButton size="small" onClick={() => onOpenTermination(e.employee_id)}><TerminationIcon fontSize="small" /></IconButton>
        </Tooltip>
      )}
      <Tooltip title="Ver detalle">
        <IconButton size="small" onClick={() => onView(e)}><ViewIcon fontSize="small" /></IconButton>
      </Tooltip>
      {e.status === 'draft' && (
        <>
          <Tooltip title="Ajustes">
            <IconButton size="small" color="primary" onClick={() => onEdit(e)}><EditIcon fontSize="small" /></IconButton>
          </Tooltip>
          <Tooltip title="Confirmar (cobra los préstamos)">
            <IconButton size="small" color="success" onClick={() => onConfirm(e.id)}><ConfirmIcon fontSize="small" /></IconButton>
          </Tooltip>
        </>
      )}
      {e.status === 'confirmed' && (
        <Tooltip title="Pagar (corta el acceso al portal)">
          <IconButton size="small" color="info" onClick={() => onPay(e.id)}><PaymentIcon fontSize="small" /></IconButton>
        </Tooltip>
      )}
      {e.status === 'paid' && (
        <Tooltip title={e.signature_url ? 'Volver a firmar recibo' : 'Firmar recibo'}>
          <IconButton size="small" color={e.signature_url ? 'default' : 'warning'} onClick={() => onSign(e)}>
            <SignatureIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );

  const badges = (e: FinalEntry) => (
    <Box display="flex" gap={0.5} flexWrap="wrap">
      <Chip label={STATUS_LABEL[e.status]} color={STATUS_COLOR[e.status]} size="small" />
      {hasDebt(e) && (
        <Tooltip title="Los descuentos superaron lo que se le debe: resolver la deuda desde la pestaña Egreso del legajo.">
          <Chip label="Deuda pendiente" color="error" variant="outlined" size="small" />
        </Tooltip>
      )}
    </Box>
  );

  const terminationLabel = (e: FinalEntry) =>
    e.termination ? `${TERMINATION_TYPE_LABELS[e.termination.type]} — ${fmtDate(e.termination.termination_date)}` : '—';

  if (isMobile) {
    return (
      <Stack spacing={2} className="no-print">
        {entries.map((e) => (
          <Card key={e.id} sx={{ p: 2, borderRadius: 2 }}>
            <Box display="flex" justifyContent="space-between" gap={1}>
              <Box>
                <Typography fontWeight="bold">{e.employee?.lastname}, {e.employee?.name}</Typography>
                <Typography variant="caption" color="text.secondary">{terminationLabel(e)}</Typography>
              </Box>
              {badges(e)}
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box display="flex" justifyContent="space-between"><Typography variant="body2" color="text.secondary">Remunerativo</Typography><Typography variant="body2">{formatCurrency(e.remunerative_total)}</Typography></Box>
            <Box display="flex" justifyContent="space-between"><Typography variant="body2" color="text.secondary">Indemnizatorio</Typography><Typography variant="body2">{formatCurrency(e.indemnity_total)}</Typography></Box>
            <Box display="flex" justifyContent="space-between"><Typography variant="body2" color="text.secondary">Descuentos</Typography><Typography variant="body2" color="error.main">-{formatCurrency(deductions(e))}</Typography></Box>
            <Box display="flex" justifyContent="space-between"><Typography variant="body2" fontWeight={700}>Neto</Typography><Typography variant="body2" fontWeight={700}>{formatCurrency(Number(e.net_amount))}</Typography></Box>
            <Box mt={1}>{actions(e)}</Box>
          </Card>
        ))}
      </Stack>
    );
  }

  return (
    <TableContainer component={Paper} elevation={2} className="no-print">
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: 'grey.50' }}>
            <TableCell><strong>Empleado</strong></TableCell>
            <TableCell><strong>Egreso</strong></TableCell>
            <TableCell align="right"><strong>Remunerativo</strong></TableCell>
            <TableCell align="right"><strong>Indemnizatorio</strong></TableCell>
            <TableCell align="right"><strong>Descuentos</strong></TableCell>
            <TableCell align="right"><strong>Neto</strong></TableCell>
            <TableCell><strong>Estado</strong></TableCell>
            <TableCell align="right"><strong>Acciones</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {entries.map((e) => (
            <TableRow key={e.id} hover>
              <TableCell>{e.employee?.lastname}, {e.employee?.name}</TableCell>
              <TableCell>{terminationLabel(e)}</TableCell>
              <TableCell align="right">{formatCurrency(e.remunerative_total)}</TableCell>
              <TableCell align="right">{formatCurrency(e.indemnity_total)}</TableCell>
              <TableCell align="right">{deductions(e) > 0 ? `-${formatCurrency(deductions(e))}` : '—'}</TableCell>
              <TableCell align="right"><strong>{formatCurrency(Number(e.net_amount))}</strong></TableCell>
              <TableCell>{badges(e)}</TableCell>
              <TableCell align="right">{actions(e)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
