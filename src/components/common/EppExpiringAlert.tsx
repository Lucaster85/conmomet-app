'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Paper, Typography, Chip, Stack } from '@mui/material';
import { SecurityOutlined as EppIcon } from '@mui/icons-material';
import { SafetyEquipment, SafetyEquipmentService } from '../../utils/api';
import { useAuth, userHasPermission } from '../../utils/auth';
import { eppExpirationLabel } from '../../utils/epp';

// Aviso simple (mismo criterio que RepairToolsAlert: sin infraestructura de notificaciones) con
// el EPP vencido o por vencer de todos los empleados. Permiso separado de `safety_equipment_read`
// a propósito: varios perfiles van a tener acceso al módulo de EPP, pero este aviso en el inicio
// solo debe verlo quien gestiona personal (mismo criterio que
// `salary_advance_deletion_alerts_read`).
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

  if (!hasAccess || loading || deliveries.length === 0) return null;

  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: 2,
        mb: 3,
        borderLeft: '4px solid',
        borderLeftColor: 'warning.main',
      }}
    >
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <EppIcon color="warning" />
        <Typography variant="h6" fontWeight="bold">EPP vencido o por vencer</Typography>
        <Chip label={deliveries.length} color="warning" size="small" />
      </Box>
      <Stack spacing={1}>
        {deliveries.map((d) => (
          <Box
            key={d.id}
            onClick={() => router.push(`/dashboard/safety-equipment?employee_id=${d.employee_id}`)}
            sx={{
              p: 1.5,
              borderRadius: 2,
              cursor: 'pointer',
              '&:hover': { bgcolor: 'grey.50' },
            }}
          >
            <Typography fontWeight={600}>{d.employee?.lastname}, {d.employee?.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {d.eppItem?.name}{d.expiration_date ? ` · ${eppExpirationLabel(d.expiration_date)}` : ''}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}
