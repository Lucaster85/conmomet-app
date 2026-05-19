'use client';
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, CircularProgress, Tooltip, TextField, Switch,
  FormControlLabel, Stack, Chip, Divider,
} from '@mui/material';
import FeedbackModal from '../../../components/FeedbackModal';
import AddressAutocomplete from '../../../components/AddressAutocomplete';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Refresh as RefreshIcon, Checklist as ChecklistIcon,
  VerifiedUser as ComplianceIcon,
} from '@mui/icons-material';
import {
  Plant, PlantService, Client, ClientService,
  DocumentCategory, DocumentCategoryService,
  PlantRequirement, PlantRequirementService,
  ComplianceService, PlantComplianceResult,
} from '../../../utils/api';

const STATUS_ICON: Record<string, { label: string; color: 'success' | 'warning' | 'error' }> = {
  compliant: { label: '🟢 Habilitado', color: 'success' },
  expiring: { label: '🟡 Por Vencer', color: 'warning' },
  non_compliant: { label: '🔴 No Habilitado', color: 'error' },
};

export default function PlantsPage() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPlant, setEditingPlant] = useState<Plant | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; plant: Plant | null }>({ open: false, plant: null });
  const [clients, setClients] = useState<Client[]>([]);

  // Requirements state
  const [reqDialog, setReqDialog] = useState<{ open: boolean; plant: Plant | null }>({ open: false, plant: null });
  const [requirements, setRequirements] = useState<PlantRequirement[]>([]);
  const [docCategories, setDocCategories] = useState<DocumentCategory[]>([]);
  const [loadingReqs, setLoadingReqs] = useState(false);
  const [addReqForm, setAddReqForm] = useState({ document_category_id: '', is_mandatory: true, notes: '' });

  // Compliance state
  const [compDialog, setCompDialog] = useState<{ open: boolean; plant: Plant | null }>({ open: false, plant: null });
  const [compData, setCompData] = useState<PlantComplianceResult | null>(null);
  const [loadingComp, setLoadingComp] = useState(false);
  const [compFilter, setCompFilter] = useState<string>('all');
  const [expandedEmp, setExpandedEmp] = useState<number | null>(null);

  // Form state
  const [form, setForm] = useState({ name: '', address: '', client_id: '', is_active: true, notes: '' });

  const loadPlants = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await PlantService.getAll();
      setPlants(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar plantas');
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const data = await ClientService.getAll();
      setClients(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    loadPlants();
    loadClients();
  }, []);

  const handleOpenCreate = () => {
    setEditingPlant(null);
    setForm({ name: '', address: '', client_id: '', is_active: true, notes: '' });
    setOpenDialog(true);
  };

  const handleOpenEdit = (plant: Plant) => {
    setEditingPlant(plant);
    setForm({
      name: plant.name,
      address: plant.address || '',
      client_id: plant.client_id ? String(plant.client_id) : '',
      is_active: plant.is_active,
      notes: plant.notes || '',
    });
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    try {
      const payload = {
        name: form.name,
        address: form.address || undefined,
        client_id: form.client_id ? Number(form.client_id) : undefined,
        is_active: form.is_active,
        notes: form.notes || undefined,
      };

      if (editingPlant) {
        await PlantService.update(editingPlant.id, payload);
        setSuccess('Planta actualizada correctamente');
      } else {
        await PlantService.create(payload);
        setSuccess('Planta creada correctamente');
      }
      setOpenDialog(false);
      loadPlants();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.plant) return;
    try {
      await PlantService.delete(deleteDialog.plant.id);
      setDeleteDialog({ open: false, plant: null });
      setSuccess('Planta eliminada');
      loadPlants();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  const handleOpenRequirements = async (plant: Plant) => {
    setReqDialog({ open: true, plant });
    setLoadingReqs(true);
    setAddReqForm({ document_category_id: '', is_mandatory: true, notes: '' });
    try {
      const [reqs, cats] = await Promise.all([
        PlantRequirementService.getAll(plant.id),
        DocumentCategoryService.getAll('employee'),
      ]);
      setRequirements(Array.isArray(reqs) ? reqs : []);
      setDocCategories(Array.isArray(cats) ? cats : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar requisitos');
    } finally {
      setLoadingReqs(false);
    }
  };

  const handleAddRequirement = async () => {
    if (!reqDialog.plant || !addReqForm.document_category_id) return;
    try {
      await PlantRequirementService.create(reqDialog.plant.id, {
        document_category_id: Number(addReqForm.document_category_id),
        is_mandatory: addReqForm.is_mandatory,
        notes: addReqForm.notes || undefined,
      });
      setAddReqForm({ document_category_id: '', is_mandatory: true, notes: '' });
      setSuccess('Requisito agregado');
      // Reload requirements
      const reqs = await PlantRequirementService.getAll(reqDialog.plant.id);
      setRequirements(Array.isArray(reqs) ? reqs : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al agregar requisito');
    }
  };

  const handleDeleteRequirement = async (reqId: number) => {
    if (!reqDialog.plant) return;
    try {
      await PlantRequirementService.delete(reqDialog.plant.id, reqId);
      setSuccess('Requisito eliminado');
      const reqs = await PlantRequirementService.getAll(reqDialog.plant.id);
      setRequirements(Array.isArray(reqs) ? reqs : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar requisito');
    }
  };

  const handleOpenCompliance = async (plant: Plant) => {
    setCompDialog({ open: true, plant });
    setLoadingComp(true);
    setCompFilter('all');
    setExpandedEmp(null);
    try {
      const data = await ComplianceService.getPlantCompliance(plant.id);
      setCompData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar habilitaciones');
    } finally {
      setLoadingComp(false);
    }
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
        <Typography variant="h4" fontWeight="bold">Plantas</Typography>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadPlants} size="small">Actualizar</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate} size="small">Nueva Planta</Button>
        </Box>
      </Box>

      <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />
      <FeedbackModal open={!!success} onClose={() => setSuccess('')} message={success} type="success" />

      {/* Mobile: Cards / Desktop: Table */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {plants.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={4}>No hay plantas registradas</Typography>
        ) : (
          <Stack spacing={2}>
            {plants.map((plant) => (
              <Paper key={plant.id} sx={{ p: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">{plant.name}</Typography>
                    {plant.address && <Typography variant="body2" color="text.secondary">{plant.address}</Typography>}
                    {plant.client && <Typography variant="body2">Cliente: {plant.client.razonSocial}</Typography>}
                    <Typography variant="body2" color={plant.is_active ? 'success.main' : 'error.main'}>
                      {plant.is_active ? '● Activa' : '● Inactiva'}
                    </Typography>
                  </Box>
                  <Box>
                    <IconButton size="small" color="primary" onClick={() => handleOpenEdit(plant)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="secondary" onClick={() => handleOpenRequirements(plant)}><ChecklistIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="info" onClick={() => handleOpenCompliance(plant)}><ComplianceIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, plant })}><DeleteIcon fontSize="small" /></IconButton>
                  </Box>
                </Box>
              </Paper>
            ))}
          </Stack>
        )}
      </Box>

      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <TableContainer component={Paper} elevation={2}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell><strong>Nombre</strong></TableCell>
                <TableCell><strong>Dirección</strong></TableCell>
                <TableCell><strong>Cliente</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell align="center"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {plants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">No hay plantas registradas</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                plants.map((plant) => (
                  <TableRow key={plant.id} hover>
                    <TableCell><Typography fontWeight="medium">{plant.name}</Typography></TableCell>
                    <TableCell>{plant.address || '—'}</TableCell>
                    <TableCell>{plant.client?.razonSocial || '—'}</TableCell>
                    <TableCell>
                      <Typography color={plant.is_active ? 'success.main' : 'error.main'} variant="body2">
                        {plant.is_active ? '● Activa' : '● Inactiva'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Editar"><IconButton size="small" color="primary" onClick={() => handleOpenEdit(plant)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Requisitos"><IconButton size="small" color="secondary" onClick={() => handleOpenRequirements(plant)}><ChecklistIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Habilitaciones"><IconButton size="small" color="info" onClick={() => handleOpenCompliance(plant)}><ComplianceIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Eliminar"><IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, plant })}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
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
        <DialogTitle>{editingPlant ? 'Editar Planta' : 'Nueva Planta'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Nombre *" fullWidth value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <AddressAutocomplete label="Dirección" fullWidth value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
            <TextField label="Cliente" select fullWidth value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })}
              SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
              <option value="">Sin cliente</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.razonSocial}</option>)}
            </TextField>
            <TextField label="Notas" fullWidth multiline rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            {editingPlant && (
              <FormControlLabel control={<Switch checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />} label="Activa" />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">{editingPlant ? 'Guardar' : 'Crear'}</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, plant: null })}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>¿Eliminar la planta <strong>{deleteDialog.plant?.name}</strong>?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, plant: null })}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Eliminar</Button>
        </DialogActions>
      </Dialog>
      {/* Requirements Dialog */}
      <Dialog open={reqDialog.open} onClose={() => setReqDialog({ open: false, plant: null })} maxWidth="md" fullWidth>
        <DialogTitle>Requisitos de Ingreso — {reqDialog.plant?.name}</DialogTitle>
        <DialogContent>
          {loadingReqs ? (
            <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
          ) : (
            <Box>
              {/* Current requirements */}
              {requirements.length === 0 ? (
                <Typography color="text.secondary" textAlign="center" py={3}>Esta planta no tiene requisitos definidos.</Typography>
              ) : (
                <Stack spacing={1} mb={3}>
                  {requirements.map((req) => (
                    <Paper key={req.id} variant="outlined" sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography fontWeight="medium">{req.documentCategory?.name}</Typography>
                          <Chip
                            label={req.is_mandatory ? 'Obligatorio' : 'Deseable'}
                            size="small"
                            color={req.is_mandatory ? 'error' : 'default'}
                            variant="outlined"
                          />
                          {req.documentCategory?.is_plant_specific && <Chip label="Específico" size="small" color="info" variant="outlined" />}
                        </Box>
                        {req.notes && <Typography variant="caption" color="text.secondary">{req.notes}</Typography>}
                      </Box>
                      <IconButton size="small" color="error" onClick={() => handleDeleteRequirement(req.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Paper>
                  ))}
                </Stack>
              )}

              {/* Add requirement form */}
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>Agregar Requisito</Typography>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="flex-end">
                <TextField
                  label="Categoría de Documento" select fullWidth
                  value={addReqForm.document_category_id}
                  onChange={(e) => setAddReqForm({ ...addReqForm, document_category_id: e.target.value })}
                  SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}
                  size="small"
                >
                  <option value="">— Seleccionar —</option>
                  {docCategories
                    .filter(dc => !requirements.some(r => r.document_category_id === dc.id))
                    .map(dc => <option key={dc.id} value={dc.id}>{dc.name}{dc.is_plant_specific ? ' (Específico de Planta)' : ''}</option>)
                  }
                </TextField>
                <FormControlLabel
                  control={<Switch checked={addReqForm.is_mandatory} onChange={(e) => setAddReqForm({ ...addReqForm, is_mandatory: e.target.checked })} size="small" />}
                  label="Obligatorio"
                  sx={{ whiteSpace: 'nowrap' }}
                />
                <Button
                  variant="contained" size="small" startIcon={<AddIcon />}
                  onClick={handleAddRequirement}
                  disabled={!addReqForm.document_category_id}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  Agregar
                </Button>
              </Stack>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReqDialog({ open: false, plant: null })}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Compliance Dialog */}
      <Dialog open={compDialog.open} onClose={() => { setCompDialog({ open: false, plant: null }); setExpandedEmp(null); }} maxWidth="md" fullWidth>
        <DialogTitle>Habilitaciones — {compDialog.plant?.name}</DialogTitle>
        <DialogContent>
          {loadingComp ? (
            <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
          ) : !compData || compData.requirements.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={3}>Esta planta no tiene requisitos definidos. Configurá los requisitos primero.</Typography>
          ) : (
            <Box>
              <Box display="flex" gap={1} mb={2} flexWrap="wrap">
                <Chip label="Todos" variant={compFilter === 'all' ? 'filled' : 'outlined'} onClick={() => setCompFilter('all')} />
                <Chip label="🟢 Habilitados" color="success" variant={compFilter === 'compliant' ? 'filled' : 'outlined'} onClick={() => setCompFilter('compliant')} />
                <Chip label="🟡 Por Vencer" color="warning" variant={compFilter === 'expiring' ? 'filled' : 'outlined'} onClick={() => setCompFilter('expiring')} />
                <Chip label="🔴 No Habilitados" color="error" variant={compFilter === 'non_compliant' ? 'filled' : 'outlined'} onClick={() => setCompFilter('non_compliant')} />
              </Box>
              <Stack spacing={1}>
                {compData.employees
                  .filter(e => compFilter === 'all' || e.status === compFilter)
                  .map((emp) => {
                    const cfg = STATUS_ICON[emp.status] || STATUS_ICON.non_compliant;
                    const isExpanded = expandedEmp === emp.employee.id;
                    return (
                      <Paper key={emp.employee.id} variant="outlined" sx={{ p: 1.5, cursor: 'pointer' }} onClick={() => setExpandedEmp(isExpanded ? null : emp.employee.id)}>
                        <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} gap={1}>
                          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                            <Typography fontWeight="medium">{emp.employee.lastname}, {emp.employee.name}</Typography>
                            <Chip label={cfg.label} size="small" color={cfg.color} variant="outlined" />
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: { xs: 'left', sm: 'right' } }}>
                            {emp.summary.met}/{emp.summary.total} requisitos
                            {emp.summary.expiring > 0 && ` • ${emp.summary.expiring} por vencer`}
                          </Typography>
                        </Box>
                        {isExpanded && (
                          <Box mt={1.5}>
                            <Divider sx={{ mb: 1 }} />
                            <Stack spacing={0.5}>
                              {emp.details.map((d, i) => (
                                <Box key={i} display="flex" justifyContent="space-between" alignItems="center">
                                  <Box display="flex" alignItems="center" gap={1}>
                                    <Typography variant="body2">
                                      {d.status === 'valid' && '✅'}
                                      {d.status === 'expiring_soon' && '⚠️'}
                                      {d.status === 'expired' && '❌'}
                                      {d.status === 'missing' && '❓'}
                                      {' '}{d.requirement.category_name}
                                    </Typography>
                                    {d.requirement.is_mandatory && <Chip label="Obligatorio" size="small" color="error" variant="outlined" sx={{ height: 20, fontSize: 10 }} />}
                                  </Box>
                                  <Typography variant="caption" color="text.secondary">
                                    {d.document ? (d.document.expiration_date || 'Sin vencimiento') : 'Sin documento'}
                                  </Typography>
                                </Box>
                              ))}
                            </Stack>
                          </Box>
                        )}
                      </Paper>
                    );
                  })}
                {compData.employees.filter(e => compFilter === 'all' || e.status === compFilter).length === 0 && (
                  <Typography color="text.secondary" textAlign="center" py={2}>Ningún empleado coincide con el filtro.</Typography>
                )}
              </Stack>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setCompDialog({ open: false, plant: null }); setExpandedEmp(null); }}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
