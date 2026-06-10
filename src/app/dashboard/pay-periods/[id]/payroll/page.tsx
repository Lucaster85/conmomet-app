'use client';
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, CircularProgress, Stack, Chip, Tooltip, Badge,
  Card, CardContent, Grid, useTheme, useMediaQuery,
} from '@mui/material';
import FeedbackModal from '../../../../../components/FeedbackModal';
import { Refresh as RefreshIcon, Edit as EditIcon, CheckCircle as ConfirmIcon, Calculate as CalcIcon, ArrowBack as BackIcon, Payment as PaymentIcon, Visibility as ViewIcon, Print as PrintIcon } from '@mui/icons-material';
import Divider from '@mui/material/Divider';
import { TableChart as ExcelIcon } from '@mui/icons-material';
import { PayrollEntry, PayrollService, PayPeriod, PayrollLine, PayrollAdjustment } from '../../../../../utils/api';
import { TokenManager } from '../../../../../utils/auth';
import { useParams, useRouter } from 'next/navigation';
import PayrollAdjustmentsModal from './PayrollAdjustmentsModal';
import RateChangesModal from './RateChangesModal';

export default function PayrollPage() {
  const params = useParams();
  const router = useRouter();
  const payPeriodId = Number(params.id);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [entries, setEntries] = useState<PayrollEntry[]>([]);
  const [period, setPeriod] = useState<PayPeriod | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [openEdit, setOpenEdit] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PayrollEntry | null>(null);
  

  const [openDetail, setOpenDetail] = useState(false);
  const [openRateChanges, setOpenRateChanges] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [detailEntry, setDetailEntry] = useState<any>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const apiBase =
        (typeof window !== 'undefined' && (window as { __ENV__?: { API_BASE_URL?: string } }).__ENV__?.API_BASE_URL) ||
        process.env.NEXT_PUBLIC_API_BASE_URL ||
        'http://localhost:4000';
      const res = await TokenManager.authenticatedFetch(`${apiBase}/payroll/${payPeriodId}`);
      if (!res.ok) throw new Error('Error al cargar');
      const json = await res.json();
      setEntries(json.data || []);
      setPeriod(json.period || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData(); }, [payPeriodId]);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      await PayrollService.generate(payPeriodId);
      setSuccess('Liquidación generada/actualizada');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar');
      setLoading(false);
    }
  };

  const handleConfirm = async (id: number) => {
    try {
      await PayrollService.confirm(id);
      setSuccess('Liquidación confirmada');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al confirmar');
    }
  };

  const handlePayItem = async (id: number) => {
    try {
      await PayrollService.pay(id);
      setSuccess('Liquidación pagada');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al pagar');
    }
  };

  const formatCurrency = (v: number) => `$${Number(v).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

  const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const formatPeriodLabel = (p: PayPeriod) => {
    const half = p.type === 'first_half' ? '1ª Quincena' : '2ª Quincena';
    const month = MONTHS[(p.month ?? 1) - 1];
    return `${half} de ${month} ${p.year}`;
  };

  const handlePrint = () => window.print();

  const handleExportHours = async () => {
    if (!period || entries.length === 0) return;

    try {
      const XLSX = await import('xlsx');
      
      const half = period.type === 'first_half' ? '1ª Quincena' : '2ª Quincena';
      const monthName = MONTHS[(period.month ?? 1) - 1];
      const periodLabel = `${half} de ${monthName} ${period.year}`;

      const formattedStartDate = period.start_date ? period.start_date.split('-').reverse().join('/') : '';
      const formattedEndDate = period.end_date ? period.end_date.split('-').reverse().join('/') : '';

      const rows = [
        [`Reporte de Horas — ${periodLabel}`],
        [`Período: ${formattedStartDate} al ${formattedEndDate}`],
        [''],
        [
          'Empleado',
          'Hs Regulares', 'Hs Extra 50%', 'Hs Extra 100%', 'Hs Especial', 'Hs Licencia/enfermedad', 'Hs Vacaciones',
          'Hs PEP', 'Hs PEP 50%', 'Hs PEP 100%'
        ],
        ...entries.map(e => {
          const isMonthly = e.employee?.pay_type === 'monthly';
          const rawReg = Number(e.total_regular_hours || 0);
          const ot50 = Number(e.total_overtime_50_hours || 0);
          const ot100 = Number(e.total_overtime_100_hours || 0);

          // Net simple/regular hours
          const baseRegRaw = e.lines ? e.lines.filter((l: PayrollLine) => l.line_type === 'regular' && l.concept_id === null).reduce((sum: number, l: PayrollLine) => sum + Number(l.quantity || 0), 0) : 0;
          const baseOt50 = e.lines ? e.lines.filter((l: PayrollLine) => l.line_type === 'extras_50' && l.concept_id === null).reduce((sum: number, l: PayrollLine) => sum + Number(l.quantity || 0), 0) : 0;
          const baseOt100 = e.lines ? e.lines.filter((l: PayrollLine) => l.line_type === 'extras_100' && l.concept_id === null).reduce((sum: number, l: PayrollLine) => sum + Number(l.quantity || 0), 0) : 0;

          const rowReg = isMonthly ? rawReg : Math.max(0, baseRegRaw - baseOt50 - baseOt100);
          const rowOt50 = ot50;
          const rowOt100 = ot100;

          // Hs Especial: regular hours under a differentiated rate concept (concept_id !== null)
          const diffRegRaw = e.lines ? e.lines.filter((l: PayrollLine) => l.line_type === 'regular' && l.concept_id !== null).reduce((sum: number, l: PayrollLine) => sum + Number(l.quantity || 0), 0) : 0;
          const diffOt50 = e.lines ? e.lines.filter((l: PayrollLine) => l.line_type === 'extras_50' && l.concept_id !== null).reduce((sum: number, l: PayrollLine) => sum + Number(l.quantity || 0), 0) : 0;
          const diffOt100 = e.lines ? e.lines.filter((l: PayrollLine) => l.line_type === 'extras_100' && l.concept_id !== null).reduce((sum: number, l: PayrollLine) => sum + Number(l.quantity || 0), 0) : 0;
          const rowEspecial = isMonthly ? 0 : Math.max(0, diffRegRaw - diffOt50 - diffOt100);

          // Hs Licencia/enfermedad: medical_leave + justified absences + holidays (both worked and non-worked)
          const rowLicencia = e.lines
            ? e.lines
                .filter((l: PayrollLine) => l.line_type === 'medical_leave' || l.line_type === 'justified' || l.line_type === 'holiday')
                .reduce((sum: number, l: PayrollLine) => sum + Number(l.quantity || 0), 0)
            : 0;

          // Hs Vacaciones: vacation (quantity in days, so we multiply by 8 to get hours)
          const rowVacaciones = e.lines
            ? e.lines
                .filter((l: PayrollLine) => l.line_type === 'vacation')
                .reduce((sum: number, l: PayrollLine) => sum + Number(l.quantity || 0) * 8, 0)
            : 0;

          // PEP OCA net simple/regular hours
          const ocaReg = isMonthly
            ? Number(e.pep_summary?.pep_oca?.regular_hours || 0)
            : Number(e.pep_summary?.pep_oca?.regular_hours || 0) - Number(e.pep_summary?.pep_oca?.overtime_50_hours || 0) - Number(e.pep_summary?.pep_oca?.overtime_100_hours || 0);
          const oca50 = Number(e.pep_summary?.pep_oca?.overtime_50_hours || 0);
          const oca100 = Number(e.pep_summary?.pep_oca?.overtime_100_hours || 0);

          // PEP Regular net simple/regular hours
          const rrReg = isMonthly
            ? Number(e.pep_summary?.pep_regular?.regular_hours || 0)
            : Number(e.pep_summary?.pep_regular?.regular_hours || 0) - Number(e.pep_summary?.pep_regular?.overtime_50_hours || 0) - Number(e.pep_summary?.pep_regular?.overtime_100_hours || 0);
          const rr50 = Number(e.pep_summary?.pep_regular?.overtime_50_hours || 0);
          const rr100 = Number(e.pep_summary?.pep_regular?.overtime_100_hours || 0);

          // Combined PEP Columns
          const pepReg = ocaReg + rrReg;
          const pep50 = oca50 + rr50;
          const pep100 = oca100 + rr100;

          return [
            `${e.employee?.lastname}, ${e.employee?.name}`,
            rowReg,
            rowOt50,
            rowOt100,
            rowEspecial,
            rowLicencia,
            rowVacaciones,
            pepReg,
            pep50,
            pep100
          ];
        })
      ];

      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws['!cols'] = [
        { wch: 30 }, // Empleado
        { wch: 13 }, // Hs Regulares
        { wch: 13 }, // Hs Extra 50%
        { wch: 13 }, // Hs Extra 100%
        { wch: 13 }, // Hs Especial
        { wch: 22 }, // Hs Licencia/enfermedad
        { wch: 15 }, // Hs Vacaciones
        { wch: 10 }, // Hs PEP
        { wch: 12 }, // Hs PEP 50%
        { wch: 12 }  // Hs PEP 100%
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Horas');
      
      const qNum = period.type === 'first_half' ? '1' : '2';
      XLSX.writeFile(wb, `Horas_Q${qNum}_${monthName}_${period.year}.xlsx`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al exportar a Excel');
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px"><CircularProgress /></Box>;

  return (
    <Box className={!openDetail && !openEdit && !openRateChanges ? "print-area" : ""}>
      <Box className="no-print" display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton onClick={() => router.push('/dashboard/pay-periods')}><BackIcon /></IconButton>
          <Typography variant="h4" fontWeight="bold">Liquidación</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadData} size="small">Actualizar</Button>
          {period?.status === 'open' && (
            <>
              <Button variant="outlined" color="primary" onClick={() => setOpenRateChanges(true)} size="small">Gestión de Aumentos</Button>
              <Button variant="contained" color="secondary" startIcon={<CalcIcon />} onClick={handleGenerate} size="small">Generar Liquidación</Button>
            </>
          )}
        </Box>
      </Box>

      <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />
      <FeedbackModal open={!!success} onClose={() => setSuccess('')} message={success} type="success" />

      {/* Period info banner */}
      {period && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: period.status === 'paid' ? '#F0FDF4' : period.status === 'closed' ? '#FFF7ED' : '#F8FAFC', border: '1px solid', borderColor: period.status === 'paid' ? '#BBF7D0' : period.status === 'closed' ? '#FED7AA' : 'divider', borderRadius: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
            <Box>
              <Typography variant="h6" fontWeight={600}>{formatPeriodLabel(period)}</Typography>
              <Typography variant="body2" color="text.secondary">
                {period.start_date} — {period.end_date}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Chip
                label={period.status === 'paid' ? 'Pagada' : period.status === 'closed' ? 'Cerrada' : 'Abierta'}
                color={period.status === 'paid' ? 'success' : period.status === 'closed' ? 'warning' : 'info'}
                size="small"
              />
              <Box className="no-print" display="flex" gap={1}>
                <Button variant="outlined" size="small" startIcon={<PrintIcon />} onClick={handlePrint} sx={{ display: entries.length > 0 ? 'inline-flex' : 'none' }}>Imprimir</Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ExcelIcon sx={{ color: '#217346' }} />}
                  onClick={handleExportHours}
                  sx={{ display: entries.length > 0 ? 'inline-flex' : 'none' }}
                >
                  Exportar Horas
                </Button>
              </Box>
            </Box>
          </Box>
        </Paper>
      )}

      {entries.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary" mb={2}>
            {period?.status === 'open'
              ? 'No se ha generado la liquidación para esta quincena aún.'
              : 'Esta quincena no tiene liquidaciones generadas.'}
          </Typography>
          {period?.status === 'open' && (
            <Button variant="contained" color="secondary" startIcon={<CalcIcon />} onClick={handleGenerate}>Generar Ahora</Button>
          )}
        </Paper>
      ) : isMobile ? (
        /* Mobile View (Cards) */
        <Stack spacing={2} className="no-print">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {entries.map((e: any) => (
            <Card 
              key={e.id} 
              sx={{ 
                borderRadius: 2, 
                position: 'relative', 
                borderLeft: '5px solid', 
                borderLeftColor: e.status === 'paid' ? 'info.main' : e.status === 'confirmed' ? 'success.main' : 'warning.main',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                  <Box>
                    <Typography variant="body1" fontWeight="bold">{(e.employee as Record<string, string>)?.lastname}, {(e.employee as Record<string, string>)?.name}</Typography>
                    <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                      <Typography variant="caption" color="text.secondary">DNI: {(e.employee as Record<string, string>)?.dni}</Typography>
                      <Chip 
                        label={(e.employee as Record<string, string>)?.pay_type === 'monthly' ? 'Mensual' : 'Jornalizado'}
                        size="small"
                        variant="outlined"
                        color={(e.employee as Record<string, string>)?.pay_type === 'monthly' ? 'primary' : 'default'}
                        sx={{ fontSize: '0.65rem', height: 20 }}
                      />
                    </Box>
                  </Box>
                  <Chip
                    label={e.status === 'draft' ? 'Borrador' : e.status === 'confirmed' ? 'Confirmado' : 'Pagado'}
                    size="small"
                    color={e.status === 'paid' ? 'info' : e.status === 'confirmed' ? 'success' : 'warning'}
                  />
                </Box>

                <Box display="flex" gap={0.5} mb={2} flexWrap="wrap">
                  {e.perfect_attendance ? (
                    <Chip label="✓ Perfecto" size="small" color="success" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                  ) : (
                    <>
                      {Number(e.absent_unjustified) > 0 && <Chip label={`${e.absent_unjustified} injust.`} size="small" color="error" sx={{ height: 20, fontSize: '0.65rem' }} />}
                      {Number(e.absent_justified) > 0 && <Chip label={`${e.absent_justified} just.`} size="small" color="warning" sx={{ height: 20, fontSize: '0.65rem' }} />}
                      {Number(e.medical_leave_count) > 0 && <Chip label={`${e.medical_leave_count} lic. méd.`} size="small" color="info" sx={{ height: 20, fontSize: '0.65rem' }} />}
                      {Number(e.vacation_count) > 0 && <Chip label={`${e.vacation_count} vac.`} size="small" sx={{ height: 20, fontSize: '0.65rem' }} />}
                    </>
                  )}
                  {Number(e.late_count) > 0 && (
                    <Chip label={`${e.late_count} tardanzas`} size="small" color="warning" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                  )}
                </Box>

                <Divider sx={{ my: 1.5 }} />

                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary" display="block">Base</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {(e.employee as Record<string, string>)?.pay_type === 'monthly'
                        ? 'Mensual'
                        : `${parseFloat((Number(e.total_regular_hours || 0) - Number(e.total_overtime_50_hours || 0) - Number(e.total_overtime_100_hours || 0)).toFixed(2))}h`}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">{formatCurrency(e.regular_amount)}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary" display="block">Hs Extras</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {Number(e.total_overtime_50_hours || 0) + Number(e.total_overtime_100_hours || 0)}h
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">{formatCurrency(Number(e.overtime_50_amount || 0) + Number(e.overtime_100_amount || 0))}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary" display="block">Sueldo Bruto</Typography>
                    <Typography variant="body2" fontWeight="bold">{formatCurrency(e.gross_amount)}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary" display="block">Adelantos</Typography>
                    <Typography variant="body2" color="error.main" fontWeight="medium">-{formatCurrency(e.advances_deducted)}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    {(() => {
                      const extraPaymentsFromAdjustments = (e.adjustments || [])
                        .filter((a: PayrollAdjustment) => a.type === 'bonus')
                        .reduce((sum: number, a: PayrollAdjustment) => sum + Number(a.amount), 0);
                      const extraPaymentsFromLines = (e.lines || [])
                        .filter((l: PayrollLine) => !['regular', 'fixed', 'extras_50', 'extras_100'].includes(l.line_type))
                        .reduce((sum: number, l: PayrollLine) => sum + Number(l.subtotal), 0);
                      const extraPayments = extraPaymentsFromAdjustments + extraPaymentsFromLines;
                      const deductions = (e.adjustments || [])
                        .filter((a: PayrollAdjustment) => a.type === 'deduction')
                        .reduce((sum: number, a: PayrollAdjustment) => sum + Number(a.amount), 0);

                      return (
                        <>
                          <Typography variant="caption" color="text.secondary" display="block">Otros / Ret.</Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {extraPayments > 0 && `+${formatCurrency(extraPayments)} `}
                            {deductions > 0 && `-${formatCurrency(deductions)}`}
                            {extraPayments === 0 && deductions === 0 && '—'}
                          </Typography>
                        </>
                      );
                    })()}
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary" display="block">Sueldo Neto</Typography>
                    <Typography variant="body2" fontWeight="bold" color="success.dark">{formatCurrency(e.net_amount)}</Typography>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 1.5 }} />

                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box display="flex" alignItems="center" gap={0.5}>
                    {e.has_active_loan && (
                      <Chip label="💰 Préstamo Activo" size="small" color="error" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />
                    )}
                  </Box>
                  <Box display="flex" gap={0.5}>
                    <Tooltip title="Ver detalle">
                      <IconButton size="small" onClick={() => { setDetailEntry(e); setOpenDetail(true); }}>
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {e.status === 'draft' && (
                      <>
                        <Tooltip title="Ajustes">
                          <IconButton 
                            size="small" 
                            color="primary" 
                            onClick={() => {
                              setEditingEntry(e as unknown as PayrollEntry);
                              setOpenEdit(true);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Confirmar">
                          <IconButton size="small" color="success" onClick={() => handleConfirm(e.id as number)}>
                            <ConfirmIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                    {e.status === 'confirmed' && (
                      <Tooltip title="Pagar">
                        <IconButton size="small" color="info" onClick={() => handlePayItem(e.id as number)}>
                          <PaymentIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      ) : (
        /* Vista Desktop (Tabla) */
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell><strong>Empleado</strong></TableCell>
                <TableCell align="center" sx={{ maxWidth: '120px' }}><strong>Presentismo</strong></TableCell>
                <TableCell align="right"><strong>Base</strong></TableCell>
                <TableCell align="right"><strong>Hs Extras</strong></TableCell>
                <TableCell align="right"><strong>Sueldo Bruto</strong></TableCell>
                <TableCell align="right"><strong>Adelantos</strong></TableCell>
                <TableCell align="right"><strong>Otros Haberes</strong></TableCell>
                <TableCell align="right"><strong>Retenciones</strong></TableCell>
                <TableCell align="right"><strong>Sueldo Neto</strong></TableCell>
                <TableCell align="center"><strong>Estado</strong></TableCell>
                <TableCell align="center" className="no-print"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {entries.map((e: any) => (
                <TableRow key={e.id as number} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">{(e.employee as Record<string, string>)?.lastname}, {(e.employee as Record<string, string>)?.name}</Typography>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Typography variant="caption" color="text.secondary">DNI: {(e.employee as Record<string, string>)?.dni}</Typography>
                      <Chip 
                        label={(e.employee as Record<string, string>)?.pay_type === 'monthly' ? 'Mensual' : 'Jornalizado'}
                        size="small"
                        variant="outlined"
                        color={(e.employee as Record<string, string>)?.pay_type === 'monthly' ? 'primary' : 'default'}
                        sx={{ fontSize: '0.65rem', height: 20 }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell align="center" sx={{ maxWidth: '120px' }}>
                    {e.perfect_attendance ? (
                      <Chip label="✓ Perfecto" size="small" color="success" variant="outlined" />
                    ) : (
                      <Box>
                        {Number(e.absent_unjustified) > 0 && (
                          <Tooltip title={`${e.absent_unjustified} falta(s) injustificada(s)`}>
                            <Chip label={`${e.absent_unjustified} injust.`} size="small" color="error" sx={{ mr: 0.5, mb: 0.5 }} />
                          </Tooltip>
                        )}
                        {Number(e.absent_justified) > 0 && (
                          <Tooltip title={`${e.absent_justified} falta(s) justificada(s)`}>
                            <Chip label={`${e.absent_justified} just.`} size="small" color="warning" sx={{ mr: 0.5, mb: 0.5 }} />
                          </Tooltip>
                        )}
                        {Number(e.medical_leave_count) > 0 && (
                          <Tooltip title={`${e.medical_leave_count} día(s) licencia médica`}>
                            <Chip label={`${e.medical_leave_count} lic. méd.`} size="small" color="info" sx={{ mr: 0.5, mb: 0.5 }} />
                          </Tooltip>
                        )}
                        {Number(e.vacation_count) > 0 && (
                          <Tooltip title={`${e.vacation_count} día(s) de vacaciones`}>
                            <Chip label={`${e.vacation_count} vac.`} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                          </Tooltip>
                        )}
                      </Box>
                    )}
                    {Number(e.late_count) > 0 && (
                      <Typography variant="caption" color="warning.main" display="block">{e.late_count as number} llegada(s) tarde</Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {(e.employee as Record<string, string>)?.pay_type === 'monthly' ? (
                      <>
                        <Typography variant="body2">Sueldo Mensual</Typography>
                        <Typography variant="caption" color="text.secondary">{formatCurrency(e.regular_amount as number)}</Typography>
                      </>
                    ) : (
                      <>
                        <Typography variant="body2">
                          {parseFloat((Number(e.total_regular_hours || 0) - Number(e.total_overtime_50_hours || 0) - Number(e.total_overtime_100_hours || 0)).toFixed(2))}h
                        </Typography>
                        <Typography variant="caption" color="text.secondary">{formatCurrency(e.regular_amount as number)}</Typography>
                      </>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">{Number(e.total_overtime_50_hours) + Number(e.total_overtime_100_hours)}h</Typography>
                    <Typography variant="caption" color="text.secondary">{formatCurrency(Number(e.overtime_50_amount) + Number(e.overtime_100_amount))}</Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ bgcolor: 'grey.50' }}><strong>{formatCurrency(e.gross_amount as number)}</strong></TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="error">-{formatCurrency(e.advances_deducted as number)}</Typography>
                  </TableCell>
                  {(() => {
                    const extraPaymentsFromAdjustments = (e.adjustments || [])
                      .filter((a: PayrollAdjustment) => a.type === 'bonus')
                      .reduce((sum: number, a: PayrollAdjustment) => sum + Number(a.amount), 0);
                    const extraPaymentsFromLines = (e.lines || [])
                      .filter((l: PayrollLine) => !['regular', 'fixed', 'extras_50', 'extras_100'].includes(l.line_type))
                      .reduce((sum: number, l: PayrollLine) => sum + Number(l.subtotal), 0);
                    const extraPayments = extraPaymentsFromAdjustments + extraPaymentsFromLines;
                    const deductions = (e.adjustments || [])
                      .filter((a: PayrollAdjustment) => a.type === 'deduction')
                      .reduce((sum: number, a: PayrollAdjustment) => sum + Number(a.amount), 0);
                    
                    return (
                      <>
                        <TableCell align="right">
                          {extraPayments > 0 ? (
                            <Typography variant="body2" color="success.main" fontWeight="medium">
                              +{formatCurrency(extraPayments)}
                            </Typography>
                          ) : '—'}
                        </TableCell>
                        <TableCell align="right">
                          {deductions > 0 ? (
                            <Typography variant="body2" color="error.main" fontWeight="medium">
                              -{formatCurrency(deductions)}
                            </Typography>
                          ) : '—'}
                        </TableCell>
                      </>
                    );
                  })()}
                  <TableCell align="right" sx={{ bgcolor: 'success.50' }}>
                    <Typography fontWeight="bold" color="success.dark">{formatCurrency(e.net_amount as number)}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={e.status === 'draft' ? 'Borrador' : e.status === 'confirmed' ? 'Confirmado' : 'Pagado'}
                      size="small"
                      color={e.status === 'paid' ? 'info' : e.status === 'confirmed' ? 'success' : 'warning'}
                    />
                  </TableCell>
                  <TableCell align="center" className="no-print">
                    <Box display="flex" justifyContent="center">
                      <Tooltip title="Ver detalle">
                        <IconButton size="small" onClick={() => { setDetailEntry(e); setOpenDetail(true); }}>
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {e.status === 'draft' && (
                        <>
                          <Tooltip title="Ajustes (Extras/Retenciones)">
                            <IconButton size="small" color="primary" onClick={() => {
                              setEditingEntry(e as unknown as PayrollEntry);
                              setOpenEdit(true);
                            }}>
                              {e.has_active_loan ? (
                                <Badge
                                  variant="dot"
                                  sx={{
                                    '& .MuiBadge-dot': {
                                      bgcolor: '#ef4444',
                                      width: 10,
                                      height: 10,
                                      borderRadius: '50%',
                                      animation: 'pulse-loan 2s ease-in-out infinite',
                                      '@keyframes pulse-loan': {
                                        '0%, 100%': { transform: 'scale(1)', opacity: 1 },
                                        '50%': { transform: 'scale(1.4)', opacity: 0.7 },
                                      },
                                    },
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </Badge>
                              ) : (
                                <EditIcon fontSize="small" />
                              )}
                            </IconButton>
                          </Tooltip>
                          {e.has_active_loan && (() => {
                            const parts: string[] = [];
                            if (Number(e.total_remaining_usd) > 0) parts.push(`USD ${Number(e.total_remaining_usd).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`);
                            if (Number(e.total_remaining_ars) > 0) parts.push(`$${Number(e.total_remaining_ars).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`);
                            const saldoText = parts.join(' + ');
                            return (
                            <Tooltip title={`Préstamo activo: ${e.active_loans_count} préstamo(s) — Saldo: ${saldoText}`}>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: '#ef4444',
                                  fontWeight: 700,
                                  fontSize: '0.65rem',
                                  cursor: 'default',
                                  lineHeight: 1,
                                  display: 'flex',
                                  alignItems: 'center',
                                }}
                              >
                                💰
                              </Typography>
                            </Tooltip>
                            );
                          })()}
                          <Tooltip title="Confirmar liquidación"><IconButton size="small" color="success" onClick={() => handleConfirm(e.id as number)}><ConfirmIcon fontSize="small" /></IconButton></Tooltip>
                        </>
                      )}
                      {e.status === 'confirmed' && (
                        <Tooltip title="Marcar como pagado"><IconButton size="small" color="info" onClick={() => handlePayItem(e.id as number)}><PaymentIcon fontSize="small" /></IconButton></Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Detail Dialog */}
      <Dialog open={openDetail} onClose={() => setOpenDetail(false)} maxWidth="md" fullWidth fullScreen={isMobile}>
        {detailEntry && (
          <>
            <DialogTitle className="no-print" sx={{ pb: 0 }}>
              Detalle de Liquidación
            </DialogTitle>
            <DialogContent>
              <Box className="print-area" sx={{ pt: 1 }}>
                {/* Header */}
                <Box mb={2}>
                  <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: '-0.02em' }}>
                    {detailEntry.employee?.lastname}, {detailEntry.employee?.name}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                    <Typography variant="body2" color="text.secondary">DNI: {detailEntry.employee?.dni}</Typography>
                    <Typography variant="body2" color="text.secondary">·</Typography>
                    <Typography variant="body2" color="text.secondary">{detailEntry.employee?.position || 'Sin cargo'}</Typography>
                    <Typography variant="body2" color="text.secondary">·</Typography>
                    <Chip
                      label={detailEntry.employee?.pay_type === 'monthly' ? 'Mensual' : 'Jornalizado'}
                      size="small" variant="outlined"
                      color={detailEntry.employee?.pay_type === 'monthly' ? 'primary' : 'default'}
                      sx={{ fontSize: '0.7rem', height: 20 }}
                    />
                    <Chip
                      label={detailEntry.status === 'paid' ? 'Pagado' : detailEntry.status === 'confirmed' ? 'Confirmado' : 'Borrador'}
                      size="small"
                      color={detailEntry.status === 'paid' ? 'info' : detailEntry.status === 'confirmed' ? 'success' : 'warning'}
                      sx={{ fontSize: '0.7rem', height: 20 }}
                    />
                  </Box>
                  {period && (
                    <Box mt={0.5}>
                      <Typography variant="body2" fontWeight={600} color="text.primary">
                        {formatPeriodLabel(period)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {period.start_date.split('-').reverse().join('/')} — {period.end_date.split('-').reverse().join('/')}
                      </Typography>
                    </Box>
                  )}
                </Box>

                <Divider sx={{ my: 1.5 }} />

                {/* Asistencia y Horas */}
                <Box display="flex" gap={3} mb={2} flexWrap="wrap">
                  <Box flex={1} minWidth={140}>
                    <Typography variant="overline" color="text.secondary" fontWeight={600}>Asistencia</Typography>
                    {detailEntry.perfect_attendance ? (
                      <Typography variant="body2" color="success.main" fontWeight={600}>✓ Presentismo perfecto</Typography>
                    ) : (
                      <Stack spacing={0.25} mt={0.5}>
                        {Number(detailEntry.absent_unjustified) > 0 && <Typography variant="body2" color="error.main">• {detailEntry.absent_unjustified} falta(s) injustificada(s)</Typography>}
                        {Number(detailEntry.absent_justified) > 0 && <Typography variant="body2" color="warning.main">• {detailEntry.absent_justified} falta(s) justificada(s)</Typography>}
                        {Number(detailEntry.medical_leave_count) > 0 && <Typography variant="body2" color="info.main">• {detailEntry.medical_leave_count} día(s) lic. médica</Typography>}
                        {Number(detailEntry.vacation_count) > 0 && <Typography variant="body2">• {detailEntry.vacation_count} día(s) vacaciones</Typography>}
                      </Stack>
                    )}
                    {Number(detailEntry.late_count) > 0 && (
                      <Typography variant="body2" color="warning.main">• {detailEntry.late_count} llegada(s) tarde</Typography>
                    )}
                  </Box>
                  <Box flex={2} minWidth={280}>
                    <Typography variant="overline" color="text.secondary" fontWeight={600}>Horas en Planta (PEP)</Typography>
                    {detailEntry.pep_summary && detailEntry.pep_summary.total_pep_hours > 0 ? (
                      <TableContainer component={Paper} variant="outlined" sx={{ mt: 0.5 }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ bgcolor: 'grey.50' }}>
                              <TableCell sx={{ py: 0.25, px: 1 }}><Typography variant="caption" fontWeight="bold">Concepto</Typography></TableCell>
                              <TableCell align="right" sx={{ py: 0.25, px: 1 }}><Typography variant="caption" fontWeight="bold">Regular</Typography></TableCell>
                              <TableCell align="right" sx={{ py: 0.25, px: 1 }}><Typography variant="caption" fontWeight="bold">50%</Typography></TableCell>
                              <TableCell align="right" sx={{ py: 0.25, px: 1 }}><Typography variant="caption" fontWeight="bold">100%</Typography></TableCell>
                              <TableCell align="right" sx={{ py: 0.25, px: 1 }}><Typography variant="caption" fontWeight="bold">Total</Typography></TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {(() => {
                              const isMonthly = detailEntry.employee?.pay_type === 'monthly';
                              
                              const ocaReg = Number(detailEntry.pep_summary.pep_oca?.regular_hours || 0);
                              const oca50 = Number(detailEntry.pep_summary.pep_oca?.overtime_50_hours || 0);
                              const oca100 = Number(detailEntry.pep_summary.pep_oca?.overtime_100_hours || 0);
                              const pepOcaSimples = isMonthly ? ocaReg : ocaReg - oca50 - oca100;

                              const regReg = Number(detailEntry.pep_summary.pep_regular?.regular_hours || 0);
                              const reg50 = Number(detailEntry.pep_summary.pep_regular?.overtime_50_hours || 0);
                              const reg100 = Number(detailEntry.pep_summary.pep_regular?.overtime_100_hours || 0);
                              const pepRegSimples = isMonthly ? regReg : regReg - reg50 - reg100;

                              const totalSimples = pepOcaSimples + pepRegSimples;
                              const total50 = oca50 + reg50;
                              const total100 = oca100 + reg100;
                              const totalPep = isMonthly ? total50 + total100 : ocaReg + regReg;

                              return (
                                <TableRow>
                                  <TableCell sx={{ py: 0.25, px: 1 }}><Typography variant="body2" fontWeight="medium">PEP (Total)</Typography></TableCell>
                                  <TableCell align="right" sx={{ py: 0.25, px: 1 }}>
                                    <Typography variant="body2">{totalSimples.toFixed(1)}h</Typography>
                                  </TableCell>
                                  <TableCell align="right" sx={{ py: 0.25, px: 1 }}>
                                    <Typography variant="body2">{total50.toFixed(1)}h</Typography>
                                  </TableCell>
                                  <TableCell align="right" sx={{ py: 0.25, px: 1 }}>
                                    <Typography variant="body2">{total100.toFixed(1)}h</Typography>
                                  </TableCell>
                                  <TableCell align="right" sx={{ py: 0.25, px: 1 }}>
                                    <Typography variant="body2" fontWeight="bold">{totalPep.toFixed(1)}h</Typography>
                                  </TableCell>
                                </TableRow>
                              );
                            })()}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                        Sin horas en planta (PEP) registradas en este período.
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Divider sx={{ my: 1.5 }} />

                {/* Desglose de haberes */}
                <Typography variant="overline" color="text.secondary" fontWeight={600}>Desglose de haberes</Typography>
                <Stack spacing={0.5} mt={1} mb={1}>
                  {(() => {
                    if (detailEntry.lines && detailEntry.lines.length > 0) {
                      const isMonthly = detailEntry.employee?.pay_type === 'monthly';
                      
                      let displayLines = detailEntry.lines;
                      if (!isMonthly) {
                        const extrasMap: Record<string, { ot50: number; ot100: number }> = {};
                        detailEntry.lines.forEach((l: PayrollLine) => {
                          if (l.line_type === 'extras_50' || l.line_type === 'extras_100') {
                            const cid = String(l.concept_id || 'null');
                            if (!extrasMap[cid]) {
                              extrasMap[cid] = { ot50: 0, ot100: 0 };
                            }
                            if (l.line_type === 'extras_50') {
                              extrasMap[cid].ot50 += Number(l.quantity || 0);
                            } else {
                              extrasMap[cid].ot100 += Number(l.quantity || 0);
                            }
                          }
                        });

                        displayLines = detailEntry.lines.map((l: PayrollLine) => {
                          const cid = String(l.concept_id || 'null');
                          if (l.line_type === 'regular') {
                            const extras = extrasMap[cid] || { ot50: 0, ot100: 0 };
                            const totalOt = extras.ot50 + extras.ot100;
                            if (totalOt > 0) {
                              const newQty = Math.max(0, Number(l.quantity || 0) - totalOt);
                              const rate = Number(l.rate || 0);
                              return {
                                ...l,
                                quantity: newQty,
                                subtotal: newQty * rate
                              };
                            }
                          } else if (l.line_type === 'extras_50') {
                            const baseRate = Number(l.rate || 0) * 2;
                            const fullRate = baseRate * 1.5;
                            const qty = Number(l.quantity || 0);
                            return {
                              ...l,
                              label: l.label.replace('Recargo 50%', 'Horas Extra 50%'),
                              rate: fullRate,
                              subtotal: qty * fullRate
                            };
                          } else if (l.line_type === 'extras_100') {
                            const baseRate = Number(l.rate || 0);
                            const fullRate = baseRate * 2.0;
                            const qty = Number(l.quantity || 0);
                            return {
                              ...l,
                              label: l.label.replace('Recargo 100%', 'Horas Extra 100%'),
                              rate: fullRate,
                              subtotal: qty * fullRate
                            };
                          }
                          return l;
                        });
                      }

                      const totalHours = isMonthly
                        ? 0
                        : displayLines
                            .filter((l: PayrollLine) => ['regular', 'extras_50', 'extras_100', 'holiday', 'medical_leave', 'justified'].includes(l.line_type))
                            .reduce((sum: number, l: PayrollLine) => sum + Number(l.quantity || 0), 0);

                      return (
                        <TableContainer component={Paper} variant="outlined" sx={{ border: 'none', bgcolor: 'transparent' }}>
                          <Table size="small" sx={{ mb: 1, '& th, & td': { borderBottom: 'none', py: 0.5, px: 0 } }}>
                            <TableHead>
                              <TableRow>
                                <TableCell><Typography variant="caption" color="text.secondary">Concepto</Typography></TableCell>
                                <TableCell align="right"><Typography variant="caption" color="text.secondary">Cant.</Typography></TableCell>
                                <TableCell align="right"><Typography variant="caption" color="text.secondary">Tarifa</Typography></TableCell>
                                <TableCell align="right"><Typography variant="caption" color="text.secondary">Subtotal</Typography></TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {displayLines.map((line: { id: number, label: string, quantity: number, rate: number, subtotal: number }) => (
                                <TableRow key={line.id}>
                                  <TableCell sx={{ maxWidth: { xs: 150, sm: 400, md: 500 } }}>
                                    <Typography variant="body2" sx={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
                                      {line.label}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="right"><Typography variant="body2">{Number(line.quantity).toFixed(1)}</Typography></TableCell>
                                  <TableCell align="right"><Typography variant="body2">{formatCurrency(line.rate)}</Typography></TableCell>
                                  <TableCell align="right"><Typography variant="body2">{formatCurrency(line.subtotal)}</Typography></TableCell>
                                </TableRow>
                              ))}

                              {/* Bonus adjustments inside the table */}
                              {(detailEntry.adjustments as PayrollAdjustment[])?.filter((a: PayrollAdjustment) => a.type === 'bonus').map((a: PayrollAdjustment) => (
                                <TableRow key={a.id}>
                                  <TableCell sx={{ maxWidth: { xs: 150, sm: 400, md: 500 } }}>
                                    <Typography variant="body2" color="success.main" sx={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
                                      Pagos extra ({a.label})
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="right"><Typography variant="body2" color="success.main">—</Typography></TableCell>
                                  <TableCell align="right"><Typography variant="body2" color="success.main">—</Typography></TableCell>
                                  <TableCell align="right"><Typography variant="body2" color="success.main">+{formatCurrency(a.amount)}</Typography></TableCell>
                                </TableRow>
                              ))}

                              {/* Divider inside table */}
                              <TableRow>
                                <TableCell colSpan={4} sx={{ py: 0.5 }}>
                                  <Divider />
                                </TableCell>
                              </TableRow>

                              {/* Sueldo Bruto inside table */}
                              <TableRow>
                                <TableCell>
                                  <Typography variant="body2" fontWeight={600}>Sueldo bruto</Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="body2" fontWeight={600}>
                                    {isMonthly ? '—' : Number(totalHours).toFixed(1)}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="body2" fontWeight={600}>—</Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="body2" fontWeight={600}>
                                    {formatCurrency(detailEntry.gross_amount)}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </TableContainer>
                      );
                    } else {
                      return (
                        <>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2">
                              {detailEntry.employee?.pay_type === 'monthly'
                                ? 'Sueldo mensual'
                                : `Horas regulares (${parseFloat((Number(detailEntry.total_regular_hours || 0) - Number(detailEntry.total_overtime_50_hours || 0) - Number(detailEntry.total_overtime_100_hours || 0)).toFixed(2))}h)`}
                            </Typography>
                            <Typography variant="body2">{formatCurrency(detailEntry.regular_amount)}</Typography>
                          </Box>
                          {Number(detailEntry.overtime_50_amount) > 0 && (
                            <Box display="flex" justifyContent="space-between">
                              <Typography variant="body2">Horas extra 50% ({detailEntry.total_overtime_50_hours}h)</Typography>
                              <Typography variant="body2">{formatCurrency(detailEntry.overtime_50_amount)}</Typography>
                            </Box>
                          )}
                          {Number(detailEntry.overtime_100_amount) > 0 && (
                            <Box display="flex" justifyContent="space-between">
                              <Typography variant="body2">Horas extra 100% ({detailEntry.total_overtime_100_hours}h)</Typography>
                              <Typography variant="body2">{formatCurrency(detailEntry.overtime_100_amount)}</Typography>
                            </Box>
                          )}
                          {detailEntry.adjustments?.filter((a: { type: string; id: number; label: string; amount: number }) => a.type === 'bonus').map((a: { type: string; id: number; label: string; amount: number }) => (
                            <Box display="flex" justifyContent="space-between" key={a.id}>
                              <Typography variant="body2" color="success.main">
                                Pagos extra ({a.label})
                              </Typography>
                              <Typography variant="body2" color="success.main">+{formatCurrency(a.amount)}</Typography>
                            </Box>
                          ))}
                          <Divider />
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2" fontWeight={600}>Sueldo bruto</Typography>
                            <Typography variant="body2" fontWeight={600}>{formatCurrency(detailEntry.gross_amount)}</Typography>
                          </Box>
                        </>
                      );
                    }
                  })()}
                </Stack>

                <Divider sx={{ my: 1.5 }} />

                {/* Deducciones */}
                <Typography variant="overline" color="text.secondary" fontWeight={600}>Deducciones</Typography>
                <Stack spacing={0.5} mt={1} mb={1}>
                  {Number(detailEntry.advances_deducted) > 0 && (
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="error.main">Adelantos</Typography>
                      <Typography variant="body2" color="error.main">-{formatCurrency(detailEntry.advances_deducted)}</Typography>
                    </Box>
                  )}
                  {detailEntry.adjustments?.filter((a: { type: string; id: number; label: string; amount: number }) => a.type === 'deduction').map((a: { type: string; id: number; label: string; amount: number }) => (
                    <Box display="flex" justifyContent="space-between" key={a.id}>
                      <Typography variant="body2" color="error.main">
                        Retenciones ({a.label})
                      </Typography>
                      <Typography variant="body2" color="error.main">-{formatCurrency(a.amount)}</Typography>
                    </Box>
                  ))}
                  {Number(detailEntry.advances_deducted) === 0 && (!detailEntry.adjustments || detailEntry.adjustments.filter((a: { type: string }) => a.type === 'deduction').length === 0) && (
                    <Typography variant="body2" color="text.secondary">Sin deducciones</Typography>
                  )}
                </Stack>

                <Divider sx={{ my: 1.5 }} />

                {/* Neto */}
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ bgcolor: 'success.50', borderRadius: 1, px: 1.5, py: 1 }}>
                  <Typography variant="subtitle1" fontWeight={700}>Neto a cobrar</Typography>
                  <Typography variant="h6" fontWeight={700} color="success.dark">{formatCurrency(detailEntry.net_amount)}</Typography>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions className="no-print">
              <Button onClick={() => setOpenDetail(false)}>Cerrar</Button>
              <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}>Imprimir</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Edit Adjustments Dialog */}
      <PayrollAdjustmentsModal
        open={openEdit}
        onClose={() => { setOpenEdit(false); loadData(); }}
        payrollEntryId={editingEntry?.id as number}
        employeeId={editingEntry?.employee?.id as number}
        employeeName={editingEntry?.employee ? `${editingEntry.employee.lastname}, ${editingEntry.employee.name}` : ''}
      />
      <RateChangesModal
        open={openRateChanges}
        onClose={() => { setOpenRateChanges(false); loadData(); }}
        payPeriodId={payPeriodId}
      />
    </Box>
  );
}
