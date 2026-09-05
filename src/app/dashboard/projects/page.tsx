'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Typography, Button, Paper, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, CircularProgress, Tooltip, TextField, Stack, LinearProgress,
  Grid, Divider, Chip,
} from '@mui/material';
import FeedbackModal from '../../../components/FeedbackModal';
import {
  AddOutlined as AddIcon, EditOutlined as EditIcon, DeleteOutlined as DeleteIcon, OpenInNewOutlined as DetailIcon,
  RefreshOutlined as RefreshIcon, GroupsOutlined as TeamIcon, CheckCircleOutlined as CompleteIcon,
  RequestQuoteOutlined as BudgetIcon, AssignmentOutlined as TitleIcon,
} from '@mui/icons-material';
import {
  Project, ProjectService, Client, ClientService, Plant, PlantService, CreateProjectData,
  ComplianceService, ProjectTeamResult, ClientSupervisor, ClientSupervisorService,
} from '../../../utils/api';
import { useAuth } from '../../../utils/auth';

const COMPLIANCE_CHIP: Record<string, { label: string; color: 'success' | 'warning' | 'error' }> = {
  compliant: { label: '🟢', color: 'success' },
  expiring: { label: '🟡', color: 'warning' },
  non_compliant: { label: '🔴', color: 'error' },
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  active: 'Activo',
  paused: 'Pausado',
  completed: 'Completado',
  cancelled: 'Cancelado',
};

