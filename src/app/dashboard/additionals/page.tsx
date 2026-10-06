'use client';
import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box, Typography, Button, Paper, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Stack, Chip, Grid, InputAdornment,
} from '@mui/material';
import {
  AddOutlined as AddIcon, RefreshOutlined as RefreshIcon, SearchOutlined as SearchIcon, PostAddOutlined as TitleIcon,
} from '@mui/icons-material';
import FeedbackModal from '../../../components/FeedbackModal';
import GearSpinner from '../../../components/GearSpinner';
import ProjectCodeLabel from '../../../components/projects/ProjectCodeLabel';
import {
  Additional, AdditionalService, AdditionalParentOption, AdditionalClientOption, AdditionalPlantOption, BudgetCurrency, ProjectService,
} from '../../../utils/api';
import { useAuth } from '../../../utils/auth';
import { BUDGET_STATUS_CHIP, PROJECT_STATUS_LABELS, todayLocal } from '../../../utils/additionalStatus';

interface CreateForm {
  name: string;
  client_id: string;
  plant_id: string;
  parent_id: string;
  description: string;
  start_date: string;
  currency: BudgetCurrency;
}

const emptyForm = (): CreateForm => ({ name: '', client_id: '', plant_id: '', parent_id: '', description: '', start_date: todayLocal(), currency: 'ARS' });

function AdditionalsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const permissions: string[] = Array.isArray((user as unknown as Record<string, unknown>)?.permissions)
    ? ((user as unknown as Record<string, unknown>).permissions as string[])
    : [];
  const hasWrite = permissions.includes('admin_granted') || permissions.includes('additionals_write');

  const [items, setItems] = useState<Additional[]>([]);
  const [clients, setClients] = useState<AdditionalClientOption[]>([]);
  const [plants, setPlants] = useState<AdditionalPlantOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtros
  const [search, setSearch] = useState('');
  const [filterClientId, setFilterClientId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterParent, setFilterParent] = useState<'' | 'true' | 'false'>('');

  // Alta
  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState<CreateForm>(emptyForm());
  const [parentOptions, setParentOptions] = useState<AdditionalParentOption[]>([]);
  const [processing, setProcessing] = useState(false);
  const autoOpened = useRef(false);

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await AdditionalService.getAll({
        q: search || undefined,
        client_id: filterClientId ? Number(filterClientId) : undefined,
        status: filterStatus || undefined,
        has_parent: filterParent ? filterParent === 'true' : undefined,
      });
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los adicionales');
    } finally {
      setLoading(false);
    }
  }, [search, filterClientId, filterStatus, filterParent]);

  useEffect(() => {
    Promise.all([AdditionalService.getCatalogClients(), AdditionalService.getCatalogPlants()])
      .then(([cls, pls]) => { setClients(cls); setPlants(pls); })
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar clientes'));
  }, []);

  // Los filtros consultan al servidor; la búsqueda por texto con un pequeño debounce.
  useEffect(() => {
    const timeout = setTimeout(loadItems, search ? 300 : 0);
    return () => clearTimeout(timeout);
  }, [loadItems, search]);

  const loadParentOptions = async (clientId: string) => {
    if (!clientId) { setParentOptions([]); return; }
    try {
      setParentOptions(await AdditionalService.getParentOptions(Number(clientId)));
    } catch {
      setParentOptions([]);
    }
  };

  const handleOpenCreate = () => {
    setForm(emptyForm());
    setParentOptions([]);
    setOpenDialog(true);
  };

  // Atajo desde la pestaña Adicionales de un proyecto: ?parent_id=X abre el alta con ese padre
  // (y su cliente y planta) ya cargados. Solo una vez por visita.
  useEffect(() => {
    const parentId = searchParams.get('parent_id');
    if (!parentId || autoOpened.current || !hasWrite) return;
    autoOpened.current = true;
    ProjectService.getById(Number(parentId))
      .then(async (parent) => {
        setForm({ ...emptyForm(), parent_id: String(parent.id), client_id: String(parent.client_id), plant_id: parent.plant_id ? String(parent.plant_id) : '' });
        await loadParentOptions(String(parent.client_id));
        setOpenDialog(true);
        router.replace('/dashboard/additionals');
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo abrir el alta con ese proyecto'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, hasWrite]);

  const handleClientChange = async (clientId: string) => {
    // Cambiar de cliente invalida el padre y la planta elegidos.
    setForm((prev) => ({ ...prev, client_id: clientId, plant_id: '', parent_id: '' }));
    await loadParentOptions(clientId);
  };

  const handleParentChange = (parentId: string) => {
    const parent = parentOptions.find((p) => String(p.id) === parentId);
    // Al elegir un padre se fijan su cliente y su planta (el backend también los fuerza).
    setForm((prev) => ({ ...prev, parent_id: parentId, plant_id: parent ? (parent.plant_id ? String(parent.plant_id) : '') : prev.plant_id }));
  };

  const parentSelected = !!form.parent_id;

  const handleCreate = async () => {
    if (!form.name.trim() || !form.client_id) {
      setError('El nombre y el cliente son obligatorios');
      return;
    }
    if (processing) return;
    setProcessing(true);
    try {
      const created = await AdditionalService.create({
        name: form.name.trim(),
        client_id: Number(form.client_id),
        plant_id: form.plant_id ? Number(form.plant_id) : null,
        parent_id: form.parent_id ? Number(form.parent_id) : null,
        description: form.description || undefined,
        start_date: form.start_date || undefined,
        currency: form.currency,
      });
      setOpenDialog(false);
      router.push(`/dashboard/additionals/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el adicional');
    } finally {
      setProcessing(false);
    }
  };

  const budgetChip = (item: Additional) => {
    const budget = item.current_budget;
    if (!budget) return <Typography variant="caption" color="text.secondary">Sin presupuesto</Typography>;
    const cfg = BUDGET_STATUS_CHIP[budget.status];
    return <Chip size="small" label={`${budget.number} · ${cfg.label}`} color={cfg.color} variant={budget.status === 'draft' ? 'outlined' : 'filled'} />;
  };

  const formatHours = (hours: number) => `${hours.toLocaleString('es-AR', { maximumFractionDigits: 1 })} hs`;
  const formatDate = (date?: string) => (date ? new Date(`${date}T00:00:00`).toLocaleDateString('es-AR') : '—');

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={1}>
        <Box display="flex" alignItems="center" gap={1}>
          <TitleIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" fontWeight={700} letterSpacing="-0.02em" color="#1E293B">Adicionales</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadItems} size="small">Actualizar</Button>
          {hasWrite && <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate} size="small">Nuevo adicional</Button>}
        </Box>
      </Box>

      <Typography variant="body2" color="text.secondary" mb={2}>
        Trabajos urgentes que arrancan ya, sin pedido de cotización ni presupuesto aprobado. Cada adicional es un proyecto propio, con o sin proyecto padre.
      </Typography>

      <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />

      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField size="small" fullWidth placeholder="Buscar por nombre o código…" value={search} onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField label="Cliente" select size="small" fullWidth value={filterClientId} onChange={(e) => setFilterClientId(e.target.value)}
              SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
              <option value="">Todos los clientes</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.razonSocial}</option>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField label="Estado" select size="small" fullWidth value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
              <option value="">Todos los estados</option>
              {Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField label="Proyecto padre" select size="small" fullWidth value={filterParent} onChange={(e) => setFilterParent(e.target.value as '' | 'true' | 'false')}
              SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
              <option value="">Todos</option>
              <option value="true">Con padre</option>
              <option value="false">Sin padre</option>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {loading && items.length === 0 ? (
        <Box display="flex" justifyContent="center" py={6}><GearSpinner /></Box>
      ) : (
        <>
          {/* Mobile Cards */}
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            {items.length === 0 ? (
              <Typography color="text.secondary" textAlign="center" py={4}>No hay adicionales que coincidan</Typography>
            ) : (
              <Stack spacing={2}>
                {items.map((item) => (
                  <Card key={item.id} sx={{ p: 2, borderRadius: 2, cursor: 'pointer' }} onClick={() => router.push(`/dashboard/additionals/${item.id}`)}>
                    <ProjectCodeLabel project={item} />
                    <Typography variant="subtitle1" fontWeight="bold">{item.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.client?.razonSocial}{item.plant ? ` · ${item.plant.name}` : ''}
                    </Typography>
                    <Box display="flex" gap={1} flexWrap="wrap" alignItems="center" mt={1}>
                      <Chip size="small" label={PROJECT_STATUS_LABELS[item.status]} color={item.status === 'active' ? 'success' : 'default'} />
                      {budgetChip(item)}
                    </Box>
                    <Typography variant="body2" color="text.secondary" mt={1}>
                      {formatHours(item.consumed_hours_own)} consumidas · Inicio: {formatDate(item.start_date)}
                    </Typography>
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
                    <TableCell><strong>Código</strong></TableCell>
                    <TableCell><strong>Nombre</strong></TableCell>
                    <TableCell><strong>Cliente / Planta</strong></TableCell>
                    <TableCell><strong>Estado</strong></TableCell>
                    <TableCell><strong>Presupuesto</strong></TableCell>
                    <TableCell align="right"><strong>Horas</strong></TableCell>
                    <TableCell><strong>Inicio</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">No hay adicionales que coincidan</Typography>
                      </TableCell>
                    </TableRow>
                  ) : items.map((item) => (
                    <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => router.push(`/dashboard/additionals/${item.id}`)}>
                      <TableCell><ProjectCodeLabel project={item} /></TableCell>
                      <TableCell><Typography fontWeight="medium">{item.name}</Typography></TableCell>
                      <TableCell>
                        {item.client?.razonSocial}
                        {item.plant && <Typography variant="caption" color="text.secondary" display="block">{item.plant.name}</Typography>}
                      </TableCell>
                      <TableCell><Chip size="small" label={PROJECT_STATUS_LABELS[item.status]} color={item.status === 'active' ? 'success' : 'default'} /></TableCell>
                      <TableCell>{budgetChip(item)}</TableCell>
                      <TableCell align="right">{formatHours(item.consumed_hours_own)}</TableCell>
                      <TableCell>{formatDate(item.start_date)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </>
      )}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nuevo adicional</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Al crearlo se genera el proyecto (activo, listo para cargar horas) y su presupuesto en borrador.
            </Typography>
            <TextField label="Nombre *" fullWidth value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} inputProps={{ maxLength: 150 }} />
            <TextField label="Cliente *" select fullWidth value={form.client_id} onChange={(e) => handleClientChange(e.target.value)}
              SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
              <option value="">— Seleccionar —</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.razonSocial}</option>)}
            </TextField>
            <TextField label="Adicional de (opcional)" select fullWidth value={form.parent_id} onChange={(e) => handleParentChange(e.target.value)}
              disabled={!form.client_id} SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}
              helperText={form.client_id ? 'Vacío: es un adicional sin proyecto padre. Se puede asignar o cambiar después.' : 'Elegí primero el cliente.'}>
              <option value="">— Sin proyecto padre —</option>
              {parentOptions.map((p) => <option key={p.id} value={p.id}>{p.code} - {p.name}</option>)}
            </TextField>
            <TextField label="Planta" select fullWidth value={form.plant_id} onChange={(e) => setForm({ ...form, plant_id: e.target.value })}
              disabled={!form.client_id || parentSelected} SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}
              helperText={parentSelected ? 'Se toma del proyecto padre' : undefined}>
              <option value="">— Ninguna —</option>
              {plants.filter((p) => p.client_id === Number(form.client_id)).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </TextField>
            <TextField label="Descripción" fullWidth multiline rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Fecha de inicio" type="date" fullWidth value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Moneda del presupuesto" select fullWidth value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value as BudgetCurrency })}
                  SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
                  <option value="ARS">ARS ($)</option>
                  <option value="USD">USD (US$)</option>
                </TextField>
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={handleCreate} variant="contained" disabled={processing}>{processing ? <GearSpinner size={20} /> : 'Crear'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default function AdditionalsPage() {
  return (
    <Suspense fallback={<Box display="flex" justifyContent="center" py={6}><GearSpinner /></Box>}>
      <AdditionalsContent />
    </Suspense>
  );
}
