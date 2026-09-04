'use client';
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, CircularProgress, Tooltip, TextField, Stack, Chip, Divider, Grid,
  Autocomplete, createFilterOptions, useMediaQuery, useTheme,
} from '@mui/material';
import FeedbackModal from '../../../components/FeedbackModal';
import {
  AddOutlined as AddIcon, EditOutlined as EditIcon, DeleteOutlined as DeleteIcon, RefreshOutlined as RefreshIcon,
  ContentCopyOutlined as DuplicateIcon, VisibilityOutlined as ViewIcon, PlayArrowOutlined as GenerateIcon,
  UploadFileOutlined as UploadIcon, SendOutlined as SendIcon, CheckCircleOutlined as ApproveIcon,
  CancelOutlined as RejectIcon, PrintOutlined as PrintIcon, DescriptionOutlined as DocumentIcon,
  AssignmentOutlined as ProjectIcon, DownloadOutlined as DownloadIcon, PercentOutlined as DiscountIcon,
  RequestQuoteOutlined as TitleIcon,
} from '@mui/icons-material';
import {
  Budget, BudgetService, BudgetLaborLine, BudgetMaterialItem, CreateBudgetData,
  BudgetItemType, BudgetItemTypeService, MaterialUnit, MaterialUnitService,
  Material, MaterialService, Client, ClientService, Plant, PlantService,
  Project, ProjectService, BudgetCurrency,
  ClientSupervisor, ClientSupervisorService, ClientItemRate, ClientItemRateService,
} from '../../../utils/api';
import { useAuth } from '../../../utils/auth';

const STATUS_LABELS: Record<string, { label: string; color: 'default' | 'info' | 'success' | 'error' }> = {
  draft: { label: 'Borrador', color: 'default' },
  sent: { label: 'Enviado', color: 'info' },
  approved: { label: 'Aprobado', color: 'success' },
  rejected: { label: 'Rechazado', color: 'error' },
};

const emptyForm = () => ({
  title: '',
  client_id: '',
  plant_id: '',
  currency: 'ARS' as BudgetCurrency,
  parent_project_id: '',
  existing_project_id: '',
  description: '',
  start_date: '',
  end_date: '',
  validity_days: 15,
  notes: '',
  work_order_number: '',
  laborLines: [] as BudgetLaborLine[],
  materialItems: [] as BudgetMaterialItem[],
});

// Opción del Autocomplete "creatable" de Unidad: una unidad real del catálogo, o la
// pseudo-opción sintética "Agregar '<texto>'" (identificada por tener `inputValue`).
interface MaterialUnitOption {
  id?: number;
  label: string;
  inputValue?: string;
}
const materialUnitFilter = createFilterOptions<MaterialUnitOption>();

// Igual patrón para el Autocomplete "creatable" de Material — a diferencia de Unidad, dar de
// alta uno nuevo pide un dato más (la unidad), así que la opción sintética abre un mini
// diálogo en vez de crear directo.
interface MaterialOption {
  id?: number;
  description: string;
  inputValue?: string;
}
const materialFilter = createFilterOptions<MaterialOption>();

// Mismo patrón "creatable" para elegir quién aprobó del lado del cliente (ClientSupervisor).
// Igual que Material, dar de alta uno nuevo pide más de un dato (nombre y apellido por
// separado), así que la opción sintética abre un mini diálogo en vez de crear directo.
interface SupervisorOption {
  id?: number;
  label: string; // "Apellido, Nombre" ya armado, para no repetir el getOptionLabel en dos formatos
  inputValue?: string;
}
const supervisorFilter = createFilterOptions<SupervisorOption>();

function formatMoney(value: number, currency: BudgetCurrency) {
  const symbol = currency === 'USD' ? 'US$' : '$';
  return `${symbol}${value.toLocaleString('es-AR', { maximumFractionDigits: 2 })}`;
}

// Subtotales "brutos" (sin bonificación) para el desglose del Ver/Imprimir — totals_by_currency
// ya viene neto de bonificación desde el backend (ver FLOWS.md).
function sumLaborByCurrency(lines: BudgetLaborLine[] | undefined, defaultCurrency: BudgetCurrency): Record<BudgetCurrency, number> {
  const totals: Record<BudgetCurrency, number> = { ARS: 0, USD: 0 };
  for (const l of lines || []) {
    const currency = (l.currency || defaultCurrency) as BudgetCurrency;
    totals[currency] += l.estimated_total || 0;
  }
  return totals;
}
function sumMaterialsByCurrency(items: BudgetMaterialItem[] | undefined, defaultCurrency: BudgetCurrency): Record<BudgetCurrency, number> {
  const totals: Record<BudgetCurrency, number> = { ARS: 0, USD: 0 };
  for (const m of items || []) {
    const currency = (m.currency || defaultCurrency) as BudgetCurrency;
    totals[currency] += m.total_price || 0;
  }
  return totals;
}

function formatTotals(totals?: Record<BudgetCurrency, number>) {
  if (!totals) return '—';
  const parts: string[] = [];
  if (totals.ARS) parts.push(formatMoney(totals.ARS, 'ARS'));
  if (totals.USD) parts.push(formatMoney(totals.USD, 'USD'));
  return parts.length > 0 ? parts.join(' + ') : formatMoney(0, 'ARS');
}

// Solo advertencia, nunca bloquea nada — la decisión de aprobar a precio viejo queda en el
// usuario. Solo tiene sentido mientras el presupuesto sigue "sent" (una vez aprobado o
// rechazado, la vigencia deja de importar).
function daysExpired(budget: Budget): number | null {
  if (budget.status !== 'sent' || !budget.sent_at || !budget.validity_days) return null;
  const sentAt = new Date(budget.sent_at);
  const deadline = new Date(sentAt.getTime() + budget.validity_days * 24 * 60 * 60 * 1000);
  const diffDays = Math.floor((Date.now() - deadline.getTime()) / (24 * 60 * 60 * 1000));
  return diffDays > 0 ? diffDays : null;
}

export default function BudgetsPage() {
  return (
    <Suspense fallback={<Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>}>
      <BudgetsPageContent />
    </Suspense>
  );
}

function BudgetsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const permissions: string[] = Array.isArray((user as unknown as Record<string, unknown>)?.permissions)
    ? ((user as unknown as Record<string, unknown>).permissions as string[])
    : [];
  const hasCostsRead = permissions.includes('admin_granted') || permissions.includes('material_costs_read');
  const hasPricesRead = permissions.includes('admin_granted') || permissions.includes('budget_prices_read');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const autoOpenedFromParent = useRef(false);
  const autoViewedBudget = useRef(false);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [itemTypes, setItemTypes] = useState<BudgetItemType[]>([]);
  const [materialUnits, setMaterialUnits] = useState<MaterialUnit[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [rootProjects, setRootProjects] = useState<Project[]>([]);
  const [projectsWithoutBudget, setProjectsWithoutBudget] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [openDialog, setOpenDialog] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [form, setForm] = useState(emptyForm());

  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; budget: Budget | null }>({ open: false, budget: null });
  const [statusDialog, setStatusDialog] = useState<{ open: boolean; budget: Budget | null; target: string }>({ open: false, budget: null, target: '' });
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalFile, setApprovalFile] = useState<File | null>(null);
  const [approvedBySupervisorId, setApprovedBySupervisorId] = useState('');
  const [statusDialogSupervisors, setStatusDialogSupervisors] = useState<ClientSupervisor[]>([]);
  const [importing, setImporting] = useState(false);
  const [printBudget, setPrintBudget] = useState<Budget | null>(null);
  // Alta rápida de Material: a diferencia de Unidad, pide un dato más (la unidad del
  // material), así que no se puede crear "al toque" — abre este mini-diálogo.
  const [materialQuickAdd, setMaterialQuickAdd] = useState<{ open: boolean; lineIdx: number; description: string; materialUnitId: string; cost: string; currency: BudgetCurrency }>(
    { open: false, lineIdx: -1, description: '', materialUnitId: '', cost: '', currency: 'ARS' }
  );
  // Alta rápida de contacto (ClientSupervisor) al aprobar — mismo criterio que Material,
  // pide más de un dato así que abre un mini-diálogo en vez de crear directo.
  const [supervisorQuickAdd, setSupervisorQuickAdd] = useState<{ open: boolean; name: string; lastname: string; email: string; phone: string }>(
    { open: false, name: '', lastname: '', email: '', phone: '' }
  );
  // Tarifas del cliente elegido en el form (por rubro) — para prellenar el valor unitario de
  // mano de obra al elegir un rubro (ej. "Hs Grúa"), sin perder el historial de precios por
  // cliente. Ver FLOWS.md.
  const [clientRates, setClientRates] = useState<ClientItemRate[]>([]);
  // Bonificación post-presentación (mano de obra / material por separado) — solo aplicable
  // desde "sent" en adelante, separado del form de edición general (ver FLOWS.md).
  const [discountDialog, setDiscountDialog] = useState<{ open: boolean; budget: Budget | null; labor: string; material: string }>(
    { open: false, budget: null, labor: '0', material: '0' }
  );

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [bgs, its, mUnits, mats, clis, plts, projs, projsNoBudget] = await Promise.all([
        BudgetService.getAll(),
        BudgetItemTypeService.getAll(true),
        MaterialUnitService.getAll(true),
        MaterialService.getAll({ is_active: true }),
        ClientService.getAll(),
        PlantService.getAll(),
        ProjectService.getAll(),
        ProjectService.getAll({ without_budget: true }),
      ]);
      setBudgets(Array.isArray(bgs) ? bgs : []);
      setItemTypes(Array.isArray(its) ? its : []);
      setMaterialUnits(Array.isArray(mUnits) ? mUnits : []);
      setMaterials(Array.isArray(mats) ? mats : []);
      setClients(Array.isArray(clis) ? clis : []);
      setPlants(Array.isArray(plts) ? plts : []);
      setRootProjects(Array.isArray(projs) ? projs.filter(p => !p.parent_id) : []);
      setProjectsWithoutBudget(Array.isArray(projsNoBudget) ? projsNoBudget : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Tarifas del cliente elegido en el form — se recargan cada vez que cambia el cliente.
  useEffect(() => {
    if (!hasPricesRead || !form.client_id) { setClientRates([]); return; }
    ClientItemRateService.getAll(Number(form.client_id)).then(setClientRates).catch(() => setClientRates([]));
  }, [form.client_id, hasPricesRead]);

  // Al llegar desde "Nuevo Adicional" (?parent_project_id=X) o "Vincular Presupuesto"
  // (?existing_project_id=X) en el detalle de un proyecto, abrimos el formulario de
  // creación con el proyecto ya preseleccionado en el modo correspondiente.
  useEffect(() => {
    if (autoOpenedFromParent.current) return; // solo una vez por visita, aunque las listas se recarguen después
    const parentProjectId = searchParams.get('parent_project_id');
    const existingProjectId = searchParams.get('existing_project_id');
    if (!parentProjectId && !existingProjectId) return;

    if (parentProjectId) {
      if (rootProjects.length === 0) return;
      const parent = rootProjects.find(p => String(p.id) === parentProjectId);
      if (!parent) return;
      autoOpenedFromParent.current = true;
      setEditingBudget(null);
      setForm({ ...emptyForm(), parent_project_id: parentProjectId, client_id: String(parent.client_id), plant_id: parent.plant_id ? String(parent.plant_id) : '' });
      setOpenDialog(true);
      router.replace('/dashboard/budgets');
    } else if (existingProjectId) {
      if (projectsWithoutBudget.length === 0) return;
      const project = projectsWithoutBudget.find(p => String(p.id) === existingProjectId);
      if (!project) return;
      autoOpenedFromParent.current = true;
      setEditingBudget(null);
      setForm({ ...emptyForm(), existing_project_id: existingProjectId, client_id: String(project.client_id), plant_id: project.plant_id ? String(project.plant_id) : '' });
      setOpenDialog(true);
      router.replace('/dashboard/budgets');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootProjects, projectsWithoutBudget]);

  // Acceso directo desde el listado de Proyectos: ?view=<budgetId> abre la vista Ver/Imprimir
  // de ese presupuesto puntual, sin pasar por la tabla.
  useEffect(() => {
    if (autoViewedBudget.current) return;
    const viewId = searchParams.get('view');
    if (!viewId || budgets.length === 0) return;
    const target = budgets.find(b => String(b.id) === viewId);
    if (!target) return;
    autoViewedBudget.current = true;
    setPrintBudget(target);
    router.replace('/dashboard/budgets');
  }, [budgets, router, searchParams]);

  const handleOpenCreate = () => {
    setEditingBudget(null);
    setForm(emptyForm());
    setOpenDialog(true);
  };

  const handleOpenEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setForm({
      title: budget.title,
      client_id: String(budget.client_id),
      plant_id: budget.plant_id ? String(budget.plant_id) : '',
      currency: budget.currency,
      parent_project_id: budget.parent_project_id ? String(budget.parent_project_id) : '',
      existing_project_id: budget.existing_project_id ? String(budget.existing_project_id) : '',
      description: budget.description || '',
      start_date: budget.start_date || '',
      end_date: budget.end_date || '',
      validity_days: budget.validity_days ?? 15,
      notes: budget.notes || '',
      work_order_number: budget.work_order_number || '',
      laborLines: budget.laborLines || [],
      materialItems: budget.materialItems || [],
    });
    setOpenDialog(true);
  };

  // Value del <select> combinado: '' | `parent:<id>` | `existing:<id>`
  const projectLinkValue = form.parent_project_id
    ? `parent:${form.parent_project_id}`
    : form.existing_project_id
      ? `existing:${form.existing_project_id}`
      : '';

  // El proyecto que este presupuesto ya tiene vinculado no aparece en projectsWithoutBudget
  // (dejó de estar "sin presupuesto" apenas se creó este mismo borrador) — lo inyectamos
  // para que la opción siga visible al editar.
  const existingProjectOptions = [
    ...projectsWithoutBudget,
    ...(editingBudget?.existingProject && !projectsWithoutBudget.some(p => p.id === editingBudget.existingProject!.id)
      ? [editingBudget.existingProject as unknown as Project]
      : []),
  ];

  const handleProjectLinkChange = (value: string) => {
    if (!value) {
      setForm({ ...form, parent_project_id: '', existing_project_id: '' });
      return;
    }
    const [mode, idStr] = value.split(':');
    if (mode === 'parent') {
      const parent = rootProjects.find(p => String(p.id) === idStr);
      setForm({
        ...form,
        parent_project_id: idStr,
        existing_project_id: '',
        client_id: parent ? String(parent.client_id) : form.client_id,
        plant_id: parent ? (parent.plant_id ? String(parent.plant_id) : '') : form.plant_id,
      });
    } else if (mode === 'existing') {
      // El objeto puede ser el "stub" sintético del proyecto ya vinculado (solo id/name/code,
      // ver existingProjectOptions) — en ese caso no pisamos cliente/planta, ya están bien.
      const project = existingProjectOptions.find(p => String(p.id) === idStr);
      setForm({
        ...form,
        parent_project_id: '',
        existing_project_id: idStr,
        client_id: project?.client_id ? String(project.client_id) : form.client_id,
        plant_id: project?.client_id ? (project.plant_id ? String(project.plant_id) : '') : form.plant_id,
      });
    }
  };

  // Si el cliente del presupuesto tiene una tarifa cargada para el rubro elegido (ver
  // ClientItemRateService), se prellena el valor unitario — sigue siendo editable normalmente,
  // es solo el punto de partida (mismo criterio que vincular un material del catálogo).
  const rateForItemType = (itemTypeId: number) => clientRates.find(r => r.budget_item_type_id === itemTypeId);

  const addLaborLine = () => {
    if (itemTypes.length === 0) return;
    const defaultType = itemTypes[0];
    const rate = rateForItemType(defaultType.id);
    setForm({
      ...form,
      laborLines: [...form.laborLines, {
        budget_item_type_id: defaultType.id,
        quantity: 0,
        unit_price: rate ? rate.current_rate : 0,
        currency: rate ? rate.currency : undefined,
      }],
    });
  };
  const updateLaborLine = (index: number, patch: Partial<BudgetLaborLine>) => {
    const lines = [...form.laborLines];
    lines[index] = { ...lines[index], ...patch };
    setForm({ ...form, laborLines: lines });
  };
  const removeLaborLine = (index: number) => {
    setForm({ ...form, laborLines: form.laborLines.filter((_, i) => i !== index) });
  };

  // El precio al cliente se calcula acá (no se carga directo): costo real × (1 + margen%).
  const computeUnitPrice = (costValue: number | null | undefined, marginPercent: number) =>
    costValue != null ? Math.round(costValue * (1 + marginPercent / 100) * 100) / 100 : 0;

  const addMaterialItem = (item?: Partial<BudgetMaterialItem>) => {
    const defaultUnitId = materialUnits.find(u => u.label.toLowerCase() === 'u')?.id;
    const marginPercent = item?.margin_percent ?? 0;
    const costValue = item?.material_cost_snapshot ?? null;
    const costCurrency = item?.material_cost_currency ?? null;
    // setForm con updater funcional (no `{...form, ...}`) — importa cuando esta función se
    // llama varias veces seguidas en un loop (import de Excel): con el objeto directo, cada
    // llamada parte del mismo `form` desactualizado y las anteriores se pisan entre sí.
    setForm(prev => ({
      ...prev,
      materialItems: [...prev.materialItems, {
        description: item?.description || '',
        quantity: item?.quantity || 0,
        material_unit_id: item?.material_unit_id ?? defaultUnitId ?? 0,
        unit_price: computeUnitPrice(costValue, marginPercent),
        currency: costCurrency,
        margin_percent: marginPercent,
        material_id: item?.material_id,
        material_cost_snapshot: costValue,
        material_cost_currency: costCurrency,
      }],
    }));
  };
  const updateMaterialItem = (index: number, patch: Partial<BudgetMaterialItem>) => {
    setForm(prev => {
      const items = [...prev.materialItems];
      items[index] = { ...items[index], ...patch };
      return { ...prev, materialItems: items };
    });
  };
  const removeMaterialItem = (index: number) => {
    setForm({ ...form, materialItems: form.materialItems.filter((_, i) => i !== index) });
  };

  // Alta rápida de Unidad de Medida desde la misma línea del material, sin salir del form.
  const handleMaterialUnitChange = async (idx: number, newValue: MaterialUnitOption | null) => {
    if (!newValue) return;
    if (newValue.inputValue) {
      try {
        const created = await MaterialUnitService.create({ label: newValue.inputValue });
        setMaterialUnits(prev => [...prev, created]);
        updateMaterialItem(idx, { material_unit_id: created.id });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al crear la unidad de medida');
      }
      return;
    }
    if (newValue.id) updateMaterialItem(idx, { material_unit_id: newValue.id });
  };

  // Vincular un Material existente del catálogo a la línea (autocompleta descripción y
  // unidad), o abrir el mini-diálogo de alta rápida si el usuario tipeó algo nuevo. Elegir
  // texto libre sin vincular nada también es válido — la línea sigue funcionando como hoy,
  // sin margen calculable.
  const handleMaterialSelectChange = (idx: number, newValue: MaterialOption | null) => {
    if (!newValue) return;
    if (newValue.inputValue) {
      setMaterialQuickAdd({ open: true, lineIdx: idx, description: newValue.inputValue, materialUnitId: '', cost: '', currency: form.currency });
      return;
    }
    const material = materials.find(m => m.id === newValue.id);
    if (material) {
      const marginPercent = form.materialItems[idx]?.margin_percent ?? 0;
      const costValue = material.current_cost ?? null;
      const costCurrency = material.currency ?? null;
      updateMaterialItem(idx, {
        material_id: material.id,
        description: material.description,
        material_unit_id: material.material_unit_id,
        material_cost_snapshot: costValue,
        material_cost_currency: costCurrency,
        currency: costCurrency,
        unit_price: computeUnitPrice(costValue, marginPercent),
      });
    }
  };

  const handleConfirmMaterialQuickAdd = async () => {
    if (!materialQuickAdd.materialUnitId) {
      setError('Elegí una unidad para el material nuevo');
      return;
    }
    try {
      const created = await MaterialService.create({
        description: materialQuickAdd.description,
        material_unit_id: Number(materialQuickAdd.materialUnitId),
        current_cost: hasCostsRead && materialQuickAdd.cost ? Number(materialQuickAdd.cost) : null,
        currency: hasCostsRead ? materialQuickAdd.currency : null,
      });
      setMaterials(prev => [...prev, created]);
      const marginPercent = form.materialItems[materialQuickAdd.lineIdx]?.margin_percent ?? 0;
      const costValue = created.current_cost ?? null;
      const costCurrency = created.currency ?? null;
      updateMaterialItem(materialQuickAdd.lineIdx, {
        material_id: created.id,
        description: created.description,
        material_unit_id: created.material_unit_id,
        material_cost_snapshot: costValue,
        material_cost_currency: costCurrency,
        currency: costCurrency,
        unit_price: computeUnitPrice(costValue, marginPercent),
      });
      setMaterialQuickAdd({ open: false, lineIdx: -1, description: '', materialUnitId: '', cost: '', currency: 'ARS' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el material');
    }
  };

  // Margen client-side (preview) de una línea vinculada a un Material — solo si las monedas
  // coinciden, para no inventar una conversión que no existe en el sistema.
  // Costo real de la línea: prioriza el snapshot ya guardado (la "foto" congelada — ver
  // FLOWS.md); si la línea recién se vinculó a un material y todavía no se guardó, todavía
  // no hay snapshot, así que se muestra el costo vigente del material como preview.
  const lineCost = (item: BudgetMaterialItem): { value: number; currency: BudgetCurrency } | null => {
    if (!item.material_id) return null;
    if (item.material_cost_snapshot != null && item.material_cost_currency) {
      return { value: item.material_cost_snapshot, currency: item.material_cost_currency };
    }
    const material = materials.find(m => m.id === item.material_id);
    if (!material || material.current_cost == null) return null;
    return { value: material.current_cost, currency: material.currency || form.currency };
  };

  // El precio al cliente siempre se calcula en la misma moneda del costo (ver FLOWS.md), así
  // que a diferencia de antes ya no hace falta chequear que las monedas coincidan.
  const lineMargin = (item: BudgetMaterialItem): number | null => {
    const cost = lineCost(item);
    if (!cost) return null;
    return ((item.unit_price || 0) - cost.value) * (item.quantity || 0);
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setImporting(true);
      const rows = await BudgetService.importMaterials(file);

      // Resolvemos en mapas locales (no contra el estado de React) para no disparar altas
      // duplicadas si el Excel repite la misma unidad/material en varias filas — el estado
      // tarda un render en reflejar cada alta.
      const unitsByLabel = new Map(materialUnits.map(u => [u.label.toLowerCase(), u]));
      const newUnits: MaterialUnit[] = [];
      const materialsByDescription = new Map(materials.map(m => [m.description.toLowerCase(), m]));
      const touchedMaterials: Material[] = [];

      for (const row of rows) {
        const unitLabel = (row.unit || 'u').trim() || 'u';
        const unitKey = unitLabel.toLowerCase();
        let unit = unitsByLabel.get(unitKey);
        if (!unit) {
          unit = await MaterialUnitService.create({ label: unitLabel });
          unitsByLabel.set(unitKey, unit);
          newUnits.push(unit);
        }

        // El precio del Excel es el COSTO REAL del material, nunca el precio al cliente —
        // por eso alimenta el catálogo (crea o actualiza current_cost), no unit_price.
        const descKey = row.description.trim().toLowerCase();
        let material = materialsByDescription.get(descKey);
        if (!material) {
          material = await MaterialService.create({
            description: row.description,
            material_unit_id: unit.id,
            current_cost: hasCostsRead ? (row.cost || null) : null,
            currency: hasCostsRead ? form.currency : null,
          });
          materialsByDescription.set(descKey, material);
          touchedMaterials.push(material);
        } else if (hasCostsRead && row.cost && material.current_cost !== row.cost) {
          // Reimportar una lista de precios de proveedor actualizada es la forma natural de
          // mantener el catálogo al día — esto genera una entrada de historial de costos.
          material = await MaterialService.update(material.id, { current_cost: row.cost, currency: form.currency });
          materialsByDescription.set(descKey, material);
          touchedMaterials.push(material);
        }

        // El precio al cliente arranca en margen 0% (= precio igual al costo) — el usuario
        // carga el margen real de cada línea aparte, no se autocompleta con nada del Excel.
        addMaterialItem({
          description: material.description,
          quantity: row.quantity,
          material_unit_id: material.material_unit_id,
          material_id: material.id,
          material_cost_snapshot: material.current_cost ?? null,
          material_cost_currency: material.currency ?? null,
          margin_percent: 0,
        });
      }

      if (newUnits.length > 0) setMaterialUnits(prev => [...prev, ...newUnits]);
      if (touchedMaterials.length > 0) {
        setMaterials(prev => {
          const merged = [...prev];
          for (const m of touchedMaterials) {
            const idx = merged.findIndex(x => x.id === m.id);
            if (idx >= 0) merged[idx] = m; else merged.push(m);
          }
          return merged;
        });
      }
      setSuccess(`${rows.length} fila(s) importadas desde el Excel. Cargá el margen de cada una antes de guardar.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al importar el Excel');
    } finally {
      setImporting(false);
    }
  };

  const laborTotal = (currency: BudgetCurrency) => form.laborLines
    .filter(l => (l.currency || form.currency) === currency)
    .reduce((sum, l) => sum + (Number(l.quantity) || 0) * (Number(l.unit_price) || 0), 0);
  const materialsTotal = (currency: BudgetCurrency) => form.materialItems
    .filter(m => (m.currency || form.currency) === currency)
    .reduce((sum, m) => sum + (Number(m.quantity) || 0) * (Number(m.unit_price) || 0), 0);
  const totalMargin = (currency: BudgetCurrency) => form.materialItems
    .filter(m => (m.currency || form.currency) === currency)
    .reduce((sum, m) => sum + (lineMargin(m) || 0), 0);
  const totalMarginPercent = (currency: BudgetCurrency): number | null => {
    const sales = materialsTotal(currency);
    if (!sales) return null;
    return (totalMargin(currency) / sales) * 100;
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.client_id) {
      setError('El título y el cliente son obligatorios');
      return;
    }
    // El precio al cliente se calcula como margen % sobre el costo real — un material sin
    // vincular al catálogo o sin costo cargado no se puede presupuestar (ver FLOWS.md).
    const unpriceable = form.materialItems.find(item => lineCost(item) === null);
    if (unpriceable) {
      setError(`El material "${unpriceable.description || 'sin descripción'}" no tiene costo cargado en el catálogo. Cárguelo antes de presupuestarlo.`);
      return;
    }
    try {
      const payload: CreateBudgetData = {
        title: form.title,
        client_id: Number(form.client_id),
        plant_id: form.plant_id ? Number(form.plant_id) : undefined,
        currency: form.currency,
        parent_project_id: form.parent_project_id ? Number(form.parent_project_id) : undefined,
        existing_project_id: form.existing_project_id ? Number(form.existing_project_id) : undefined,
        description: form.description || undefined,
        start_date: form.start_date || undefined,
        end_date: form.end_date || undefined,
        validity_days: form.validity_days,
        notes: form.notes || undefined,
        work_order_number: form.work_order_number || undefined,
        laborLines: form.laborLines,
        materialItems: form.materialItems,
      };
      if (editingBudget) {
        await BudgetService.update(editingBudget.id, payload);
        setSuccess('Presupuesto actualizado');
      } else {
        await BudgetService.create(payload);
        setSuccess('Presupuesto creado');
      }
      setOpenDialog(false);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.budget) return;
    try {
      await BudgetService.delete(deleteDialog.budget.id);
      setDeleteDialog({ open: false, budget: null });
      setSuccess('Presupuesto eliminado');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  const handleOpenStatusDialog = async (budget: Budget, target: string) => {
    setStatusDialog({ open: true, budget, target });
    setRejectionReason('');
    setApprovalFile(null);
    setApprovedBySupervisorId(budget.approved_by_supervisor_id ? String(budget.approved_by_supervisor_id) : '');
    if (target === 'approved') {
      try {
        const sups = await ClientSupervisorService.getAll(budget.client_id);
        setStatusDialogSupervisors(sups);
      } catch {
        setStatusDialogSupervisors([]);
      }
    }
  };

  const handleChangeStatus = async () => {
    if (!statusDialog.budget) return;
    try {
      await BudgetService.changeStatus(statusDialog.budget.id, statusDialog.target, {
        rejection_reason: rejectionReason || undefined,
        file: approvalFile || undefined,
        approved_by_supervisor_id: approvedBySupervisorId ? Number(approvedBySupervisorId) : undefined,
      });
      setStatusDialog({ open: false, budget: null, target: '' });
      setRejectionReason('');
      setApprovalFile(null);
      setApprovedBySupervisorId('');
      setSuccess('Estado actualizado');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar el estado');
    }
  };

  const handleSupervisorSelectChange = (newValue: SupervisorOption | null) => {
    if (!newValue) { setApprovedBySupervisorId(''); return; }
    if (newValue.inputValue) {
      setSupervisorQuickAdd({ open: true, name: newValue.inputValue, lastname: '', email: '', phone: '' });
      return;
    }
    if (newValue.id) setApprovedBySupervisorId(String(newValue.id));
  };

  const handleConfirmSupervisorQuickAdd = async () => {
    if (!statusDialog.budget || !supervisorQuickAdd.name.trim() || !supervisorQuickAdd.lastname.trim()) {
      setError('Nombre y apellido son obligatorios');
      return;
    }
    try {
      const created = await ClientSupervisorService.create({
        client_id: statusDialog.budget.client_id,
        name: supervisorQuickAdd.name,
        lastname: supervisorQuickAdd.lastname,
        email: supervisorQuickAdd.email || undefined,
        phone: supervisorQuickAdd.phone || undefined,
      });
      setStatusDialogSupervisors(prev => [...prev, created]);
      setApprovedBySupervisorId(String(created.id));
      setSupervisorQuickAdd({ open: false, name: '', lastname: '', email: '', phone: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el contacto');
    }
  };

  const handleDuplicate = async (budget: Budget) => {
    try {
      await BudgetService.duplicate(budget.id);
      setSuccess('Presupuesto duplicado como borrador');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al duplicar');
    }
  };

  const handleGenerateProject = async (budget: Budget) => {
    try {
      await BudgetService.generateProject(budget.id);
      setSuccess('Proyecto generado correctamente');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar el proyecto');
    }
  };

  const handleOpenDiscountDialog = (budget: Budget) => {
    setDiscountDialog({
      open: true,
      budget,
      labor: String(budget.labor_discount_percent ?? 0),
      material: String(budget.material_discount_percent ?? 0),
    });
  };

  const handleApplyDiscount = async () => {
    if (!discountDialog.budget) return;
    try {
      await BudgetService.applyDiscount(discountDialog.budget.id, Number(discountDialog.labor) || 0, Number(discountDialog.material) || 0);
      setDiscountDialog({ open: false, budget: null, labor: '0', material: '0' });
      setSuccess('Bonificación aplicada');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al aplicar la bonificación');
    }
  };

  // Mismo patrón que OCAs/Liquidación: window.print() sobre un .print-area, sin librería de PDF.
  const handlePrint = () => {
    if (!printBudget) return;
    const originalTitle = document.title;
    document.title = printBudget.number;
    const restoreTitle = () => {
      document.title = originalTitle;
      window.removeEventListener('afterprint', restoreTitle);
    };
    window.addEventListener('afterprint', restoreTitle);
    window.print();
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
        <Box display="flex" alignItems="center" gap={1}>
          <TitleIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" fontWeight={700} letterSpacing="-0.02em" color="#1E293B">Presupuestos</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadData} size="small">Actualizar</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate} size="small">Nuevo Presupuesto</Button>
        </Box>
      </Box>

      <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />
      <FeedbackModal open={!!success} onClose={() => setSuccess('')} message={success} type="success" />

      {budgets.length === 0 ? (
        <Paper elevation={2} sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">No hay presupuestos registrados</Typography>
        </Paper>
      ) : (
        <>
          {/* Vista mobile: cards en vez de tabla — mismo patrón que dashboard/projects */}
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            <Stack spacing={2}>
              {budgets.map((b) => (
                <Paper key={b.id} elevation={2} sx={{ p: 2 }}>
                  <Stack spacing={1}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1}>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">{b.number}</Typography>
                        <Typography fontWeight="medium">{b.title}</Typography>
                        {b.parentProject && <Typography variant="caption" color="text.secondary" display="block">Adicional de {b.parentProject.code}</Typography>}
                        {b.existingProject && <Typography variant="caption" color="text.secondary" display="block">Vinculado a {b.existingProject.code}</Typography>}
                        {b.work_order_number && <Typography variant="caption" color="text.secondary" display="block">OT: {b.work_order_number}</Typography>}
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary">{b.client?.razonSocial}</Typography>
                    <Box>
                      <Chip label={STATUS_LABELS[b.status].label} color={STATUS_LABELS[b.status].color} size="small" />
                      {daysExpired(b) !== null && (
                        <Chip label={`Vencido hace ${daysExpired(b)} día(s)`} color="warning" size="small" variant="outlined" sx={{ ml: 0.5 }} />
                      )}
                      {b.status === 'approved' && b.approvedBySupervisor && (
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                          Aprobó: {b.approvedBySupervisor.lastname}, {b.approvedBySupervisor.name} (cliente)
                        </Typography>
                      )}
                      {b.status === 'approved' && b.approvedBy && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          Cargó: {b.approvedBy.lastname}, {b.approvedBy.name}{b.approved_at ? ` · ${new Date(b.approved_at).toLocaleDateString('es-AR')}` : ''}
                        </Typography>
                      )}
                      {b.status === 'approved' && b.approved_document_url && (
                        <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                          <DocumentIcon fontSize="inherit" color="action" />
                          <a href={b.approved_document_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem' }}>documento firmado</a>
                        </Box>
                      )}
                    </Box>
                    {hasPricesRead && <Typography variant="body2">{formatTotals(b.totals_by_currency)}</Typography>}
                    {b.project && (
                      <Chip
                        size="small" icon={<ProjectIcon />} label={`${b.project.code} - ${b.project.name}`}
                        color="primary" variant="outlined" clickable
                        onClick={() => router.push(`/dashboard/projects/${b.project!.id}`)}
                        sx={{ alignSelf: 'flex-start' }}
                      />
                    )}
                    <Divider />
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      <Tooltip title="Ver / Imprimir"><IconButton size="small" color="secondary" onClick={() => setPrintBudget(b)}><ViewIcon fontSize="small" /></IconButton></Tooltip>
                      {b.status === 'draft' && (
                        <>
                          <Tooltip title="Editar"><IconButton size="small" color="primary" onClick={() => handleOpenEdit(b)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title="Enviar"><IconButton size="small" color="info" onClick={() => handleOpenStatusDialog(b, 'sent')}><SendIcon fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title="Eliminar"><IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, budget: b })}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                        </>
                      )}
                      {b.status === 'sent' && (
                        <>
                          <Tooltip title="Aprobar"><IconButton size="small" color="success" onClick={() => handleOpenStatusDialog(b, 'approved')}><ApproveIcon fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title="Rechazar"><IconButton size="small" color="error" onClick={() => handleOpenStatusDialog(b, 'rejected')}><RejectIcon fontSize="small" /></IconButton></Tooltip>
                        </>
                      )}
                      {b.status === 'approved' && !b.approved_document_url && (
                        <Tooltip title="Subir documento firmado"><IconButton size="small" color="info" onClick={() => handleOpenStatusDialog(b, 'approved')}><UploadIcon fontSize="small" /></IconButton></Tooltip>
                      )}
                      {b.status === 'approved' && !b.project_id && (
                        <Tooltip title="Generar Proyecto"><IconButton size="small" color="success" onClick={() => handleGenerateProject(b)}><GenerateIcon fontSize="small" /></IconButton></Tooltip>
                      )}
                      {hasPricesRead && (b.status === 'sent' || b.status === 'approved') && (
                        <Tooltip title="Bonificación"><IconButton size="small" color="warning" onClick={() => handleOpenDiscountDialog(b)}><DiscountIcon fontSize="small" /></IconButton></Tooltip>
                      )}
                      <Tooltip title="Duplicar"><IconButton size="small" onClick={() => handleDuplicate(b)}><DuplicateIcon fontSize="small" /></IconButton></Tooltip>
                    </Box>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Box>

          {/* Vista desktop: tabla */}
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <TableContainer component={Paper} elevation={2}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell><strong>Número</strong></TableCell>
                    <TableCell><strong>Título</strong></TableCell>
                    <TableCell><strong>Cliente</strong></TableCell>
                    <TableCell><strong>Estado</strong></TableCell>
                    {hasPricesRead && <TableCell><strong>Total</strong></TableCell>}
                    <TableCell><strong>Proyecto</strong></TableCell>
                    <TableCell align="center"><strong>Acciones</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {budgets.map((b) => (
                    <TableRow key={b.id} hover>
                      <TableCell><Typography variant="body2" fontWeight="medium">{b.number}</Typography></TableCell>
                      <TableCell>
                        <Typography fontWeight="medium">{b.title}</Typography>
                        {b.parentProject && <Typography variant="caption" color="text.secondary">Adicional de {b.parentProject.code}</Typography>}
                        {b.existingProject && <Typography variant="caption" color="text.secondary">Vinculado a {b.existingProject.code}</Typography>}
                        {b.work_order_number && <Typography variant="caption" color="text.secondary" display="block">OT: {b.work_order_number}</Typography>}
                      </TableCell>
                      <TableCell>{b.client?.razonSocial}</TableCell>
                      <TableCell>
                        <Chip label={STATUS_LABELS[b.status].label} color={STATUS_LABELS[b.status].color} size="small" />
                        {daysExpired(b) !== null && (
                          <Chip label={`Vencido hace ${daysExpired(b)} día(s)`} color="warning" size="small" variant="outlined" sx={{ ml: 0.5 }} />
                        )}
                        {b.status === 'approved' && b.approvedBySupervisor && (
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                            Aprobó: {b.approvedBySupervisor.lastname}, {b.approvedBySupervisor.name} (cliente)
                          </Typography>
                        )}
                        {b.status === 'approved' && b.approvedBy && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            Cargó: {b.approvedBy.lastname}, {b.approvedBy.name}{b.approved_at ? ` · ${new Date(b.approved_at).toLocaleDateString('es-AR')}` : ''}
                          </Typography>
                        )}
                        {b.status === 'approved' && b.approved_document_url && (
                          <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                            <DocumentIcon fontSize="inherit" color="action" />
                            <a href={b.approved_document_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem' }}>documento firmado</a>
                          </Box>
                        )}
                      </TableCell>
                      {hasPricesRead && <TableCell>{formatTotals(b.totals_by_currency)}</TableCell>}
                      <TableCell>
                        {b.project ? (
                          <Tooltip title="Ver proyecto">
                            <Chip
                              size="small" icon={<ProjectIcon />} label={`${b.project.code} - ${b.project.name}`}
                              color="primary" variant="outlined" clickable
                              onClick={() => router.push(`/dashboard/projects/${b.project!.id}`)}
                            />
                          </Tooltip>
                        ) : '—'}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Ver / Imprimir"><IconButton size="small" color="secondary" onClick={() => setPrintBudget(b)}><ViewIcon fontSize="small" /></IconButton></Tooltip>
                        {b.status === 'draft' && (
                          <>
                            <Tooltip title="Editar"><IconButton size="small" color="primary" onClick={() => handleOpenEdit(b)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                            <Tooltip title="Enviar"><IconButton size="small" color="info" onClick={() => handleOpenStatusDialog(b, 'sent')}><SendIcon fontSize="small" /></IconButton></Tooltip>
                            <Tooltip title="Eliminar"><IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, budget: b })}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                          </>
                        )}
                        {b.status === 'sent' && (
                          <>
                            <Tooltip title="Aprobar"><IconButton size="small" color="success" onClick={() => handleOpenStatusDialog(b, 'approved')}><ApproveIcon fontSize="small" /></IconButton></Tooltip>
                            <Tooltip title="Rechazar"><IconButton size="small" color="error" onClick={() => handleOpenStatusDialog(b, 'rejected')}><RejectIcon fontSize="small" /></IconButton></Tooltip>
                          </>
                        )}
                        {b.status === 'approved' && !b.approved_document_url && (
                          <Tooltip title="Subir documento firmado"><IconButton size="small" color="info" onClick={() => handleOpenStatusDialog(b, 'approved')}><UploadIcon fontSize="small" /></IconButton></Tooltip>
                        )}
                        {b.status === 'approved' && !b.project_id && (
                          <Tooltip title="Generar Proyecto"><IconButton size="small" color="success" onClick={() => handleGenerateProject(b)}><GenerateIcon fontSize="small" /></IconButton></Tooltip>
                        )}
                        {hasPricesRead && (b.status === 'sent' || b.status === 'approved') && (
                          <Tooltip title="Bonificación"><IconButton size="small" color="warning" onClick={() => handleOpenDiscountDialog(b)}><DiscountIcon fontSize="small" /></IconButton></Tooltip>
                        )}
                        <Tooltip title="Duplicar"><IconButton size="small" onClick={() => handleDuplicate(b)}><DuplicateIcon fontSize="small" /></IconButton></Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth fullScreen={isMobile}>
        <DialogTitle>{editingBudget ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 8 }}>
                <TextField label="Título *" fullWidth value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField label="Moneda" select fullWidth value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value as BudgetCurrency })}
                  SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
                  <option value="ARS">ARS ($)</option>
                  <option value="USD">USD (US$)</option>
                </TextField>
              </Grid>
            </Grid>

            <TextField label="Relación con un proyecto" select fullWidth value={projectLinkValue}
              onChange={(e) => handleProjectLinkChange(e.target.value)}
              SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}
              helperText="Nuevo: genera un proyecto. Adicional: genera un subproyecto hijo. Vincular: no crea nada, usa el proyecto tal cual."
            >
              <option value="">— No, es un proyecto nuevo —</option>
              <optgroup label="Es un adicional de (genera un subproyecto):">
                {rootProjects.map((p) => <option key={`parent-${p.id}`} value={`parent:${p.id}`}>{p.code} - {p.name}</option>)}
              </optgroup>
              <optgroup label="Vincular a un proyecto ya existente (sin presupuesto):">
                {existingProjectOptions.map((p) => <option key={`existing-${p.id}`} value={`existing:${p.id}`}>{p.code} - {p.name}</option>)}
              </optgroup>
            </TextField>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="Cliente *" select fullWidth value={form.client_id} disabled={!!form.parent_project_id || !!form.existing_project_id}
                  onChange={(e) => setForm({ ...form, client_id: e.target.value, plant_id: '' })}
                  SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
                  <option value="">— Seleccionar —</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.razonSocial}</option>)}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="Planta" select fullWidth value={form.plant_id} disabled={!!form.parent_project_id || !!form.existing_project_id || !form.client_id}
                  onChange={(e) => setForm({ ...form, plant_id: e.target.value })}
                  SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
                  <option value="">— Ninguna —</option>
                  {plants.filter(p => p.client_id === Number(form.client_id)).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </TextField>
              </Grid>
            </Grid>

            <TextField label="Descripción" fullWidth multiline rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="Fecha de Inicio (prevista)" type="date" fullWidth value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })} InputLabelProps={{ shrink: true }}
                  helperText="Se traslada al proyecto al generar/vincular" />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="Fecha de Fin (prevista)" type="date" fullWidth value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })} InputLabelProps={{ shrink: true }} />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Vigencia (días)" type="number" fullWidth value={form.validity_days}
                  onChange={(e) => setForm({ ...form, validity_days: Number(e.target.value) })} inputProps={{ min: 0 }}
                  helperText="Días desde que se envía hasta que se considera vencido (solo advertencia)" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="N° de OT" fullWidth value={form.work_order_number}
                  onChange={(e) => setForm({ ...form, work_order_number: e.target.value })}
                  helperText="OT que genera el cliente, para rastreo (opcional)" />
              </Grid>
            </Grid>

            {/* Mano de obra */}
            <Divider />
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography fontWeight="bold">Mano de Obra</Typography>
              <Button size="small" startIcon={<AddIcon />} onClick={addLaborLine} disabled={itemTypes.length === 0}>Agregar línea</Button>
            </Box>
            {form.laborLines.map((line, idx) => (
              <Grid container spacing={1} key={idx} alignItems="center">
                <Grid size={{ xs: 12, md: hasPricesRead ? 4 : 6 }}>
                  <TextField select fullWidth size="small" label="Rubro" value={line.budget_item_type_id}
                    onChange={(e) => {
                      const newTypeId = Number(e.target.value);
                      const rate = rateForItemType(newTypeId);
                      const patch: Partial<BudgetLaborLine> = { budget_item_type_id: newTypeId };
                      // Solo prellena si la línea todavía no tiene un valor cargado a mano —
                      // no pisa una edición ya hecha por el usuario.
                      if (rate && !line.unit_price) {
                        patch.unit_price = rate.current_rate;
                        patch.currency = rate.currency;
                      }
                      updateLaborLine(idx, patch);
                    }}
                    SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
                    {itemTypes.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
                  </TextField>
                </Grid>
                <Grid size={{ xs: hasPricesRead ? 6 : 10, md: hasPricesRead ? 2 : 5 }}>
                  <TextField type="number" size="small" fullWidth label="Cantidad" value={line.quantity}
                    onChange={(e) => updateLaborLine(idx, { quantity: Number(e.target.value) })} />
                </Grid>
                {hasPricesRead && (
                  <>
                    <Grid size={{ xs: 6, md: 2 }}>
                      <TextField type="number" size="small" fullWidth label="Valor unitario" value={line.unit_price}
                        onChange={(e) => updateLaborLine(idx, { unit_price: Number(e.target.value) })} />
                    </Grid>
                    <Grid size={{ xs: 6, md: 2 }}>
                      <TextField select size="small" fullWidth label="Moneda" value={line.currency || ''}
                        onChange={(e) => updateLaborLine(idx, { currency: (e.target.value || null) as BudgetCurrency | null })}
                        SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
                        <option value="">{form.currency} (default)</option>
                        <option value="ARS">ARS</option>
                        <option value="USD">USD</option>
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 5, md: 1.5 }}>
                      <Typography variant="body2" fontWeight="bold">
                        {formatMoney((line.quantity || 0) * (line.unit_price || 0), line.currency || form.currency)}
                      </Typography>
                    </Grid>
                  </>
                )}
                <Grid size={{ xs: hasPricesRead ? 1 : 2, md: hasPricesRead ? 0.5 : 1 }}>
                  <IconButton size="small" color="error" onClick={() => removeLaborLine(idx)}><DeleteIcon fontSize="small" /></IconButton>
                </Grid>
              </Grid>
            ))}

            {/* Materiales */}
            <Divider />
            <Box display="flex" sx={{ flexDirection: { xs: 'column', sm: 'row' } }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} gap={1}>
              <Typography fontWeight="bold">Materiales</Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                <Button size="small" startIcon={<DownloadIcon />} component="a" href="/plantillas/plantilla-materiales.xlsx" download>
                  Descargar plantilla
                </Button>
                <Button size="small" startIcon={<UploadIcon />} component="label" disabled={importing}>
                  {importing ? 'Importando…' : 'Importar Excel'}
                  <input type="file" hidden accept=".xlsx,.xls" onChange={handleImportExcel} />
                </Button>
                <Button size="small" startIcon={<AddIcon />} onClick={() => addMaterialItem()}>Agregar item</Button>
              </Box>
            </Box>
            {form.materialItems.map((item, idx) => {
              const cost = lineCost(item);
              const margin = lineMargin(item);
              return (
              <Grid container spacing={1} key={idx} alignItems="center">
                <Grid size={{ xs: 12, md: hasPricesRead ? (hasCostsRead ? 4.7 : 6.2) : (hasCostsRead ? 5 : 7) }}>
                  <Autocomplete<MaterialOption, false, false, true>
                    freeSolo
                    size="small"
                    fullWidth
                    options={materials}
                    value={item.description}
                    onChange={(_, newValue) => handleMaterialSelectChange(idx, typeof newValue === 'string' ? null : newValue)}
                    onInputChange={(_, newInputValue, reason) => {
                      if (reason !== 'input') return;
                      const linkedDescription = materials.find(m => m.id === item.material_id)?.description;
                      const stillLinked = item.material_id && newInputValue === linkedDescription;
                      updateMaterialItem(idx, {
                        description: newInputValue,
                        material_id: stillLinked ? item.material_id : null,
                        // Al desvincular se pierde la base de costo — sin eso no se puede
                        // calcular el precio con margen (ver FLOWS.md).
                        ...(stillLinked ? {} : { material_cost_snapshot: null, material_cost_currency: null, unit_price: 0 }),
                      });
                    }}
                    getOptionLabel={(option) => typeof option === 'string' ? option : (option.description || option.inputValue || '')}
                    filterOptions={(options, params) => {
                      const filtered = materialFilter(options, params);
                      const { inputValue } = params;
                      const exists = options.some((o) => o.description.toLowerCase() === inputValue.toLowerCase());
                      if (inputValue !== '' && !exists) {
                        filtered.unshift({ description: `Agregar "${inputValue}"`, inputValue });
                      }
                      return filtered;
                    }}
                    renderOption={(props, option) => {
                      const { key, ...optionProps } = props;
                      return (
                        <li key={key} {...optionProps}>
                          {option.inputValue ? (
                            <Box display="flex" alignItems="center" gap={1}>
                              <AddIcon fontSize="small" sx={{ color: 'success.main' }} />
                              <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 500 }}>{option.description}</Typography>
                            </Box>
                          ) : option.description}
                        </li>
                      );
                    }}
                    renderInput={(params) => <TextField {...params} label="Descripción" helperText={item.material_id ? '✓ vinculado al catálogo' : ' '} />}
                  />
                </Grid>
                <Grid size={{ xs: 6, md: hasPricesRead ? 1.1 : 1.5 }}>
                  <TextField type="number" size="small" fullWidth label="Cant." value={item.quantity}
                    onChange={(e) => updateMaterialItem(idx, { quantity: Number(e.target.value) })} />
                </Grid>
                <Grid size={{ xs: 6, md: hasPricesRead ? 1.2 : 1.6 }}>
                  <Autocomplete<MaterialUnitOption>
                    size="small"
                    fullWidth
                    options={materialUnits}
                    value={materialUnits.find(u => u.id === item.material_unit_id) || null}
                    onChange={(_, newValue) => handleMaterialUnitChange(idx, newValue)}
                    getOptionLabel={(option) => option.label}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    filterOptions={(options, params) => {
                      const filtered = materialUnitFilter(options, params);
                      const { inputValue } = params;
                      const exists = options.some((o) => o.label.toLowerCase() === inputValue.toLowerCase());
                      if (inputValue !== '' && !exists) {
                        filtered.push({ label: `Agregar "${inputValue}"`, inputValue });
                      }
                      return filtered;
                    }}
                    selectOnFocus
                    clearOnBlur
                    handleHomeEndKeys
                    renderInput={(params) => <TextField {...params} label="Unidad" />}
                  />
                </Grid>
                {hasCostsRead && (
                  <Grid size={{ xs: hasPricesRead ? 6 : 12, md: hasPricesRead ? 1.5 : 2.5 }}>
                    <TextField
                      type={item.material_id ? 'number' : 'text'}
                      size="small" fullWidth label="Costo real"
                      disabled={!item.material_id}
                      value={item.material_id ? (cost?.value ?? '') : 'Sin vincular'}
                      onChange={(e) => {
                        const newCost = e.target.value === '' ? null : Number(e.target.value);
                        const newCurrency = cost?.currency || item.material_cost_currency || form.currency;
                        updateMaterialItem(idx, {
                          material_cost_snapshot: newCost,
                          material_cost_currency: newCurrency,
                          currency: newCurrency,
                          unit_price: computeUnitPrice(newCost, item.margin_percent ?? 0),
                        });
                      }}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                )}
                {hasPricesRead && (
                  <>
                    <Grid size={{ xs: hasCostsRead ? 6 : 12, md: 1.5 }}>
                      <TextField
                        type="number" size="small" fullWidth label="Margen %"
                        disabled={!cost}
                        value={item.margin_percent ?? 0}
                        onChange={(e) => {
                          const marginPercent = Number(e.target.value);
                          updateMaterialItem(idx, { margin_percent: marginPercent, unit_price: computeUnitPrice(cost?.value, marginPercent) });
                        }}
                        helperText={!cost ? 'Vinculá un material con costo' : `${formatMoney(item.unit_price || 0, item.currency || form.currency)} c/u`}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid size={{ xs: 5, md: 1.5 }}>
                      <Typography variant="body2" fontWeight="bold">
                        {formatMoney((item.quantity || 0) * (item.unit_price || 0), item.currency || form.currency)}
                      </Typography>
                      {hasCostsRead && item.material_id && (
                        <Typography variant="caption" display="block" color={margin !== null && margin >= 0 ? 'success.main' : margin !== null ? 'error.main' : 'text.secondary'}>
                          {margin !== null ? `Margen: ${formatMoney(margin, item.currency || form.currency)}` : 'Margen: —'}
                        </Typography>
                      )}
                    </Grid>
                  </>
                )}
                <Grid size={{ xs: hasPricesRead ? 1 : 2, md: hasPricesRead ? 0.5 : 1 }}>
                  <IconButton size="small" color="error" onClick={() => removeMaterialItem(idx)}><DeleteIcon fontSize="small" /></IconButton>
                </Grid>
              </Grid>
              );
            })}

            {hasPricesRead && (
              <>
                <Divider />
                <Box textAlign="right">
                  <Typography variant="body2">Mano de obra: {formatMoney(laborTotal('ARS'), 'ARS')} {laborTotal('USD') > 0 && `+ ${formatMoney(laborTotal('USD'), 'USD')}`}</Typography>
                  <Typography variant="body2">Materiales: {formatMoney(materialsTotal('ARS'), 'ARS')} {materialsTotal('USD') > 0 && `+ ${formatMoney(materialsTotal('USD'), 'USD')}`}</Typography>
                  <Typography variant="h6" fontWeight="bold">
                    Total: {formatMoney(laborTotal('ARS') + materialsTotal('ARS'), 'ARS')} {(laborTotal('USD') + materialsTotal('USD')) > 0 && `+ ${formatMoney(laborTotal('USD') + materialsTotal('USD'), 'USD')}`}
                  </Typography>
                  {hasCostsRead && (totalMargin('ARS') !== 0 || totalMargin('USD') !== 0) && (
                    <Typography variant="body2" color="text.secondary">
                      Margen materiales: {formatMoney(totalMargin('ARS'), 'ARS')}
                      {totalMarginPercent('ARS') !== null && ` (${totalMarginPercent('ARS')!.toFixed(1)}%)`}
                      {totalMargin('USD') !== 0 && ` + ${formatMoney(totalMargin('USD'), 'USD')}`}
                      {totalMargin('USD') !== 0 && totalMarginPercent('USD') !== null && ` (${totalMarginPercent('USD')!.toFixed(1)}%)`}
                    </Typography>
                  )}
                </Box>
              </>
            )}

            <TextField label="Notas internas" fullWidth multiline rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">{editingBudget ? 'Guardar' : 'Crear'}</Button>
        </DialogActions>
      </Dialog>

      {/* Alta rápida de Material — abierta desde el Autocomplete de Descripción */}
      <Dialog open={materialQuickAdd.open} onClose={() => setMaterialQuickAdd({ ...materialQuickAdd, open: false })} maxWidth="xs" fullWidth>
        <DialogTitle>Nuevo Material</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Descripción" fullWidth value={materialQuickAdd.description}
              onChange={(e) => setMaterialQuickAdd({ ...materialQuickAdd, description: e.target.value })} />
            <TextField label="Unidad *" select fullWidth value={materialQuickAdd.materialUnitId}
              onChange={(e) => setMaterialQuickAdd({ ...materialQuickAdd, materialUnitId: e.target.value })}
              SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
              <option value="">— Seleccionar —</option>
              {materialUnits.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
            </TextField>
            {hasCostsRead && (
              <Stack direction="row" spacing={2}>
                <TextField label="Costo real (opcional)" type="number" fullWidth value={materialQuickAdd.cost}
                  onChange={(e) => setMaterialQuickAdd({ ...materialQuickAdd, cost: e.target.value })} />
                <TextField label="Moneda" select fullWidth value={materialQuickAdd.currency}
                  onChange={(e) => setMaterialQuickAdd({ ...materialQuickAdd, currency: e.target.value as BudgetCurrency })}
                  SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
                  <option value="ARS">ARS</option>
                  <option value="USD">USD</option>
                </TextField>
              </Stack>
            )}
            {!hasCostsRead && (
              <Typography variant="caption" color="text.secondary">
                Se crea sin costo — alguien con permiso lo completa después desde el catálogo de Materiales.
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMaterialQuickAdd({ ...materialQuickAdd, open: false })}>Cancelar</Button>
          <Button onClick={handleConfirmMaterialQuickAdd} variant="contained">Crear y usar</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, budget: null })} maxWidth="xs" fullWidth>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>¿Eliminar el presupuesto <strong>{deleteDialog.budget?.number}</strong>?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, budget: null })}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Eliminar</Button>
        </DialogActions>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog open={statusDialog.open} onClose={() => { setStatusDialog({ open: false, budget: null, target: '' }); setApprovalFile(null); setRejectionReason(''); setApprovedBySupervisorId(''); }} maxWidth="sm" fullWidth>
        <DialogTitle>
          {statusDialog.target === 'sent' && 'Enviar Presupuesto'}
          {statusDialog.target === 'approved' && statusDialog.budget?.status === 'approved' && 'Subir Documento Firmado'}
          {statusDialog.target === 'approved' && statusDialog.budget?.status !== 'approved' && 'Aprobar Presupuesto'}
          {statusDialog.target === 'rejected' && 'Rechazar Presupuesto'}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>Presupuesto <strong>{statusDialog.budget?.number}</strong></Typography>
          {statusDialog.target === 'rejected' && (
            <TextField label="Motivo del rechazo *" fullWidth multiline rows={2} value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} />
          )}
          {statusDialog.target === 'approved' && (
            <Stack spacing={2}>
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Quién aprobó del lado del cliente (opcional, se puede completar más adelante) —
                  distinto de quién carga esto en el sistema.
                </Typography>
                <Autocomplete<SupervisorOption>
                  size="small"
                  fullWidth
                  options={statusDialogSupervisors.map(s => ({ id: s.id, label: `${s.lastname}, ${s.name}` }))}
                  value={(() => {
                    const s = statusDialogSupervisors.find(sup => String(sup.id) === approvedBySupervisorId);
                    return s ? { id: s.id, label: `${s.lastname}, ${s.name}` } : null;
                  })()}
                  onChange={(_, newValue) => handleSupervisorSelectChange(newValue)}
                  getOptionLabel={(option) => option.label}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  filterOptions={(options, params) => {
                    const filtered = supervisorFilter(options, params);
                    const { inputValue } = params;
                    const exists = options.some((o) => o.label.toLowerCase() === inputValue.toLowerCase());
                    if (inputValue !== '' && !exists) {
                      filtered.push({ label: `Agregar "${inputValue}"`, inputValue });
                    }
                    return filtered;
                  }}
                  renderInput={(params) => <TextField {...params} label="Aprobado por (contacto del cliente)" />}
                />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Documento firmado por el cliente (opcional{statusDialog.budget?.status === 'approved' ? ', reemplaza al actual' : ', se puede subir más adelante'}).
                </Typography>
                <Button component="label" variant="outlined" size="small" startIcon={<UploadIcon />} sx={{ mt: 1 }}>
                  {approvalFile ? approvalFile.name : 'Seleccionar archivo'}
                  <input type="file" hidden onChange={(e) => setApprovalFile(e.target.files?.[0] || null)} />
                </Button>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setStatusDialog({ open: false, budget: null, target: '' }); setApprovalFile(null); setRejectionReason(''); setApprovedBySupervisorId(''); }}>Cancelar</Button>
          <Button onClick={handleChangeStatus} variant="contained">Confirmar</Button>
        </DialogActions>
      </Dialog>

      {/* Bonificación post-presentación — separada del form de edición porque solo aplica
          desde "sent" en adelante, discriminada mano de obra / material (ver FLOWS.md) */}
      <Dialog open={discountDialog.open} onClose={() => setDiscountDialog({ open: false, budget: null, labor: '0', material: '0' })} maxWidth="xs" fullWidth>
        <DialogTitle>Bonificación</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>Presupuesto <strong>{discountDialog.budget?.number}</strong></Typography>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Bonificación mano de obra (%)" type="number" fullWidth value={discountDialog.labor}
              onChange={(e) => setDiscountDialog({ ...discountDialog, labor: e.target.value })} inputProps={{ min: 0, max: 100 }} />
            <TextField label="Bonificación material (%)" type="number" fullWidth value={discountDialog.material}
              onChange={(e) => setDiscountDialog({ ...discountDialog, material: e.target.value })} inputProps={{ min: 0, max: 100 }} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDiscountDialog({ open: false, budget: null, labor: '0', material: '0' })}>Cancelar</Button>
          <Button onClick={handleApplyDiscount} variant="contained">Aplicar</Button>
        </DialogActions>
      </Dialog>

      {/* Alta rápida de contacto del cliente (ClientSupervisor) — abierta desde el Autocomplete de arriba */}
      <Dialog open={supervisorQuickAdd.open} onClose={() => setSupervisorQuickAdd({ ...supervisorQuickAdd, open: false })} maxWidth="xs" fullWidth>
        <DialogTitle>Nuevo Contacto del Cliente</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Nombre *" fullWidth value={supervisorQuickAdd.name}
              onChange={(e) => setSupervisorQuickAdd({ ...supervisorQuickAdd, name: e.target.value })} />
            <TextField label="Apellido *" fullWidth value={supervisorQuickAdd.lastname}
              onChange={(e) => setSupervisorQuickAdd({ ...supervisorQuickAdd, lastname: e.target.value })} />
            <TextField label="Email" fullWidth value={supervisorQuickAdd.email}
              onChange={(e) => setSupervisorQuickAdd({ ...supervisorQuickAdd, email: e.target.value })} />
            <TextField label="Teléfono" fullWidth value={supervisorQuickAdd.phone}
              onChange={(e) => setSupervisorQuickAdd({ ...supervisorQuickAdd, phone: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSupervisorQuickAdd({ ...supervisorQuickAdd, open: false })}>Cancelar</Button>
          <Button onClick={handleConfirmSupervisorQuickAdd} variant="contained">Crear y usar</Button>
        </DialogActions>
      </Dialog>

      {/* Vista Ver/Imprimir — mismo patrón que OCAs y Liquidación: window.print() sobre .print-area */}
      <Dialog open={!!printBudget} onClose={() => setPrintBudget(null)} maxWidth="md" fullWidth>
        <DialogTitle>Presupuesto {printBudget?.number}</DialogTitle>
        <DialogContent>
          {printBudget && (
            <Box className="print-area" sx={{ bgcolor: 'white', color: 'black', p: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Box>
                  <Typography variant="h5" fontWeight="bold">{printBudget.number}</Typography>
                  <Typography variant="h6">{printBudget.title}</Typography>
                </Box>
                <Chip label={STATUS_LABELS[printBudget.status].label} color={STATUS_LABELS[printBudget.status].color} />
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2"><strong>Cliente:</strong> {printBudget.client?.razonSocial}</Typography>
                  {printBudget.plant && <Typography variant="body2"><strong>Planta:</strong> {printBudget.plant.name}</Typography>}
                  {printBudget.parentProject && <Typography variant="body2"><strong>Adicional de:</strong> {printBudget.parentProject.code} - {printBudget.parentProject.name}</Typography>}
                  {printBudget.existingProject && <Typography variant="body2"><strong>Vinculado a:</strong> {printBudget.existingProject.code} - {printBudget.existingProject.name}</Typography>}
                  {printBudget.work_order_number && <Typography variant="body2"><strong>N° OT:</strong> {printBudget.work_order_number}</Typography>}
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2"><strong>Fecha:</strong> {new Date(printBudget.createdAt).toLocaleDateString('es-AR')}</Typography>
                  {printBudget.status === 'approved' && printBudget.approvedBySupervisor && (
                    <Typography variant="body2"><strong>Aprobado por:</strong> {printBudget.approvedBySupervisor.lastname}, {printBudget.approvedBySupervisor.name}{printBudget.approved_at ? ` — ${new Date(printBudget.approved_at).toLocaleDateString('es-AR')}` : ''}</Typography>
                  )}
                  {printBudget.project && <Typography variant="body2"><strong>Proyecto generado:</strong> {printBudget.project.code}</Typography>}
                </Grid>
              </Grid>
              {printBudget.description && <Typography variant="body2" sx={{ mb: 2 }}>{printBudget.description}</Typography>}

              {(printBudget.laborLines?.length || 0) > 0 && (
                <>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2 }}>Mano de Obra</Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Rubro</TableCell>
                          <TableCell align="right">Cantidad</TableCell>
                          {hasPricesRead && <TableCell align="right">Valor Unitario</TableCell>}
                          {hasPricesRead && <TableCell align="right">Total</TableCell>}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {printBudget.laborLines?.map((line, i) => (
                          <TableRow key={i}>
                            <TableCell>{line.itemType?.name}</TableCell>
                            <TableCell align="right">{line.quantity} {line.itemType?.unit_label}</TableCell>
                            {hasPricesRead && <TableCell align="right">{formatMoney(line.unit_price, line.currency || printBudget.currency)}</TableCell>}
                            {hasPricesRead && <TableCell align="right">{formatMoney(line.estimated_total || 0, line.currency || printBudget.currency)}</TableCell>}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}

              {(printBudget.materialItems?.length || 0) > 0 && (
                <>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2 }}>Materiales</Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Descripción</TableCell>
                          <TableCell align="right">Cantidad</TableCell>
                          {hasPricesRead && <TableCell align="right">Precio Unitario</TableCell>}
                          {hasPricesRead && <TableCell align="right">Total</TableCell>}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {printBudget.materialItems?.map((item, i) => (
                          <TableRow key={i}>
                            <TableCell>{item.description}</TableCell>
                            <TableCell align="right">{item.quantity} {item.materialUnit?.label}</TableCell>
                            {hasPricesRead && <TableCell align="right">{formatMoney(item.unit_price, item.currency || printBudget.currency)}</TableCell>}
                            {hasPricesRead && <TableCell align="right">{formatMoney(item.total_price || 0, item.currency || printBudget.currency)}</TableCell>}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}

              {hasPricesRead && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box textAlign="right">
                    <Typography variant="body2">Mano de obra: {formatTotals(sumLaborByCurrency(printBudget.laborLines, printBudget.currency))}</Typography>
                    {(printBudget.labor_discount_percent ?? 0) > 0 && (
                      <Typography variant="body2" color="text.secondary">Bonificación mano de obra: {printBudget.labor_discount_percent}%</Typography>
                    )}
                    <Typography variant="body2">Materiales: {formatTotals(sumMaterialsByCurrency(printBudget.materialItems, printBudget.currency))}</Typography>
                    {(printBudget.material_discount_percent ?? 0) > 0 && (
                      <Typography variant="body2" color="text.secondary">Bonificación material: {printBudget.material_discount_percent}%</Typography>
                    )}
                    <Typography variant="h6" fontWeight="bold">Total: {formatTotals(printBudget.totals_by_currency)}</Typography>
                  </Box>
                </>
              )}

              {printBudget.notes && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" fontWeight="bold">Notas internas:</Typography>
                  <Typography variant="body2">{printBudget.notes}</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPrintBudget(null)}>Cerrar</Button>
          <Button onClick={handlePrint} variant="contained" startIcon={<PrintIcon />}>Imprimir</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
