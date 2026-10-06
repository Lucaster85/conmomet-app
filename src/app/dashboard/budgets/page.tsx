'use client';
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Box, Typography, Button, Paper, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Tooltip, TextField, Stack, Chip, Divider, Grid, Alert, Link,
  Autocomplete, createFilterOptions, useMediaQuery, useTheme,
  FormControlLabel, Switch,
} from '@mui/material';
import FeedbackModal from '../../../components/FeedbackModal';
import GearSpinner from '../../../components/GearSpinner';
import CurrencyInput from '../../../components/CurrencyInput';
import DeliverToManagementDialog from '../../../components/common/DeliverToManagementDialog';
import {
  AddOutlined as AddIcon, EditOutlined as EditIcon, DeleteOutlined as DeleteIcon, RefreshOutlined as RefreshIcon,
  ContentCopyOutlined as DuplicateIcon, VisibilityOutlined as ViewIcon, PlayArrowOutlined as GenerateIcon,
  UploadFileOutlined as UploadIcon, SendOutlined as SendIcon, CheckCircleOutlined as ApproveIcon,
  CancelOutlined as RejectIcon, PrintOutlined as PrintIcon, DescriptionOutlined as DocumentIcon,
  AssignmentOutlined as ProjectIcon, DownloadOutlined as DownloadIcon, PercentOutlined as DiscountIcon,
  RequestQuoteOutlined as TitleIcon, AssignmentReturnOutlined as DeliverIcon, AttachFileOutlined as AttachIcon,
  InfoOutlined as InfoIcon,
} from '@mui/icons-material';
import {
  Budget, BudgetService, BudgetLaborLine, BudgetMaterialItem, CreateBudgetData,
  BudgetItemType, BudgetItemTypeService, MaterialUnit, MaterialUnitService,
  Material, MaterialService, MaterialProvider, MaterialProviderService, Client, ClientService, Plant, PlantService,
  Project, ProjectService, HourBucket, BudgetCurrency,
  ClientSupervisor, ClientSupervisorService, ClientItemRate, ClientItemRateService,
  QuoteRequestService,
} from '../../../utils/api';
import { useAuth } from '../../../utils/auth';
import ProviderPriceAutocomplete from '../../../components/materials/ProviderPriceAutocomplete';
import MaterialSelect from '../../../components/materials/MaterialSelect';
import { downloadMaterialsTemplate, exportMaterialsSheet } from '../../../utils/materialsExcel';
import { findPrice } from '../../../utils/materialPrices';
import { formatLaborQuantity, formatHours, hoursPerDayFor, laborLineHours, lineHoursPerDay } from '../../../utils/laborFormat';
import { formatProjectCode } from '../../../utils/projectCode';

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
  quote_request_id: '',
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

// Mismo patrón "creatable" para elegir quién aprobó del lado del cliente (ClientSupervisor).
// Igual que Material, dar de alta uno nuevo pide más de un dato (nombre y apellido por
// separado), así que la opción sintética abre un mini diálogo en vez de crear directo.
interface SupervisorOption {
  id?: number;
  label: string; // "Apellido, Nombre" ya armado, para no repetir el getOptionLabel en dos formatos
  inputValue?: string;
}
const supervisorFilter = createFilterOptions<SupervisorOption>();

