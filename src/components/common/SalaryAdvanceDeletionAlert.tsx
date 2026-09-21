'use client';
import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Stack, IconButton } from '@mui/material';
import { WarningAmberOutlined as WarningIcon, CloseOutlined as CloseIcon } from '@mui/icons-material';
import { SalaryAdvanceDeletionAlertService, SalaryAdvanceDeletionAlert } from '../../utils/api';
import { useAuth } from '../../utils/auth';

const formatCurrency = (v: number) => `$${Number(v).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
const PAYMENT_METHOD_LABEL: Record<string, string> = { efectivo: 'Efectivo', transferencia: 'Transferencia' };

// Aviso simple (sin infraestructura de notificaciones genérica en el repo) para avisar a Socios
// Gerentes cuando se anula un adelanto que ya estaba pagado. A diferencia de RepairToolsAlert,
// este sí es descartable por usuario (se guarda en dismissed_by en el backend).
export default function SalaryAdvanceDeletionAlertWidget() {
  const { user } = useAuth();
  const permissions: string[] = Array.isArray((user as unknown as Record<string, unknown>)?.permissions)
    ? ((user as unknown as Record<string, unknown>).permissions as string[])
    : [];
  const hasAccess = permissions.includes('admin_granted') || permissions.includes('salary_advance_deletion_alerts_read');

  const [alerts, setAlerts] = useState<SalaryAdvanceDeletionAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasAccess) {
      setLoading(false);
      return;
    }
    SalaryAdvanceDeletionAlertService.getAll()
      .then(setAlerts)
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  }, [hasAccess]);

  const handleDismiss = async (id: number) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    try {
      await SalaryAdvanceDeletionAlertService.dismiss(id);
    } catch {
      // Si falla el dismiss en el server, el aviso vuelve a aparecer en la próxima carga.
    }
  };

  if (!hasAccess || loading || alerts.length === 0) return null;

  const formatPeriod = (p?: SalaryAdvanceDeletionAlert['payPeriod']) =>
    p ? `${p.type === 'first_half' ? '1ra' : '2da'} quincena ${p.month}/${p.year}` : 'sin quincena asignada';

  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: 2,
        mb: 3,
        borderLeft: '4px solid',
        borderLeftColor: 'error.main',
      }}
    >
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <WarningIcon color="error" />
        <Typography variant="h6" fontWeight="bold">Adelantos pagados anulados</Typography>
      </Box>
      <Stack spacing={1}>
        {alerts.map((a) => (
          <Box
            key={a.id}
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: 'grey.50',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 1,
            }}
          >
            <Box>
              <Typography variant="body2">
                Adelanto de <strong>{a.employee ? `${a.employee.lastname}, ${a.employee.name}` : `empleado #${a.employee_id}`}</strong> por{' '}
                <strong>{formatCurrency(a.amount)}</strong>
                {a.payment_method ? ` (${PAYMENT_METHOD_LABEL[a.payment_method] || a.payment_method})` : ''}, {formatPeriod(a.payPeriod)}.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Motivo: &quot;{a.justification}&quot;
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Anulado por {a.deletedBy ? `${a.deletedBy.name} ${a.deletedBy.lastname}` : 'usuario desconocido'} el {new Date(a.created_at).toLocaleDateString('es-AR')}
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => handleDismiss(a.id)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}
