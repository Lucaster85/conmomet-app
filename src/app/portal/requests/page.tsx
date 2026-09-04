'use client';
import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Divider,
  Chip,
  TextField,
  Button,
  Stack,
} from '@mui/material';
import {
  MonetizationOnOutlined as AdvanceIcon,
  AccountBalanceOutlined as LoanIcon,
  RequestQuoteOutlined as TitleIcon,
} from '@mui/icons-material';
import { SelfService, Employee, SalaryAdvance, Loan } from '@/utils/api';
import CurrencyInput from '@/components/CurrencyInput';
import FeedbackModal from '@/components/FeedbackModal';
import dayjs from 'dayjs';

const MIN_LOAN_SENIORITY_YEARS = 1;

const hasMinimumSeniority = (hireDate?: string | null) => {
  if (!hireDate) return false;
  const diffYears = (Date.now() - new Date(hireDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  return diffYears >= MIN_LOAN_SENIORITY_YEARS;
};

type HistoryItem = {
  key: string;
  kind: 'advance' | 'loan';
  id: number;
  amount: number;
  date: string;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'completed' | 'cancelled';
  paidAt?: string | null;
  notes?: string;
  payPeriodId?: number | null;
};

// Vigente: adelanto todavía no descontado de una quincena, o préstamo con
// saldo pendiente (pending/approved/active). El resto pasa al historial.
const isCurrentItem = (item: HistoryItem) => {
  if (item.kind === 'advance') {
    return (item.status === 'pending' || item.status === 'approved') && !item.payPeriodId;
  }
  return item.status === 'pending' || item.status === 'approved' || item.status === 'active';
};

const getStatusChip = (item: HistoryItem): { label: string; color: 'warning' | 'success' | 'error' | 'default' | 'info' } => {
  switch (item.status) {
    case 'pending': return { label: 'Pendiente de aprobación', color: 'warning' };
    case 'rejected': return { label: 'Rechazado', color: 'error' };
    case 'completed': return { label: 'Completado', color: 'default' };
    case 'cancelled': return { label: 'Cancelado', color: 'default' };
    case 'active': return { label: 'Aprobado — Pagado', color: 'success' };
    case 'approved':
      return item.paidAt
        ? { label: 'Aprobado — Pagado', color: 'success' }
        : { label: 'Aprobado — Pend. de pago', color: 'info' };
    default: return { label: item.status, color: 'default' };
  }
};

export default function PortalRequestsPage() {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [advances, setAdvances] = useState<SalaryAdvance[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  const [advanceAmount, setAdvanceAmount] = useState<number | null>(null);
  const [advanceNotes, setAdvanceNotes] = useState('');
  const [submittingAdvance, setSubmittingAdvance] = useState(false);

  const [loanAmount, setLoanAmount] = useState<number | null>(null);
  const [loanNotes, setLoanNotes] = useState('');
  const [submittingLoan, setSubmittingLoan] = useState(false);

  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [profile, myAdvances, myLoans] = await Promise.all([
        SelfService.getMyProfile(),
        SelfService.getMyAdvances(),
        SelfService.getMyLoans(),
      ]);
      setEmployee(profile);
      setAdvances(myAdvances);
      setLoans(myLoans);
    } catch (err: unknown) {
      setFeedback({ message: err instanceof Error ? err.message : 'Error al cargar tus solicitudes', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRequestAdvance = async () => {
    if (!advanceAmount || advanceAmount <= 0) {
      setFeedback({ message: 'Ingresá un monto válido.', type: 'error' });
      return;
    }
    setSubmittingAdvance(true);
    try {
      await SelfService.requestAdvance({ amount: advanceAmount, notes: advanceNotes || undefined });
      setAdvanceAmount(null);
      setAdvanceNotes('');
      setFeedback({ message: 'Tu pedido de adelanto fue enviado.', type: 'success' });
      await loadData();
    } catch (err: unknown) {
      setFeedback({ message: err instanceof Error ? err.message : 'Error al solicitar el adelanto', type: 'error' });
    } finally {
      setSubmittingAdvance(false);
    }
  };

  const handleRequestLoan = async () => {
    if (!loanAmount || loanAmount <= 0) {
      setFeedback({ message: 'Ingresá un monto válido.', type: 'error' });
      return;
    }
    setSubmittingLoan(true);
    try {
      await SelfService.requestLoan({ amount: loanAmount, notes: loanNotes || undefined });
      setLoanAmount(null);
      setLoanNotes('');
      setFeedback({ message: 'Tu pedido de préstamo fue enviado.', type: 'success' });
      await loadData();
    } catch (err: unknown) {
      setFeedback({ message: err instanceof Error ? err.message : 'Error al solicitar el préstamo', type: 'error' });
    } finally {
      setSubmittingLoan(false);
    }
  };

  const handleCancel = async (item: HistoryItem) => {
    setCancelling(item.key);
    try {
      if (item.kind === 'advance') {
        await SelfService.cancelMyAdvance(item.id);
      } else {
        await SelfService.cancelMyLoan(item.id);
      }
      setFeedback({ message: 'Pedido cancelado.', type: 'success' });
      await loadData();
    } catch (err: unknown) {
      setFeedback({ message: err instanceof Error ? err.message : 'Error al cancelar el pedido', type: 'error' });
    } finally {
      setCancelling(null);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={8}>
        <CircularProgress />
      </Box>
    );
  }

  const canRequestLoan = hasMinimumSeniority(employee?.hire_date);

  const history: HistoryItem[] = [
    ...advances.map((a) => ({
      key: `advance-${a.id}`,
      kind: 'advance' as const,
      id: a.id,
      amount: Number(a.amount),
      date: a.date,
      status: a.status,
      paidAt: a.paid_at,
      notes: a.notes,
      payPeriodId: a.pay_period_id,
    })),
    ...loans.map((l) => ({
      key: `loan-${l.id}`,
      kind: 'loan' as const,
      id: l.id,
      amount: Number(l.requested_amount ?? l.amount),
      date: l.start_date,
      status: l.status,
      paidAt: l.paid_at,
      notes: l.notes,
    })),
  ].sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf());

  const currentItems = history.filter(isCurrentItem);
  const historyItems = history.filter((item) => !isCurrentItem(item));

  const renderRequestItem = (item: HistoryItem) => {
    const chip = getStatusChip(item);
    return (
      <Box
        key={item.key}
        sx={{
          border: 1,
          borderColor: 'divider',
          borderRadius: 2,
          p: 2,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
        }}
      >
        <Box>
          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
            <Typography fontWeight="bold">
              {item.kind === 'advance' ? 'Adelanto' : 'Préstamo'} — ${item.amount.toLocaleString('es-AR')}
            </Typography>
            <Chip label={chip.label} color={chip.color} size="small" />
          </Box>
          <Typography variant="caption" color="text.secondary">
            {dayjs(item.date).format('DD/MM/YYYY')}
            {item.notes ? ` · ${item.notes}` : ''}
          </Typography>
        </Box>
        {item.status === 'pending' && (
          <Button
            size="small"
            color="inherit"
            disabled={cancelling === item.key}
            onClick={() => handleCancel(item)}
          >
            {cancelling === item.key ? 'Cancelando...' : 'Cancelar'}
          </Button>
        )}
      </Box>
    );
  };

  return (
    <Box>
      <FeedbackModal
        open={!!feedback}
        onClose={() => setFeedback(null)}
        message={feedback?.message || ''}
        type={feedback?.type || 'error'}
      />

      <Box display="flex" alignItems="center" gap={1} mb={3}>
        <TitleIcon color="primary" sx={{ fontSize: 28 }} />
        <Typography variant="h5" fontWeight={600}>
          Adelantos y Préstamos
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <AdvanceIcon color="primary" />
                <Typography variant="h6" fontWeight={600}>Pedir un adelanto</Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />
              <Typography variant="body2" color="text.secondary" mb={2}>
                Se aplicará a la quincena en curso. Tu pedido queda sujeto a revisión y aprobación.
              </Typography>
              <Stack spacing={2}>
                <CurrencyInput
                  label="Monto"
                  fullWidth
                  value={advanceAmount}
                  onChange={setAdvanceAmount}
                />
                <TextField
                  label="Motivo (opcional)"
                  fullWidth
                  multiline
                  minRows={2}
                  value={advanceNotes}
                  onChange={(e) => setAdvanceNotes(e.target.value)}
                />
                <Button
                  variant="contained"
                  size="large"
                  disabled={submittingAdvance}
                  onClick={handleRequestAdvance}
                >
                  {submittingAdvance ? 'Enviando...' : 'Solicitar Adelanto'}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <LoanIcon color="primary" />
                <Typography variant="h6" fontWeight={600}>Pedir un préstamo</Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />

              {!canRequestLoan ? (
                <Box p={2} bgcolor="grey.50" borderRadius={2}>
                  <Typography variant="body2" color="text.secondary">
                    Para solicitar un préstamo se requiere al menos {MIN_LOAN_SENIORITY_YEARS} año de antigüedad en la empresa.
                  </Typography>
                </Box>
              ) : (
                <>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Tu pedido queda sujeto a revisión y aprobación.
                  </Typography>
                  <Stack spacing={2}>
                    <CurrencyInput
                      label="Monto en pesos"
                      fullWidth
                      value={loanAmount}
                      onChange={setLoanAmount}
                    />
                    <TextField
                      label="Motivo (opcional)"
                      fullWidth
                      multiline
                      minRows={2}
                      value={loanNotes}
                      onChange={(e) => setLoanNotes(e.target.value)}
                    />
                    <Button
                      variant="contained"
                      size="large"
                      disabled={submittingLoan}
                      onClick={handleRequestLoan}
                    >
                      {submittingLoan ? 'Enviando...' : 'Solicitar Préstamo'}
                    </Button>
                  </Stack>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Mis pedidos
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {currentItems.length === 0 ? (
                <Box textAlign="center" py={4} bgcolor="grey.50" borderRadius={2}>
                  <Typography color="text.secondary">
                    {history.length === 0 ? 'Todavía no hiciste ningún pedido.' : 'No tenés adelantos ni préstamos vigentes en este momento.'}
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={1.5}>
                  {currentItems.map((item) => renderRequestItem(item))}
                </Stack>
              )}

              {historyItems.length > 0 && (
                <>
                  <Button
                    size="small"
                    onClick={() => setShowHistory((v) => !v)}
                    sx={{ mt: 2 }}
                  >
                    {showHistory ? 'Ocultar historial' : `Ver historial (${historyItems.length})`}
                  </Button>
                  {showHistory && (
                    <Stack spacing={1.5} sx={{ mt: 1.5 }}>
                      {historyItems.map((item) => renderRequestItem(item))}
                    </Stack>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
