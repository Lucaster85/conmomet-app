'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Box, Typography, Button, Paper, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, CircularProgress, Tooltip, TextField, Stack, Chip, ToggleButtonGroup, ToggleButton,
  Autocomplete,
} from '@mui/material';
import FeedbackModal from '../../../components/FeedbackModal';
import {
  AddOutlined as AddIcon, RefreshOutlined as RefreshIcon, CheckCircleOutlined as DeliverIcon,
  AssignmentReturnOutlined as ReturnIcon, CancelOutlined as CancelIcon, SwapHorizOutlined as TitleIcon,
} from '@mui/icons-material';
import DateField from '../../../components/DateField';
import {
  AssetAssignment, AssetAssignmentService, AssetAssignmentStatus, AssetCondition, AssetCompleteness,
  Tool, ToolService, Vehicle, VehicleService, Employee, EmployeeService, Project, ProjectService,
} from '../../../utils/api';

const STATUS_LABELS: Record<AssetAssignmentStatus, string> = {
  reserved: 'Reservada',
  delivered: 'Entregada',
  returned: 'Devuelta',
};

const STATUS_COLORS: Record<AssetAssignmentStatus, 'info' | 'warning' | 'success'> = {
  reserved: 'info',
  delivered: 'warning',
  returned: 'success',
};

const CONDITION_LABELS: Record<AssetCondition, string> = { bueno: 'Bueno', regular: 'Regular', malo: 'Malo' };
const COMPLETENESS_LABELS: Record<AssetCompleteness, string> = { completo: 'Completo', faltante: 'Faltante' };

const today = () => new Date().toISOString().split('T')[0];

type AssetKind = 'tool' | 'vehicle';

const emptyCreateForm = () => ({
  kind: 'tool' as AssetKind,
  tool_id: '' as number | '',
  vehicle_id: '' as number | '',
  project_id: '' as number | '',
  employee_id: '' as number | '',
  deliverNow: false,
  delivered_date: today(),
  delivery_condition: 'bueno' as AssetCondition,
  delivery_completeness: 'completo' as AssetCompleteness,
  delivery_notes: '',
});

