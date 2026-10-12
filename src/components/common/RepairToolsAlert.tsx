'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography } from '@mui/material';
import { BuildOutlined as RepairIcon } from '@mui/icons-material';
import { SelfService, Tool } from '../../utils/api';
import { useAuth, userHasPermission } from '../../utils/auth';
import DashboardAlertCard, { DashboardAlertItem } from './DashboardAlertCard';
import { useRegisterAlertSummary } from './AlertViewsProvider';
import { ALERT_SHORT_LABEL } from '../../utils/alerts';

// Aviso para el empleado responsable de una reparación, con acuse de vista (ver FLOWS.md §36). Se
// muestra en el home de dashboard y de portal, ya que según el rol algunos usuarios solo entran a
// uno de los dos — en el portal no hay provider de vistas montado y la tarjeta degrada a mostrar
// todo, que es el comportamiento que tenía antes de este flujo.
export default function RepairToolsAlert() {
  const router = useRouter();
  const { user } = useAuth();
  const employeeId = (user as unknown as Record<string, unknown>)?.employee_id;
  const hasToolsAccess = userHasPermission(user, 'tools_read');

  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!employeeId) {
      setLoading(false);
      return;
    }
    SelfService.getMyToolsInRepair()
      .then(setTools)
      .catch(() => setTools([]))
      .finally(() => setLoading(false));
  }, [employeeId]);

  const items: DashboardAlertItem[] = useMemo(
    () =>
      tools.map((tool) => ({
        entity_id: tool.id,
        // Reaparece si la herramienta cambió de estado (volvió de reparación y se re-envió).
        revision: `${tool.status}`,
        content: (
          <Box
            onClick={hasToolsAccess ? () => router.push(`/dashboard/tools/${tool.id}`) : undefined}
            sx={{
              cursor: hasToolsAccess ? 'pointer' : 'default',
              '&:hover': hasToolsAccess ? { opacity: 0.8 } : undefined,
            }}
          >
            <Typography fontWeight={600}>{tool.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              Código: {tool.reference_code}{tool.toolType?.name ? ` · ${tool.toolType.name}` : ''}
            </Typography>
          </Box>
        ),
      })),
    [tools, hasToolsAccess, router]
  );

  const ready = !!employeeId && !loading;
  useRegisterAlertSummary(
    ready
      ? {
          type: 'tool_in_repair',
          label: ALERT_SHORT_LABEL.tool_in_repair,
          total: tools.length,
          href: '/dashboard/tools',
          color: 'warning',
        }
      : null
  );

  if (!ready) return null;

  return (
    <DashboardAlertCard
      type="tool_in_repair"
      title="Herramientas en reparación asignadas a vos"
      icon={<RepairIcon />}
      color="warning"
      items={items}
    />
  );
}
