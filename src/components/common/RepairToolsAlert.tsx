'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Paper, Typography, Chip, Stack } from '@mui/material';
import { BuildOutlined as RepairIcon } from '@mui/icons-material';
import { SelfService, Tool } from '../../utils/api';
import { useAuth } from '../../utils/auth';

// Aviso simple (sin infraestructura de notificaciones — no hay precedente de eso en el repo) para
// el empleado responsable de una reparación: se muestra en el home de dashboard y de portal, ya
// que según el rol algunos usuarios solo entran a uno de los dos.
export default function RepairToolsAlert() {
  const router = useRouter();
  const { user } = useAuth();
  const employeeId = (user as unknown as Record<string, unknown>)?.employee_id;
  const permissions: string[] = Array.isArray((user as unknown as Record<string, unknown>)?.permissions)
    ? ((user as unknown as Record<string, unknown>).permissions as string[])
    : [];
  const hasToolsAccess = permissions.includes('admin_granted') || permissions.includes('tools_read');

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

  if (!employeeId || loading || tools.length === 0) return null;

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
        <RepairIcon color="warning" />
        <Typography variant="h6" fontWeight="bold">Herramientas en reparación asignadas a vos</Typography>
        <Chip label={tools.length} color="warning" size="small" />
      </Box>
      <Stack spacing={1}>
        {tools.map((tool) => (
          <Box
            key={tool.id}
            onClick={hasToolsAccess ? () => router.push(`/dashboard/tools/${tool.id}`) : undefined}
            sx={{
              p: 1.5,
              borderRadius: 2,
              cursor: hasToolsAccess ? 'pointer' : 'default',
              '&:hover': hasToolsAccess ? { bgcolor: 'grey.50' } : undefined,
            }}
          >
            <Typography fontWeight={600}>{tool.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              Código: {tool.reference_code}{tool.toolType?.name ? ` · ${tool.toolType.name}` : ''}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}
