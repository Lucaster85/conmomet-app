'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Chip, Typography } from '@mui/material';
import { ForumOutlined as InquiryIcon } from '@mui/icons-material';
import { ContactInquiry, ContactInquiryService } from '../../utils/api';
import { useAuth, userHasPermission } from '../../utils/auth';
import { CONTACT_REASON_LABELS } from '../../utils/contactInquiries';
import DashboardAlertCard, { DashboardAlertItem } from './DashboardAlertCard';
import { useRegisterAlertSummary } from './AlertViewsProvider';
import { ALERT_SHORT_LABEL } from '../../utils/alerts';

const DAY_MS = 24 * 60 * 60 * 1000;

const receivedAgo = (createdAt: string) => {
  const days = Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / DAY_MS));
  if (days === 0) return 'recibida hoy';
  return `recibida hace ${days} ${days === 1 ? 'día' : 'días'}`;
};

// Aviso "Consultas web" (ver FLOWS.md §58): lo que escribió un visitante en el formulario de
// contacto de la landing y todavía nadie tomó. Es del equipo, no personal: lo ve cualquiera con
// contact_inquiries_read, y desaparece solo cuando la consulta pasa a "en curso" o "cerrada".
//
// La revisión es el estado. Como el aviso solo lista las `new`, en la práctica nunca cambia con la
// consulta en pantalla — el "visto" sirve para esconderla de ESTE usuario sin tomarla.
export default function ContactInquiryAlert() {
  const router = useRouter();
  const { user } = useAuth();
  const hasAccess = userHasPermission(user, 'contact_inquiries_read');

  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasAccess) {
      setLoading(false);
      return;
    }
    ContactInquiryService.getAll({ status: 'new' })
      // Las más viejas primero: son las que llevan más tiempo esperando respuesta.
      .then((list) => setInquiries([...list].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())))
      .catch(() => setInquiries([]))
      .finally(() => setLoading(false));
  }, [hasAccess]);

  const items: DashboardAlertItem[] = useMemo(
    () =>
      inquiries.map((i) => ({
        entity_id: i.id,
        revision: i.status,
        content: (
          <Box onClick={() => router.push(`/dashboard/contact-inquiries?view=${i.id}`)} sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}>
            <Box display="flex" alignItems="center" flexWrap="wrap" gap={1}>
              <Typography variant="body2" fontWeight={600}>{i.name}</Typography>
              <Chip size="small" variant="outlined" label={CONTACT_REASON_LABELS[i.reason]} />
            </Box>
            <Typography variant="caption" color="text.secondary" display="block">
              {i.company ? `${i.company} · ` : ''}{receivedAgo(i.createdAt)}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>{i.message}</Typography>
          </Box>
        ),
      })),
    [inquiries, router]
  );

  const ready = hasAccess && !loading;
  useRegisterAlertSummary(
    ready
      ? { type: 'contact_inquiry', label: ALERT_SHORT_LABEL.contact_inquiry, total: inquiries.length, href: '/dashboard/contact-inquiries', color: 'info' }
      : null
  );

  if (!ready) return null;

  return (
    <DashboardAlertCard
      type="contact_inquiry"
      title="Consultas web sin atender"
      icon={<InquiryIcon />}
      color="info"
      items={items}
      footer={
        <Button variant="contained" size="small" onClick={() => router.push('/dashboard/contact-inquiries')}>
          Ver consultas
        </Button>
      }
    />
  );
}