export default function ProjectsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const userPermissions: string[] = Array.isArray((user as unknown as Record<string, unknown>)?.permissions)
    ? ((user as unknown as Record<string, unknown>).permissions as string[])
    : [];
  const hasBudgetsRead = userPermissions.includes('admin_granted') || userPermissions.includes('budgets_read');
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filtros del listado
  const [filterCode, setFilterCode] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterClientId, setFilterClientId] = useState<number | ''>('');
  const [filterPlantId, setFilterPlantId] = useState<number | ''>('');
  
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; project: Project | null }>({ open: false, project: null });
  const [completeDialog, setCompleteDialog] = useState<{ open: boolean; project: Project | null }>({ open: false, project: null });

  // Team state
  const [teamDialog, setTeamDialog] = useState<{ open: boolean; project: Project | null }>({ open: false, project: null });
  const [teamData, setTeamData] = useState<ProjectTeamResult | null>(null);
  const [loadingTeam, setLoadingTeam] = useState(false);

  // Supervisors state
  const [clientSupervisors, setClientSupervisors] = useState<ClientSupervisor[]>([]);
  const [selectedSupervisorIds, setSelectedSupervisorIds] = useState<number[]>([]);
  const [loadingSupervisors, setLoadingSupervisors] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: '',
    code: '',
    client_id: '',
    plant_id: '',
    description: '',
    budgeted_hours: 0,
    status: 'active',
    start_date: '',
    end_date: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [projs, clis, plts] = await Promise.all([
        ProjectService.getAll(),
        ClientService.getAll(),
        PlantService.getAll(),
      ]);
      
      const rawProjects = Array.isArray(projs) ? projs : [];
      const sortedProjects = [...rawProjects].sort((a, b) => {
        const aFinished = a.status === 'completed' || a.status === 'cancelled';
        const bFinished = b.status === 'completed' || b.status === 'cancelled';
        if (aFinished && !bFinished) return 1;
        if (!aFinished && bFinished) return -1;
        return 0;
      });

      setProjects(sortedProjects);
      setClients(Array.isArray(clis) ? clis : []);
      setPlants(Array.isArray(plts) ? plts : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const loadClientSupervisors = async (clientId: number) => {
    try {
      setLoadingSupervisors(true);
      const data = await ClientSupervisorService.getAll(clientId);
      setClientSupervisors(data);
    } catch (err) {
      console.error('Error loading client supervisors:', err);
      setClientSupervisors([]);
    } finally {
      setLoadingSupervisors(false);
    }
  };

  useEffect(() => {
    if (form.client_id) {
      loadClientSupervisors(Number(form.client_id));
    } else {
      setClientSupervisors([]);
      setSelectedSupervisorIds([]);
    }
  }, [form.client_id]);

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingProject(null);
    setForm({
      name: '',
      code: '',
      client_id: '',
      plant_id: '',
      description: '',
      budgeted_hours: 0,
      status: 'active',
      start_date: '',
      end_date: '',
    });
    setSelectedSupervisorIds([]);
    setOpenDialog(true);
  };

  const handleOpenEdit = async (project: Project) => {
    setEditingProject(project);
    setForm({
      name: project.name,
      code: project.code || '',
      client_id: String(project.client_id),
      plant_id: project.plant_id ? String(project.plant_id) : '',
      description: project.description || '',
      budgeted_hours: project.budgeted_hours || 0,
      status: project.status || 'active',
      start_date: project.start_date || '',
      end_date: project.end_date || '',
    });

    if (project.supervisors) {
      setSelectedSupervisorIds(project.supervisors.map(s => s.id));
    } else {
      try {
        const sups = await ProjectService.getSupervisors(project.id);
        setSelectedSupervisorIds(sups.map(s => s.id));
      } catch (err) {
        console.error('Error fetching supervisors:', err);
        setSelectedSupervisorIds([]);
      }
    }
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.client_id) {
      setError('El nombre y el cliente son obligatorios');
      return;
    }
    try {
      const payload: Partial<CreateProjectData> & { name: string; client_id: number } = {
        name: form.name,
        client_id: Number(form.client_id),
        plant_id: form.plant_id ? Number(form.plant_id) : undefined,
        description: form.description || undefined,
        budgeted_hours: Number(form.budgeted_hours) || 0,
        status: form.status as CreateProjectData['status'],
        start_date: form.start_date || undefined,
        end_date: form.end_date || undefined,
      };
      // Solo enviamos el code si el usuario lo escribió, sino el backend lo genera
      if (form.code.trim()) {
        payload.code = form.code.trim();
      }

      let savedProject: Project;
      if (editingProject) {
        savedProject = await ProjectService.update(editingProject.id, payload);
        await ProjectService.syncSupervisors(editingProject.id, selectedSupervisorIds);
        setSuccess('Proyecto actualizado');
      } else {
        savedProject = await ProjectService.create(payload);
        await ProjectService.syncSupervisors(savedProject.id, selectedSupervisorIds);
        setSuccess('Proyecto creado');
      }
      setOpenDialog(false);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.project) return;
    try {
      await ProjectService.delete(deleteDialog.project.id);
      setDeleteDialog({ open: false, project: null });
      setSuccess('Proyecto eliminado');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  const handleComplete = async () => {
    if (!completeDialog.project) return;
    try {
      await ProjectService.update(completeDialog.project.id, { status: 'completed' });
      setCompleteDialog({ open: false, project: null });
      setSuccess('Proyecto finalizado');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al finalizar el proyecto');
    }
  };

  // Helper para la barra de progreso
  const renderProgress = (consumed: number, budgeted: number) => {
    if (!budgeted || budgeted <= 0) return <Typography variant="body2">{consumed} hs</Typography>;
    
    const percentage = Math.min((consumed / budgeted) * 100, 100);
    const isOverBudget = consumed > budgeted;
    
    return (
      <Box sx={{ width: '100%', minWidth: 120 }}>
        <Box display="flex" justifyContent="space-between" mb={0.5}>
          <Typography variant="caption" fontWeight="bold" color={isOverBudget ? 'error.main' : 'text.primary'}>
            {consumed} hs
          </Typography>
          <Typography variant="caption" color="text.secondary">
            / {budgeted} hs ({Math.round((consumed/budgeted)*100)}%)
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={percentage} 
          color={isOverBudget ? 'error' : (percentage > 80 ? 'warning' : 'success')}
          sx={{ height: 6, borderRadius: 3 }}
        />
      </Box>
    );
  };

  const handleOpenTeam = async (project: Project) => {
    setTeamDialog({ open: true, project });
    setLoadingTeam(true);
    try {
      const data = await ComplianceService.getProjectTeam(project.id);
      setTeamData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar equipo');
    } finally {
      setLoadingTeam(false);
    }
  };

  const filteredProjects = projects.filter((proj) => {
    if (filterCode && !proj.code?.toLowerCase().includes(filterCode.toLowerCase())) return false;
    if (filterName && !proj.name.toLowerCase().includes(filterName.toLowerCase())) return false;
    if (filterClientId && proj.client_id !== filterClientId) return false;
    if (filterPlantId && proj.plant_id !== filterPlantId) return false;
    return true;
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={1}>
        <Box display="flex" alignItems="center" gap={1}>
          <TitleIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" fontWeight={700} letterSpacing="-0.02em" color="#1E293B">Proyectos</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadData} size="small">Actualizar</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate} size="small">Nuevo Proyecto</Button>
        </Box>
      </Box>

      <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />
      <FeedbackModal open={!!success} onClose={() => setSuccess('')} message={success} type="success" />

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              label="Código"
              size="small"
              fullWidth
              value={filterCode}
              onChange={(e) => setFilterCode(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              label="Nombre del proyecto"
              size="small"
              fullWidth
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              label="Cliente"
              select
              size="small"
              fullWidth
              value={filterClientId}
              onChange={(e) => { setFilterClientId(e.target.value ? Number(e.target.value) : ''); setFilterPlantId(''); }}
              SelectProps={{ native: true }}
              InputLabelProps={{ shrink: true }}
            >
              <option value="">Todos los clientes</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.razonSocial}</option>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              label="Planta"
              select
              size="small"
              fullWidth
              value={filterPlantId}
              onChange={(e) => setFilterPlantId(e.target.value ? Number(e.target.value) : '')}
              SelectProps={{ native: true }}
              InputLabelProps={{ shrink: true }}
            >
              <option value="">Todas las plantas</option>
              {plants
                .filter((p) => !filterClientId || p.client_id === filterClientId)
                .map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Mobile view */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {filteredProjects.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={4}>No hay proyectos que coincidan con los filtros</Typography>
        ) : (
          <Stack spacing={2}>
            {filteredProjects.map((proj) => (
              <Card key={proj.id} sx={{ p: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                  <Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="subtitle1" fontWeight="bold">[{proj.code}] {proj.name}</Typography>
                      {!!proj.subproject_count && (
                        <Chip size="small" label={`${proj.subproject_count} adicional(es)`} color="secondary" variant="outlined" />
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary">{proj.client?.razonSocial}</Typography>
                    {proj.supervisors && proj.supervisors.length > 0 && (
                      <Typography variant="caption" color="primary.main" display="block" sx={{ mt: 0.5 }}>
                        👥 {proj.supervisors.length} supervisor(es)
                      </Typography>
                    )}
                    <Typography variant="body2" color={proj.status === 'active' ? 'success.main' : 'text.secondary'} sx={{ mt: 0.5, fontWeight: 'medium' }}>
                      {STATUS_LABELS[proj.status]}
                    </Typography>
                  </Box>
                  <Box>
                    <IconButton size="small" color="secondary" onClick={() => router.push(`/dashboard/projects/${proj.id}`)}><DetailIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="primary" onClick={() => handleOpenEdit(proj)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="info" onClick={() => handleOpenTeam(proj)}><TeamIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="success" onClick={() => setCompleteDialog({ open: true, project: proj })} disabled={proj.status === 'completed' || proj.status === 'cancelled'}><CompleteIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, project: proj })}><DeleteIcon fontSize="small" /></IconButton>
                  </Box>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box mt={1}>
                  {renderProgress(proj.consumed_hours_total || 0, proj.budgeted_hours || 0)}
                </Box>
                {hasBudgetsRead && (
                  <Box mt={1}>
                    {proj.budget ? (
                      <Chip
                        size="small" icon={<BudgetIcon />} label={proj.budget.number}
                        color="primary" variant="outlined" clickable
                        onClick={() => router.push(`/dashboard/budgets?view=${proj.budget!.id}`)}
                      />
                    ) : (
                      <Typography variant="caption" color="text.secondary">Sin presupuesto</Typography>
                    )}
                  </Box>
                )}
              </Card>
            ))}
          </Stack>
        )}
      </Box>

      {/* Desktop view */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <TableContainer component={Paper} elevation={2}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell><strong>Código</strong></TableCell>
                <TableCell><strong>Nombre</strong></TableCell>
                <TableCell><strong>Cliente</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell sx={{ minWidth: 200 }}><strong>Progreso de Horas</strong></TableCell>
                {hasBudgetsRead && <TableCell><strong>Presupuesto</strong></TableCell>}
                <TableCell align="center"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={hasBudgetsRead ? 7 : 6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">No hay proyectos que coincidan con los filtros</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProjects.map((proj) => (
                  <TableRow key={proj.id} hover>
                    <TableCell><Typography variant="body2" color="text.secondary" fontWeight="medium">{proj.code}</Typography></TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography fontWeight="medium">{proj.name}</Typography>
                        {!!proj.subproject_count && (
                          <Chip size="small" label={`${proj.subproject_count} adicional(es)`} color="secondary" variant="outlined" />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{proj.client?.razonSocial}</Typography>
                      {proj.plant && <Typography variant="caption" color="text.secondary" display="block">Planta: {proj.plant.name}</Typography>}
                      {proj.supervisors && proj.supervisors.length > 0 && (
                        <Typography variant="caption" color="primary.main" display="block" sx={{ mt: 0.5 }}>
                          👥 {proj.supervisors.length} supervisor(es)
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color={proj.status === 'active' ? 'success.main' : 'text.secondary'} fontWeight="medium">
                        {STATUS_LABELS[proj.status]}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {renderProgress(proj.consumed_hours_total || 0, proj.budgeted_hours || 0)}
                    </TableCell>
                    {hasBudgetsRead && (
                      <TableCell>
                        {proj.budget ? (
                          <Tooltip title="Ver / Imprimir presupuesto">
                            <Chip
                              size="small" icon={<BudgetIcon />} label={proj.budget.number}
                              color="primary" variant="outlined" clickable
                              onClick={() => router.push(`/dashboard/budgets?view=${proj.budget!.id}`)}
                            />
                          </Tooltip>
                        ) : (
                          <Typography variant="caption" color="text.secondary">Sin presupuesto</Typography>
                        )}
                      </TableCell>
                    )}
                    <TableCell align="center">
                      <Tooltip title="Ver detalle"><IconButton size="small" color="secondary" onClick={() => router.push(`/dashboard/projects/${proj.id}`)}><DetailIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Editar"><IconButton size="small" color="primary" onClick={() => handleOpenEdit(proj)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Equipo"><IconButton size="small" color="info" onClick={() => handleOpenTeam(proj)}><TeamIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Finalizar Proyecto">
                        <span>
                          <IconButton size="small" color="success" onClick={() => setCompleteDialog({ open: true, project: proj })} disabled={proj.status === 'completed' || proj.status === 'cancelled'}>
                            <CompleteIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Eliminar"><IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, project: proj })}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingProject ? 'Editar Proyecto' : 'Nuevo Proyecto'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 8 }}>
                <TextField label="Nombre del Proyecto *" fullWidth value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField label="Código" fullWidth value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} helperText={!editingProject ? "Auto-generado si se omite" : ""} />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="Cliente *" select fullWidth value={form.client_id} onChange={(e) => {
                  setForm({ ...form, client_id: e.target.value, plant_id: '' }); // Reset plant when client changes
                }} SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
                  <option value="">— Seleccionar —</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.razonSocial}</option>)}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="Planta" select fullWidth value={form.plant_id} onChange={(e) => setForm({ ...form, plant_id: e.target.value })}
                  SelectProps={{ native: true }} InputLabelProps={{ shrink: true }} disabled={!form.client_id}>
                  <option value="">— Ninguna —</option>
                  {plants.filter(p => p.client_id === Number(form.client_id)).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </TextField>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="Horas Presupuestadas" type="number" fullWidth value={form.budgeted_hours} onChange={(e) => setForm({ ...form, budgeted_hours: Number(e.target.value) })} inputProps={{ min: 0 }} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="Estado" select fullWidth value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                  SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
                  <option value="draft">Borrador</option>
                  <option value="active">Activo</option>
                  <option value="paused">Pausado</option>
                  <option value="completed">Completado</option>
                  <option value="cancelled">Cancelado</option>
                </TextField>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="Fecha de Inicio" type="date" fullWidth value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="Fecha de Fin" type="date" fullWidth value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })} InputLabelProps={{ shrink: true }} />
              </Grid>
            </Grid>

            {/* Asignación de Supervisores */}
            {form.client_id && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>
                  Supervisores Asignados ({selectedSupervisorIds.length})
                </Typography>
                {loadingSupervisors ? (
                  <CircularProgress size={20} />
                ) : clientSupervisors.length === 0 ? (
                  <Typography variant="caption" color="text.secondary">
                    No hay supervisores registrados para este cliente. Configúrelos en la sección Clientes.
                  </Typography>
                ) : (
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
                    {clientSupervisors.map((supervisor) => {
                      const isSelected = selectedSupervisorIds.includes(supervisor.id);
                      return (
                        <Chip
                          key={supervisor.id}
                          label={`${supervisor.lastname}, ${supervisor.name}`}
                          color={isSelected ? "primary" : "default"}
                          variant={isSelected ? "filled" : "outlined"}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedSupervisorIds(prev => prev.filter(id => id !== supervisor.id));
                            } else {
                              setSelectedSupervisorIds(prev => [...prev, supervisor.id]);
                            }
                          }}
                          sx={{ cursor: 'pointer' }}
                        />
                      );
                    })}
                  </Stack>
                )}
              </Box>
            )}

            <TextField label="Descripción" fullWidth multiline rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">{editingProject ? 'Guardar' : 'Crear'}</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, project: null })}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>¿Eliminar el proyecto <strong>{deleteDialog.project?.name}</strong>?</Typography>
          <Typography variant="body2" color="error" mt={1}>Solo se pueden eliminar proyectos que no tengan horas cargadas.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, project: null })}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Eliminar</Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Complete Dialog */}
      <Dialog open={completeDialog.open} onClose={() => setCompleteDialog({ open: false, project: null })}>
        <DialogTitle>Confirmar Finalización</DialogTitle>
        <DialogContent>
          <Typography>¿Está seguro de que desea finalizar el proyecto <strong>{completeDialog.project?.name}</strong>?</Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>Una vez finalizado, no se podrán registrar más horas en él.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompleteDialog({ open: false, project: null })}>Cancelar</Button>
          <Button onClick={handleComplete} color="success" variant="contained">Finalizar</Button>
        </DialogActions>
      </Dialog>

      {/* Team Dialog */}
      <Dialog open={teamDialog.open} onClose={() => setTeamDialog({ open: false, project: null })} maxWidth="md" fullWidth>
        <DialogTitle>Equipo — {teamDialog.project?.name}</DialogTitle>
        <DialogContent>
          {loadingTeam ? (
            <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
          ) : !teamData || teamData.team.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={3}>No hay empleados con horas registradas en este proyecto.</Typography>
          ) : (
            <Box>
              {/* Mobile View */}
              <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                <Stack spacing={2}>
                  {teamData.team.map((m) => (
                    <Card key={m.employee.id} variant="outlined" sx={{ p: 2 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                        <Box>
                          <Typography fontWeight="medium">{m.employee.lastname}, {m.employee.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{m.entries} registros • {m.first_date} a {m.last_date}</Typography>
                        </Box>
                        <Box>
                          {m.compliance ? (
                            <Tooltip title={`${m.compliance.summary.met}/${m.compliance.summary.total} requisitos`}>
                              <Chip
                                label={(COMPLIANCE_CHIP[m.compliance.status] || COMPLIANCE_CHIP.non_compliant).label}
                                size="small"
                                color={(COMPLIANCE_CHIP[m.compliance.status] || COMPLIANCE_CHIP.non_compliant).color}
                                variant="outlined"
                              />
                            </Tooltip>
                          ) : (
                            <Typography variant="caption" color="text.secondary">—</Typography>
                          )}
                        </Box>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Grid container spacing={1} sx={{ textAlign: 'center' }}>
                        <Grid size={{ xs: 3 }}>
                          <Typography variant="caption" color="text.secondary">Reg</Typography>
                          <Typography variant="body2">{m.hours.regular.toFixed(1)}</Typography>
                        </Grid>
                        <Grid size={{ xs: 3 }}>
                          <Typography variant="caption" color="text.secondary">50%</Typography>
                          <Typography variant="body2">{m.hours.overtime_50.toFixed(1)}</Typography>
                        </Grid>
                        <Grid size={{ xs: 3 }}>
                          <Typography variant="caption" color="text.secondary">100%</Typography>
                          <Typography variant="body2">{m.hours.overtime_100.toFixed(1)}</Typography>
                        </Grid>
                        <Grid size={{ xs: 3 }}>
                          <Typography variant="caption" color="text.secondary" fontWeight="bold">Total</Typography>
                          <Typography variant="body2" fontWeight="bold">{m.hours.weighted_total.toFixed(1)}</Typography>
                        </Grid>
                      </Grid>
                    </Card>
                  ))}
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography fontWeight="bold" textAlign="center" mb={1}>Totales del Equipo</Typography>
                    <Grid container spacing={1} sx={{ textAlign: 'center' }}>
                      <Grid size={{ xs: 3 }}>
                        <Typography variant="caption" color="text.secondary">Reg</Typography>
                        <Typography variant="body2" fontWeight="bold">{teamData.team.reduce((s, m) => s + m.hours.regular, 0).toFixed(1)}</Typography>
                      </Grid>
                      <Grid size={{ xs: 3 }}>
                        <Typography variant="caption" color="text.secondary">50%</Typography>
                        <Typography variant="body2" fontWeight="bold">{teamData.team.reduce((s, m) => s + m.hours.overtime_50, 0).toFixed(1)}</Typography>
                      </Grid>
                      <Grid size={{ xs: 3 }}>
                        <Typography variant="caption" color="text.secondary">100%</Typography>
                        <Typography variant="body2" fontWeight="bold">{teamData.team.reduce((s, m) => s + m.hours.overtime_100, 0).toFixed(1)}</Typography>
                      </Grid>
                      <Grid size={{ xs: 3 }}>
                        <Typography variant="caption" color="text.secondary" fontWeight="bold">Total</Typography>
                        <Typography variant="body2" fontWeight="bold">{teamData.team.reduce((s, m) => s + m.hours.weighted_total, 0).toFixed(1)}</Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Stack>
              </Box>

              {/* Desktop View */}
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell><strong>Empleado</strong></TableCell>
                        <TableCell align="right"><strong>Hs Regulares</strong></TableCell>
                        <TableCell align="right"><strong>Hs 50%</strong></TableCell>
                        <TableCell align="right"><strong>Hs 100%</strong></TableCell>
                        <TableCell align="right"><strong>Total Ponderado</strong></TableCell>
                        <TableCell align="center"><strong>Habilitación</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {teamData.team.map((m) => (
                        <TableRow key={m.employee.id} hover>
                          <TableCell>
                            <Typography fontWeight="medium">{m.employee.lastname}, {m.employee.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{m.entries} registros • {m.first_date} a {m.last_date}</Typography>
                          </TableCell>
                          <TableCell align="right">{m.hours.regular.toFixed(1)}</TableCell>
                          <TableCell align="right">{m.hours.overtime_50.toFixed(1)}</TableCell>
                          <TableCell align="right">{m.hours.overtime_100.toFixed(1)}</TableCell>
                          <TableCell align="right"><Typography fontWeight="bold">{m.hours.weighted_total.toFixed(1)}</Typography></TableCell>
                          <TableCell align="center">
                            {m.compliance ? (
                              <Tooltip title={`${m.compliance.summary.met}/${m.compliance.summary.total} requisitos`}>
                                <Chip
                                  label={(COMPLIANCE_CHIP[m.compliance.status] || COMPLIANCE_CHIP.non_compliant).label}
                                  size="small"
                                  color={(COMPLIANCE_CHIP[m.compliance.status] || COMPLIANCE_CHIP.non_compliant).color}
                                  variant="outlined"
                                />
                              </Tooltip>
                            ) : (
                              <Typography variant="caption" color="text.secondary">—</Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell><Typography fontWeight="bold">Total</Typography></TableCell>
                        <TableCell align="right"><strong>{teamData.team.reduce((s, m) => s + m.hours.regular, 0).toFixed(1)}</strong></TableCell>
                        <TableCell align="right"><strong>{teamData.team.reduce((s, m) => s + m.hours.overtime_50, 0).toFixed(1)}</strong></TableCell>
                        <TableCell align="right"><strong>{teamData.team.reduce((s, m) => s + m.hours.overtime_100, 0).toFixed(1)}</strong></TableCell>
                        <TableCell align="right"><Typography fontWeight="bold">{teamData.team.reduce((s, m) => s + m.hours.weighted_total, 0).toFixed(1)}</Typography></TableCell>
                        <TableCell />
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTeamDialog({ open: false, project: null })}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
