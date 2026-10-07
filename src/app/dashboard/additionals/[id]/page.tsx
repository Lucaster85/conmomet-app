'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Alert, Box, Button, Card, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Grid, IconButton,
  Link, Paper, Stack, TextField, Tooltip, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import {
  AddOutlined as AddIcon, ArrowBackOutlined as BackIcon, DeleteOutlined as DeleteIcon, SaveOutlined as SaveIcon,
  OpenInNewOutlined as OpenIcon, RequestQuoteOutlined as BudgetIcon, ScheduleOutlined as HoursIcon, InfoOutlined as InfoIcon,
} from '@mui/icons-material';
import FeedbackModal from '../../../../components/FeedbackModal';
import GearSpinner from '../../../../components/GearSpinner';
import CurrencyInput from '../../../../components/CurrencyInput';
import ProjectCodeLabel from '../../../../components/projects/ProjectCodeLabel';
import ProjectLogPanel from '../../../../components/projects/ProjectLogPanel';
import MaterialSelect from '../../../../components/materials/MaterialSelect';
import ProviderPriceAutocomplete from '../../../../components/materials/ProviderPriceAutocomplete';
import {
  Additional, AdditionalMaterialItem, AdditionalParentOption, AdditionalPlantOption, AdditionalService, BudgetCurrency, Material,
  MaterialProvider, MaterialUnit, Project,
} from '../../../../utils/api';
import { useAuth } from '../../../../utils/auth';
import { findPrice } from '../../../../utils/materialPrices';
import { BUDGET_STATUS_CHIP, PROJECT_STATUS_LABELS } from '../../../../utils/additionalStatus';

interface GeneralForm {
  name: string;
  description: string;
  plant_id: string;
  parent_id: string;
  status: Project['status'];
  start_date: string;
  end_date: string;
}

interface QuickAdd {
  open: boolean;
  lineIdx: number;
  description: string;
  unitId: string;
  providerId: number | null;
  cost: number | null;
  currency: BudgetCurrency;
}

const closedQuickAdd = (): QuickAdd => ({ open: false, lineIdx: -1, description: '', unitId: '', providerId: null, cost: null, currency: 'ARS' });

const toGeneralForm = (a: Additional): GeneralForm => ({
  name: a.name,
  description: a.description || '',
  plant_id: a.plant_id ? String(a.plant_id) : '',
  parent_id: a.parent_id ? String(a.parent_id) : '',
  status: a.status,
  start_date: a.start_date || '',
  end_date: a.end_date || '',
});

const formatDate = (date?: string | null) => (date ? new Date(date.length === 10 ? `${date}T00:00:00` : date).toLocaleDateString('es-AR') : '—');