export default function AssetAssignmentsPage() {
  const searchParams = useSearchParams();

  const [items, setItems] = useState<AssetAssignment[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [kindFilter, setKindFilter] = useState<'all' | AssetKind>('all');
  const [statusFilter, setStatusFilter] = useState<'' | AssetAssignmentStatus>('');

  const [openCreate, setOpenCreate] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm());

  const [deliverDialog, setDeliverDialog] = useState<{ open: boolean; item: AssetAssignment | null; delivered_date: string; delivery_condition: AssetCondition; delivery_completeness: AssetCompleteness; delivery_notes: string }>(
    { open: false, item: null, delivered_date: today(), delivery_condition: 'bueno', delivery_completeness: 'completo', delivery_notes: '' }
  );
  const [returnDialog, setReturnDialog] = useState<{ open: boolean; item: AssetAssignment | null; returned_date: string; return_condition: AssetCondition; return_completeness: AssetCompleteness; return_notes: string; resulting_status: 'available' | 'in_repair' }>(
    { open: false, item: null, returned_date: today(), return_condition: 'bueno', return_completeness: 'completo', return_notes: '', resulting_status: 'available' }
  );
  const [cancelDialog, setCancelDialog] = useState<{ open: boolean; item: AssetAssignment | null }>({ open: false, item: null });

  const loadData = useCallback(async (params?: { status?: AssetAssignmentStatus }) => {
    try {
      setLoading(true);
      setError('');
      const [assignments, allTools, allVehicles, emps, projs] = await Promise.all([
        AssetAssignmentService.getAll(params),
        ToolService.getAll(),
        VehicleService.getAll(),
        EmployeeService.getAll('active'),
        ProjectService.getAll(),
      ]);
      setItems(Array.isArray(assignments) ? assignments : []);
      setTools(Array.isArray(allTools) ? allTools : []);
      setVehicles(Array.isArray(allVehicles) ? allVehicles : []);
      setEmployees(Array.isArray(emps) ? emps : []);
      setProjects(Array.isArray(projs) ? projs : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar asignaciones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(statusFilter ? { status: statusFilter } : undefined); }, [loadData, statusFilter]);

  // Deep-link desde Herramientas/Vehículos ("Asignar" en una fila) — precarga el diálogo de
  // alta con el activo ya elegido.
  useEffect(() => {
    const toolId = searchParams.get('tool_id');
    const vehicleId = searchParams.get('vehicle_id');
    if (toolId) {
      setCreateForm({ ...emptyCreateForm(), kind: 'tool', tool_id: Number(toolId) });
      setOpenCreate(true);
    } else if (vehicleId) {
      setCreateForm({ ...emptyCreateForm(), kind: 'vehicle', vehicle_id: Number(vehicleId) });
      setOpenCreate(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredItems = useMemo(() => {
    if (kindFilter === 'all') return items;
    return items.filter(i => kindFilter === 'tool' ? !!i.tool_id : !!i.vehicle_id);
  }, [items, kindFilter]);

  const availableTools = useMemo(() => tools.filter(t => t.status === 'available'), [tools]);
  const availableVehicles = useMemo(() => vehicles.filter(v => v.status === 'available'), [vehicles]);

  const handleOpenCreate = () => {
    setCreateForm(emptyCreateForm());
    setOpenCreate(true);
  };

  const handleSubmitCreate = async () => {
    const { kind, tool_id, vehicle_id, project_id, employee_id, deliverNow, delivered_date, delivery_condition, delivery_completeness, delivery_notes } = createForm;
    if (kind === 'tool' && !tool_id) { setError('Elegí una herramienta'); return; }
    if (kind === 'vehicle' && !vehicle_id) { setError('Elegí una grúa/vehículo'); return; }
    if (kind === 'tool' && !employee_id) { setError('El responsable es obligatorio para asignar una herramienta'); return; }

    try {
      await AssetAssignmentService.create({
        tool_id: kind === 'tool' ? Number(tool_id) : undefined,
        vehicle_id: kind === 'vehicle' ? Number(vehicle_id) : undefined,
        project_id: project_id ? Number(project_id) : undefined,
        employee_id: employee_id ? Number(employee_id) : undefined,
        delivered_date: deliverNow ? delivered_date : undefined,
        delivery_condition: deliverNow ? delivery_condition : undefined,
        delivery_completeness: deliverNow ? delivery_completeness : undefined,
        delivery_notes: deliverNow ? (delivery_notes || undefined) : undefined,
      });
      setSuccess(deliverNow ? 'Entrega registrada' : 'Reserva creada');
      setOpenCreate(false);
      loadData(statusFilter ? { status: statusFilter } : undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la asignación');
    }
  };

  const handleSubmitDeliver = async () => {
    if (!deliverDialog.item) return;
    try {
      await AssetAssignmentService.deliver(deliverDialog.item.id, {
        delivered_date: deliverDialog.delivered_date,
        delivery_condition: deliverDialog.delivery_condition,
        delivery_completeness: deliverDialog.delivery_completeness,
        delivery_notes: deliverDialog.delivery_notes || undefined,
      });
      setSuccess('Entrega confirmada');
      setDeliverDialog({ open: false, item: null, delivered_date: today(), delivery_condition: 'bueno', delivery_completeness: 'completo', delivery_notes: '' });
      loadData(statusFilter ? { status: statusFilter } : undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al confirmar la entrega');
    }
  };

  const handleSubmitReturn = async () => {
    if (!returnDialog.item) return;
    try {
      await AssetAssignmentService.returnAssignment(returnDialog.item.id, {
        returned_date: returnDialog.returned_date,
        return_condition: returnDialog.return_condition,
        return_completeness: returnDialog.return_completeness,
        return_notes: returnDialog.return_notes || undefined,
        resulting_status: returnDialog.resulting_status,
      });
      setSuccess('Devolución registrada');
      setReturnDialog({ open: false, item: null, returned_date: today(), return_condition: 'bueno', return_completeness: 'completo', return_notes: '', resulting_status: 'available' });
      loadData(statusFilter ? { status: statusFilter } : undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar la devolución');
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelDialog.item) return;
    try {
      await AssetAssignmentService.cancel(cancelDialog.item.id);
      setSuccess('Reserva cancelada');
      setCancelDialog({ open: false, item: null });
      loadData(statusFilter ? { status: statusFilter } : undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cancelar la reserva');
    }
  };

  const assetLabel = (item: AssetAssignment) => item.tool ? `${item.tool.name} (${item.tool.reference_code})` : item.vehicle ? `${item.vehicle.brand || ''} ${item.vehicle.model || ''} — ${item.vehicle.plate}`.trim() : '—';

  const renderRowActions = (item: AssetAssignment) => (
    <>
      {item.status === 'reserved' && (
        <>
          <Tooltip title="Confirmar entrega">
            <IconButton size="small" color="success" onClick={() => setDeliverDialog({ open: true, item, delivered_date: today(), delivery_condition: 'bueno', delivery_completeness: 'completo', delivery_notes: '' })}>
              <DeliverIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Cancelar reserva">
            <IconButton size="small" color="error" onClick={() => setCancelDialog({ open: true, item })}><CancelIcon fontSize="small" /></IconButton>
          </Tooltip>
        </>
      )}
      {item.status === 'delivered' && (
        <Tooltip title="Registrar devolución">
          <IconButton size="small" color="primary" onClick={() => setReturnDialog({ open: true, item, returned_date: today(), return_condition: 'bueno', return_completeness: 'completo', return_notes: '', resulting_status: 'available' })}>
            <ReturnIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </>
  );

  if (loading && items.length === 0) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px"><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={1}>
        <Box display="flex" alignItems="center" gap={1}>
          <TitleIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" fontWeight={700} letterSpacing="-0.02em" color="#1E293B">Asignaciones</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => loadData(statusFilter ? { status: statusFilter } : undefined)} size="small">Actualizar</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate} size="small">Nueva Asignación</Button>
        </Box>
      </Box>

      <Typography variant="body2" color="text.secondary" mb={2}>
        Entrega y devolución de herramientas y grúas/vehículos a un proyecto y responsable. El proyecto es opcional;
        el responsable es obligatorio para herramientas.
      </Typography>

      <Box display="flex" flexWrap="wrap" gap={2} mb={2} alignItems="center">
        <ToggleButtonGroup size="small" value={kindFilter} exclusive onChange={(_, v) => v && setKindFilter(v)}>
          <ToggleButton value="all">Todos</ToggleButton>
          <ToggleButton value="tool">Herramientas</ToggleButton>
          <ToggleButton value="vehicle">Grúas/Vehículos</ToggleButton>
        </ToggleButtonGroup>
        <TextField label="Estado" select size="small" sx={{ minWidth: 160 }} value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as '' | AssetAssignmentStatus)}
          SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
          <option value="">Todos</option>
          <option value="reserved">Reservada</option>
          <option value="delivered">Entregada</option>
          <option value="returned">Devuelta</option>
        </TextField>
      </Box>

      <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />
      <FeedbackModal open={!!success} onClose={() => setSuccess('')} message={success} type="success" />

      {/* Mobile Cards */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {filteredItems.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={4}>No hay asignaciones que coincidan</Typography>
        ) : (
          <Stack spacing={2}>
            {filteredItems.map((item) => (
              <Card key={item.id} sx={{ p: 2, borderRadius: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box flex={1}>
                    <Typography variant="subtitle1" fontWeight="bold">{assetLabel(item)}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.employee ? `${item.employee.lastname}, ${item.employee.name}` : 'Sin responsable'}
                      {item.project ? ` · ${item.project.name}` : ''}
                    </Typography>
                    {item.delivered_date && <Typography variant="body2">Entrega: {item.delivered_date}</Typography>}
                    {item.returned_date && <Typography variant="body2">Devolución: {item.returned_date}</Typography>}
                    <Chip size="small" label={STATUS_LABELS[item.status]} color={STATUS_COLORS[item.status]} sx={{ mt: 0.5 }} />
                  </Box>
                  <Box>{renderRowActions(item)}</Box>
                </Box>
              </Card>
            ))}
          </Stack>
        )}
      </Box>

      {/* Desktop Table */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <TableContainer component={Paper} elevation={2}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell><strong>Activo</strong></TableCell>
                <TableCell><strong>Responsable</strong></TableCell>
                <TableCell><strong>Proyecto</strong></TableCell>
                <TableCell><strong>Entrega</strong></TableCell>
                <TableCell><strong>Devolución</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell align="center"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">No hay asignaciones que coincidan</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>{assetLabel(item)}</TableCell>
                    <TableCell>{item.employee ? `${item.employee.lastname}, ${item.employee.name}` : '—'}</TableCell>
                    <TableCell>{item.project?.name || '—'}</TableCell>
                    <TableCell>{item.delivered_date || '—'}</TableCell>
                    <TableCell>{item.returned_date || '—'}</TableCell>
                    <TableCell><Chip size="small" label={STATUS_LABELS[item.status]} color={STATUS_COLORS[item.status]} /></TableCell>
                    <TableCell align="center">{renderRowActions(item)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* ─── Create Dialog ─── */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nueva Asignación</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <ToggleButtonGroup size="small" value={createForm.kind} exclusive
              onChange={(_, v) => v && setCreateForm({ ...createForm, kind: v, tool_id: '', vehicle_id: '' })}>
              <ToggleButton value="tool">Herramienta</ToggleButton>
              <ToggleButton value="vehicle">Grúa/Vehículo</ToggleButton>
            </ToggleButtonGroup>

            {createForm.kind === 'tool' ? (
              <Autocomplete
                options={availableTools}
                getOptionLabel={(t) => `${t.name} (${t.reference_code})`}
                value={availableTools.find(t => t.id === createForm.tool_id) || null}
                onChange={(_, val) => setCreateForm({ ...createForm, tool_id: val ? val.id : '' })}
                renderInput={(params) => <TextField {...params} label="Herramienta *" placeholder="Buscar herramienta disponible..." />}
              />
            ) : (
              <Autocomplete
                options={availableVehicles}
                getOptionLabel={(v) => `${[v.brand, v.model].filter(Boolean).join(' ')} — ${v.plate}`}
                value={availableVehicles.find(v => v.id === createForm.vehicle_id) || null}
                onChange={(_, val) => setCreateForm({ ...createForm, vehicle_id: val ? val.id : '' })}
                renderInput={(params) => <TextField {...params} label="Grúa/Vehículo *" placeholder="Buscar vehículo disponible..." />}
              />
            )}

            <Autocomplete
              options={employees}
              getOptionLabel={(e) => `${e.lastname}, ${e.name}`}
              value={employees.find(e => e.id === createForm.employee_id) || null}
              onChange={(_, val) => setCreateForm({ ...createForm, employee_id: val ? val.id : '' })}
              renderInput={(params) => <TextField {...params} label={`Responsable${createForm.kind === 'tool' ? ' *' : ' (opcional)'}`} placeholder="Buscar empleado..." />}
            />

            <Autocomplete
              options={projects}
              getOptionLabel={(p) => p.name}
              value={projects.find(p => p.id === createForm.project_id) || null}
              onChange={(_, val) => setCreateForm({ ...createForm, project_id: val ? val.id : '' })}
              renderInput={(params) => <TextField {...params} label="Proyecto (opcional)" placeholder="Buscar proyecto..." />}
            />

            <ToggleButtonGroup size="small" value={createForm.deliverNow ? 'deliver' : 'reserve'} exclusive
              onChange={(_, v) => v && setCreateForm({ ...createForm, deliverNow: v === 'deliver' })}>
              <ToggleButton value="reserve">Solo reservar</ToggleButton>
              <ToggleButton value="deliver">Entregar ahora</ToggleButton>
            </ToggleButtonGroup>

            {createForm.deliverNow && (
              <>
                <DateField label="Fecha de entrega" fullWidth value={createForm.delivered_date}
                  onChange={(val) => setCreateForm({ ...createForm, delivered_date: val })}
                  InputLabelProps={{ shrink: true }} />
                <Stack direction="row" spacing={2}>
                  <TextField label="Condición" select fullWidth value={createForm.delivery_condition}
                    onChange={(e) => setCreateForm({ ...createForm, delivery_condition: e.target.value as AssetCondition })}
                    SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
                    {Object.entries(CONDITION_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </TextField>
                  <TextField label="Completitud" select fullWidth value={createForm.delivery_completeness}
                    onChange={(e) => setCreateForm({ ...createForm, delivery_completeness: e.target.value as AssetCompleteness })}
                    SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
                    {Object.entries(COMPLETENESS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </TextField>
                </Stack>
                <TextField label="Notas de entrega" fullWidth multiline rows={2} value={createForm.delivery_notes}
                  onChange={(e) => setCreateForm({ ...createForm, delivery_notes: e.target.value })} />
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)}>Cancelar</Button>
          <Button onClick={handleSubmitCreate} variant="contained">{createForm.deliverNow ? 'Entregar' : 'Reservar'}</Button>
        </DialogActions>
      </Dialog>

      {/* ─── Deliver Dialog (confirmar entrega de una reserva) ─── */}
      <Dialog open={deliverDialog.open} onClose={() => setDeliverDialog({ ...deliverDialog, open: false })} maxWidth="xs" fullWidth>
        <DialogTitle>Confirmar entrega — {deliverDialog.item && assetLabel(deliverDialog.item)}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <DateField label="Fecha de entrega" fullWidth value={deliverDialog.delivered_date}
              onChange={(val) => setDeliverDialog({ ...deliverDialog, delivered_date: val })}
              InputLabelProps={{ shrink: true }} />
            <TextField label="Condición" select fullWidth value={deliverDialog.delivery_condition}
              onChange={(e) => setDeliverDialog({ ...deliverDialog, delivery_condition: e.target.value as AssetCondition })}
              SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
              {Object.entries(CONDITION_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </TextField>
            <TextField label="Completitud" select fullWidth value={deliverDialog.delivery_completeness}
              onChange={(e) => setDeliverDialog({ ...deliverDialog, delivery_completeness: e.target.value as AssetCompleteness })}
              SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
              {Object.entries(COMPLETENESS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </TextField>
            <TextField label="Notas" fullWidth multiline rows={2} value={deliverDialog.delivery_notes}
              onChange={(e) => setDeliverDialog({ ...deliverDialog, delivery_notes: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeliverDialog({ ...deliverDialog, open: false })}>Cancelar</Button>
          <Button onClick={handleSubmitDeliver} variant="contained">Confirmar entrega</Button>
        </DialogActions>
      </Dialog>

      {/* ─── Return Dialog ─── */}
      <Dialog open={returnDialog.open} onClose={() => setReturnDialog({ ...returnDialog, open: false })} maxWidth="xs" fullWidth>
        <DialogTitle>Registrar devolución — {returnDialog.item && assetLabel(returnDialog.item)}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <DateField label="Fecha de devolución" fullWidth value={returnDialog.returned_date}
              onChange={(val) => setReturnDialog({ ...returnDialog, returned_date: val })}
              InputLabelProps={{ shrink: true }} />
            <Stack direction="row" spacing={2}>
              <TextField label="Condición" select fullWidth value={returnDialog.return_condition}
                onChange={(e) => setReturnDialog({ ...returnDialog, return_condition: e.target.value as AssetCondition })}
                SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
                {Object.entries(CONDITION_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </TextField>
              <TextField label="Completitud" select fullWidth value={returnDialog.return_completeness}
                onChange={(e) => setReturnDialog({ ...returnDialog, return_completeness: e.target.value as AssetCompleteness })}
                SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
                {Object.entries(COMPLETENESS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </TextField>
            </Stack>
            <TextField label="Estado resultante" select fullWidth value={returnDialog.resulting_status}
              onChange={(e) => setReturnDialog({ ...returnDialog, resulting_status: e.target.value as 'available' | 'in_repair' })}
              SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}
              helperText="Qué estado queda el activo después de esta devolución">
              <option value="available">Disponible</option>
              <option value="in_repair">En reparación</option>
            </TextField>
            <TextField label="Notas" fullWidth multiline rows={2} value={returnDialog.return_notes}
              onChange={(e) => setReturnDialog({ ...returnDialog, return_notes: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReturnDialog({ ...returnDialog, open: false })}>Cancelar</Button>
          <Button onClick={handleSubmitReturn} variant="contained">Registrar devolución</Button>
        </DialogActions>
      </Dialog>

      {/* ─── Cancel Reservation Dialog ─── */}
      <Dialog open={cancelDialog.open} onClose={() => setCancelDialog({ open: false, item: null })}>
        <DialogTitle>Cancelar reserva</DialogTitle>
        <DialogContent>
          <Typography>¿Cancelar la reserva de <strong>{cancelDialog.item && assetLabel(cancelDialog.item)}</strong>? Vuelve a quedar disponible.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialog({ open: false, item: null })}>Volver</Button>
          <Button onClick={handleConfirmCancel} color="error" variant="contained">Cancelar reserva</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
