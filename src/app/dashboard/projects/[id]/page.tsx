'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box, Typography, Paper, Tabs, Tab, CircularProgress, Chip, LinearProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button,
  Grid, Divider, Stack,
} from '@mui/material';
import { ArrowBack as BackIcon, Add as AddIcon } from '@mui/icons-material';
import { useAuth } from '../../../../utils/auth';
import { Project, ProjectService, TimeEntry, TimeEntryService, BudgetCurrency } from '../../../../utils/api';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador', active: 'Activo', paused: 'Pausado', completed: 'Completado', cancelled: 'Cancelado',
};

function formatMoney(value: number, currency: BudgetCurrency) {
  const symbol = currency === 'USD' ? 'US$' : '$';
  return `${symbol}${value.toLocaleString('es-AR', { maximumFractionDigits: 2 })}`;
}

function formatTotals(totals?: Record<BudgetCurrency, number>) {
  if (!totals) return '—';
  const parts: string[] = [];
  if (totals.ARS) parts.push(formatMoney(totals.ARS, 'ARS'));
  if (totals.USD) parts.push(formatMoney(totals.USD, 'USD'));
  return parts.length > 0 ? parts.join(' + ') : formatMoney(0, 'ARS');
}

function renderProgress(consumed: number, budgeted: number) {
  if (!budgeted || budgeted <= 0) return <Typography variant="body2">{consumed.toFixed(1)} hs</Typography>;
  const percentage = Math.min((consumed / budgeted) * 100, 100);
  const isOverBudget = consumed > budgeted;
  return (
    <Box sx={{ width: '100%', maxWidth: 320 }}>
      <Box display="flex" justifyContent="space-between" mb={0.5}>
        <Typography variant="caption" fontWeight="bold" color={isOverBudget ? 'error.main' : 'text.primary'}>{consumed.toFixed(1)} hs</Typography>
        <Typography variant="caption" color="text.secondary">/ {budgeted} hs ({Math.round((consumed / budgeted) * 100)}%)</Typography>
      </Box>
      <LinearProgress variant="determinate" value={percentage} color={isOverBudget ? 'error' : (percentage > 80 ? 'warning' : 'success')} sx={{ height: 6, borderRadius: 3 }} />
    </Box>
  );
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = Number(params.id);
  const { user } = useAuth();
  const permissions: string[] = Array.isArray((user as unknown as Record<string, unknown>)?.permissions)
    ? ((user as unknown as Record<string, unknown>).permissions as string[])
    : [];
  const hasBudgetsRead = permissions.includes('admin_granted') || permissions.includes('budgets_read');
  const hasPricesRead = permissions.includes('admin_granted') || permissions.includes('budget_prices_read');

  const [project, setProject] = useState<Project | null>(null);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [includeChildrenHours, setIncludeChildrenHours] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const proj = await ProjectService.getById(projectId);
      setProject(proj);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (tab !== 2 || !project) return;
    const childIds = (project.subprojects || []).map(sp => sp.id);
    const idsToLoad = includeChildrenHours ? [project.id, ...childIds] : [project.id];
    Promise.all(idsToLoad.map(id => TimeEntryService.getAll({ project_id: id })))
      .then(results => setEntries(results.flat()));
  }, [tab, project, includeChildrenHours]);

  if (loading || !project) {
    return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;
  }

  const tabs = [
    { label: 'Resumen' },
    { label: `Adicionales (${project.subproject_count ?? project.subprojects?.length ?? 0})` },
    { label: 'Horas' },
    ...(hasBudgetsRead ? [{ label: 'Presupuesto' }] : []),
  ];

  return (
    <Box>
      <Button startIcon={<BackIcon />} onClick={() => router.push('/dashboard/projects')} sx={{ mb: 2 }}>Volver a Proyectos</Button>

      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2} flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h4" fontWeight="bold">[{project.code}] {project.name}</Typography>
          <Typography variant="body2" color="text.secondary">{project.client?.razonSocial}{project.plant ? ` · ${project.plant.name}` : ''}</Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          {hasBudgetsRead && !project.budget && !project.parent_id && (
            <Button
              variant="outlined" size="small" startIcon={<AddIcon />}
              onClick={() => router.push(`/dashboard/budgets?existing_project_id=${project.id}`)}
            >
              Vincular Presupuesto
            </Button>
          )}
          <Chip label={STATUS_LABELS[project.status]} color={project.status === 'active' ? 'success' : 'default'} />
        </Box>
      </Box>

      <Paper elevation={1} sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          {tabs.map((t, i) => <Tab key={i} label={t.label} />)}
        </Tabs>
      </Paper>

      {tab === 0 && (
        <Paper sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" color="text.secondary">Horas propias</Typography>
              {renderProgress(project.consumed_hours_own || 0, project.budgeted_hours || 0)}
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" color="text.secondary">Horas consolidadas (propias + adicionales)</Typography>
              {renderProgress(project.consumed_hours_total || 0, project.budgeted_hours || 0)}
            </Grid>
          </Grid>
          <Divider sx={{ my: 3 }} />
          <Stack spacing={1}>
            <Typography variant="body2"><strong>Descripción:</strong> {project.description || '—'}</Typography>
            <Typography variant="body2"><strong>Fecha de inicio:</strong> {project.start_date || '—'}</Typography>
            <Typography variant="body2"><strong>Fecha de fin:</strong> {project.end_date || '—'}</Typography>
            {project.parent && (
              <Typography variant="body2"><strong>Es adicional de:</strong> {project.parent.code} - {project.parent.name}</Typography>
            )}
            {project.supervisors && project.supervisors.length > 0 && (
              <Typography variant="body2"><strong>Supervisores:</strong> {project.supervisors.map(s => `${s.lastname}, ${s.name}`).join(' · ')}</Typography>
            )}
          </Stack>
        </Paper>
      )}

      {tab === 1 && (
        <Paper sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Adicionales / Subproyectos</Typography>
            <Button
              variant="contained" size="small" startIcon={<AddIcon />}
              onClick={() => router.push(`/dashboard/budgets?parent_project_id=${project.id}`)}
            >
              Nuevo Adicional
            </Button>
          </Box>
          {(!project.subprojects || project.subprojects.length === 0) ? (
            <Typography color="text.secondary" textAlign="center" py={3}>No hay adicionales/subproyectos asociados.</Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell><strong>Código</strong></TableCell>
                    <TableCell><strong>Nombre</strong></TableCell>
                    <TableCell><strong>Estado</strong></TableCell>
                    <TableCell><strong>Horas</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {project.subprojects.map((sp) => (
                    <TableRow key={sp.id} hover sx={{ cursor: 'pointer' }} onClick={() => router.push(`/dashboard/projects/${sp.id}`)}>
                      <TableCell>{sp.code}</TableCell>
                      <TableCell>{sp.name}</TableCell>
                      <TableCell>{STATUS_LABELS[sp.status]}</TableCell>
                      <TableCell>{renderProgress(sp.consumed_hours_own || 0, sp.budgeted_hours || 0)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {tab === 2 && (
        <Paper sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Horas Cargadas</Typography>
            {project.subprojects && project.subprojects.length > 0 && (
              <Button size="small" onClick={() => setIncludeChildrenHours(!includeChildrenHours)}>
                {includeChildrenHours ? 'Ver solo horas propias' : 'Incluir horas de adicionales'}
              </Button>
            )}
          </Box>
          {entries.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={3}>No hay registros de horas.</Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell><strong>Fecha</strong></TableCell>
                    <TableCell><strong>Empleado</strong></TableCell>
                    <TableCell><strong>Proyecto</strong></TableCell>
                    <TableCell align="right"><strong>Reg.</strong></TableCell>
                    <TableCell align="right"><strong>50%</strong></TableCell>
                    <TableCell align="right"><strong>100%</strong></TableCell>
                    <TableCell><strong>Estado</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {entries.map((e) => (
                    <TableRow key={e.id} hover>
                      <TableCell>{e.date}</TableCell>
                      <TableCell>{e.employee ? `${e.employee.lastname}, ${e.employee.name}` : '—'}</TableCell>
                      <TableCell>{e.project ? `${e.project.code}` : '—'}</TableCell>
                      <TableCell align="right">{e.regular_hours}</TableCell>
                      <TableCell align="right">{e.overtime_50_hours}</TableCell>
                      <TableCell align="right">{e.overtime_100_hours}</TableCell>
                      <TableCell>{e.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {tab === 3 && hasBudgetsRead && (
        <Paper sx={{ p: 3 }}>
          {!project.budget ? (
            <Typography color="text.secondary" textAlign="center" py={3}>Este proyecto no tiene un presupuesto vinculado.</Typography>
          ) : (
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Presupuesto {project.budget.number}</Typography>
                <Button size="small" onClick={() => router.push('/dashboard/budgets')}>Ver en módulo de Presupuestos</Button>
              </Box>
              <Typography variant="body2" color="text.secondary" mb={2}>{project.budget.title}</Typography>

              <Typography variant="subtitle2" sx={{ mt: 2 }}>Mano de Obra</Typography>
              <TableContainer sx={{ mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Rubro</TableCell>
                      <TableCell align="right">Cantidad</TableCell>
                      {hasPricesRead && <TableCell align="right">Estimado</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(project.budget.laborLines || []).map((line, i) => (
                      <TableRow key={i}>
                        <TableCell>{line.itemType?.name}</TableCell>
                        <TableCell align="right">{line.quantity} {line.itemType?.unit_label}</TableCell>
                        {hasPricesRead && <TableCell align="right">{line.currency || project.budget?.currency} {line.estimated_total}</TableCell>}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Typography variant="subtitle2">Materiales</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Descripción</TableCell>
                      <TableCell align="right">Cantidad</TableCell>
                      {hasPricesRead && <TableCell align="right">Total</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(project.budget.materialItems || []).map((item, i) => (
                      <TableRow key={i}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell align="right">{item.quantity} {item.materialUnit?.label}</TableCell>
                        {hasPricesRead && <TableCell align="right">{item.currency || project.budget?.currency} {item.total_price}</TableCell>}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {hasPricesRead && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box textAlign="right">
                    <Typography variant="h6" fontWeight="bold">Total: {formatTotals(project.budget.totals_by_currency)}</Typography>
                  </Box>
                </>
              )}
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
}
