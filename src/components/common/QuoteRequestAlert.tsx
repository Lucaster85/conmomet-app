'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Paper, Typography, Chip, Button, Stack } from '@mui/material';
import { RequestQuoteOutlined as QuoteIcon } from '@mui/icons-material';
import { QuoteRequestService, QuoteRequest } from '../../utils/api';
import { useAuth, userHasPermission } from '../../utils/auth';

// Aviso simple (sin infraestructura de notificaciones push, ver PLAN del módulo) para quien
// tiene un Pedido de Cotización asignado — cubre los dos lados del ping-pong responsable ↔
// gerencia, porque la misma persona puede estar en los dos grupos a la vez: armando un PC
// (pending/in_progress) y validando otro que le devolvieron (pending_review). Mismo patrón que
// OcaBudgetAlert.tsx — autocontenido, no bloquea nada, se oculta solo si no hay nada que avisar.
function daysUntil(dueDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((new Date(dueDate + 'T00:00:00').getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default function QuoteRequestAlert() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id;
  const hasAccess = userHasPermission(user, 'quote_requests_read');

  const [toBuild, setToBuild] = useState<QuoteRequest[]>([]);
  const [toValidate, setToValidate] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !hasAccess) {
      setLoading(false);
      return;
    }
    QuoteRequestService.getAll({ assigned_to_me: true })
      .then((quoteRequests) => {
        setToBuild(quoteRequests.filter((q) => q.status === 'pending' || q.status === 'in_progress'));
        setToValidate(quoteRequests.filter((q) => q.status === 'pending_review'));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [userId, hasAccess]);

  const total = toBuild.length + toValidate.length;

  if (!userId || !hasAccess || loading || total === 0) return null;

  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: 2,
        mb: 3,
        borderLeft: '4px solid',
        borderLeftColor: 'info.main',
      }}
    >
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <QuoteIcon color="info" />
        <Typography variant="h6" fontWeight="bold">Pedidos de Cotización</Typography>
        <Chip label={total} color="info" size="small" />
      </Box>
      <Stack spacing={2}>
        {toBuild.length > 0 && (
          <Box>
            <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
              Pedidos de cotización asignados a vos ({toBuild.length})
            </Typography>
            <Stack spacing={0.5}>
              {toBuild.map((qr) => {
                const days = daysUntil(qr.due_date);
                return (
                  <Box key={qr.id}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                      <Typography variant="body2">{qr.number} — {qr.title}</Typography>
                      <Chip
                        size="small"
                        label={days < 0 ? `Vencido hace ${Math.abs(days)} día(s)` : days === 0 ? 'Vence hoy' : `Vence en ${days} días`}
                        color={days <= 2 ? 'error' : days <= 7 ? 'warning' : 'default'}
                      />
                    </Box>
                    {qr.last_comment && (
                      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        &quot;{qr.last_comment.comment}&quot; — {qr.last_comment.from.name} {qr.last_comment.from.lastname}
                      </Typography>
                    )}
                  </Box>
                );
              })}
            </Stack>
            <Button
              variant="contained"
              size="small"
              sx={{ mt: 1 }}
              onClick={() => router.push('/dashboard/quote-requests')}
            >
              Ver pedidos pendientes
            </Button>
          </Box>
        )}
        {toValidate.length > 0 && (
          <Box>
            <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
              Presupuestos esperando tu validación ({toValidate.length})
            </Typography>
            <Stack spacing={0.5}>
              {toValidate.map((qr) => (
                <Box key={qr.id}>
                  <Typography variant="body2">{qr.number} — {qr.title}</Typography>
                  {qr.last_comment && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      &quot;{qr.last_comment.comment}&quot; — {qr.last_comment.from.name} {qr.last_comment.from.lastname}
                    </Typography>
                  )}
                </Box>
              ))}
            </Stack>
            <Button
              variant="contained"
              size="small"
              sx={{ mt: 1 }}
              onClick={() => router.push('/dashboard/quote-requests')}
            >
              Ver pedidos a validar
            </Button>
          </Box>
        )}
      </Stack>
    </Paper>
  );
}
