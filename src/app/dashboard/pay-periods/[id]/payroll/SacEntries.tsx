import React, { useState } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, DialogTitle, DialogContent, DialogActions, Stack, Chip, Tooltip, Button, Card, CardContent, Divider,
} from '@mui/material';
import AppDialog from '@/components/common/AppDialog';
import {
  EditOutlined as EditIcon, CheckCircleOutlined as ConfirmIcon, PaymentOutlined as PaymentIcon,
  VisibilityOutlined as ViewIcon, DrawOutlined as SignatureIcon, CalculateOutlined as BreakdownIcon,
} from '@mui/icons-material';
import { PayrollEntry, PayrollAdjustment } from '../../../../../utils/api';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// Desglose que arma GET /payroll/:id para un período sac (se calcula al vuelo, no se persiste).
// Es una herramienta de control interno: nunca va en el recibo ni en el portal del empleado.
export interface SacBreakdown {
  year: number;
  semester: 1 | 2;
  label: string;
  calculated_amount: number;
  best_month: number | null;
  best_amount: number;
  computable_days: number;
  semester_days: number;
  monthly: {
    month: number; amount: number; gross: number; non_remunerative: number;
    retro_added: number; retro_removed: number; sac_adjustments: number;
  }[];
  bonuses: { month: number; label: string; amount: number; is_remunerative: boolean }[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SacEntry = PayrollEntry & { sac_breakdown?: SacBreakdown; [key: string]: any };

interface Props {
  entries: SacEntry[];
  formatCurrency: (v: number) => string;
  onView: (entry: SacEntry) => void;
  onEdit: (entry: SacEntry) => void;
  onConfirm: (id: number) => void;
  onPay: (id: number) => void;
  onSign: (entry: SacEntry) => void;
  isMobile: boolean;
}

const STATUS_LABEL: Record<string, string> = { draft: 'Borrador', confirmed: 'Confirmado', paid: 'Pagado' };
const STATUS_COLOR: Record<string, 'warning' | 'success' | 'info'> = { draft: 'warning', confirmed: 'success', paid: 'info' };

const sumByType = (adjustments: PayrollAdjustment[] | undefined, type: PayrollAdjustment['type']) =>
  (adjustments || []).filter((a) => a.type === type).reduce((s, a) => s + Number(a.amount), 0);

const excludedBonuses = (b?: SacBreakdown) => (b?.bonuses || []).filter((x) => !x.is_remunerative);

export default function SacEntries({ entries, formatCurrency, onView, onEdit, onConfirm, onPay, onSign, isMobile }: Props) {
  const [breakdownEntry, setBreakdownEntry] = useState<SacEntry | null>(null);

  const bestMonthLabel = (b?: SacBreakdown) => (b?.best_month ? `${MONTHS[b.best_month - 1]} ${formatCurrency(b.best_amount)}` : '—');
  const daysLabel = (b?: SacBreakdown) => (b ? `${b.computable_days} / ${b.semester_days}` : '—');
  const sacLineAmount = (e: SacEntry) =>
    (e.lines || []).filter((l) => l.line_type === 'sac').reduce((s, l) => s + Number(l.subtotal), 0);
  // Si el cálculo vivo difiere de la línea ya generada, hay algo para regenerar (borrador) o revisar.
  const isOutdated = (e: SacEntry) =>
    e.status === 'draft' && e.sac_breakdown != null && Math.abs(e.sac_breakdown.calculated_amount - sacLineAmount(e)) > 0.009;

  const actions = (e: SacEntry) => (
    <Box display="flex" gap={0.5} justifyContent="flex-end">
      <Tooltip title="Desglose del cálculo">
        <IconButton size="small" onClick={() => setBreakdownEntry(e)}><BreakdownIcon fontSize="small" /></IconButton>
      </Tooltip>
      <Tooltip title="Ver detalle">
        <IconButton size="small" onClick={() => onView(e)}><ViewIcon fontSize="small" /></IconButton>
      </Tooltip>
      {e.status === 'draft' && (
        <>
          <Tooltip title="Ajustes">
            <IconButton size="small" color="primary" onClick={() => onEdit(e)}><EditIcon fontSize="small" /></IconButton>
          </Tooltip>
          <Tooltip title="Confirmar">
            <IconButton size="small" color="success" onClick={() => onConfirm(e.id)}><ConfirmIcon fontSize="small" /></IconButton>
          </Tooltip>
        </>
      )}
      {e.status === 'confirmed' && (
        <Tooltip title="Pagar">
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

  const badges = (e: SacEntry) => {
    const excluded = excludedBonuses(e.sac_breakdown);
    return (
      <Box display="flex" gap={0.5} flexWrap="wrap">
        {excluded.length > 0 && (
          <Tooltip title={excluded.map((x) => `${x.label} (${formatCurrency(x.amount)})`).join(' · ')}>
            <Chip label={`${excluded.length} no remun.`} size="small" color="warning" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
          </Tooltip>
        )}
        {isOutdated(e) && (
          <Tooltip title={`El cálculo actual da ${formatCurrency(e.sac_breakdown!.calculated_amount)}: volvé a generar para actualizarlo.`}>
            <Chip label="Desactualizado" size="small" color="error" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
          </Tooltip>
        )}
      </Box>
    );
  };

  const breakdownDialog = (
    <AppDialog open={!!breakdownEntry} onClose={() => setBreakdownEntry(null)} maxWidth="sm" fullWidth fullScreen={isMobile}>
      {breakdownEntry?.sac_breakdown && (() => {
        const b = breakdownEntry.sac_breakdown;
        const counted = b.bonuses.filter((x) => x.is_remunerative);
        const excluded = b.bonuses.filter((x) => !x.is_remunerative);
        return (
          <>
            <DialogTitle sx={{ pb: 0 }}>
              Desglose — {breakdownEntry.employee?.lastname}, {breakdownEntry.employee?.name}
            </DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary" mb={1.5}>
                {b.label}. Solo para control interno: no aparece en el recibo ni en el portal del empleado.
              </Typography>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell>Mes</TableCell>
                      <TableCell align="right">Remuneración</TableCell>
                      <TableCell align="right">No remun.</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {b.monthly.map((m) => (
                      <TableRow key={m.month} selected={m.month === b.best_month}>
                        <TableCell>
                          {MONTHS[m.month - 1]}
                          {m.month === b.best_month && <Chip label="Mejor mes" size="small" color="primary" sx={{ ml: 1, height: 18, fontSize: '0.65rem' }} />}
                        </TableCell>
                        <TableCell align="right">{formatCurrency(m.amount)}</TableCell>
                        <TableCell align="right">{m.non_remunerative > 0 ? `-${formatCurrency(m.non_remunerative)}` : '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Stack spacing={0.5} mt={2}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Mejor mes ÷ 2</Typography>
                  <Typography variant="body2">{formatCurrency(b.best_amount / 2)}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Días computables / días del semestre</Typography>
                  <Typography variant="body2">{b.computable_days} / {b.semester_days}</Typography>
                </Box>
                <Divider />
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" fontWeight={700}>SAC calculado</Typography>
                  <Typography variant="body2" fontWeight={700}>{formatCurrency(b.calculated_amount)}</Typography>
                </Box>
              </Stack>

              <Typography variant="overline" color="text.secondary" fontWeight={600} display="block" mt={2}>
                Premios del semestre
              </Typography>
              {b.bonuses.length === 0 ? (
                <Typography variant="body2" color="text.secondary">Sin premios cargados.</Typography>
              ) : (
                <Stack spacing={0.25}>
                  {counted.map((x, i) => (
                    <Box key={`c${i}`} display="flex" justifyContent="space-between">
                      <Typography variant="body2">{MONTHS[x.month - 1]} · {x.label} <Typography component="span" variant="caption" color="success.main">(cuenta)</Typography></Typography>
                      <Typography variant="body2">{formatCurrency(x.amount)}</Typography>
                    </Box>
                  ))}
                  {excluded.map((x, i) => (
                    <Box key={`e${i}`} display="flex" justifyContent="space-between">
                      <Typography variant="body2">{MONTHS[x.month - 1]} · {x.label} <Typography component="span" variant="caption" color="warning.main">(no remunerativo, excluido)</Typography></Typography>
                      <Typography variant="body2">{formatCurrency(x.amount)}</Typography>
                    </Box>
                  ))}
                </Stack>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setBreakdownEntry(null)}>Cerrar</Button>
            </DialogActions>
          </>
        );
      })()}
    </AppDialog>
  );

  if (isMobile) {
    return (
      <>
        <Stack spacing={2} className="no-print">
          {entries.map((e) => (
            <Card key={e.id} sx={{ borderRadius: 2, borderLeft: '5px solid', borderLeftColor: `${STATUS_COLOR[e.status]}.main` }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                  <Box>
                    <Typography variant="body1" fontWeight="bold">{e.employee?.lastname}, {e.employee?.name}</Typography>
                    <Typography variant="caption" color="text.secondary">DNI: {e.employee?.dni}</Typography>
                  </Box>
                  <Chip label={STATUS_LABEL[e.status]} size="small" color={STATUS_COLOR[e.status]} />
                </Box>
                {badges(e)}
                <Divider sx={{ my: 1.5 }} />
                <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1.5}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">Mejor mes</Typography>
                    <Typography variant="body2" fontWeight="medium">{bestMonthLabel(e.sac_breakdown)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">Días</Typography>
                    <Typography variant="body2" fontWeight="medium">{daysLabel(e.sac_breakdown)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">SAC</Typography>
                    <Typography variant="body2" fontWeight="medium">{formatCurrency(sacLineAmount(e))}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">Sueldo Bruto</Typography>
                    <Typography variant="body2" fontWeight="bold">{formatCurrency(e.gross_amount)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">Ret. / Depósito</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {sumByType(e.adjustments, 'deduction') + sumByType(e.adjustments, 'deposit') > 0
                        ? `-${formatCurrency(sumByType(e.adjustments, 'deduction') + sumByType(e.adjustments, 'deposit'))}`
                        : '—'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">Sueldo Neto</Typography>
                    <Typography variant="body2" fontWeight="bold" color="success.dark">{formatCurrency(e.net_amount)}</Typography>
                  </Box>
                </Box>
                <Divider sx={{ my: 1.5 }} />
                {actions(e)}
              </CardContent>
            </Card>
          ))}
        </Stack>
        {breakdownDialog}
      </>
    );
  }

  return (
    <>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell><strong>Empleado</strong></TableCell>
              <TableCell align="right"><strong>Mejor mes</strong></TableCell>
              <TableCell align="right"><strong>Días</strong></TableCell>
              <TableCell align="right"><strong>SAC</strong></TableCell>
              <TableCell align="right"><strong>Sueldo Bruto</strong></TableCell>
              <TableCell align="right"><strong>Retenciones</strong></TableCell>
              <TableCell align="right"><strong>Depósito</strong></TableCell>
              <TableCell align="right"><strong>Sueldo Neto</strong></TableCell>
              <TableCell align="center"><strong>Estado</strong></TableCell>
              <TableCell align="center" className="no-print"><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entries.map((e) => (
              <TableRow key={e.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">{e.employee?.lastname}, {e.employee?.name}</Typography>
                  <Typography variant="caption" color="text.secondary">DNI: {e.employee?.dni}</Typography>
                  {badges(e)}
                </TableCell>
                <TableCell align="right">{bestMonthLabel(e.sac_breakdown)}</TableCell>
                <TableCell align="right">{daysLabel(e.sac_breakdown)}</TableCell>
                <TableCell align="right">{formatCurrency(sacLineAmount(e))}</TableCell>
                <TableCell align="right"><strong>{formatCurrency(e.gross_amount)}</strong></TableCell>
                <TableCell align="right">{sumByType(e.adjustments, 'deduction') > 0 ? `-${formatCurrency(sumByType(e.adjustments, 'deduction'))}` : '—'}</TableCell>
                <TableCell align="right">{sumByType(e.adjustments, 'deposit') > 0 ? `-${formatCurrency(sumByType(e.adjustments, 'deposit'))}` : '—'}</TableCell>
                <TableCell align="right"><strong>{formatCurrency(e.net_amount)}</strong></TableCell>
                <TableCell align="center">
                  <Chip label={STATUS_LABEL[e.status]} size="small" color={STATUS_COLOR[e.status]} />
                </TableCell>
                <TableCell align="center" className="no-print">{actions(e)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {breakdownDialog}
    </>
  );
}
