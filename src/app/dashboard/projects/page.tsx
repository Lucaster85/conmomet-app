'use client';
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, CircularProgress, Tooltip, TextField, Stack, LinearProgress,
  Grid, Divider
} from '@mui/material';
import FeedbackModal from '../../../components/FeedbackModal';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { Project, ProjectService, Client, ClientService, Plant, PlantService, CreateProjectData } from '../../../utils/api';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  active: 'Activo',
  paused: 'Pausado',
  completed: 'Completado',
  cancelled: 'Cancelado',
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; project: Project | null }>({ open: false, project: null });

  // Form state
  const [form, setForm] = useState({
    name: '',
    code: '',
    client_id: '',
    plant_id: '',
    description: '',
    budgeted_hours: 0,
    status: 'active',
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
      setProjects(Array.isArray(projs) ? projs : []);
      setClients(Array.isArray(clis) ? clis : []);
      setPlants(Array.isArray(plts) ? plts : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

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
    });
    setOpenDialog(true);
  };

  const handleOpenEdit = (project: Project) => {
    setEditingProject(project);
    setForm({
      name: project.name,
      code: project.code || '',
      client_id: String(project.client_id),
      plant_id: project.plant_id ? String(project.plant_id) : '',
      description: project.description || '',
      budgeted_hours: project.budgeted_hours || 0,
      status: project.status || 'active',
    });
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
      };
      // Solo enviamos el code si el usuario lo escribió, sino el backend lo genera
      if (form.code.trim()) {
        payload.code = form.code.trim();
      }

      if (editingProject) {
        await ProjectService.update(editingProject.id, payload);
        setSuccess('Proyecto actualizado');
      } else {
        await ProjectService.create(payload);
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
        <Typography variant="h4" fontWeight="bold">Proyectos</Typography>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadData} size="small">Actualizar</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate} size="small">Nuevo Proyecto</Button>
        </Box>
      </Box>

      <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />
      <FeedbackModal open={!!success} onClose={() => setSuccess('')} message={success} type="success" />

      {/* Mobile view */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {projects.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={4}>No hay proyectos registrados</Typography>
        ) : (
          <Stack spacing={2}>
            {projects.map((proj) => (
              <Paper key={proj.id} sx={{ p: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">[{proj.code}] {proj.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{proj.client?.razonSocial}</Typography>
                    <Typography variant="body2" color={proj.status === 'active' ? 'success.main' : 'text.secondary'} sx={{ mt: 0.5, fontWeight: 'medium' }}>
                      {STATUS_LABELS[proj.status]}
                    </Typography>
                  </Box>
                  <Box>
                    <IconButton size="small" color="primary" onClick={() => handleOpenEdit(proj)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, project: proj })}><DeleteIcon fontSize="small" /></IconButton>
                  </Box>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box mt={1}>
                  {renderProgress(proj.consumed_hours || 0, proj.budgeted_hours || 0)}
                </Box>
              </Paper>
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
                <TableCell align="center"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">No hay proyectos registrados</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                projects.map((proj) => (
                  <TableRow key={proj.id} hover>
                    <TableCell><Typography variant="body2" color="text.secondary" fontWeight="medium">{proj.code}</Typography></TableCell>
                    <TableCell><Typography fontWeight="medium">{proj.name}</Typography></TableCell>
                    <TableCell>
                      <Typography variant="body2">{proj.client?.razonSocial}</Typography>
                      {proj.plant && <Typography variant="caption" color="text.secondary">Planta: {proj.plant.name}</Typography>}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color={proj.status === 'active' ? 'success.main' : 'text.secondary'} fontWeight="medium">
                        {STATUS_LABELS[proj.status]}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {renderProgress(proj.consumed_hours || 0, proj.budgeted_hours || 0)}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Editar"><IconButton size="small" color="primary" onClick={() => handleOpenEdit(proj)}><EditIcon fontSize="small" /></IconButton></Tooltip>
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
    </Box>
  );
}
