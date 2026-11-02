'use client';
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Alert,
  Chip,
  Divider,
} from '@mui/material';
import { PaymentsOutlined as TitleIcon } from '@mui/icons-material';
import { SelfService, PayrollEntry, PayrollAdjustment } from '@/utils/api';
import GearSpinner from '@/components/GearSpinner';
import dayjs from 'dayjs';
import { isSacPeriod, sacPeriodLabel } from '@/utils/payPeriods';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// El período que devuelve /me/payroll no trae `name`: se arma desde tipo, mes y año. El aguinaldo
// se nombra aparte (utils/payPeriods.ts).
const periodTitle = (p: PayrollEntry['payPeriod']) => {
  if (!p) return 'Período Desconocido';
  if (p.type && p.month && p.year) {
    if (isSacPeriod(p)) return sacPeriodLabel({ type: p.type, month: p.month, year: p.year });
    return `${p.type === 'first_half' ? '1ª' : '2ª'} Quincena de ${MONTHS[p.month - 1]} ${p.year}`;
  }
  return p.name || 'Período Desconocido';
};

export default function PortalPayroll() {
  const [payrolls, setPayrolls] = useState<PayrollEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPayroll = async () => {
      try {
        const data = await SelfService.getMyPayroll();
        setPayrolls(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Error al cargar liquidaciones');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchPayroll();
  }, []);

  if (loading) return <Box display="flex" justifyContent="center" mt={8}><GearSpinner /></Box>;
  if (error) return <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>;

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1} mb={3}>
        <TitleIcon color="primary" sx={{ fontSize: 28 }} />
        <Typography variant="h5" fontWeight={600}>
          Mis Liquidaciones
        </Typography>
      </Box>

      {payrolls.length === 0 ? (
        <Card sx={{ borderRadius: 3, p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
          <Typography color="text.secondary">No tenés liquidaciones registradas.</Typography>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {payrolls.map((payroll) => (
            <Grid size={{ xs: 12, md: 6 }} key={payroll.id}>
              <Card sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box>
                      <Typography variant="h6" fontWeight={600}>
                        {periodTitle(payroll.payPeriod)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {dayjs(payroll.payPeriod?.start_date).format('DD/MM/YYYY')} - {dayjs(payroll.payPeriod?.end_date).format('DD/MM/YYYY')}
                      </Typography>
                    </Box>
                    <Chip 
                      label={payroll.status === 'paid' ? 'Pagado' : 'Confirmado'} 
                      color={payroll.status === 'paid' ? 'success' : 'primary'}
                      size="small"
                    />
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Grid container spacing={2}>
                    {isSacPeriod(payroll.payPeriod) ? (
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="caption" color="text.secondary">Aguinaldo (SAC)</Typography>
                        <Typography variant="body2" fontWeight={500}>$ {Number(payroll.gross_amount || 0).toLocaleString()}</Typography>
                      </Grid>
                    ) : (
                      <>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="text.secondary">Horas Normales</Typography>
                          <Typography variant="body2" fontWeight={500}>{payroll.total_regular_hours}</Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="text.secondary">Horas Extras</Typography>
                          <Typography variant="body2" fontWeight={500}>{Number(payroll.total_overtime_50_hours || 0) + Number(payroll.total_overtime_100_hours || 0)}</Typography>
                        </Grid>

                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="text.secondary">Adelantos Descontados</Typography>
                          <Typography variant="body2" color="error.main" fontWeight={500}>
                            $ {Number(payroll.advances_deducted || 0).toLocaleString()}
                          </Typography>
                        </Grid>
                      </>
                    )}
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">Otras Deducciones</Typography>
                      <Typography variant="body2" color="error.main" fontWeight={500}>
                        $ {Number((payroll.adjustments || [])
                          .filter((a: PayrollAdjustment) => a.type === 'deduction')
                          .reduce((sum: number, a: PayrollAdjustment) => sum + Number(a.amount), 0)).toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">Recibo / Depósito</Typography>
                      <Typography variant="body2" color="info.main" fontWeight={500}>
                        $ {Number((payroll.adjustments || [])
                          .filter((a: PayrollAdjustment) => a.type === 'deposit')
                          .reduce((sum: number, a: PayrollAdjustment) => sum + Number(a.amount), 0)).toLocaleString()}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Box mt={3} p={2} bgcolor="grey.50" borderRadius={2} display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body1" fontWeight={600} color="text.secondary">
                      Sueldo Neto
                    </Typography>
                    <Typography variant="h5" fontWeight={700} color="primary.main">
                      $ {Number(payroll.net_amount).toLocaleString()}
                    </Typography>
                  </Box>

                  {(payroll.extra_payments_notes || payroll.deductions_notes) && (
                    <Typography variant="caption" color="text.secondary" display="block" mt={2}>
                      Nota: {payroll.extra_payments_notes} {payroll.deductions_notes}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
