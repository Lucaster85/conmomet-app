'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, Paper, Stack, Chip, Button } from '@mui/material';
import {
  AssignmentOutlined as AssignmentIcon,
  BadgeOutlined as BadgeIcon,
  EventAvailableOutlined as EventAvailableIcon,
  RequestQuoteOutlined as RequestQuoteIcon,
} from '@mui/icons-material';
import { ClockIcon } from '@mui/x-date-pickers';
import { LoanService, SalaryAdvanceService } from '../../utils/api';
import FeedbackModal from '../../components/FeedbackModal';
import GearSpinner from '../../components/GearSpinner';
import { useAuth, userHasPermission } from '../../utils/auth';
import IconTileGrid, { IconTileItem } from '../../components/common/IconTileGrid';
import DashboardAlertSummaryBar from '../../components/common/DashboardAlertSummaryBar';
import RepairToolsAlert from '../../components/common/RepairToolsAlert';
import OcaBudgetAlert from '../../components/common/OcaBudgetAlert';
import SalaryAdvanceDeletionAlert from '../../components/common/SalaryAdvanceDeletionAlert';
import QuoteRequestAlert from '../../components/common/QuoteRequestAlert';
import EppExpiringAlert from '../../components/common/EppExpiringAlert';
import DocumentExpirationAlert from '../../components/common/DocumentExpirationAlert';

