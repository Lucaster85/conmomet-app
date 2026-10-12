'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography } from '@mui/material';
import { SecurityOutlined as EppIcon } from '@mui/icons-material';
import { SafetyEquipment, SafetyEquipmentService } from '../../utils/api';
import { useAuth, userHasPermission } from '../../utils/auth';
import { eppExpirationLabel } from '../../utils/epp';
import DashboardAlertCard, { DashboardAlertItem } from './DashboardAlertCard';
import { useRegisterAlertSummary } from './AlertViewsProvider';
import { ALERT_SHORT_LABEL } from '../../utils/alerts';

// Aviso con el EPP vencido o por vencer de todos los empleados, con acuse de vista (ver FLOWS.md
// §36). Permiso separado de `safety_equipment_read` a propósito: varios perfiles van a tener
// acceso al módulo de EPP, pero este aviso en el inicio solo debe verlo quien gestiona personal
// (mismo criterio que `salary_advance_deletion_alerts_read`).
export default function EppExpiringAlert() {
  const router = useRouter();
  const { user } = useAuth();
  const hasAccess = userHasPermission(user, 'safety_equipment_alerts_read');

  const [deliveries, setDeliveries] = useState<SafetyEquipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasAccess) {
      setLoading(false);
      return;
    }
    SafetyEquipmentService.getAll({ status: 'alert' })
      .then(setDeliveries)
      .catch(() => setDeliveries([]))
      .finally(() => setLoading(false));
  }, [hasAccess]);

  const items: DashboardAlertItem[] = useMemo(
    () =>
      deliveries.map((d) => ({
        entity_id: d.id,
        // Reaparece si pasó de "por vencer" a "vencido", o si se corrió la fecha de vencimiento.
        revision: `${d.computed_status ?? ''}|${d.expiration_date ?? ''}`,
        content: (
          <Box
            onClick={() => router.push(`/dashboard/safety-equipment?employee_id=${d.employee_id}`)}
            sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
          >
            <Typography fontWeight={600}>{d.employee?.lastname}, {d.employee?.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {d.eppItem?.name}{d.expiration_date ? ` · ${eppExpirationLabel(d.expiration_date)}` : ''}
            </Typography>
          </Box>
        ),
      })),
    [deliveries, router]
  );

  const ready = hasAccess && !loading;
  useRegisterAlertSummary(
    ready
      ? {
          type: 'safety_equipment',
          label: ALERT_SHORT_LABEL.safety_equipment,
          total: deliveries.length,
          href: '/dashboard/safety-equipment',
          color: 'warning',
        }
      : null
  );

  if (!ready) return null;

  return (
    <DashboardAlertCard
      type="safety_equipment"
      title="EPP vencido o por vencer"
      icon={<EppIcon />}
      color="warning"
      items={items}
    />
  );
}
