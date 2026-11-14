'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Chip, Typography } from '@mui/material';
import { PersonSearchOutlined as CandidateIcon } from '@mui/icons-material';
import { Candidate, CandidateApplication, CandidateService } from '../../utils/api';
import { useAuth, userHasPermission } from '../../utils/auth';
import { CANDIDATE_SOURCE_LABELS, fullName } from '../../utils/candidates';
import DashboardAlertCard, { DashboardAlertItem } from './DashboardAlertCard';
import { useRegisterAlertSummary } from './AlertViewsProvider';
import { ALERT_SHORT_LABEL } from '../../utils/alerts';

const DAY_MS = 24 * 60 * 60 * 1000;

const receivedAgo = (iso: string) => {
  const days = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / DAY_MS));
  if (days === 0) return 'recibida hoy';
  return `recibida hace ${days} ${days === 1 ? 'día' : 'días'}`;
};

interface NewApplication {
  candidate: Candidate;
  application: CandidateApplication;
}

// Aviso "Postulaciones nuevas" (ver FLOWS.md §60): postulaciones que todavía nadie miró (etapa
// "Nueva"), vengan de la web o cargadas a mano. Es del equipo: lo ve cualquiera con candidates_read.
// Desaparece solo cuando la postulación pasa a otra etapa.
//
// El item es la POSTULACIÓN, no la persona (la misma persona puede tener una vieja cerrada y una nueva),
// y la revisión es la etapa — igual que el aviso de Consultas web.
export default function PostulacionesNuevasAlert() {
  const router = useRouter();
  const { user } = useAuth();
  const hasAccess = userHasPermission(user, 'candidates_read');

  const [pending, setPending] = useState<NewApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasAccess) {
      setLoading(false);
      return;
    }
    // stage=new trae a las personas con alguna postulación nueva; después se queda con esas postulaciones.
    CandidateService.getAll({ stage: 'new' })
      .then((candidates) => {
        const list: NewApplication[] = [];
        candidates.forEach((candidate) =>
          (candidate.applications || []).filter((a) => a.stage === 'new').forEach((application) => list.push({ candidate, application }))
        );
        // Las más viejas primero: son las que llevan más tiempo esperando.
        list.sort((a, b) => new Date(a.application.applied_at).getTime() - new Date(b.application.applied_at).getTime());
        setPending(list);
      })
      .catch(() => setPending([]))
      .finally(() => setLoading(false));
  }, [hasAccess]);

  const items: DashboardAlertItem[] = useMemo(
    () =>
      pending.map(({ candidate, application }) => ({
        entity_id: application.id,
        revision: application.stage,
        content: (
          <Box onClick={() => router.push(`/dashboard/candidates/${candidate.id}`)} sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}>
            <Box display="flex" alignItems="center" flexWrap="wrap" gap={1}>
              <Typography variant="body2" fontWeight={600}>{fullName(candidate)}</Typography>
              <Chip size="small" variant="outlined" label={CANDIDATE_SOURCE_LABELS[application.source]} />
            </Box>
            <Typography variant="caption" color="text.secondary" display="block">
              {application.position_of_interest || candidate.trade || 'Postulación espontánea'} · {receivedAgo(application.applied_at)}
            </Typography>
          </Box>
        ),
      })),
    [pending, router]
  );

  const ready = hasAccess && !loading;
  useRegisterAlertSummary(
    ready
      ? { type: 'candidate_application', label: ALERT_SHORT_LABEL.candidate_application, total: pending.length, href: '/dashboard/candidates', color: 'info' }
      : null
  );

  if (!ready) return null;

  return (
    <DashboardAlertCard
      type="candidate_application"
      title="Postulaciones nuevas"
      icon={<CandidateIcon />}
      color="info"
      items={items}
      footer={
        <Button variant="contained" size="small" onClick={() => router.push('/dashboard/candidates')}>
          Ver postulantes
        </Button>
      }
    />
  );
}