export default function AdditionalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const theme = useTheme();
  const { user } = useAuth();
  const id = Number(params.id);

  const permissions: string[] = Array.isArray((user as unknown as Record<string, unknown>)?.permissions)
    ? ((user as unknown as Record<string, unknown>).permissions as string[])
    : [];
  const can = (name: string) => permissions.includes('admin_granted') || permissions.includes(name);
  const canUpdate = can('additionals_update');
  const canWrite = can('additionals_write');
  const canDelete = can('additionals_delete');
  const hasCostsRead = can('material_costs_read');
  const hasBudgetsRead = can('budgets_read');
  const hasProjectsRead = can('projects_read');

  // Debajo de 1100px no entra la grilla alineada de materiales: pasan a tarjetas apiladas.
  const stacked = useMediaQuery(theme.breakpoints.down(1100));

  const [additional, setAdditional] = useState<Additional | null>(null);
  const [general, setGeneral] = useState<GeneralForm | null>(null);
  const [items, setItems] = useState<AdditionalMaterialItem[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [units, setUnits] = useState<MaterialUnit[]>([]);
  const [providers, setProviders] = useState<MaterialProvider[]>([]);
  const [plants, setPlants] = useState<AdditionalPlantOption[]>([]);
  const [parentOptions, setParentOptions] = useState<AdditionalParentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [savingMaterials, setSavingMaterials] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [quickAdd, setQuickAdd] = useState<QuickAdd>(closedQuickAdd());
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [creatingBudget, setCreatingBudget] = useState(false);

  const applyAdditional = useCallback((data: Additional) => {
    setAdditional(data);
    setGeneral(toGeneralForm(data));
    setItems(data.current_budget_items || []);
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await AdditionalService.get(id);
      applyAdditional(data);
      const [mats, mUnits, mProviders, pls, parents] = await Promise.all([
        AdditionalService.getCatalogMaterials(),
        AdditionalService.getCatalogUnits(),
        AdditionalService.getCatalogProviders(),
        AdditionalService.getCatalogPlants(),
        AdditionalService.getParentOptions(data.client_id),
      ]);
      setMaterials(mats);
      setUnits(mUnits);
      setProviders(mProviders);
      setPlants(pls);
      setParentOptions(parents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el adicional');
    } finally {
      setLoading(false);
    }
  }, [id, applyAdditional]);

  useEffect(() => { load(); }, [load]);

  const budget = additional?.current_budget || null;
  const budgetEditable = budget?.status === 'draft';
  const materialsReadOnly = !budgetEditable || !canUpdate;
  const budgetCurrency: BudgetCurrency = budget?.currency || 'ARS';
  const unspecifiedProvider = providers.find((p) => p.is_system) || null;

  // ----- Datos generales -----
  const generalDirty = !!additional && !!general && JSON.stringify(general) !== JSON.stringify(toGeneralForm(additional));

  const handleSaveGeneral = async () => {
    if (!general || !additional) return;
    if (!general.name.trim()) { setError('El nombre es obligatorio'); return; }
    setSavingGeneral(true);
    try {
      const updated = await AdditionalService.update(additional.id, {
        name: general.name.trim(),
        description: general.description || null,
        plant_id: general.plant_id ? Number(general.plant_id) : null,
        parent_id: general.parent_id ? Number(general.parent_id) : null,
        status: general.status,
        start_date: general.start_date || null,
        end_date: general.end_date || null,
      });
      // Se conserva lo que el usuario venía editando en materiales (sin guardar).
      setAdditional(updated);
      setGeneral(toGeneralForm(updated));
      setSuccess('Datos del adicional actualizados');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSavingGeneral(false);
    }
  };

  // Al elegir un padre con planta, la planta pasa a ser la del padre (el backend lo hace igual).
  const handleParentChange = (parentId: string) => {
    if (!general) return;
    const parent = parentOptions.find((p) => String(p.id) === parentId);
    setGeneral({ ...general, parent_id: parentId, plant_id: parent?.plant_id ? String(parent.plant_id) : general.plant_id });
  };

  // ----- Materiales -----
  const updateItem = (idx: number, patch: Partial<AdditionalMaterialItem>) =>
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, ...patch } : item)));

  const addItem = () => setItems((prev) => [...prev, {
    material_id: null, description: '', quantity: 0, material_unit_id: units.find((u) => u.label.toLowerCase() === 'u')?.id || 0,
  }]);

  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  // Vincula una línea a un material del catálogo con un proveedor: el costo base es el precio de
  // ese par (si no tiene, queda vacío para cargarlo a mano — con material_costs_read).
  const linkMaterial = (idx: number, material: Material, provider: MaterialProvider | null) => {
    const price = findPrice(material, provider?.id);
    updateItem(idx, {
      material_id: material.id,
      material,
      description: material.description,
      material_unit_id: material.material_unit_id,
      provider_id: provider?.id ?? null,
      provider,
      material_cost_snapshot: price?.cost != null ? Number(price.cost) : null,
      material_cost_currency: price?.currency ?? budgetCurrency,
    });
  };

  const handleProviderChange = (idx: number, provider: MaterialProvider) => {
    const material = materials.find((m) => m.id === items[idx]?.material_id);
    if (material) linkMaterial(idx, material, provider);
  };

  const createProviderInline = async (name: string) => {
    const created = await AdditionalService.createCatalogProvider(name);
    setProviders((prev) => (prev.some((p) => p.id === created.id) ? prev : [...prev, created]));
    return created;
  };

  const handleConfirmQuickAdd = async () => {
    if (!quickAdd.unitId) { setError('Elegí una unidad para el material nuevo'); return; }
    try {
      const providerId = quickAdd.providerId ?? unspecifiedProvider?.id ?? null;
      const created = await AdditionalService.createCatalogMaterial({
        description: quickAdd.description,
        material_unit_id: Number(quickAdd.unitId),
        // El costo ingresado se guarda como precio del proveedor elegido.
        provider_prices: hasCostsRead && providerId
          ? [{ provider_id: providerId, cost: quickAdd.cost, currency: quickAdd.cost != null ? quickAdd.currency : null }]
          : undefined,
      });
      setMaterials((prev) => [...prev, created]);
      linkMaterial(quickAdd.lineIdx, created, providers.find((p) => p.id === providerId) || unspecifiedProvider);
      setQuickAdd(closedQuickAdd());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el material');
    }
  };

  const handleSaveMaterials = async () => {
    if (items.some((item) => !item.material_id)) {
      setError('Todas las líneas tienen que tener un material del catálogo');
      return;
    }
    setSavingMaterials(true);
    try {
      // Sin margen ni precio al cliente: este módulo no los ve ni los edita.
      const saved = await AdditionalService.updateMaterials(id, items.map((item) => ({
        id: item.id,
        material_id: item.material_id,
        provider_id: item.provider_id ?? null,
        description: item.description,
        quantity: Number(item.quantity) || 0,
        material_unit_id: item.material_unit_id,
        ...(hasCostsRead ? { material_cost_snapshot: item.material_cost_snapshot ?? null, material_cost_currency: item.material_cost_currency ?? null } : {}),
      })));
      setItems(saved);
      setSuccess('Materiales guardados');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar los materiales');
    } finally {
      setSavingMaterials(false);
    }
  };

  // ----- Presupuesto rechazado -----
  const handleNewBudget = async () => {
    setCreatingBudget(true);
    try {
      applyAdditional(await AdditionalService.newBudget(id));
      setSuccess('Se creó un presupuesto nuevo en borrador, con los materiales del rechazado');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el presupuesto');
    } finally {
      setCreatingBudget(false);
    }
  };

  const handleDelete = async () => {
    try {
      await AdditionalService.delete(id);
      router.push('/dashboard/additionals');
    } catch (err) {
      setDeleteOpen(false);
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  if (loading && !additional) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px"><GearSpinner /></Box>;
  }
  if (!additional || !general) {
    return (
      <Box>
        <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />
        <Button startIcon={<BackIcon />} onClick={() => router.push('/dashboard/additionals')}>Volver a Adicionales</Button>
      </Box>
    );
  }

  const budgetChip = budget ? BUDGET_STATUS_CHIP[budget.status] : null;

  // ----- Grilla de materiales -----
  const gridTemplate = ['minmax(0, 2.4fr)', 'minmax(0, 1.8fr)', '88px', '110px', ...(hasCostsRead ? ['140px'] : []), '40px'].join(' ');
  const headers = ['Material', 'Proveedor', 'Cant.', 'Unidad', ...(hasCostsRead ? ['Costo real'] : []), ''];

  const renderItem = (item: AdditionalMaterialItem, idx: number) => {
    const lbl = (text: string) => (stacked ? text : '');
    const material = materials.find((m) => m.id === item.material_id);
    const materialField = (
      <MaterialSelect
        materials={materials} value={item.material_id ?? null} disabled={materialsReadOnly}
        onChange={(m) => { if (m) linkMaterial(idx, m, unspecifiedProvider); }}
        onCreateRequest={(name) => setQuickAdd({ ...closedQuickAdd(), open: true, lineIdx: idx, description: name, providerId: unspecifiedProvider?.id ?? null, currency: budgetCurrency })}
        label={lbl('Material')} placeholder="Buscar material…"
      />
    );
    const providerField = (
      <ProviderPriceAutocomplete
        providers={providers} prices={material?.providerPrices || []}
        value={item.material_id ? (item.provider_id ?? null) : null} valueFallback={item.provider}
        disabled={materialsReadOnly || !item.material_id} disableClearable showPrices={hasCostsRead}
        label={lbl('Proveedor')} placeholder="Elegí un material primero"
        onChange={(p) => { if (p) handleProviderChange(idx, p); }}
        onCreate={createProviderInline} onError={setError}
      />
    );
    const quantityField = (
      <TextField type="number" size="small" fullWidth label={lbl('Cant.')} value={item.quantity} disabled={materialsReadOnly}
        inputProps={{ min: 0 }} onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })} />
    );
    const unitField = (
      <TextField select size="small" fullWidth label={lbl('Unidad')} value={item.material_unit_id || ''} disabled={materialsReadOnly}
        onChange={(e) => updateItem(idx, { material_unit_id: Number(e.target.value) })}
        SelectProps={{ native: true }} InputLabelProps={stacked ? { shrink: true } : undefined}>
        <option value="">—</option>
        {units.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
      </TextField>
    );
    const costField = !hasCostsRead ? null : (
      <CurrencyInput
        size="small" fullWidth label={lbl('Costo real')} disabled={materialsReadOnly || !item.material_id}
        currency={item.material_cost_currency || budgetCurrency}
        value={item.material_cost_snapshot ?? null}
        onChange={(cost) => updateItem(idx, { material_cost_snapshot: cost, material_cost_currency: item.material_cost_currency || budgetCurrency })}
      />
    );
    const removeButton = materialsReadOnly ? <Box /> : (
      <Tooltip title="Quitar material">
        <IconButton size="small" color="error" onClick={() => removeItem(idx)}><DeleteIcon fontSize="small" /></IconButton>
      </Tooltip>
    );

    if (!stacked) {
      return (
        <Box key={idx} sx={{ display: 'grid', gridTemplateColumns: gridTemplate, gap: 1, alignItems: 'center', py: 0.75, borderBottom: '1px solid', borderColor: 'divider' }}>
          {materialField}{providerField}{quantityField}{unitField}{costField}
          <Box textAlign="center">{removeButton}</Box>
        </Box>
      );
    }
    return (
      <Box key={idx} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
        <Stack spacing={1.5}>
          <Box display="flex" gap={1} alignItems="flex-start">
            <Box sx={{ flex: 1, minWidth: 0, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
              {materialField}{providerField}
            </Box>
            {removeButton}
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 1.5 }}>
            {quantityField}{unitField}{costField}
          </Box>
        </Stack>
      </Box>
    );
  };

  return (
    <Box>
      <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />
      <FeedbackModal open={!!success} onClose={() => setSuccess('')} message={success} type="success" />

      <Button startIcon={<BackIcon />} size="small" onClick={() => router.push('/dashboard/additionals')} sx={{ mb: 1 }}>Adicionales</Button>

      {/* Encabezado */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1}>
          <Box>
            <ProjectCodeLabel project={additional} />
            <Typography variant="h5" fontWeight={700}>{additional.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {additional.client?.razonSocial}{additional.plant ? ` · ${additional.plant.name}` : ''}
            </Typography>
          </Box>
          <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
            <Chip size="small" label={PROJECT_STATUS_LABELS[additional.status]} color={additional.status === 'active' ? 'success' : 'default'} />
            {budget && budgetChip && (hasBudgetsRead ? (
              <Chip size="small" icon={<BudgetIcon />} clickable label={`${budget.number} · ${budgetChip.label}`} color={budgetChip.color}
                onClick={() => router.push(`/dashboard/budgets?view=${budget.id}`)} />
            ) : (
              <Chip size="small" label={`${budget.number} · ${budgetChip.label}`} color={budgetChip.color} />
            ))}
            {hasProjectsRead && (
              <Button size="small" endIcon={<OpenIcon />} onClick={() => router.push(`/dashboard/projects/${additional.id}`)}>Ver proyecto completo</Button>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Presupuesto rechazado */}
      {budget?.status === 'rejected' && (
        <Alert severity="warning" sx={{ mb: 2 }}
          action={canWrite ? (
            <Button color="inherit" size="small" onClick={handleNewBudget} disabled={creatingBudget}>
              {creatingBudget ? 'Creando…' : 'Nuevo presupuesto'}
            </Button>
          ) : undefined}>
          El cliente rechazó el presupuesto {budget.number}{budget.rejection_reason ? ` — motivo: ${budget.rejection_reason}` : ''}.
          El adicional sigue activo: «Nuevo presupuesto» parte del rechazado (con sus materiales) y queda vinculado a este adicional.
        </Alert>
      )}

      {/* Datos generales */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" alignItems="center" gap={0.5} mb={2}>
          <Typography variant="h6" fontWeight={700}>Datos generales</Typography>
          {/* La explicación de la sincronización con el presupuesto va en un tooltip (tocar el ícono en el celular). */}
          <Tooltip enterTouchDelay={0} leaveTouchDelay={6000} title={
            budgetEditable
              ? 'El nombre, la descripción y la planta se usan también en el presupuesto mientras esté en borrador: editarlos acá los actualiza allá (y al revés).'
              : budget
                ? 'El presupuesto ya fue enviado: los cambios de nombre, descripción y planta no se reflejan ahí (es lo que se le mandó al cliente).'
                : 'Este adicional no tiene presupuesto.'
          }>
            <IconButton size="small" color="info" aria-label="Información sobre los datos generales"><InfoIcon fontSize="small" /></IconButton>
          </Tooltip>
        </Box>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 8 }}>
            <TextField label="Nombre *" fullWidth value={general.name} disabled={!canUpdate} inputProps={{ maxLength: 150 }}
              onChange={(e) => setGeneral({ ...general, name: e.target.value })} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField label="Estado" select fullWidth value={general.status} disabled={!canUpdate}
              onChange={(e) => setGeneral({ ...general, status: e.target.value as Project['status'] })}
              SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
              {Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField label="Descripción" fullWidth multiline minRows={2} value={general.description} disabled={!canUpdate}
              onChange={(e) => setGeneral({ ...general, description: e.target.value })} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField label="Adicional de (proyecto padre)" select fullWidth value={general.parent_id} disabled={!canUpdate}
              onChange={(e) => handleParentChange(e.target.value)} SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}
              helperText="Opcional. Se puede asignar, cambiar o quitar en cualquier momento: el código del adicional no cambia y las horas se consolidan en el padre.">
              <option value="">— Sin proyecto padre —</option>
              {parentOptions.map((p) => <option key={p.id} value={p.id}>{p.code} - {p.name}</option>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField label="Planta" select fullWidth value={general.plant_id} disabled={!canUpdate}
              onChange={(e) => setGeneral({ ...general, plant_id: e.target.value })} SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
              <option value="">— Ninguna —</option>
              {plants.filter((p) => p.client_id === additional.client_id).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Fecha de inicio" type="date" fullWidth value={general.start_date} disabled={!canUpdate}
              onChange={(e) => setGeneral({ ...general, start_date: e.target.value })} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Fecha de fin" type="date" fullWidth value={general.end_date} disabled={!canUpdate}
              onChange={(e) => setGeneral({ ...general, end_date: e.target.value })} InputLabelProps={{ shrink: true }} />
          </Grid>
        </Grid>
        {canUpdate && (
          <Box display="flex" justifyContent="flex-end" mt={2}>
            <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveGeneral} disabled={!generalDirty || savingGeneral}>
              {savingGeneral ? <GearSpinner size={20} /> : 'Guardar datos'}
            </Button>
          </Box>
        )}
      </Paper>

      {/* Materiales */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} mb={1}>
          <Typography variant="h6" fontWeight={700}>Materiales</Typography>
          {!materialsReadOnly && (
            <Button size="small" startIcon={<AddIcon />} onClick={addItem}>Agregar material</Button>
          )}
        </Box>
        <Typography variant="body2" color="text.secondary" mb={1.5}>
          Material, cantidad, proveedor{hasCostsRead ? ' y costo real' : ''}. Se guardan en el presupuesto del adicional.
        </Typography>
        {!budget ? (
          <Alert severity="info">Este adicional no tiene presupuesto.</Alert>
        ) : !budgetEditable && (
          <Alert severity="warning" sx={{ mb: 1.5 }}>
            {budget.status === 'rejected'
              ? 'El presupuesto fue rechazado: los materiales quedan en solo lectura. Creá un presupuesto nuevo para volver a editarlos.'
              : 'El presupuesto ya fue enviado: los materiales quedan en solo lectura.'}
          </Alert>
        )}
        {items.length === 0 ? (
          <Typography variant="body2" color="text.secondary" py={2}>Todavía no hay materiales cargados.</Typography>
        ) : (
          <Box>
            {!stacked && (
              <Box sx={{ display: 'grid', gridTemplateColumns: gridTemplate, gap: 1, pb: 0.5, borderBottom: '2px solid', borderColor: 'divider' }}>
                {headers.map((header, i) => <Typography key={i} variant="caption" fontWeight={700} color="text.secondary">{header}</Typography>)}
              </Box>
            )}
            <Stack spacing={stacked ? 1.5 : 0} sx={{ mt: stacked ? 0 : 0.5 }}>
              {items.map((item, idx) => renderItem(item, idx))}
            </Stack>
          </Box>
        )}
        {!materialsReadOnly && (
          <Box display="flex" justifyContent="flex-end" mt={2}>
            <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveMaterials} disabled={savingMaterials}>
              {savingMaterials ? <GearSpinner size={20} /> : 'Guardar materiales'}
            </Button>
          </Box>
        )}
      </Paper>

      {/* Horas */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
          <Box display="flex" alignItems="center" gap={1}>
            <HoursIcon color="primary" />
            <Box>
              <Typography variant="h6" fontWeight={700}>Horas</Typography>
              <Typography variant="body2" color="text.secondary">
                {additional.consumed_hours_own.toLocaleString('es-AR', { maximumFractionDigits: 1 })} hs consumidas (aprobadas)
              </Typography>
            </Box>
          </Box>
          <Box display="flex" gap={1} flexWrap="wrap">
            {can('time_entries_read') && <Button size="small" variant="outlined" onClick={() => router.push('/dashboard/time-entries')}>Cargar horas</Button>}
            {hasProjectsRead && <Button size="small" variant="outlined" onClick={() => router.push(`/dashboard/projects/${additional.id}`)}>Ver detalle en el proyecto</Button>}
          </Box>
        </Box>
        <Typography variant="caption" color="text.secondary" display="block" mt={1}>
          Las horas se cargan desde Carga de Horas, eligiendo este adicional como cualquier proyecto.
        </Typography>
      </Paper>

      {/* Seguimiento: notas de seguimiento con fecha y fotos (solo agregar). Es la del proyecto del adicional. */}
      {can('project_logs_read') && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" fontWeight={700} mb={0.5}>Seguimiento</Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Notas de seguimiento con fecha: qué se compró, qué se hizo. Se pueden sumar fotos.
          </Typography>
          <ProjectLogPanel projectId={additional.id} />
        </Paper>
      )}

      {/* Historial de presupuestos */}
      {(additional.budget_history || []).length > 0 && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" fontWeight={700} mb={1}>Historial de presupuestos</Typography>
          <Stack spacing={1}>
            {(additional.budget_history || []).map((b) => {
              const cfg = BUDGET_STATUS_CHIP[b.status];
              return (
                <Card key={b.id} sx={{ p: 1.5, borderRadius: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                    <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                      {hasBudgetsRead
                        ? <Link component="button" underline="hover" variant="body2" fontWeight={600} onClick={() => router.push(`/dashboard/budgets?view=${b.id}`)}>{b.number}</Link>
                        : <Typography variant="body2" fontWeight={600}>{b.number}</Typography>}
                      <Chip size="small" label={cfg.label} color={cfg.color} />
                    </Box>
                    <Typography variant="caption" color="text.secondary">{formatDate(b.created_at)}</Typography>
                  </Box>
                  {b.status === 'rejected' && b.rejection_reason && (
                    <Typography variant="body2" color="text.secondary" mt={0.5}>Motivo: {b.rejection_reason}</Typography>
                  )}
                </Card>
              );
            })}
          </Stack>
        </Paper>
      )}

      {canDelete && (
        <>
          <Divider sx={{ my: 2 }} />
          <Box display="flex" justifyContent="flex-end">
            <Button color="error" variant="outlined" startIcon={<DeleteIcon />} onClick={() => setDeleteOpen(true)}>Eliminar adicional</Button>
          </Box>
        </>
      )}

      {/* Alta rápida de material */}
      <Dialog open={quickAdd.open} onClose={() => setQuickAdd(closedQuickAdd())} maxWidth="xs" fullWidth>
        <DialogTitle>Nuevo material</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Descripción" fullWidth value={quickAdd.description} onChange={(e) => setQuickAdd({ ...quickAdd, description: e.target.value })} />
            <TextField label="Unidad *" select fullWidth value={quickAdd.unitId} onChange={(e) => setQuickAdd({ ...quickAdd, unitId: e.target.value })}
              SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
              <option value="">— Seleccionar —</option>
              {units.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
            </TextField>
            {hasCostsRead && (
              <>
                <ProviderPriceAutocomplete providers={providers} value={quickAdd.providerId} showPrices={false} disableClearable size="medium"
                  onChange={(p) => { if (p) setQuickAdd({ ...quickAdd, providerId: p.id }); }} onCreate={createProviderInline} onError={setError} />
                <Stack direction="row" spacing={2}>
                  <CurrencyInput label="Costo real (opcional)" fullWidth value={quickAdd.cost} currency={quickAdd.currency}
                    onChange={(value) => setQuickAdd({ ...quickAdd, cost: value })} />
                  <TextField label="Moneda" select fullWidth value={quickAdd.currency} onChange={(e) => setQuickAdd({ ...quickAdd, currency: e.target.value as BudgetCurrency })}
                    SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
                    <option value="ARS">ARS</option>
                    <option value="USD">USD</option>
                  </TextField>
                </Stack>
              </>
            )}
            {!hasCostsRead && (
              <Typography variant="caption" color="text.secondary">
                Se crea sin costo ni proveedor — alguien con permiso lo completa después desde el catálogo de Materiales.
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQuickAdd(closedQuickAdd())}>Cancelar</Button>
          <Button onClick={handleConfirmQuickAdd} variant="contained">Crear y usar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Eliminar adicional</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Eliminar <strong>{additional.name}</strong> y su presupuesto en borrador? No se puede si ya tiene horas cargadas o si el presupuesto ya fue enviado.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Eliminar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
