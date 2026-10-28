'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, Chip, Button } from '@mui/material';
import { RequestQuoteOutlined as QuoteIcon } from '@mui/icons-material';
import { QuoteRequestService, QuoteRequest } from '../../utils/api';
import { useAuth, userHasPermission } from '../../utils/auth';
import DashboardAlertCard, { DashboardAlertItem } from './DashboardAlertCard';
import { useRegisterAlertSummary } from './AlertViewsProvider';
import { ALERT_SHORT_LABEL } from '../../utils/alerts';

// Aviso de los Pedidos de Cotización propios, con acuse de vista (ver FLOWS.md §36) — cubre los
// dos lados del ping-pong responsable ↔ gerencia, porque la misma persona puede estar en los dos
// grupos a la vez: armando un PC (pending/in_progress) y validando otro que le devolvieron
// (pending_review).
//
// Los dos grupos van en UNA sola tarjeta, cada item con un chip que dice de qué lado está, en vez
// de dos bloques con su propio botón como antes: con 10 PC la pantalla se volvía enorme, y
// compactar es el punto de este flujo. El orden pone primero lo que espera validación, que es lo
// que bloquea a otra persona.
function daysUntil(dueDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((new Date(dueDate + 'T00:00:00').getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// Revisión del item: reaparece si le cambió el estado o si hay un comentario nuevo dirigido a él.
// `last_comment.at` (el changed_at del log) y no `updated_at` del PC a propósito — updated_at
// cambia también al editar el título, y eso haría reaparecer items por ruido.
const revisionOf = (q: QuoteRequest) => `${q.status}|${q.last_comment?.at ?? ''}`;

export default function QuoteRequestAlert() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = (user as unknown as Record<string, unknown>)?.id as number | undefined;
  const hasAccess = userHasPermission(user, 'quote_requests_read');

  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !hasAccess) {
      setLoading(false);
      return;
    }
    QuoteRequestService.getAll({ assigned_to_me: true })
      .then((all) => {
        setQuoteRequests(
          all.filter((q) => q.status === 'pending' || q.status === 'in_progress' || q.status === 'pending_review')
        );
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [userId, hasAccess]);

  const items: DashboardAlertItem[] = useMemo(() => {
    const ordered = [...quoteRequests].sort((a, b) => {
      const weight = (q: QuoteRequest) => (q.status === 'pending_review' ? 0 : 1);
      return weight(a) - weight(b);
    });
    return ordered.map((qr) => {
      const toValidate = qr.status === 'pending_review';
      const days = daysUntil(qr.due_date);
      return {
        entity_id: qr.id,
        revision: revisionOf(qr),
        content: (
          // Clickeable: cae directo en el detalle, en modo lectura (ver FLOWS.md flujo 27g). El
          // ojo de "Marcar como visto" vive afuera de este `content`, en el shell de
          // DashboardAlertCard, así que no hay conflicto de clicks.
          <Box
            role="button"
            tabIndex={0}
            onClick={() => router.push(`/dashboard/quote-requests?view=${qr.id}`)}
            onKeyDown={(e) => { if (e.key === 'Enter') router.push(`/dashboard/quote-requests?view=${qr.id}`); }}
            sx={{ cursor: 'pointer', borderRadius: 1, p: 0.5, '&:hover': { bgcolor: 'action.hover' } }}
          >
            <Box display="flex" alignItems="center" flexWrap="wrap" gap={1}>
              <Typography variant="body2">{qr.number} — {qr.title}</Typography>
              <Chip
                size="small"
                variant="outlined"
                label={toValidate ? 'Esperando tu validación' : 'Asignado a vos'}
              />
              {!toValidate && (
                <Chip
                  size="small"
                  label={days < 0 ? `Vencido hace ${Math.abs(days)} día(s)` : days === 0 ? 'Vence hoy' : `Vence en ${days} días`}
                  color={days <= 2 ? 'error' : days <= 7 ? 'warning' : 'default'}
                />
              )}
            </Box>
            {qr.last_comment && (
              <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                &quot;{qr.last_comment.comment}&quot; — {qr.last_comment.from.name} {qr.last_comment.from.lastname}
              </Typography>
            )}
          </Box>
        ),
      };
    });
  }, [quoteRequests, router]);

  const ready = !!userId && hasAccess && !loading;
  useRegisterAlertSummary(
    ready
      ? {
          type: 'quote_request',
          label: ALERT_SHORT_LABEL.quote_request,
          total: quoteRequests.length,
          href: '/dashboard/quote-requests',
          color: 'info',
        }
      : null
  );

  if (!ready) return null;

  return (
    <DashboardAlertCard
      type="quote_request"
      title="Pedidos de Cotización"
      icon={<QuoteIcon />}
      color="info"
      items={items}
      footer={
        <Button variant="contained" size="small" onClick={() => router.push('/dashboard/quote-requests')}>
          Ver pedidos de cotización
        </Button>
      }
    />
  );
}
