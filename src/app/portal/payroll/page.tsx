'use client';
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Chip,
  Divider,
} from '@mui/material';
import { SelfService, PayrollEntry } from '@/utils/api';
import dayjs from 'dayjs';

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

  if (loading) return <Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>;
  if (error) return <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>;

  return (
    <Box>
      <Typography variant="h5" fontWeight={600} mb={3}>
        Mis Liquidaciones
      </Typography>

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
                        {payroll.payPeriod?.name || 'Período Desconocido'}
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
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">Otras Deducciones</Typography>
                      <Typography variant="body2" color="error.main" fontWeight={500}>
                        $ {Number(payroll.deductions || 0).toLocaleString()}
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