// Accesos rápidos del home mobile: solo las 3 secciones de uso más frecuente, cada una
// condicionada al permiso de lectura correspondiente (mismo criterio que el menú del drawer).
const QUICK_ACCESS_ITEMS: (IconTileItem & { requiredPermission: string })[] = [
  { key: 'time-entries', label: 'Carga de Horas', path: '/dashboard/time-entries', icon: <ClockIcon />, requiredPermission: 'time_entries_read' },
  { key: 'employees', label: 'Empleados', path: '/dashboard/employees', icon: <BadgeIcon />, requiredPermission: 'employees_read' },
  { key: 'attendance', label: 'Presentismo', path: '/dashboard/attendance', icon: <EventAvailableIcon />, requiredPermission: 'attendance_read' },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const quickAccessItems = QUICK_ACCESS_ITEMS.filter((item) => userHasPermission(user, item.requiredPermission));
  // Antes no hacía falta chequear esto acá: todo rol real tenía casi todos los permisos. Con un
  // rol acotado (ej. "Seguridad e Higiene": employees_read + safety_equipment_read, sin nada de
  // Contabilidad) estos fetches sin gating 401eaban en cada carga de la portada.
  const canSeeSalaryAdvances = userHasPermission(user, 'salary_advances_read');
  const canSeeLoans = userHasPermission(user, 'loans_read');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [pendingAdvances, setPendingAdvances] = useState(0);
  const [advancesPendingPayment, setAdvancesPendingPayment] = useState(0);
  const [pendingLoans, setPendingLoans] = useState(0);
  const [loansPendingPayment, setLoansPendingPayment] = useState(0);
  const [loadingRequests, setLoadingRequests] = useState(true);

  const fetchPendingRequests = useCallback(async () => {
    if (!canSeeSalaryAdvances && !canSeeLoans) {
      setLoadingRequests(false);
      return;
    }
    try {
      setLoadingRequests(true);
      const [advances, advancesToPay, loans, loansToPay] = await Promise.all([
        canSeeSalaryAdvances ? SalaryAdvanceService.getAll({ status: 'pending' }) : Promise.resolve([]),
        canSeeSalaryAdvances ? SalaryAdvanceService.getAll({ status: 'approved', paid: false }) : Promise.resolve([]),
        canSeeLoans ? LoanService.getAll({ status: 'pending' }) : Promise.resolve([]),
        canSeeLoans ? LoanService.getAll({ status: 'approved' }) : Promise.resolve([]),
      ]);
      setPendingAdvances(advances.length);
      setAdvancesPendingPayment(advancesToPay.length);
      setPendingLoans(loans.length);
      setLoansPendingPayment(loansToPay.length);
    } catch {
      // Silencioso: no bloquea el resto del dashboard si falla.
    } finally {
      setLoadingRequests(false);
    }
  }, [canSeeSalaryAdvances, canSeeLoans]);

  useEffect(() => {
    fetchPendingRequests();
  }, [fetchPendingRequests]);

  return (
    <Box>
      <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />
      <FeedbackModal open={!!success} onClose={() => setSuccess('')} message={success} type="success" />

      {/* Contadores de todos los avisos — siempre visibles, incluso con todo marcado como visto
          (ver FLOWS.md §36). Debajo, cada aviso solo abre su tarjeta si tiene algo sin ver. */}
      <DashboardAlertSummaryBar />

      <QuoteRequestAlert />
      <DocumentExpirationAlert onError={setError} onSuccess={setSuccess} />
      <OcaBudgetAlert />
      <EppExpiringAlert />
      <RepairToolsAlert />
      <SalaryAdvanceDeletionAlert />

      {/* Accesos rápidos — prueba: solo mobile, en desktop ya está el menú del drawer siempre visible */}
      {quickAccessItems.length > 0 && (
        <Box sx={{ display: { xs: 'block', sm: 'none' }, mb: 3 }}>
          <IconTileGrid items={quickAccessItems} columns={{ xs: 3, sm: 3 }} />
        </Box>
      )}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>

        {/* Widget: Adelantos y Préstamos pendientes. Es puro contador, sin detalle por item, así
            que no entra en el mecanismo de acuse de vista: no hay nada que ocupe pantalla de más. */}
        {(canSeeSalaryAdvances || canSeeLoans) && (
        <Paper
          sx={{
            flex: '1 1 300px',
            p: 3,
            borderRadius: 2,
            transition: 'transform 0.25s ease, box-shadow 0.25s ease',
            '&:hover': {
              transform: 'translateY(-6px)',
              boxShadow: '0 16px 40px rgba(0,0,0,0.14)',
            },
          }}
        >
          <Box display="flex" alignItems="center" gap={1} mb={3}>
            <RequestQuoteIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Solicitudes Pendientes
            </Typography>
          </Box>

          {loadingRequests ? (
            <Box display="flex" justifyContent="center" py={2}><GearSpinner size={28} /></Box>
          ) : (
            <Stack spacing={2.5}>
              {canSeeSalaryAdvances && (
                <Box onClick={() => router.push('/dashboard/salary-advances')} sx={{ cursor: 'pointer', p: 1.5, borderRadius: 2, '&:hover': { bgcolor: 'grey.50' } }}>
                  <Typography fontWeight="bold" mb={0.75}>Adelantos</Typography>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Typography variant="body2" color="text.secondary">Pend. de aprobación</Typography>
                    <Chip label={pendingAdvances} color={pendingAdvances > 0 ? 'warning' : 'success'} size="small" />
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">Pend. de pago</Typography>
                    <Chip label={advancesPendingPayment} color={advancesPendingPayment > 0 ? 'info' : 'success'} size="small" />
                  </Box>
                </Box>
              )}
              {canSeeLoans && (
                <Box onClick={() => router.push('/dashboard/loans')} sx={{ cursor: 'pointer', p: 1.5, borderRadius: 2, '&:hover': { bgcolor: 'grey.50' } }}>
                  <Typography fontWeight="bold" mb={0.75}>Préstamos</Typography>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Typography variant="body2" color="text.secondary">Pend. de aprobación</Typography>
                    <Chip label={pendingLoans} color={pendingLoans > 0 ? 'warning' : 'success'} size="small" />
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">Pend. de pago</Typography>
                    <Chip label={loansPendingPayment} color={loansPendingPayment > 0 ? 'info' : 'success'} size="small" />
                  </Box>
                </Box>
              )}
            </Stack>
          )}
        </Paper>
        )}

        {/* Oculto en mobile: redundante con la grilla de accesos rápidos de arriba */}
        <Paper
          sx={{
            display: { xs: 'none', sm: 'block' },
            flex: '1 1 300px',
            p: 3,
            borderRadius: 2,
            transition: 'transform 0.25s ease, box-shadow 0.25s ease',
            '&:hover': {
              transform: 'translateY(-6px)',
              boxShadow: '0 16px 40px rgba(0,0,0,0.14)',
            },
          }}
        >
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
            Accesos Rápidos
          </Typography>
          <Stack spacing={2}>
            <Button variant="outlined" startIcon={<ClockIcon />} onClick={() => router.push('/dashboard/time-entries')}>
              Carga de Horas
            </Button>
            <Button variant="outlined" startIcon={<AssignmentIcon />} onClick={() => router.push('/dashboard/employees')}>
              Gestión de Personal
            </Button>
            <Button variant="outlined" startIcon={<AssignmentIcon />} onClick={() => router.push('/dashboard/attendance')}>
              Presentismo
            </Button>
          </Stack>
        </Paper>

      </Box>
    </Box>
  );
}
