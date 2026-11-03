'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Chip, Divider, Paper, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Typography,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/RefreshOutlined';
import dayjs from 'dayjs';
import GearSpinner from '@/components/GearSpinner';
import { EmployeeTerminationService, TerminationCalculation, TerminationCalculationItem } from '@/utils/api';

const money = (n: number) => `$${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmt = (d?: string | null) => (d ? dayjs(d).format('DD/MM/YYYY') : '—');
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const monthLabel = (year: number, month: number) => `${MONTHS[month - 1]} ${year}`;

type Breakdown = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

/** Cómo se llegó al monto de cada concepto, en una o dos líneas. */
function describeItem(item: TerminationCalculationItem): string {
  const b = item.breakdown as Breakdown;
  if (item.applies === false && b.reason) return b.reason;

  if (item.key === 'wages') {
    const range = b.range as Breakdown | undefined;
    const period = range ? `Del ${fmt(range.from)} al ${fmt(range.to)} (${range.days} días)` : '';
    if (b.method === 'prorate_fixed') {
      const ot = b.overtime?.amount > 0 ? ` + horas extra ${money(b.overtime.amount)}` : '';
      return `${period}: sueldo mensual ${money(b.equivalent_monthly_salary)} ÷ 30 × días = ${money(b.prorated_amount)}${ot}.`;
    }
    if (b.method === 'prorate_overpaid') {
      return `${period} ya liquidados de más: sueldo mensual ${money(b.equivalent_monthly_salary)} ÷ 30 × días.`;
    }
    if (b.method === 'engine') {
      const lines = (b.lines as Breakdown[]) || [];
      return `${period}. ${lines.length === 0 ? 'Sin horas aprobadas.' : lines.map((l) => `${l.label} ${money(l.subtotal)}`).join(' · ')}`;
    }
    return b.note || period;
  }
  if (item.key === 'sac_proportional') {
    return `Mejor mes ${b.best_month ? MONTHS[b.best_month - 1] : '—'} ${money(b.best_amount)} ÷ 2 × ${b.computable_days}/${b.semester_days} días del semestre.`;
  }
  if (item.key.startsWith('sac_previous_')) {
    return b.kind === 'difference'
      ? `Recalculado ${money(b.recalculated)} − liquidado ${money(b.paid)} − diferencias ya pagadas ${money(b.adjustments_paid)}.`
      : `Mejor mes ${money(b.best_amount)} ÷ 2 × ${b.computable_days}/${b.semester_days} días: el semestre anterior todavía no se liquidó.`;
  }
  if (item.key === 'vacation_unused') {
    return `${b.corresponding_days} días del año × ${b.worked_days_in_year}/365 = ${b.earned_days} − ${b.taken_days} gozados = ${b.unused_days} días × ${money(b.daily_rate)}.`;
  }
  if (item.key === 'notice_pay') {
    if (b.notice_given === 'partial' && b.given_days != null) {
      return `${b.months_entitled} mes(es) de base ${money(b.base)}; se otorgaron ${b.given_days} de ${b.entitled_days} días.`;
    }
    return b.reason || `${b.months_entitled} mes(es) × base ${money(b.base)}.`;
  }
  if (item.key === 'month_integration') {
    return b.reason || `Base ${money(b.base)} ÷ ${b.month_days} días × ${b.remaining_days} días que faltan para fin de mes.`;
  }
  if (item.key === 'severance') {
    if (b.in_probation) return 'Período de prueba: no corresponde.';
    const parts = [`${b.years} año(s) × ${money(b.capped_base ?? b.base)}`];
    if (b.cap_applied) parts.push(`tope del convenio ${money(b.cap)} aplicado sobre la base ${money(b.base)}`);
    if (b.minimum_applied) parts.push('se aplicó el mínimo de 1 mes de sueldo');
    return `${parts.join(' — ')}.`;
  }
  if (item.key.endsWith('_sac') && item.key !== 'sac_proportional') return `${money(b.base)} ÷ 12.`;
  if (item.key === 'severance_agreed') return b.agreed != null ? 'Monto pactado en el acuerdo.' : 'Se carga con el acuerdo de pago (etapa siguiente).';
  return '';
}

interface Props {
  terminationId: number;
}

export default function TerminationCalculationCard({ terminationId }: Props) {
  const [data, setData] = useState<TerminationCalculation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await EmployeeTerminationService.getCalculation(terminationId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al calcular la liquidación');
    } finally {
      setLoading(false);
    }
  }, [terminationId]);

  useEffect(() => { load(); }, [load]);

  const visibleItems = (group: 'remunerative' | 'indemnity') => (data?.items || []).filter((i) => i.group === group);

  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1} gap={2} flexWrap="wrap">
          <Typography variant="h6" fontWeight={600}>Cálculo de la liquidación</Typography>
          <Button size="small" startIcon={<RefreshIcon />} onClick={load} disabled={loading}>Recalcular</Button>
        </Box>
        <Alert severity="info" sx={{ mb: 2 }}>
          Es una <strong>propuesta</strong> con la regla vigente. La Ley 27.802 tiene artículos suspendidos judicialmente
          (preaviso y art. 245), así que <strong>el contador tiene que validar cada monto</strong> antes de pagar.
          Por ahora es solo de lectura: no genera ninguna liquidación.
        </Alert>

        {error && <Alert severity="error">{error}</Alert>}
        {loading && !data && <Box display="flex" justifyContent="center" py={3}><GearSpinner /></Box>}

        {data && (
          <Stack spacing={3}>
            {data.warnings.map((w) => <Alert key={w} severity="warning">{w}</Alert>)}

            <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">Antigüedad al último día</Typography>
                <Typography>
                  {data.seniority.years} años, {data.seniority.months} meses, {data.seniority.days} días
                  {data.seniority.in_probation && <Chip size="small" color="warning" label="Período de prueba" sx={{ ml: 1 }} />}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Para el art. 245 cuenta {data.seniority.years_for_severance} año(s)
                  {data.seniority.fraction_over_three_months ? ' (la fracción supera 3 meses)' : ''}.
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Base de la indemnización (mejor mes de los últimos 12)</Typography>
                <Typography fontWeight={600}>
                  {money(data.severance_base.base)}
                  {data.severance_base.month && data.severance_base.year ? ` — ${monthLabel(data.severance_base.year, data.severance_base.month)}` : ''}
                </Typography>
                {data.cct_cap_amount != null && <Typography variant="caption" color="text.secondary">Tope del convenio: {money(data.cct_cap_amount)}</Typography>}
              </Box>
            </Box>

            <Box>
              <Typography variant="subtitle2" color="text.secondary" mb={1}>Remuneración de los últimos 12 meses (sin SAC, vacaciones ni premios no remunerativos)</Typography>
              <Box display="grid" gridTemplateColumns={{ xs: 'repeat(3, 1fr)', sm: 'repeat(4, 1fr)', md: 'repeat(6, 1fr)' }} gap={1}>
                {data.severance_base.series.map((m) => {
                  const isBest = data.severance_base.month === m.month && data.severance_base.year === m.year && m.amount > 0;
                  return (
                    <Paper key={`${m.year}-${m.month}`} variant="outlined" sx={{ p: 1, borderRadius: 2, borderColor: isBest ? 'primary.main' : 'divider' }}>
                      <Typography variant="caption" color="text.secondary">{monthLabel(m.year, m.month)}</Typography>
                      <Typography variant="body2" fontWeight={isBest ? 700 : 400}>{money(m.amount)}</Typography>
                    </Paper>
                  );
                })}
              </Box>
            </Box>

            <ConceptsSection title="Remunerativo" items={visibleItems('remunerative')} subtotal={data.remunerative_total} />
            {visibleItems('indemnity').length > 0 && (
              <ConceptsSection
                title="Indemnizatorio / no remunerativo"
                items={visibleItems('indemnity')}
                subtotal={data.indemnity_total}
                note={data.agreement ? `La indemnización se paga con el acuerdo de pago en cuotas (${money(data.agreement.total_amount)}): estos conceptos quedan como referencia y no entran en la liquidación final.` : data.type === 'mutual_agreement' ? 'En el mutuo acuerdo estos conceptos son solo una referencia para negociar el monto: no se liquidan.' : undefined}
              />
            )}

            <Divider />
            <Box display="flex" justifyContent="space-between"><Typography fontWeight={700}>Total bruto</Typography><Typography fontWeight={700}>{money(data.gross_total)}</Typography></Box>

            <Box>
              <Typography variant="subtitle2" mb={1}>Descuentos</Typography>
              <Stack spacing={0.5}>
                <Row label={`Adelantos pagados sin descontar (${data.deductions.advances.items.length})`} value={money(data.deductions.advances.total)} />
                {data.deductions.loans.items.map((l) => (
                  <Row
                    key={l.loan_id}
                    label={`Préstamo #${l.loan_id}${l.kind === 'fixed_installments' ? ` — ${l.installments} cuota(s) pendientes${l.interest_waived > 0 ? `, interés perdonado ${money(l.interest_waived)}` : ''}` : ' — saldo a discreción'}`}
                    value={l.currency === 'USD' ? `US$ ${l.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : money(l.amount)}
                  />
                ))}
                {data.deductions.advances.items.length === 0 && data.deductions.loans.items.length === 0 && (
                  <Typography variant="body2" color="text.secondary">Sin adelantos ni préstamos pendientes.</Typography>
                )}
              </Stack>
              <Box display="flex" justifyContent="space-between" mt={1}>
                <Typography fontWeight={600}>Total descuentos (en pesos)</Typography>
                <Typography fontWeight={600}>{money(data.deductions.total)}</Typography>
              </Box>
            </Box>

            <Divider />
            <Box display="flex" justifyContent="space-between"><Typography variant="h6" fontWeight={700}>Neto estimado</Typography><Typography variant="h6" fontWeight={700}>{money(data.net_estimate)}</Typography></Box>
            {data.uncovered_debt > 0 && (
              <Alert severity="warning">
                Los descuentos superan lo que se le debe: el neto queda en $0 y el empleado quedaría con una deuda de {money(data.uncovered_debt)}.
              </Alert>
            )}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Box display="flex" justifyContent="space-between" gap={2}>
      <Typography variant="body2">{label}</Typography>
      <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>{value}</Typography>
    </Box>
  );
}

function ConceptsSection({ title, items, subtotal, note }: { title: string; items: TerminationCalculationItem[]; subtotal: number; note?: string }) {
  return (
    <Box>
      <Typography variant="subtitle2" mb={1}>{title}</Typography>
      {note && <Alert severity="info" sx={{ mb: 1 }}>{note}</Alert>}

      {/* Mobile Cards */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        <Stack spacing={1.5}>
          {items.map((item) => (
            <Card key={item.key} sx={{ p: 2, borderRadius: 2, opacity: item.applies ? 1 : 0.6 }}>
              <Box display="flex" justifyContent="space-between" gap={1}>
                <Typography fontWeight={600}>{item.label}</Typography>
                <Typography fontWeight={600} sx={{ whiteSpace: 'nowrap' }}>{money(item.amount)}</Typography>
              </Box>
              <ItemChips item={item} />
              <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>{describeItem(item)}</Typography>
            </Card>
          ))}
        </Stack>
      </Box>

      {/* Desktop Table */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <TableContainer component={Paper} elevation={0} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell><strong>Concepto</strong></TableCell>
                <TableCell><strong>Cómo se calculó</strong></TableCell>
                <TableCell align="right"><strong>Monto</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.key} sx={{ opacity: item.applies ? 1 : 0.6 }}>
                  <TableCell>{item.label} <ItemChips item={item} /></TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{describeItem(item)}</Typography></TableCell>
                  <TableCell align="right">{money(item.amount)}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={2}><strong>Subtotal</strong></TableCell>
                <TableCell align="right"><strong>{money(subtotal)}</strong></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      <Box sx={{ display: { xs: 'flex', md: 'none' }, justifyContent: 'space-between', mt: 1 }}>
        <Typography fontWeight={600}>Subtotal</Typography>
        <Typography fontWeight={600}>{money(subtotal)}</Typography>
      </Box>
    </Box>
  );
}

function ItemChips({ item }: { item: TerminationCalculationItem }) {
  return (
    <>
      {item.reference_only && <Chip size="small" label="Solo referencia" sx={{ ml: 0.5 }} />}
      {!item.applies && <Chip size="small" variant="outlined" label="No corresponde" sx={{ ml: 0.5 }} />}
    </>
  );
}