function formatMoney(value: number | string, currency: BudgetCurrency) {
  const symbol = currency === 'USD' ? 'US$' : '$';
  return `${symbol}${(Number(value) || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Subtotales "brutos" (sin bonificación) para el desglose del Ver/Imprimir — totals_by_currency
// ya viene neto de bonificación desde el backend (ver FLOWS.md).
// Los DECIMAL de Sequelize llegan como string (estimated_total/total_price) — Number() es
// obligatorio acá, sino `totals[currency] += "7.50"` concatena en vez de sumar.
function sumLaborByCurrency(lines: BudgetLaborLine[] | undefined, defaultCurrency: BudgetCurrency): Record<BudgetCurrency, number> {
  const totals: Record<BudgetCurrency, number> = { ARS: 0, USD: 0 };
  for (const l of lines || []) {
    const currency = (l.currency || defaultCurrency) as BudgetCurrency;
    totals[currency] += Number(l.estimated_total) || 0;
  }
  return totals;
}
function sumMaterialsByCurrency(items: BudgetMaterialItem[] | undefined, defaultCurrency: BudgetCurrency): Record<BudgetCurrency, number> {
  const totals: Record<BudgetCurrency, number> = { ARS: 0, USD: 0 };
  for (const m of items || []) {
    const currency = (m.currency || defaultCurrency) as BudgetCurrency;
    totals[currency] += Number(m.total_price) || 0;
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
// Un adicional (parent_project_id) puede generar su proyecto estando en borrador — todavía no
// se sabe el alcance real, se va cargando horas mientras se termina de armar el presupuesto
// formal. Proyecto nuevo raíz o vinculación a uno existente siguen requiriendo aprobación.
function canGenerateProject(budget: Budget): boolean {
  if (budget.project_id) return false;
  if (budget.status === 'approved') return true;
  return budget.status === 'draft' && !!budget.parent_project_id;
}

function daysExpired(budget: Budget): number | null {
  if (budget.status !== 'sent' || !budget.sent_at || !budget.validity_days) return null;
  const sentAt = new Date(budget.sent_at);
  const deadline = new Date(sentAt.getTime() + budget.validity_days * 24 * 60 * 60 * 1000);
  const diffDays = Math.floor((Date.now() - deadline.getTime()) / (24 * 60 * 60 * 1000));
  return diffDays > 0 ? diffDays : null;
}

// Vencimiento de presentación del PC vinculado — mismo criterio "visual, no bloquea" que
// daysExpired de arriba, pero sobre quoteRequest.due_date en vez de sent_at+validity_days
// (ver quote-requests/page.tsx#dueDateChip, misma lógica duplicada a propósito por ser un
// helper de 4 líneas sin estado compartido).
function quoteRequestDueChip(dueDate: string): { label: string; color: 'default' | 'warning' | 'error' } {
  const days = Math.ceil((new Date(dueDate + 'T00:00:00').getTime() - new Date().setHours(0, 0, 0, 0)) / (24 * 60 * 60 * 1000));
  if (days < 0) return { label: `PC vencido hace ${Math.abs(days)} día(s)`, color: 'error' };
  if (days <= 2) return { label: `PC vence en ${days}d`, color: 'error' };
  if (days <= 7) return { label: `PC vence en ${days}d`, color: 'warning' };
  return { label: `PC vence en ${days}d`, color: 'default' };
}

// Etiqueta para el listado cuando el presupuesto está asignado a quien está mirando (vía los
// responsables de su Pedido de Cotización). El texto cambia según qué se espera de esa persona:
// armarlo o validarlo. En PC ya cotizado o cancelado no se muestra — no hay nada que hacer.
function assignedChip(qr: NonNullable<Budget['quoteRequest']>): { label: string; color: 'primary' | 'warning' } | null {
  if (!qr.assigned_to_me) return null;
  if (qr.status === 'pending' || qr.status === 'in_progress') return { label: 'Asignado a vos', color: 'primary' };
  if (qr.status === 'pending_review') return { label: 'A validar por vos', color: 'warning' };
  return null;
}

export default function BudgetsPage() {
  return (
    <Suspense fallback={<Box display="flex" justifyContent="center" py={8}><GearSpinner /></Box>}>
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
  // budget_prices_read gatea SOLO la mano de obra (valores), el total general y la bonificación.
  // Los precios y el margen de los materiales los ve y carga cualquiera con acceso a Presupuestos.
  const hasPricesRead = permissions.includes('admin_granted') || permissions.includes('budget_prices_read');
  const hasAdditionalsRead = permissions.includes('admin_granted') || permissions.includes('additionals_read');
  // Enviar al cliente es un permiso aparte de budgets_update: quien arma el presupuesto puede
  // editarlo pero no necesariamente ponerlo en manos del cliente (ver FLOWS.md flujo 27).
  // Además, quien no ve los valores de mano de obra (hasPricesRead) no puede enviar: lo que le
  // llegaría al cliente sería un presupuesto incompleto. El backend lo exige también.
  const hasSendPermission = (permissions.includes('admin_granted') || permissions.includes('budgets_send')) && hasPricesRead;
  // Entregar a gerencia es una transición del PC, no del presupuesto: pide el permiso granular
  // de ese módulo. Gerencia (quote_requests_assign) también puede hacerlo (ver FLOWS.md 27d).
  const hasDeliverPermission = permissions.includes('admin_granted')
    || permissions.includes('quote_requests_deliver')
    || permissions.includes('quote_requests_assign');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  // Debajo de 960px no entra la grilla alineada de las líneas de material: pasan a tarjetas apiladas.
  const stackedMaterialLines = useMediaQuery(theme.breakpoints.down(960));
  const autoOpenedFromParent = useRef(false);
  const autoViewedBudget = useRef(false);
  const autoOpenedFromQuoteRequest = useRef(false);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [itemTypes, setItemTypes] = useState<BudgetItemType[]>([]);
  const [materialUnits, setMaterialUnits] = useState<MaterialUnit[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [providers, setProviders] = useState<MaterialProvider[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [projectsWithoutBudget, setProjectsWithoutBudget] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [openDialog, setOpenDialog] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [processing, setProcessing] = useState(false);
  const [form, setForm] = useState(emptyForm());
  // Bolsas de horas por rubro del proyecto vinculado (si lo hay) — para mostrar "ya cargado en
  // el proyecto" en vivo mientras se arma el presupuesto, sin depender de haber guardado antes
  // (ver FLOWS.md, Fase 2 Parte A.1).
  const [linkedProjectHourBuckets, setLinkedProjectHourBuckets] = useState<HourBucket[]>([]);

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
  const [materialQuickAdd, setMaterialQuickAdd] = useState<{ open: boolean; lineIdx: number; description: string; materialUnitId: string; providerId: number | null; cost: string; currency: BudgetCurrency }>(
    { open: false, lineIdx: -1, description: '', materialUnitId: '', providerId: null, cost: '', currency: 'ARS' }
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

  // Si el original venía de un Pedido de Cotización, al duplicar se pregunta si el duplicado
  // sigue atado al mismo PC (y por lo tanto hereda su N° de cotización del cliente) o nace
  // libre — no hay una regla de negocio única todavía (ver FLOWS.md flujo 27). Para un
  // presupuesto sin PC no hay nada que preguntar: se duplica directo.
  const [duplicateDialog, setDuplicateDialog] = useState<{ open: boolean; budget: Budget | null; keepQuoteRequest: boolean }>(
    { open: false, budget: null, keepQuoteRequest: false }
  );

  const [deliverDialog, setDeliverDialog] = useState<{ open: boolean; budget: Budget | null }>(
    { open: false, budget: null }
  );

  // "Entregar a gerencia" solo tiene sentido sobre un presupuesto que nació de un PC y que
  // todavía está del lado del responsable (PC en "En progreso"). Es una transición del PC, por
  // eso pide el permiso de ese módulo (ver FLOWS.md flujo 27d).
  const canDeliverBudget = (b: Budget) =>
    hasDeliverPermission && !!b.quoteRequest && b.quoteRequest.status === 'in_progress';

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [bgs, its, mUnits, mats, mProviders, clis, plts, projsNoBudget] = await Promise.all([
        BudgetService.getAll(),
        BudgetItemTypeService.getAll(true),
        MaterialUnitService.getAll(true),
        MaterialService.getAll({ is_active: true }),
        MaterialProviderService.getAll(),
        ClientService.getAll({ is_active: true }),
        PlantService.getAll(),
        ProjectService.getAll({ without_budget: true }),
      ]);
      setBudgets(Array.isArray(bgs) ? bgs : []);
      setItemTypes(Array.isArray(its) ? its : []);
      setMaterialUnits(Array.isArray(mUnits) ? mUnits : []);
      setMaterials(Array.isArray(mats) ? mats : []);
      setProviders(Array.isArray(mProviders) ? mProviders : []);
      setClients(Array.isArray(clis) ? clis : []);
      setPlants(Array.isArray(plts) ? plts : []);
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

  // "Nuevo Adicional" ya no vive acá: los adicionales se crean desde el módulo Adicionales. Un link
  // viejo con ?parent_project_id=X redirige al alta de ese módulo con el padre ya puesto.
  useEffect(() => {
    const parentProjectId = searchParams.get('parent_project_id');
    if (parentProjectId) router.replace(`/dashboard/additionals?parent_id=${parentProjectId}`);
  }, [searchParams, router]);

  // Al llegar desde "Vincular Presupuesto" (?existing_project_id=X) en el detalle de un proyecto,
  // abrimos el formulario de creación con el proyecto ya preseleccionado.
  useEffect(() => {
    if (autoOpenedFromParent.current) return; // solo una vez por visita, aunque las listas se recarguen después
    const existingProjectId = searchParams.get('existing_project_id');
    if (!existingProjectId) return;

    if (projectsWithoutBudget.length === 0) return;
    const project = projectsWithoutBudget.find(p => String(p.id) === existingProjectId);
    if (!project) return;
    autoOpenedFromParent.current = true;
    setEditingBudget(null);
    setForm({ ...emptyForm(), existing_project_id: existingProjectId, client_id: String(project.client_id), plant_id: project.plant_id ? String(project.plant_id) : '' });
    setOpenDialog(true);
    router.replace('/dashboard/budgets');
    // El proyecto todavía no tiene presupuesto, pero puede ya tener horas cargadas (ver
    // "Vincular Presupuesto" en el detalle de Proyecto) — la lista sin presupuesto no trae el
    // detalle por rubro, hay que pedirlo aparte para que se vea el mismo aviso que en edición.
    ProjectService.getById(project.id)
      .then(proj => setLinkedProjectHourBuckets(proj.hour_buckets || []))
      .catch(() => setLinkedProjectHourBuckets([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectsWithoutBudget]);

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

  // Acceso directo desde "Crear presupuesto" en el listado de Pedidos de Cotización:
  // ?quote_request_id=<id> abre el alta pre-vinculada al PC, precargando cliente/planta —
  // mismo patrón que parent_project_id/existing_project_id de arriba.
  useEffect(() => {
    if (autoOpenedFromQuoteRequest.current) return;
    const quoteRequestId = searchParams.get('quote_request_id');
    if (!quoteRequestId) return;
    autoOpenedFromQuoteRequest.current = true;
    QuoteRequestService.getById(Number(quoteRequestId))
      .then((qr) => {
        setEditingBudget(null);
        setForm({
          ...emptyForm(),
          quote_request_id: String(qr.id),
          title: qr.title,
          client_id: String(qr.client_id),
          plant_id: qr.plant_id ? String(qr.plant_id) : '',
        });
        setOpenDialog(true);
      })
      .catch(() => setError('No se pudo cargar el Pedido de Cotización.'));
    router.replace('/dashboard/budgets');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenCreate = () => {
    setEditingBudget(null);
    setForm(emptyForm());
    setLinkedProjectHourBuckets([]);
    setOpenDialog(true);
  };

  const handleOpenEdit = async (budget: Budget) => {
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
      quote_request_id: budget.quote_request_id ? String(budget.quote_request_id) : '',
      laborLines: budget.laborLines || [],
      materialItems: budget.materialItems || [],
    });
    if (budget.project_id) {
      try {
        const proj = await ProjectService.getById(budget.project_id);
        setLinkedProjectHourBuckets(proj.hour_buckets || []);
      } catch {
        setLinkedProjectHourBuckets([]);
      }
    } else {
      setLinkedProjectHourBuckets([]);
    }
    setOpenDialog(true);
  };

  // Value del <select> de relación: '' | `existing:<id>` ("adicional de" ya no existe acá).
  const projectLinkValue = form.existing_project_id ? `existing:${form.existing_project_id}` : '';

  // El proyecto que este presupuesto ya tiene vinculado no aparece en projectsWithoutBudget
  // (dejó de estar "sin presupuesto" apenas se creó este mismo borrador) — lo inyectamos
  // para que la opción siga visible al editar.
  const existingProjectOptions = [
    ...projectsWithoutBudget,
    ...(editingBudget?.existingProject && !projectsWithoutBudget.some(p => p.id === editingBudget.existingProject!.id)
      ? [editingBudget.existingProject as unknown as Project]
      : []),
  ];

  // Presupuesto de un ADICIONAL (módulo Adicionales): cliente, planta y proyecto son del adicional.
  const additionalProject = editingBudget?.project?.is_additional ? editingBudget.project : null;
  // Borrador viejo "adicional de…" (flujo anterior): sigue generando su subproyecto como siempre.
  const legacyParent = !additionalProject && form.parent_project_id ? editingBudget?.parentProject || null : null;
  // Un adicional tiene un solo presupuesto vivo (no rechazado) a la vez: solo se puede duplicar
  // cuando todos están rechazados.
  const additionalHasLiveBudget = (b: Budget) =>
    !!b.project?.is_additional && budgets.some(o => o.project?.id === b.project?.id && o.status !== 'rejected');

  const handleProjectLinkChange = (value: string) => {
    if (!value) {
      setForm({ ...form, existing_project_id: '' });
      return;
    }
    const [, idStr] = value.split(':');
    // El objeto puede ser el "stub" sintético del proyecto ya vinculado (solo id/name/code,
    // ver existingProjectOptions) — en ese caso no pisamos cliente/planta, ya están bien.
    const project = existingProjectOptions.find(p => String(p.id) === idStr);
    setForm({
      ...form,
      existing_project_id: idStr,
      client_id: project?.client_id ? String(project.client_id) : form.client_id,
      plant_id: project?.client_id ? (project.plant_id ? String(project.plant_id) : '') : form.plant_id,
    });
  };

  // Los proyectos elegibles dependen del cliente y la planta del formulario: sin cliente no hay
  // lista; con cliente, solo los de ese cliente; con planta elegida, solo los de esa planta (la
  // planta es opcional — sin planta se ven todos los del cliente). El stub del proyecto ya
  // vinculado (ver existingProjectOptions) no trae client_id y siempre pasa el filtro, igual
  // que el proyecto actualmente elegido, para que nunca desaparezca de su propio select.
  const matchesClientAndPlant = (p: Project, clientId: string, plantId: string) => {
    if (!p.client_id) return true;
    if (String(p.client_id) !== clientId) return false;
    return !plantId || String(p.plant_id ?? '') === plantId;
  };
  const filteredExistingProjects = existingProjectOptions.filter(p =>
    matchesClientAndPlant(p, form.client_id, form.plant_id) || String(p.id) === form.existing_project_id);

  // Al cambiar cliente/planta, si el proyecto ya elegido deja de corresponder se desvincula.
  const changeClientOrPlant = (clientId: string, plantId: string) => {
    const linked = form.existing_project_id
      ? existingProjectOptions.find(p => String(p.id) === form.existing_project_id)
      : undefined;
    const stillMatches = !linked || matchesClientAndPlant(linked, clientId, plantId);
    if (!stillMatches) setLinkedProjectHourBuckets([]);
    setForm({
      ...form,
      client_id: clientId,
      plant_id: plantId,
      ...(stillMatches ? {} : { existing_project_id: '' }),
    });
  };

  // Si el cliente del presupuesto tiene una tarifa cargada para el rubro elegido (ver
  // ClientItemRateService), se prellena el valor unitario — sigue siendo editable normalmente,
  // es solo el punto de partida (mismo criterio que vincular un material del catálogo).
  // Rubros que aparecen en más de una línea del presupuesto.
  const repeatedLaborTypeIds = (() => {
    const counts = new Map<number, number>();
    form.laborLines.forEach(l => counts.set(l.budget_item_type_id, (counts.get(l.budget_item_type_id) || 0) + 1));
    return new Set(Array.from(counts.entries()).filter(([, n]) => n > 1).map(([id]) => id));
  })();

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
        // Rubro por días: cada día vale 9 hs (el backend lo fija igual al guardar).
        hours_per_day: hoursPerDayFor(defaultType),
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
        provider_id: item?.provider_id,
        provider: item?.provider,
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

  // Proveedor por defecto de una línea: "Sin especificar" (is_system). Elegir otro es opcional.
  const unspecifiedProvider = providers.find(p => p.is_system) || null;

  // Alta inline de proveedor desde el selector de la línea (o del alta rápida de material).
  const createProviderInline = async (name: string) => {
    const created = await MaterialProviderService.create(name);
    setProviders(prev => (prev.some(p => p.id === created.id) ? prev : [...prev, created]));
    return created;
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

  // Aplica a la línea el precio de (material, proveedor) del catálogo como costo base — si ese
  // par no tiene precio el costo queda vacío para cargarlo a mano, y lo cargado se guarda en el
  // backend como el precio de ese proveedor.
  const linkMaterialToLine = (idx: number, material: Material, provider: MaterialProvider | null) => {
    const marginPercent = form.materialItems[idx]?.margin_percent ?? 0;
    const price = findPrice(material, provider?.id);
    const costValue = price?.cost != null ? Number(price.cost) : null;
    const costCurrency = price?.currency ?? null;
    updateMaterialItem(idx, {
      material_id: material.id,
      provider_id: provider?.id ?? null,
      provider,
      description: material.description,
      material_unit_id: material.material_unit_id,
      material_cost_snapshot: costValue,
      material_cost_currency: costCurrency,
      currency: costCurrency,
      unit_price: computeUnitPrice(costValue, marginPercent),
    });
  };

  // Vincular un Material existente del catálogo a la línea (autocompleta descripción y
  // unidad), o abrir el mini-diálogo de alta rápida si el usuario tipeó algo nuevo. La línea
  // siempre queda vinculada al catálogo: sin costo real no se puede calcular el precio.
  const handleMaterialSelectChange = (idx: number, material: Material | null) => {
    if (material) linkMaterialToLine(idx, material, unspecifiedProvider);
  };
  const handleMaterialCreateRequest = (idx: number, name: string) =>
    setMaterialQuickAdd({ open: true, lineIdx: idx, description: name, materialUnitId: '', providerId: unspecifiedProvider?.id ?? null, cost: '', currency: form.currency });

  // Cambiar de proveedor re-resuelve el costo: pasa a ser el precio de ese proveedor.
  const handleProviderChange = (idx: number, provider: MaterialProvider) => {
    const material = materials.find(m => m.id === form.materialItems[idx]?.material_id);
    if (material) linkMaterialToLine(idx, material, provider);
  };

  const handleConfirmMaterialQuickAdd = async () => {
    if (!materialQuickAdd.materialUnitId) {
      setError('Elegí una unidad para el material nuevo');
      return;
    }
    try {
      const providerId = materialQuickAdd.providerId ?? unspecifiedProvider?.id ?? null;
      const costNumber = materialQuickAdd.cost ? Number(materialQuickAdd.cost) : null;
      const created = await MaterialService.create({
        description: materialQuickAdd.description,
        material_unit_id: Number(materialQuickAdd.materialUnitId),
        // El costo ingresado se guarda como precio del proveedor elegido.
        provider_prices: hasCostsRead && providerId
          ? [{ provider_id: providerId, cost: costNumber, currency: costNumber != null ? materialQuickAdd.currency : null }]
          : undefined,
      });
      setMaterials(prev => [...prev, created]);
      linkMaterialToLine(
        materialQuickAdd.lineIdx,
        created,
        providers.find(p => p.id === providerId) || unspecifiedProvider,
      );
      setMaterialQuickAdd({ open: false, lineIdx: -1, description: '', materialUnitId: '', providerId: null, cost: '', currency: 'ARS' });
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
    const price = findPrice(materials.find(m => m.id === item.material_id), item.provider_id);
    if (!price || price.cost == null) return null;
    return { value: Number(price.cost), currency: price.currency || form.currency };
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

      // El precio del Excel es el COSTO REAL del material, nunca el precio al cliente — por eso
      // alimenta el catálogo (precio de ese proveedor), no unit_price. Todo el alta (unidades,
      // proveedores, materiales y precios) se hace en una sola transacción en el backend.
      const { data: committed } = await MaterialService.importCommit(rows.map(row => ({
        description: row.description,
        unit: row.unit,
        provider: row.provider,
        cost: hasCostsRead ? row.cost : null,
        // Si el archivo no trae moneda, la del presupuesto.
        currency: hasCostsRead && row.cost != null ? (row.currency || form.currency) : null,
        kg_per_meter: row.kg_per_meter,
      })));

      const [mats, mUnits, mProviders] = await Promise.all([
        MaterialService.getAll({ is_active: true }),
        MaterialUnitService.getAll(true),
        MaterialProviderService.getAll(),
      ]);
      setMaterials(Array.isArray(mats) ? mats : []);
      setMaterialUnits(Array.isArray(mUnits) ? mUnits : []);
      setProviders(Array.isArray(mProviders) ? mProviders : []);

      // El precio al cliente arranca en margen 0% (= precio igual al costo) — el usuario
      // carga el margen real de cada línea aparte, no se autocompleta con nada del Excel.
      committed.forEach((result, i) => {
        addMaterialItem({
          description: mats.find(m => m.id === result.material_id)?.description ?? rows[i].description,
          quantity: rows[i].quantity,
          material_unit_id: result.material_unit_id,
          material_id: result.material_id,
          provider_id: result.provider_id,
          provider: { id: result.provider_id, razonSocial: result.provider_name, is_system: false },
          material_cost_snapshot: result.cost,
          material_cost_currency: result.currency,
          margin_percent: 0,
        });
      });
      setSuccess(`${rows.length} fila(s) importadas desde el Excel. Cargá el margen de cada una antes de guardar.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al importar el Excel');
    } finally {
      setImporting(false);
    }
  };

  // Mismo formato que la plantilla, así el archivo se puede volver a importar. Sale del estado
  // del formulario (no del servidor), así funciona también antes de guardar el presupuesto.
  const handleExportExcel = async () => {
    try {
      await exportMaterialsSheet(form.materialItems.map(item => {
        const cost = hasCostsRead ? lineCost(item) : null;
        const kg = materials.find(m => m.id === item.material_id)?.kg_per_meter;
        return {
          description: item.description,
          quantity: item.quantity,
          unit: materialUnits.find(u => u.id === item.material_unit_id)?.label || 'u',
          provider: item.provider?.razonSocial || providers.find(p => p.id === item.provider_id)?.razonSocial || '',
          cost: cost?.value ?? null,
          currency: cost?.currency ?? null,
          kg_per_meter: kg != null ? Number(kg) : null,
        };
      }), `materiales-${editingBudget?.number || 'presupuesto'}.xlsx`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al descargar el Excel');
    }
  };

  // ---- Líneas de material ----
  // Desktop: una fila de grilla por línea, alineada bajo un único encabezado (columnas de ancho
  // fijo para los datos cortos, el resto se reparte entre material y proveedor, que truncan con
  // "…"). Angosto: tarjeta apilada con etiquetas en cada campo. Las columnas de costo y de
  // margen/total solo existen con el permiso correspondiente.
  const materialGridTemplate = [
    'minmax(0, 2.4fr)', 'minmax(0, 1.8fr)', '68px', '92px',
    ...(hasCostsRead ? ['118px'] : []),
    '76px', '112px',
    '36px',
  ].join(' ');
  const materialColumnHeaders = [
    'Material', 'Proveedor', 'Cant.', 'Unidad',
    ...(hasCostsRead ? ['Costo real'] : []),
    'Margen %', 'Total',
    '',
  ];

  const renderMaterialLine = (item: BudgetMaterialItem, idx: number) => {
    const stacked = stackedMaterialLines;
    const cost = lineCost(item);
    const margin = lineMargin(item);
    const lineCurrency = item.currency || form.currency;
    // En desktop las etiquetas van en el encabezado de la grilla, no en cada input.
    const lbl = (text: string) => (stacked ? text : '');
    const shrink = stacked ? { shrink: true } : undefined;
    // Línea vieja cargada como texto libre: se ve qué decía, marcada en rojo, para vincularla.
    const unlinkedText = !item.material_id && item.description ? `Sin vincular: "${item.description}"` : '';

    const materialField = (
      <MaterialSelect
        materials={materials}
        value={item.material_id ?? null}
        onChange={(material) => handleMaterialSelectChange(idx, material)}
        onCreateRequest={(name) => handleMaterialCreateRequest(idx, name)}
        label={lbl('Material')}
        placeholder={unlinkedText || 'Buscar material…'}
        error={!!unlinkedText}
        helperText={stacked && unlinkedText ? `${unlinkedText} — elegí un material` : undefined}
      />
    );
    const providerField = (
      <ProviderPriceAutocomplete
        providers={providers}
        prices={materials.find(m => m.id === item.material_id)?.providerPrices || []}
        value={item.material_id ? (item.provider_id ?? null) : null}
        valueFallback={item.provider}
        disabled={!item.material_id}
        disableClearable
        showPrices={hasCostsRead}
        label={lbl('Proveedor')}
        placeholder="Elegí un material primero"
        onChange={(provider) => { if (provider) handleProviderChange(idx, provider); }}
        onCreate={createProviderInline}
        onError={setError}
      />
    );
    const quantityField = (
      <TextField type="number" size="small" fullWidth label={lbl('Cant.')} value={item.quantity}
        inputProps={{ min: 0 }}
        onChange={(e) => updateMaterialItem(idx, { quantity: Number(e.target.value) })} />
    );
    const unitField = (
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
        renderInput={(params) => <TextField {...params} label={lbl('Unidad')} />}
      />
    );
    const costField = !hasCostsRead ? null : item.material_id ? (
      <CurrencyInput
        size="small" fullWidth label={lbl('Costo real')}
        currency={cost?.currency || item.material_cost_currency || form.currency}
        value={cost?.value ?? null}
        onChange={(newCost) => {
          const newCurrency = cost?.currency || item.material_cost_currency || form.currency;
          updateMaterialItem(idx, {
            material_cost_snapshot: newCost,
            material_cost_currency: newCurrency,
            currency: newCurrency,
            unit_price: computeUnitPrice(newCost, item.margin_percent ?? 0),
          });
        }}
      />
    ) : (
      <TextField size="small" fullWidth label={lbl('Costo real')} disabled value="Sin vincular" InputLabelProps={shrink} />
    );
    const marginField = (
      <TextField
        type="number" size="small" fullWidth label={lbl('Margen %')}
        disabled={!cost}
        value={item.margin_percent ?? 0}
        inputProps={{ min: 0 }}
        onChange={(e) => {
          const marginPercent = Number(e.target.value);
          updateMaterialItem(idx, { margin_percent: marginPercent, unit_price: computeUnitPrice(cost?.value, marginPercent) });
        }}
        InputLabelProps={shrink}
      />
    );
    const totalField = (
      <Tooltip title={cost ? `${formatMoney(item.unit_price || 0, lineCurrency)} c/u` : 'Vinculá un material con costo'}>
        <Box minWidth={0}>
          <Typography variant="body2" fontWeight="bold" noWrap>
            {formatMoney((item.quantity || 0) * (item.unit_price || 0), lineCurrency)}
          </Typography>
          {hasCostsRead && item.material_id && (
            <Typography variant="caption" noWrap display="block" color={margin !== null && margin >= 0 ? 'success.main' : margin !== null ? 'error.main' : 'text.secondary'}>
              {margin !== null ? `Margen: ${formatMoney(margin, lineCurrency)}` : 'Margen: —'}
            </Typography>
          )}
        </Box>
      </Tooltip>
    );
    const removeButton = (
      <Tooltip title="Quitar material">
        <IconButton size="small" color="error" onClick={() => removeMaterialItem(idx)}><DeleteIcon fontSize="small" /></IconButton>
      </Tooltip>
    );

    if (!stacked) {
      return (
        <Box key={idx} sx={{
          display: 'grid', gridTemplateColumns: materialGridTemplate, gap: 1, alignItems: 'center', py: 0.75, borderBottom: '1px solid', borderColor: 'divider',
          // Fuente y padding más chicos en la grilla de desktop para que entre todo en una fila
          // (desde 960px, ej. laptop de 1024). Mobile/tablet usan tarjetas con tamaño normal.
          '& .MuiInputBase-root, & .MuiTypography-body2': { fontSize: '0.75rem' },
          '& .MuiInputBase-input': { textOverflow: 'ellipsis' },
          '& .MuiOutlinedInput-root:not(.MuiAutocomplete-inputRoot) .MuiOutlinedInput-input': { pl: '10px', pr: '6px' },
          '& .MuiAutocomplete-root .MuiOutlinedInput-root': { pl: '6px' },
        }}>
          {materialField}
          {providerField}
          {quantityField}
          {unitField}
          {costField}
          {marginField}
          {totalField}
          <Box textAlign="center">{removeButton}</Box>
        </Box>
      );
    }
    return (
      <Box key={idx} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
        <Stack spacing={1.5}>
          {/* Material y proveedor lado a lado desde tablet; apilados en celular. */}
          <Box display="flex" gap={1} alignItems="flex-start">
            <Box sx={{ flex: 1, minWidth: 0, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
              {materialField}
              {providerField}
            </Box>
            {removeButton}
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 1.5 }}>
            {quantityField}
            {unitField}
            {costField}
            {marginField}
          </Box>
          {(
            <Box display="flex" justifyContent="space-between" alignItems="center" gap={1}>
              <Typography variant="caption" color="text.secondary">Total</Typography>
              <Box textAlign="right" minWidth={0}>{totalField}</Box>
            </Box>
          )}
        </Stack>
      </Box>
    );
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
    if (processing) return;
    setProcessing(true);
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
        // Solo tiene efecto en el alta — el backend lo ignora en update, el vínculo con el PC
        // queda fijo desde que nace el presupuesto (ver FLOWS.md).
        quote_request_id: !editingBudget && form.quote_request_id ? Number(form.quote_request_id) : undefined,
        // Sin budget_prices_read la mano de obra es de solo lectura: no se manda y el backend la conserva.
        laborLines: hasPricesRead ? form.laborLines : undefined,
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
    } finally {
      setProcessing(false);
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

  const runDuplicate = async (budget: Budget, keepQuoteRequest: boolean) => {
    setProcessing(true);
    try {
      await BudgetService.duplicate(budget.id, {
        quote_request_id: keepQuoteRequest ? budget.quote_request_id || undefined : undefined,
      });
      setDuplicateDialog({ open: false, budget: null, keepQuoteRequest: false });
      setSuccess('Presupuesto duplicado como borrador');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al duplicar');
    } finally {
      setProcessing(false);
    }
  };

  // Sin PC detrás no hay nada que decidir: se duplica directo, como venía siendo antes.
  const handleDuplicate = (budget: Budget) => {
    // Presupuesto de un adicional: el duplicado queda vinculado al mismo adicional — se aclara.
    if (budget.project?.is_additional) {
      setDuplicateDialog({ open: true, budget, keepQuoteRequest: false });
      return;
    }
    if (!budget.quoteRequest) {
      runDuplicate(budget, false);
      return;
    }
    setDuplicateDialog({ open: true, budget, keepQuoteRequest: true });
  };

  const handleConfirmDuplicate = () => {
    if (!duplicateDialog.budget) return;
    runDuplicate(duplicateDialog.budget, duplicateDialog.keepQuoteRequest);
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
        <GearSpinner />
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
                <Card key={b.id} elevation={2} sx={{ p: 2 }}>
                  <Stack spacing={1}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1}>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">{b.number}</Typography>
                        <Typography fontWeight="medium">{b.title}</Typography>
                        {b.parentProject && <Typography variant="caption" color="text.secondary" display="block">Adicional de {b.parentProject.code}</Typography>}
                        {b.project?.is_additional && <Typography variant="caption" color="text.secondary" display="block">Adicional {formatProjectCode(b.project)}</Typography>}
                        {b.existingProject && <Typography variant="caption" color="text.secondary" display="block">Vinculado a {b.existingProject.code}</Typography>}
                        {b.work_order_number && <Typography variant="caption" color="text.secondary" display="block">OT: {b.work_order_number}</Typography>}
                        {b.quoteRequest?.client_quote_number && <Typography variant="caption" color="text.secondary" display="block">N° Cotización Cliente: {b.quoteRequest.client_quote_number}</Typography>}
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary">{b.client?.razonSocial}</Typography>
                    <Box>
                      <Chip label={STATUS_LABELS[b.status].label} color={STATUS_LABELS[b.status].color} size="small" />
                      {daysExpired(b) !== null && (
                        <Chip label={`Vencido hace ${daysExpired(b)} día(s)`} color="warning" size="small" variant="outlined" sx={{ ml: 0.5 }} />
                      )}
                      {b.quoteRequest && (
                        <Chip
                          label={`${b.quoteRequest.number} · ${quoteRequestDueChip(b.quoteRequest.due_date).label}`}
                          color={quoteRequestDueChip(b.quoteRequest.due_date).color}
                          size="small" variant="outlined" sx={{ ml: 0.5 }} clickable
                          onClick={() => router.push(`/dashboard/quote-requests?view=${b.quoteRequest!.id}`)}
                        />
                      )}
                      {b.quoteRequest && assignedChip(b.quoteRequest) && (
                        <Chip
                          label={assignedChip(b.quoteRequest)!.label}
                          color={assignedChip(b.quoteRequest)!.color}
                          size="small" sx={{ ml: 0.5 }}
                        />
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
                    <Typography variant="body2">
                      {hasPricesRead ? formatTotals(b.totals_by_currency) : `Materiales: ${formatTotals(b.materials_totals_by_currency)}`}
                    </Typography>
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
                      <Tooltip title={hasPricesRead ? 'Ver / Imprimir' : 'Ver'}><IconButton size="small" color="secondary" onClick={() => setPrintBudget(b)}><ViewIcon fontSize="small" /></IconButton></Tooltip>
                      {b.status === 'draft' && (
                        <>
                          <Tooltip title="Editar"><IconButton size="small" color="primary" onClick={() => handleOpenEdit(b)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                          {canDeliverBudget(b) && (
                            <Tooltip title="Entregar a gerencia"><IconButton size="small" color="warning" onClick={() => setDeliverDialog({ open: true, budget: b })}><DeliverIcon fontSize="small" /></IconButton></Tooltip>
                          )}
                          {hasSendPermission && (
                            <Tooltip title="Enviar"><IconButton size="small" color="info" onClick={() => handleOpenStatusDialog(b, 'sent')}><SendIcon fontSize="small" /></IconButton></Tooltip>
                          )}
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
                      {canGenerateProject(b) && (
                        <Tooltip title="Generar Proyecto"><IconButton size="small" color="success" onClick={() => handleGenerateProject(b)}><GenerateIcon fontSize="small" /></IconButton></Tooltip>
                      )}
                      {hasPricesRead && (b.status === 'sent' || b.status === 'approved') && (
                        <Tooltip title="Bonificación"><IconButton size="small" color="warning" onClick={() => handleOpenDiscountDialog(b)}><DiscountIcon fontSize="small" /></IconButton></Tooltip>
                      )}
                      <Tooltip title={additionalHasLiveBudget(b) ? 'El adicional ya tiene un presupuesto en curso' : 'Duplicar'}>
                        <span><IconButton size="small" disabled={additionalHasLiveBudget(b)} onClick={() => handleDuplicate(b)}><DuplicateIcon fontSize="small" /></IconButton></span>
                      </Tooltip>
                    </Box>
                  </Stack>
                </Card>
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
                    <TableCell><strong>{hasPricesRead ? 'Total' : 'Total materiales'}</strong></TableCell>
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
                        {b.parentProject && <Typography variant="caption" color="text.secondary" display="block">Adicional de {b.parentProject.code}</Typography>}
                        {b.project?.is_additional && <Typography variant="caption" color="text.secondary" display="block">Adicional {formatProjectCode(b.project)}</Typography>}
                        {b.existingProject && <Typography variant="caption" color="text.secondary">Vinculado a {b.existingProject.code}</Typography>}
                        {b.work_order_number && <Typography variant="caption" color="text.secondary" display="block">OT: {b.work_order_number}</Typography>}
                        {b.quoteRequest?.client_quote_number && <Typography variant="caption" color="text.secondary" display="block">N° Cotización Cliente: {b.quoteRequest.client_quote_number}</Typography>}
                      </TableCell>
                      <TableCell>{b.client?.razonSocial}</TableCell>
                      <TableCell>
                        <Chip label={STATUS_LABELS[b.status].label} color={STATUS_LABELS[b.status].color} size="small" />
                        {daysExpired(b) !== null && (
                          <Chip label={`Vencido hace ${daysExpired(b)} día(s)`} color="warning" size="small" variant="outlined" sx={{ ml: 0.5 }} />
                        )}
                        {b.quoteRequest && (
                          <Chip
                            label={`${b.quoteRequest.number} · ${quoteRequestDueChip(b.quoteRequest.due_date).label}`}
                            color={quoteRequestDueChip(b.quoteRequest.due_date).color}
                            size="small" variant="outlined" sx={{ ml: 0.5 }} clickable
                            onClick={() => router.push(`/dashboard/quote-requests?view=${b.quoteRequest!.id}`)}
                          />
                        )}
                        {b.quoteRequest && assignedChip(b.quoteRequest) && (
                          <Chip
                            label={assignedChip(b.quoteRequest)!.label}
                            color={assignedChip(b.quoteRequest)!.color}
                            size="small" sx={{ ml: 0.5 }}
                          />
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
                      <TableCell>{formatTotals(hasPricesRead ? b.totals_by_currency : b.materials_totals_by_currency)}</TableCell>
                      <TableCell>
                        {b.project ? (
                          <Tooltip title={`Ver proyecto: ${b.project.code} - ${b.project.name}`}>
                            {/* maxWidth: el label del Chip ya trunca con "…"; sin tope, un nombre largo ensancha la tabla y empuja las acciones fuera de vista. */}
                            <Chip
                              size="small" icon={<ProjectIcon />} label={`${b.project.code} - ${b.project.name}`}
                              color="primary" variant="outlined" clickable sx={{ maxWidth: 220 }}
                              onClick={() => router.push(`/dashboard/projects/${b.project!.id}`)}
                            />
                          </Tooltip>
                        ) : '—'}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title={hasPricesRead ? 'Ver / Imprimir' : 'Ver'}><IconButton size="small" color="secondary" onClick={() => setPrintBudget(b)}><ViewIcon fontSize="small" /></IconButton></Tooltip>
                        {b.status === 'draft' && (
                          <>
                            <Tooltip title="Editar"><IconButton size="small" color="primary" onClick={() => handleOpenEdit(b)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                            {canDeliverBudget(b) && (
                              <Tooltip title="Entregar a gerencia"><IconButton size="small" color="warning" onClick={() => setDeliverDialog({ open: true, budget: b })}><DeliverIcon fontSize="small" /></IconButton></Tooltip>
                            )}
                            {hasSendPermission && (
                              <Tooltip title="Enviar"><IconButton size="small" color="info" onClick={() => handleOpenStatusDialog(b, 'sent')}><SendIcon fontSize="small" /></IconButton></Tooltip>
                            )}
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
                        {canGenerateProject(b) && (
                          <Tooltip title="Generar Proyecto"><IconButton size="small" color="success" onClick={() => handleGenerateProject(b)}><GenerateIcon fontSize="small" /></IconButton></Tooltip>
                        )}
                        {hasPricesRead && (b.status === 'sent' || b.status === 'approved') && (
                          <Tooltip title="Bonificación"><IconButton size="small" color="warning" onClick={() => handleOpenDiscountDialog(b)}><DiscountIcon fontSize="small" /></IconButton></Tooltip>
                        )}
                        <Tooltip title={additionalHasLiveBudget(b) ? 'El adicional ya tiene un presupuesto en curso' : 'Duplicar'}>
                          <span><IconButton size="small" disabled={additionalHasLiveBudget(b)} onClick={() => handleDuplicate(b)}><DuplicateIcon fontSize="small" /></IconButton></span>
                        </Tooltip>
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
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="lg" fullWidth fullScreen={isMobile}>
        <DialogTitle>
          {editingBudget ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}
          {editingBudget?.quoteRequest?.client_quote_number && (
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              N° Cotización Cliente: {editingBudget.quoteRequest.client_quote_number}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {(editingBudget?.quoteRequest?.files || []).length > 0 && (
              <Alert severity="info" icon={<AttachIcon fontSize="small" />} sx={{ py: 0.5 }}>
                <Typography variant="body2" fontWeight={600}>Pliego del Pedido de Cotización {editingBudget?.quoteRequest?.number}</Typography>
                {(editingBudget?.quoteRequest?.files || []).map((f) => (
                  <Typography key={f.id} variant="body2">
                    <Link href={f.file_url} target="_blank" rel="noopener noreferrer" underline="hover">{f.file_name || 'Archivo'}</Link>
                    {f.size_bytes ? ` (${f.size_bytes >= 1048576 ? `${(f.size_bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(f.size_bytes / 1024))} KB`})` : ''}
                  </Typography>
                ))}
              </Alert>
            )}
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

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="Cliente *" select fullWidth value={form.client_id} disabled={!!form.quote_request_id || !!additionalProject}
                  onChange={(e) => changeClientOrPlant(e.target.value, '')}
                  SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}
                  helperText={form.quote_request_id ? 'Viene del Pedido de Cotización — no se puede cambiar' : additionalProject ? 'Viene del adicional — no se puede cambiar' : undefined}>
                  <option value="">— Seleccionar —</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.razonSocial}</option>)}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="Planta" select fullWidth value={form.plant_id} disabled={!!form.quote_request_id || !!additionalProject || !form.client_id}
                  onChange={(e) => changeClientOrPlant(form.client_id, e.target.value)}
                  SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
                  <option value="">— Ninguna —</option>
                  {plants.filter(p => p.client_id === Number(form.client_id)).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </TextField>
              </Grid>
            </Grid>

            {additionalProject ? (
              // Presupuesto de un adicional: solo el "i" (con la explicación en un tooltip) y el código del
              // adicional, que es un acceso directo a su ficha.
              <Box display="flex" alignItems="center" gap={0.5}>
                <Tooltip enterTouchDelay={0} leaveTouchDelay={6000}
                  title="Este presupuesto pertenece a un adicional. Cliente, planta y proyecto se gestionan desde el adicional; el título y la descripción se sincronizan con él mientras este presupuesto esté en borrador.">
                  <IconButton size="small" color="info" aria-label="Información sobre el adicional"><InfoIcon fontSize="small" /></IconButton>
                </Tooltip>
                {hasAdditionalsRead ? (
                  <Tooltip title="Ir al adicional">
                    <Chip size="small" clickable color="info" variant="outlined" label={`Adicional ${formatProjectCode(additionalProject)}`}
                      onClick={() => router.push(`/dashboard/additionals/${additionalProject.id}`)} />
                  </Tooltip>
                ) : (
                  <Chip size="small" color="info" variant="outlined" label={`Adicional ${formatProjectCode(additionalProject)}`} />
                )}
              </Box>
            ) : legacyParent ? (
              <TextField label="Relación con un proyecto" fullWidth disabled value={`Adicional de ${legacyParent.code} - ${legacyParent.name}`}
                helperText="Borrador del flujo anterior: al generar el proyecto se crea un subproyecto. Los adicionales nuevos se crean desde el módulo Adicionales." />
            ) : (
              <TextField label="Relación con un proyecto" select fullWidth value={projectLinkValue} disabled={!form.client_id}
                onChange={(e) => handleProjectLinkChange(e.target.value)}
                SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}
                helperText={form.client_id
                  ? 'Nuevo: genera un proyecto al aprobar. Vincular: no crea nada, usa el proyecto tal cual. (Los adicionales se crean desde el módulo Adicionales.)'
                  : 'Elegí primero el cliente para ver sus proyectos.'}
              >
                <option value="">— No, es un proyecto nuevo —</option>
                <optgroup label="Vincular a un proyecto ya existente (sin presupuesto):">
                  {filteredExistingProjects.map((p) => <option key={`existing-${p.id}`} value={`existing:${p.id}`}>{p.code} - {p.name}</option>)}
                </optgroup>
              </TextField>
            )}

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
            {linkedProjectHourBuckets.some(b => b.consumed_hours > 0) && (
              <Alert severity="info" sx={{ py: 0.5 }}>
                Horas ya cargadas en el proyecto: {linkedProjectHourBuckets
                  .filter(b => b.consumed_hours > 0)
                  .map(b => `${b.item_type_name}: ${b.consumed_hours.toFixed(1)} hs`)
                  .join(' · ')}
              </Alert>
            )}
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography fontWeight="bold">Mano de Obra</Typography>
              {hasPricesRead && (
                <Button size="small" startIcon={<AddIcon />} onClick={addLaborLine} disabled={itemTypes.length === 0}>Agregar línea</Button>
              )}
            </Box>
            {!hasPricesRead && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: -1 }}>
                Solo lectura: la mano de obra la carga quien tiene permiso de precios.
              </Typography>
            )}
            {hasPricesRead && repeatedLaborTypeIds.size > 0 && (
              <Alert severity="info" sx={{ py: 0.5 }}>
                Hay rubros repetidos: cada línea conserva su propio valor y en el proyecto se suman en una sola bolsa de horas.
                La tarifa del cliente no se actualiza para los rubros repetidos.
              </Alert>
            )}
            {form.laborLines.map((line, idx) => {
              const itemType = itemTypes.find(t => t.id === line.budget_item_type_id);
              const perDay = lineHoursPerDay(line, itemType);
              const isRepeated = repeatedLaborTypeIds.has(line.budget_item_type_id);
              const isFirstOfType = form.laborLines.findIndex(l => l.budget_item_type_id === line.budget_item_type_id) === idx;
              const bucket = isFirstOfType ? linkedProjectHourBuckets.find(b => b.budget_item_type_id === line.budget_item_type_id) : undefined;
              // En un rubro por días se ve la equivalencia en horas; las horas ya cargadas en el
              // proyecto se muestran solo en la primera línea de cada rubro (la bolsa es una sola).
              const quantityHelper = [
                perDay ? `= ${formatHours(laborLineHours(line, itemType))}` : null,
                bucket ? `Ya cargado en el proyecto: ${bucket.consumed_hours.toFixed(1)} hs${isRepeated ? ' (rubro repetido: se suma en el proyecto)' : ''}` : null,
              ].filter(Boolean).join(' · ') || undefined;
              return (
              <Grid container spacing={1} key={idx} alignItems="center">
                <Grid size={{ xs: 12, md: hasPricesRead ? 4 : 6 }}>
                  <TextField select fullWidth size="small" label="Rubro" value={line.budget_item_type_id} disabled={!hasPricesRead}
                    onChange={(e) => {
                      const newTypeId = Number(e.target.value);
                      const rate = rateForItemType(newTypeId);
                      const patch: Partial<BudgetLaborLine> = {
                        budget_item_type_id: newTypeId,
                        hours_per_day: hoursPerDayFor(itemTypes.find(t => t.id === newTypeId)),
                      };
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
                <Grid size={{ xs: hasPricesRead ? 6 : 12, md: hasPricesRead ? 2 : 6 }}>
                  <TextField type="number" size="small" fullWidth label={perDay ? 'Días' : 'Cantidad'} value={line.quantity} disabled={!hasPricesRead}
                    onChange={(e) => updateLaborLine(idx, { quantity: Number(e.target.value) })}
                    helperText={quantityHelper}
                  />
                </Grid>
                {hasPricesRead && (
                  <>
                    <Grid size={{ xs: 6, md: 2 }}>
                      <CurrencyInput size="small" fullWidth label={perDay ? 'Valor por día' : 'Valor unitario'} value={line.unit_price}
                        currency={line.currency || form.currency}
                        onChange={(value) => updateLaborLine(idx, { unit_price: value ?? 0 })} />
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
                    <Grid size={{ xs: 12, md: 3 }}>
                      <Typography variant="body2" fontWeight="bold">
                        {formatMoney((line.quantity || 0) * (line.unit_price || 0), line.currency || form.currency)}
                      </Typography>
                    </Grid>
                  </>
                )}
                {hasPricesRead && (
                  <Grid size={{ xs: 1, md: 0.5 }}>
                    <IconButton size="small" color="error" onClick={() => removeLaborLine(idx)}><DeleteIcon fontSize="small" /></IconButton>
                  </Grid>
                )}
              </Grid>
              );
            })}

            {/* Materiales */}
            <Divider />
            <Box display="flex" sx={{ flexDirection: { xs: 'column', sm: 'row' } }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} gap={1}>
              <Typography fontWeight="bold">Materiales</Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                <Button size="small" startIcon={<DownloadIcon />} onClick={() => downloadMaterialsTemplate('budget')}>
                  Descargar plantilla modelo
                </Button>
                <Button size="small" startIcon={<DownloadIcon />} onClick={handleExportExcel} disabled={form.materialItems.length === 0}>
                  Descargar Excel
                </Button>
                <Button size="small" startIcon={<UploadIcon />} component="label" disabled={importing}>
                  {importing ? 'Importando…' : 'Importar Excel'}
                  <input type="file" hidden accept=".xlsx,.xls" onChange={handleImportExcel} />
                </Button>
                <Button size="small" startIcon={<AddIcon />} onClick={() => addMaterialItem()}>Agregar item</Button>
              </Box>
            </Box>
            {form.materialItems.length > 0 && (
              <Box>
                {!stackedMaterialLines && (
                  <Box sx={{ display: 'grid', gridTemplateColumns: materialGridTemplate, gap: 1, pb: 0.5, borderBottom: '2px solid', borderColor: 'divider' }}>
                    {materialColumnHeaders.map((header, i) => (
                      <Typography key={i} variant="caption" fontWeight={700} color="text.secondary">{header}</Typography>
                    ))}
                  </Box>
                )}
                <Stack spacing={stackedMaterialLines ? 1.5 : 0} sx={{ mt: stackedMaterialLines ? 0 : 0.5 }}>
                  {form.materialItems.map((item, idx) => renderMaterialLine(item, idx))}
                </Stack>
              </Box>
            )}

            {(
              <>
                <Divider />
                <Box textAlign="right">
                  {hasPricesRead && (
                    <Typography variant="body2">Mano de obra: {formatMoney(laborTotal('ARS'), 'ARS')} {laborTotal('USD') > 0 && `+ ${formatMoney(laborTotal('USD'), 'USD')}`}</Typography>
                  )}
                  <Typography variant="body2">Materiales: {formatMoney(materialsTotal('ARS'), 'ARS')} {materialsTotal('USD') > 0 && `+ ${formatMoney(materialsTotal('USD'), 'USD')}`}</Typography>
                  {hasPricesRead && (
                    <Typography variant="h6" fontWeight="bold">
                      Total: {formatMoney(laborTotal('ARS') + materialsTotal('ARS'), 'ARS')} {(laborTotal('USD') + materialsTotal('USD')) > 0 && `+ ${formatMoney(laborTotal('USD') + materialsTotal('USD'), 'USD')}`}
                    </Typography>
                  )}
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

            {/* Detalle de mano de obra: no es un texto guardado aparte — se arma desde las líneas, así
                que agregar o quitar una línea agrega o quita su fila y cada una conserva su descripción. */}
            {form.laborLines.length > 0 && (
              <Box>
                <Typography fontWeight="bold">Detalle de mano de obra</Typography>
                <Typography variant="caption" color="text.secondary">
                  Se muestra debajo del total en la vista del presupuesto.{!hasPricesRead && ' Solo lectura.'}
                </Typography>
                <Stack spacing={1.5} sx={{ mt: 1 }}>
                  {form.laborLines.map((line, idx) => {
                    const itemType = itemTypes.find(t => t.id === line.budget_item_type_id);
                    return (
                      <Box key={idx}>
                        <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                          {idx + 1} - {itemType?.name || line.itemType?.name} - {formatLaborQuantity(line, itemType)}
                        </Typography>
                        <TextField size="small" fullWidth multiline minRows={1} maxRows={6} label="Descripción"
                          value={line.description ?? ''} disabled={!hasPricesRead}
                          onChange={(e) => updateLaborLine(idx, { description: e.target.value })} />
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            )}

            <TextField label="Notas internas" fullWidth multiline rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={processing}>
            {processing ? <GearSpinner size={20} /> : (editingBudget ? 'Guardar' : 'Crear')}
          </Button>
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
              <ProviderPriceAutocomplete
                providers={providers}
                value={materialQuickAdd.providerId}
                showPrices={false}
                disableClearable
                size="medium"
                onChange={(provider) => { if (provider) setMaterialQuickAdd({ ...materialQuickAdd, providerId: provider.id }); }}
                onCreate={createProviderInline}
                onError={setError}
              />
            )}
            {hasCostsRead && (
              <Stack direction="row" spacing={2}>
                <CurrencyInput label="Costo real (opcional)" fullWidth
                  value={materialQuickAdd.cost === '' ? null : materialQuickAdd.cost}
                  currency={materialQuickAdd.currency}
                  onChange={(value) => setMaterialQuickAdd({ ...materialQuickAdd, cost: value === null ? '' : String(value) })} />
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
                Se crea sin costo ni proveedor — alguien con permiso lo completa después desde el catálogo de Materiales.
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

      {/* Duplicar — solo pregunta si el duplicado sigue atado al mismo Pedido de Cotización. Un
          presupuesto sin PC se duplica directo, sin pasar por acá (ver FLOWS.md flujo 27). */}
      <Dialog open={duplicateDialog.open} onClose={() => setDuplicateDialog({ open: false, budget: null, keepQuoteRequest: false })} maxWidth="xs" fullWidth>
        <DialogTitle>Duplicar Presupuesto</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>A partir de <strong>{duplicateDialog.budget?.number}</strong></Typography>
          {duplicateDialog.budget?.project?.is_additional ? (
            <Typography variant="body2" color="text.secondary">
              El duplicado queda <strong>vinculado al mismo adicional</strong> ({formatProjectCode(duplicateDialog.budget.project)}) como nuevo borrador,
              con los materiales y la mano de obra como punto de partida. Un adicional tiene un solo presupuesto en curso a la vez.
            </Typography>
          ) : (
          <Stack spacing={1} sx={{ mt: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={duplicateDialog.keepQuoteRequest}
                  onChange={(e) => setDuplicateDialog({ ...duplicateDialog, keepQuoteRequest: e.target.checked })}
                />
              }
              label="Mantener vínculo con el mismo Pedido de Cotización"
            />
            <Typography variant="caption" color="text.secondary">
              {duplicateDialog.keepQuoteRequest
                ? `Sigue vinculado a ${duplicateDialog.budget?.quoteRequest?.number}${duplicateDialog.budget?.quoteRequest?.client_quote_number ? ` (N° del cliente: ${duplicateDialog.budget.quoteRequest.client_quote_number})` : ''} — cliente y planta quedan bloqueados, igual que en el original.`
                : 'Nace libre, sin Pedido de Cotización — cliente y planta se podrán editar, y no va a tener N° de cotización del cliente hasta que se lo vincule a una PC.'}
            </Typography>
          </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDuplicateDialog({ open: false, budget: null, keepQuoteRequest: false })}>Cancelar</Button>
          <Button onClick={handleConfirmDuplicate} variant="contained" disabled={processing}>Duplicar</Button>
        </DialogActions>
      </Dialog>

      <DeliverToManagementDialog
        open={deliverDialog.open}
        quoteRequest={deliverDialog.budget?.quoteRequest ?? null}
        budgetNumber={deliverDialog.budget?.number}
        onClose={() => setDeliverDialog({ open: false, budget: null })}
        onDelivered={(msg) => { setSuccess(msg); loadData(); }}
        onError={(msg) => setError(msg)}
      />

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
            <Box className="print-area" sx={{ bgcolor: 'white', color: 'black', p: 2, fontFamily: 'sans-serif' }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" borderBottom="2px solid black" pb={2} mb={2}>
                <Box>
                  {/* eslint-disable-next-line @next/next/no-img-element -- documento imprimible, mismo criterio que el resto del print-area (evitar quirks de next/image al imprimir) */}
                  <img src="/img/logos/logo-conmomet-ROJO.png" alt="Conmomet" style={{ height: 50, objectFit: 'contain' }} />
                  <Typography variant="caption" sx={{ color: 'black', display: 'block', mt: 0.5 }}>Servicios Metalúrgicos e Industriales</Typography>
                </Box>
                <Box textAlign="right">
                  <Typography variant="h6" fontWeight="bold" sx={{ color: 'black' }}>PRESUPUESTO</Typography>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ fontFamily: 'monospace', color: 'black' }}>Nº: {printBudget.number}</Typography>
                  <Chip label={STATUS_LABELS[printBudget.status].label} color={STATUS_LABELS[printBudget.status].color} size="small" sx={{ mt: 1 }} />
                </Box>
              </Box>
              <Typography variant="h6" fontWeight="bold" sx={{ color: 'black', mb: 2 }}>{printBudget.title}</Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2"><strong>Cliente:</strong> {printBudget.client?.razonSocial}</Typography>
                  {printBudget.plant && <Typography variant="body2"><strong>Planta:</strong> {printBudget.plant.name}</Typography>}
                  {printBudget.parentProject && <Typography variant="body2"><strong>Adicional de:</strong> {printBudget.parentProject.code} - {printBudget.parentProject.name}</Typography>}
                  {printBudget.project?.is_additional && <Typography variant="body2"><strong>Adicional:</strong> {formatProjectCode(printBudget.project)} - {printBudget.project.name}</Typography>}
                  {printBudget.existingProject && <Typography variant="body2"><strong>Vinculado a:</strong> {printBudget.existingProject.code} - {printBudget.existingProject.name}</Typography>}
                  {printBudget.work_order_number && <Typography variant="body2"><strong>N° OT:</strong> {printBudget.work_order_number}</Typography>}
                  {printBudget.quoteRequest && <Typography variant="body2"><strong>Pedido de Cotización:</strong> {printBudget.quoteRequest.number}</Typography>}
                  {printBudget.quoteRequest?.client_quote_number && <Typography variant="body2"><strong>N° Cotización Cliente:</strong> {printBudget.quoteRequest.client_quote_number}</Typography>}
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2"><strong>Fecha:</strong> {new Date(printBudget.createdAt).toLocaleDateString('es-AR')}</Typography>
                  {printBudget.status === 'approved' && printBudget.approvedBySupervisor && (
                    <Typography variant="body2"><strong>Aprobado por:</strong> {printBudget.approvedBySupervisor.lastname}, {printBudget.approvedBySupervisor.name}{printBudget.approved_at ? ` — ${new Date(printBudget.approved_at).toLocaleDateString('es-AR')}` : ''}</Typography>
                  )}
                  {printBudget.project && !printBudget.existingProject && <Typography variant="body2"><strong>Proyecto generado:</strong> {printBudget.project.code}</Typography>}
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
                            <TableCell align="right">{formatLaborQuantity(line)}</TableCell>
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
                          <TableCell align="right">Precio Unitario</TableCell>
                          <TableCell align="right">Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {printBudget.materialItems?.map((item, i) => (
                          <TableRow key={i}>
                            <TableCell>{item.description}</TableCell>
                            <TableCell align="right">{item.quantity} {item.materialUnit?.label}</TableCell>
                            <TableCell align="right">{formatMoney(item.unit_price, item.currency || printBudget.currency)}</TableCell>
                            <TableCell align="right">{formatMoney(item.total_price || 0, item.currency || printBudget.currency)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}

              {(
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box textAlign="right">
                    {hasPricesRead && (
                      <>
                        <Typography variant="body2">Mano de obra: {formatTotals(sumLaborByCurrency(printBudget.laborLines, printBudget.currency))}</Typography>
                        {(printBudget.labor_discount_percent ?? 0) > 0 && (
                          <Typography variant="body2" color="text.secondary">Bonificación mano de obra: {printBudget.labor_discount_percent}%</Typography>
                        )}
                      </>
                    )}
                    <Typography variant="body2">Materiales: {formatTotals(sumMaterialsByCurrency(printBudget.materialItems, printBudget.currency))}</Typography>
                    {hasPricesRead && (printBudget.material_discount_percent ?? 0) > 0 && (
                      <Typography variant="body2" color="text.secondary">Bonificación material: {printBudget.material_discount_percent}%</Typography>
                    )}
                    {hasPricesRead && <Typography variant="h6" fontWeight="bold">Total: {formatTotals(printBudget.totals_by_currency)}</Typography>}
                  </Box>
                </>
              )}

              {/* Detalle de mano de obra: una línea por cada línea de mano de obra, en su orden, sin precios. */}
              {(printBudget.laborLines?.length || 0) > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold">Detalle de mano de obra</Typography>
                  <Stack spacing={0.75} sx={{ mt: 0.5 }}>
                    {printBudget.laborLines?.map((line, i) => (
                      <Typography key={i} variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {i + 1} - {line.itemType?.name} - {formatLaborQuantity(line)}{line.description ? `: ${line.description}` : ''}
                      </Typography>
                    ))}
                  </Stack>
                </Box>
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
          {/* Atajo a la edición: al llegar por un acceso directo (?view=) lo habitual es querer editar, y
              cerrar la vista deja al usuario en el listado completo sin saber cuál era el presupuesto.
              Solo en borrador, igual que el ícono Editar del listado. */}
          {printBudget?.status === 'draft' && (
            <Button
              variant="outlined" startIcon={<EditIcon />}
              onClick={() => { const budget = printBudget; setPrintBudget(null); handleOpenEdit(budget); }}
            >
              Editar
            </Button>
          )}
          <Button onClick={() => setPrintBudget(null)}>Cerrar</Button>
          {/* Sin budget_prices_read la vista no incluye la mano de obra: imprimirla daría un presupuesto incompleto. */}
          {hasPricesRead && <Button onClick={handlePrint} variant="contained" startIcon={<PrintIcon />}>Imprimir</Button>}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
