'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Chip, Typography } from '@mui/material';
import { EventOutlined as InterviewIcon } from '@mui/icons-material';
import { CandidateInterviewService, UpcomingInterview } from '../../utils/api';
import { useAuth, userHasPermission } from '../../utils/auth';
import { INTERVIEW_MODALITY_LABELS, formatInterviewWhen, fullName } from '../../utils/candidates';
import DashboardAlertCard, { DashboardAlertItem } from './DashboardAlertCard';
import { useRegisterAlertSummary } from './AlertViewsProvider';
import { ALERT_SHORT_LABEL } from '../../utils/alerts';

// "Hoy" en la hora local del navegador, que es la de Argentina para quienes usan el sistema.
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

// Aviso "Entrevistas de hoy y mañana" (ver FLOWS.md §61): las entrevistas agendadas donde el usuario es
// entrevistador. A diferencia de Consultas web y Postulaciones nuevas, es PERSONAL: no es del equipo.
// Incluye las de hoy que ya pasaron y siguen sin resultado — son las que hay que cerrar.
//
// El item es la entrevista y la revisión incluye la fecha: si se reprograma, reaparece aunque se hubiera
// marcado como vista. Desaparece sola al cargar el resultado, cancelarla o marcar que no vino.
export default function EntrevistasProximasAlert() {
  const router = useRouter();
  const { user } = useAuth();
  const hasAccess = userHasPermission(user, 'candidates_read');

  const [interviews, setInterviews] = useState<UpcomingInterview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasAccess) {
      setLoading(false);
      return;
    }
    CandidateInterviewService.getUpcoming()
      .then(setInterviews)
      .catch(() => setInterviews([]))
      .finally(() => setLoading(false));
  }, [hasAccess]);

  const items: DashboardAlertItem[] = useMemo(() => {
    const now = new Date();
    return interviews.map((i) => {
      const when = new Date(i.scheduled_at);
      const isToday = sameDay(when, now);
      const pastDue = when.getTime() < now.getTime();
      return {
        entity_id: i.id,
        revision: `${i.status}|${i.scheduled_at}`,
        content: (
          <Box onClick={() => router.push(`/dashboard/candidates/${i.application.candidate.id}`)} sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}>
            <Box display="flex" alignItems="center" flexWrap="wrap" gap={1}>
              <Typography variant="body2" fontWeight={600}>{fullName(i.application.candidate)}</Typography>
              <Chip size="small" color={pastDue ? 'warning' : isToday ? 'info' : 'default'} label={pastDue ? 'Sin resultado' : isToday ? 'Hoy' : 'Mañana'} />
            </Box>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ textTransform: 'capitalize' }}>
              {formatInterviewWhen(i.scheduled_at)} hs · {INTERVIEW_MODALITY_LABELS[i.modality]}{i.location ? ` · ${i.location}` : ''}
            </Typography>
          </Box>
        ),
      };
    });
  }, [interviews, router]);

  const ready = hasAccess && !loading;
  useRegisterAlertSummary(
    ready
      ? { type: 'candidate_interview', label: ALERT_SHORT_LABEL.candidate_interview, total: interviews.length, href: '/dashboard/candidates', color: 'warning' }
      : null
  );

  if (!ready) return null;

  return (
    <DashboardAlertCard
      type="candidate_interview"
      title="Entrevistas de hoy y mañana"
      icon={<InterviewIcon />}
      color="warning"
      items={items}
      footer={
        <Button variant="contained" size="small" onClick={() => router.push('/dashboard/candidates')}>
          Ver postulantes
        </Button>
      }
    />
  );
}
