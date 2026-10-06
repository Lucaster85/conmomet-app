'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box, Typography, Button, Paper, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Tooltip, TextField, Stack, Chip, Autocomplete, Link, useMediaQuery, useTheme,
} from '@mui/material';
import FeedbackModal from '../../../components/FeedbackModal';
import GearSpinner from '../../../components/GearSpinner';
import DateField from '../../../components/DateField';
import {
  AddOutlined as AddIcon, EditOutlined as EditIcon, DeleteOutlined as DeleteIcon,
  RefreshOutlined as RefreshIcon, RequestQuoteOutlined as TitleIcon,
  AttachFileOutlined as AttachIcon, CloseOutlined as CloseIcon,
  ReceiptLongOutlined as BudgetIcon, AssignmentReturnOutlined as HandoffIcon,
  CancelOutlined as CancelIcon,
  ReplayOutlined as ReopenIcon, VisibilityOutlined as ViewIcon,
} from '@mui/icons-material';
import {
  QuoteRequest, QuoteRequestService, CreateQuoteRequestData, QuoteRequestHistoryEntry,
  Client, ClientService, Plant, PlantService, User, UserService, Permission,
} from '../../../utils/api';
import { useAuth } from '../../../utils/auth';

const STATUS_LABELS: Record<QuoteRequest['status'], { label: string; color: 'default' | 'info' | 'warning' | 'success' | 'error' }> = {
  pending: { label: 'Pendiente', color: 'default' },
  in_progress: { label: 'En progreso', color: 'info' },
  pending_review: { label: 'A validar', color: 'warning' },
  quoted: { label: 'Cotizado', color: 'success' },
  cancelled: { label: 'Cancelado', color: 'error' },
};

// Línea de tiempo del ida y vuelta (ver FLOWS.md flujo 27g) — un evento por fila, PC +
// Presupuesto mezclados y ya ordenados por el backend.
const HISTORY_EVENT_LABELS: Record<QuoteRequestHistoryEntry['event'], string> = {
  assigned: 'Asignado', delivered: 'Entregado a gerencia', returned: 'Devuelto al responsable',
  reassigned: 'Reasignado', cancelled: 'Cancelado', reopened: 'Reabierto', quoted: 'Marcado como cotizado',
  budget_sent: 'Presupuesto enviado al cliente', budget_approved: 'Presupuesto aprobado', budget_rejected: 'Presupuesto rechazado',
};

// Mismo criterio que daysExpired en budgets/page.tsx: puramente visual, nunca bloquea nada.
function daysUntil(dueDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(dueDate + 'T00:00:00');
  return Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function dueDateChip(dueDate: string): { label: string; color: 'default' | 'warning' | 'error' } {
  const days = daysUntil(dueDate);
  if (days < 0) return { label: `Vencido hace ${Math.abs(days)} día${Math.abs(days) === 1 ? '' : 's'}`, color: 'error' };
  if (days === 0) return { label: 'Vence hoy', color: 'error' };
  if (days <= 2) return { label: `Vence en ${days} día${days === 1 ? '' : 's'}`, color: 'error' };
  if (days <= 7) return { label: `Vence en ${days} días`, color: 'warning' };
  return { label: `Vence en ${days} días`, color: 'default' };
}

// GET /users trae permisos como objetos anidados (role.permissions + permissions), a diferencia
// de utils/auth.ts#userHasPermission que espera el user de la sesión ya aplanado a string[].
function flattenPermissions(user: User): string[] {
  const rolePerms = (user.role?.permissions || []).map((p: Permission) => p.name);
  const ownPerms = (user.permissions || []).map((p: Permission) => p.name);
  return [...rolePerms, ...ownPerms];
}

function canBeAssigned(user: User): boolean {
  const perms = flattenPermissions(user);
  return perms.includes('admin_granted') || perms.includes('quote_requests_read') || perms.includes('quote_requests_update');
}

// Un PC puede tener técnicamente varios presupuestos (el FK vive en Budget, sin unicidad), pero
// por decisión de producto se muestra uno solo: el botón de crear desaparece apenas hay un
// presupuesto vivo. Un presupuesto RECHAZADO no cuenta — ahí hay que poder volver a cotizar
// (la vía natural es duplicarlo, ver el tema Presupuestos). Los eliminados tampoco aparecen acá:
// Budget es paranoid y el include los excluye solo.
const BUDGET_STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador', sent: 'Enviado', approved: 'Aprobado', rejected: 'Rechazado',
};

function hasLiveBudget(qr: QuoteRequest): boolean {
  return (qr.budgets || []).some((b) => b.status !== 'rejected');
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface FormState {
  title: string;
  client_quote_number: string;
  client_id: string;
  plant_id: string;
  description: string;
  received_at: string;
  due_date: string;
  notes: string;
  assignee_ids: number[];
}

function emptyForm(): FormState {
  return { title: '', client_quote_number: '', client_id: '', plant_id: '', description: '', received_at: '', due_date: '', notes: '', assignee_ids: [] };
}

export default function QuoteRequestsPage() {
  return (
    <Suspense fallback={<GearSpinner />}>
      <QuoteRequestsPageContent />
    </Suspense>
  );
}

function QuoteRequestsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const perms = user?.permissions || [];
  // Gerencia: crear/editar PC y todas las transiciones salvo la entrega.
  const hasAssignPermission = perms.includes('admin_granted') || perms.includes('quote_requests_assign');
  // Responsable: única acción sobre el PC es entregarlo a gerencia (ver FLOWS.md flujo 27d).
  const hasDeliverPermission = hasAssignPermission || perms.includes('quote_requests_deliver');

  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processing, setProcessing] = useState(false);

  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState<QuoteRequest | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const [viewOnly, setViewOnly] = useState(false);
  const [editComment, setEditComment] = useState('');
  const [historyEntries, setHistoryEntries] = useState<QuoteRequestHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [deleteDialog, setDeleteDialog] = useState<QuoteRequest | null>(null);
  const [statusDialog, setStatusDialog] = useState<{ open: boolean; qr: QuoteRequest | null; target: QuoteRequest['status'] | '' }>({ open: false, qr: null, target: '' });
  const [statusAssigneeIds, setStatusAssigneeIds] = useState<number[]>([]);
  const [statusComment, setStatusComment] = useState('');

  const assignableUsers = users.filter(canBeAssigned);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [qrs, clis, plts, usrs] = await Promise.all([
        QuoteRequestService.getAll(),
        ClientService.getAll({ is_active: true }),
        PlantService.getAll(),
        UserService.getAll(),
      ]);
      setQuoteRequests(Array.isArray(qrs) ? qrs : []);
      setClients(Array.isArray(clis) ? clis : []);
      setPlants(Array.isArray(plts) ? plts : []);
      setUsers(Array.isArray(usrs) ? usrs : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Línea de tiempo unificada PC + Presupuesto (ver FLOWS.md flujo 27g) — se carga al abrir el
  // detalle de un PC existente, en modo lectura o edición.
  const loadHistory = async (id: number) => {
    setHistoryLoading(true);
    try {
      const entries = await QuoteRequestService.getHistory(id);
      setHistoryEntries(entries);
    } catch {
      setHistoryEntries([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Deep link simétrico al de Presupuestos: un chip "PC-..." en budgets/page.tsx (y el deep
  // link del push, ver FLOWS.md flujo 28) abren acá el detalle directo, sin tener que buscarlo
  // en el listado. Quien no puede editar (responsable) lo abre en modo lectura — antes caía
  // siempre en modo edición, que el backend le rechazaba al guardar (ver FLOWS.md flujo 27g,
  // §2.3: el responsable no tenía ninguna vía para leer su propio PC).
  useEffect(() => {
    const viewId = searchParams.get('view');
    if (viewId && quoteRequests.length > 0) {
      const qr = quoteRequests.find((q) => q.id === Number(viewId));
      if (qr) handleOpenEdit(qr, !hasAssignPermission);
      router.replace('/dashboard/quote-requests');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteRequests]);

  const handleOpenCreate = () => {
    setEditing(null);
    setViewOnly(false);
    setForm(emptyForm());
    setPendingFiles([]);
    setEditComment('');
    setHistoryEntries([]);
    setOpenDialog(true);
  };

  const handleOpenEdit = (qr: QuoteRequest, viewOnlyMode = false) => {
    setEditing(qr);
    setViewOnly(viewOnlyMode);
    setForm({
      title: qr.title,
      client_quote_number: qr.client_quote_number || '',
      client_id: String(qr.client_id),
      plant_id: qr.plant_id ? String(qr.plant_id) : '',
      description: qr.description || '',
      received_at: qr.received_at || '',
      due_date: qr.due_date,
      notes: qr.notes || '',
      assignee_ids: (qr.assignees || []).map((a) => a.id),
    });
    setPendingFiles([]);
    setEditComment('');
    setOpenDialog(true);
    loadHistory(qr.id);
  };

  const handleOpenView = (qr: QuoteRequest) => handleOpenEdit(qr, true);

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.client_id || !form.due_date || !form.client_quote_number.trim()) {
      setError('Título, N° de Cotización del Cliente, Cliente y Vencimiento de presentación son obligatorios.');
      return;
    }
    setProcessing(true);
    try {
      const body: CreateQuoteRequestData = {
        title: form.title,
        client_quote_number: form.client_quote_number.trim(),
        client_id: Number(form.client_id),
        plant_id: form.plant_id ? Number(form.plant_id) : null,
        description: form.description || undefined,
        received_at: form.received_at || null,
        due_date: form.due_date,
        notes: form.notes || undefined,
        assignee_ids: form.assignee_ids,
        comment: editComment.trim() || undefined,
      };

      if (editing) {
        const updated = await QuoteRequestService.update(editing.id, body);
        if (pendingFiles.length > 0) await QuoteRequestService.addFiles(updated.id, pendingFiles);
      } else {
        await QuoteRequestService.create({ ...body, files: pendingFiles });
      }

      setOpenDialog(false);
      setSuccess(editing ? 'Pedido de Cotización actualizado.' : 'Pedido de Cotización creado.');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveExistingFile = async (fileId: number) => {
    if (!editing) return;
    try {
      const updated = await QuoteRequestService.removeFile(editing.id, fileId);
      setEditing(updated);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar el archivo');
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    setProcessing(true);
    try {
      await QuoteRequestService.delete(deleteDialog.id);
      setDeleteDialog(null);
      setSuccess('Pedido de Cotización eliminado.');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      setProcessing(false);
    }
  };

  // El handoff REEMPLAZA a los asignados: el PC pasa de manos. Por eso pre-cargar a los
  // asignados actuales estaba mal en las dos direcciones — los asignados actuales son siempre
  // el lado que está entregando, o sea uno mismo, y había que buscarse en la lista para
  // sacarse. El default correcto es el lado que RECIBE:
  // - Entregar a gerencia: no se puede adivinar a qué gerente va, se elige. Arranca vacío.
  // - Devolver al responsable: el candidato natural es quien armó el presupuesto.
  // En ningún caso se pre-carga al usuario actual.
  const handleOpenStatusDialog = (qr: QuoteRequest, target: QuoteRequest['status']) => {
    setStatusDialog({ open: true, qr, target });
    setStatusComment('');

    let preselected: number[] = [];
    if (target === 'in_progress' && qr.status === 'pending_review') {
      const liveBudget = (qr.budgets || []).find((b) => b.status !== 'rejected');
      if (liveBudget?.created_by) preselected = [liveBudget.created_by];
    }
    setStatusAssigneeIds(preselected.filter((id) => id !== user?.id));
  };

  const needsReassignOnTransition = statusDialog.target === 'in_progress' || statusDialog.target === 'pending_review';
  // Devolver al responsable es la única transición con comentario obligatorio (ver FLOWS.md
  // flujo 27g) — mismo criterio que budgetController exige rejection_reason al rechazar.
  const isReturnTransition = statusDialog.target === 'in_progress' && statusDialog.qr?.status === 'pending_review';
  const commentMissing = isReturnTransition && !statusComment.trim();

  const handleConfirmStatusChange = async () => {
    if (!statusDialog.qr || !statusDialog.target) return;
    setProcessing(true);
    try {
      await QuoteRequestService.changeStatus(
        statusDialog.qr.id,
        statusDialog.target,
        needsReassignOnTransition ? statusAssigneeIds : undefined,
        statusComment.trim() || undefined
      );
      setStatusDialog({ open: false, qr: null, target: '' });
      setSuccess('Estado actualizado.');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar el estado');
    } finally {
      setProcessing(false);
    }
  };

  const availablePlants = plants.filter((p) => p.client_id === Number(form.client_id));

  const renderActions = (qr: QuoteRequest) => (
    <Box display="flex" gap={0.5} flexWrap="wrap">
      {hasAssignPermission ? (
        <Tooltip title="Editar">
          <IconButton size="small" onClick={() => handleOpenEdit(qr)}><EditIcon fontSize="small" /></IconButton>
        </Tooltip>
      ) : (
        // Responsable: no puede editar, pero sí tiene que poder leer su propio PC — línea de
        // tiempo incluida (ver FLOWS.md flujo 27g, §2.3).
        <Tooltip title="Ver">
          <IconButton size="small" onClick={() => handleOpenView(qr)}><ViewIcon fontSize="small" /></IconButton>
        </Tooltip>
      )}
      {(qr.status === 'pending' || qr.status === 'in_progress' || qr.status === 'pending_review') && !hasLiveBudget(qr) && (
        <Tooltip title="Crear presupuesto">
          <IconButton size="small" color="primary" onClick={() => router.push(`/dashboard/budgets?quote_request_id=${qr.id}`)}>
            <BudgetIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {(qr.budgets || []).map((b) => (
        <Tooltip key={b.id} title={`Ver presupuesto ${b.number} (${BUDGET_STATUS_LABELS[b.status] || b.status})`}>
          <Chip
            size="small"
            icon={<BudgetIcon />}
            label={b.number}
            color={b.status === 'rejected' ? 'error' : 'default'}
            variant={b.status === 'rejected' ? 'outlined' : 'filled'}
            clickable
            onClick={() => router.push(`/dashboard/budgets?view=${b.id}`)}
          />
        </Tooltip>
      ))}
      {qr.status === 'in_progress' && hasDeliverPermission && (
        <Tooltip title="Entregar a gerencia">
          <IconButton size="small" color="warning" onClick={() => handleOpenStatusDialog(qr, 'pending_review')}>
            <HandoffIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {qr.status === 'pending_review' && hasAssignPermission && (
        <Tooltip title="Devolver al responsable">
          <IconButton size="small" onClick={() => handleOpenStatusDialog(qr, 'in_progress')}>
            <HandoffIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {hasAssignPermission && (qr.status === 'pending' || qr.status === 'in_progress' || qr.status === 'pending_review') && (
        <Tooltip title="Cancelar">
          <IconButton size="small" color="error" onClick={() => handleOpenStatusDialog(qr, 'cancelled')}>
            <CancelIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {qr.status === 'cancelled' && hasAssignPermission && (
        <Tooltip title="Reabrir">
          <IconButton size="small" onClick={() => handleOpenStatusDialog(qr, 'pending')}>
            <ReopenIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {hasAssignPermission && (
        <Tooltip title="Eliminar">
          <IconButton size="small" color="error" onClick={() => setDeleteDialog(qr)}><DeleteIcon fontSize="small" /></IconButton>
        </Tooltip>
      )}
    </Box>
  );

  if (loading) return <GearSpinner />;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <TitleIcon color="primary" />
          <Typography variant="h5" fontWeight="bold">Pedidos de Cotización</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button startIcon={<RefreshIcon />} onClick={loadData}>Actualizar</Button>
          {hasAssignPermission && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>Nuevo Pedido</Button>
          )}
        </Box>
      </Box>

      <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />
      <FeedbackModal open={!!success} onClose={() => setSuccess('')} message={success} type="success" />

      {/* Mobile Cards */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {quoteRequests.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={4}>No hay Pedidos de Cotización</Typography>
        ) : (
          <Stack spacing={2}>
            {quoteRequests.map((qr) => {
              const chip = dueDateChip(qr.due_date);
              return (
                <Card key={qr.id} sx={{ p: 2, borderRadius: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold">{qr.number}</Typography>
                      {qr.client_quote_number && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          N° Cliente: {qr.client_quote_number}
                        </Typography>
                      )}
                      <Typography variant="body2">{qr.title}</Typography>
                    </Box>
                    <Chip label={STATUS_LABELS[qr.status].label} color={STATUS_LABELS[qr.status].color} size="small" />
                  </Box>
                  <Typography variant="body2" color="text.secondary">{qr.client?.razonSocial}</Typography>
                  <Chip label={chip.label} color={chip.color} size="small" sx={{ mt: 1 }} />
                  {(qr.assignees || []).length > 0 && (
                    <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                      Responsables: {qr.assignees!.map((a) => `${a.name} ${a.lastname}`).join(', ')}
                    </Typography>
                  )}
                  <Box mt={1}>{renderActions(qr)}</Box>
                </Card>
              );
            })}
          </Stack>
        )}
      </Box>

      {/* Desktop Table */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <TableContainer component={Paper} elevation={2}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Número</TableCell>
                <TableCell>N° Cliente</TableCell>
                <TableCell>Título</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Vencimiento</TableCell>
                <TableCell>Responsables</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {quoteRequests.length === 0 ? (
                <TableRow><TableCell colSpan={8} align="center">No hay Pedidos de Cotización</TableCell></TableRow>
              ) : (
                quoteRequests.map((qr) => {
                  const chip = dueDateChip(qr.due_date);
                  return (
                    <TableRow key={qr.id} hover>
                      <TableCell>{qr.number}</TableCell>
                      <TableCell>{qr.client_quote_number || '—'}</TableCell>
                      <TableCell>{qr.title}</TableCell>
                      <TableCell>{qr.client?.razonSocial}</TableCell>
                      <TableCell><Chip label={STATUS_LABELS[qr.status].label} color={STATUS_LABELS[qr.status].color} size="small" /></TableCell>
                      <TableCell><Chip label={chip.label} color={chip.color} size="small" /></TableCell>
                      <TableCell>{(qr.assignees || []).map((a) => `${a.name} ${a.lastname}`).join(', ') || '—'}</TableCell>
                      <TableCell>{renderActions(qr)}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Alta / Edición / Ver */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle>{viewOnly ? `Ver ${editing?.number}` : editing ? `Editar ${editing.number}` : 'Nuevo Pedido de Cotización'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Título *" fullWidth disabled={viewOnly} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <TextField label="N° de Cotización del Cliente *" fullWidth disabled={viewOnly} value={form.client_quote_number}
              onChange={(e) => setForm({ ...form, client_quote_number: e.target.value })}
              helperText="Número con el que el cliente identifica su pedido — texto libre, cada cliente usa su propia nomenclatura" />
            <TextField label="Cliente *" select fullWidth disabled={viewOnly} value={form.client_id}
              onChange={(e) => setForm({ ...form, client_id: e.target.value, plant_id: '' })}
              SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
              <option value="">— Seleccionar —</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.razonSocial}</option>)}
            </TextField>
            <TextField label="Planta" select fullWidth disabled={viewOnly || !form.client_id} value={form.plant_id}
              onChange={(e) => setForm({ ...form, plant_id: e.target.value })}
              SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
              <option value="">— Ninguna —</option>
              {availablePlants.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </TextField>
            <TextField label="Descripción" fullWidth multiline rows={2} disabled={viewOnly} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <DateField label="Fecha de recepción" value={form.received_at} onChange={(v) => setForm({ ...form, received_at: v })} fullWidth disabled={viewOnly} />
              <DateField label="Vencimiento de presentación *" value={form.due_date} onChange={(v) => setForm({ ...form, due_date: v })} fullWidth disabled={viewOnly} />
            </Stack>
            <Autocomplete
              multiple
              disabled={viewOnly}
              options={assignableUsers}
              getOptionLabel={(u) => `${u.name} ${u.lastname}`}
              value={assignableUsers.filter((u) => form.assignee_ids.includes(u.id))}
              onChange={(_e, value) => setForm({ ...form, assignee_ids: value.map((u) => u.id) })}
              renderInput={(params) => <TextField {...params} label="Responsables" placeholder="Agregar responsable" />}
              isOptionEqualToValue={(a, b) => a.id === b.id}
            />
            <TextField label="Notas" fullWidth multiline rows={2} disabled={viewOnly} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            {!viewOnly && (
              <TextField
                label="Comentario"
                fullWidth
                multiline
                rows={2}
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
                helperText={editing
                  ? 'Opcional — se avisa a los responsables que se agreguen y queda en la línea de tiempo'
                  : 'Opcional — se avisa a los responsables asignados y queda en la línea de tiempo'}
              />
            )}

            {!viewOnly && (
              <Box>
                <Button component="label" variant="outlined" startIcon={<AttachIcon />} size="small">
                  Adjuntar documento
                  <input type="file" hidden multiple onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setPendingFiles((prev) => [...prev, ...files]);
                    e.target.value = '';
                  }} />
                </Button>
                <Stack spacing={0.5} sx={{ mt: 1 }}>
                  {(editing?.files || []).map((f) => (
                    <Box key={f.id} display="flex" alignItems="center" justifyContent="space-between" sx={{ bgcolor: 'action.hover', px: 1, py: 0.5, borderRadius: 1 }}>
                      <Typography variant="body2" noWrap sx={{ maxWidth: '70%' }}>
                        <Link href={f.file_url} target="_blank" rel="noopener noreferrer" underline="hover">{f.file_name || 'Archivo'}</Link>
                        {f.size_bytes ? ` (${formatFileSize(f.size_bytes)})` : ''}
                      </Typography>
                      <IconButton size="small" onClick={() => handleRemoveExistingFile(f.id)}><CloseIcon fontSize="small" /></IconButton>
                    </Box>
                  ))}
                  {pendingFiles.map((f, idx) => (
                    <Box key={idx} display="flex" alignItems="center" justifyContent="space-between" sx={{ bgcolor: 'action.hover', px: 1, py: 0.5, borderRadius: 1 }}>
                      <Typography variant="body2" noWrap sx={{ maxWidth: '70%' }}>{f.name} ({formatFileSize(f.size)})</Typography>
                      <IconButton size="small" onClick={() => setPendingFiles((prev) => prev.filter((_, i) => i !== idx))}><CloseIcon fontSize="small" /></IconButton>
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}
            {viewOnly && (editing?.files || []).length > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary">Archivos adjuntos</Typography>
                <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                  {(editing?.files || []).map((f) => (
                    <Typography key={f.id} variant="body2">
                      <Link href={f.file_url} target="_blank" rel="noopener noreferrer" underline="hover">{f.file_name || 'Archivo'}</Link>
                      {f.size_bytes ? ` (${formatFileSize(f.size_bytes)})` : ''}
                    </Typography>
                  ))}
                </Stack>
              </Box>
            )}

            {editing && (
              <>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mt: 1 }}>Línea de tiempo</Typography>
                {historyLoading ? (
                  <Typography variant="body2" color="text.secondary">Cargando…</Typography>
                ) : historyEntries.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">Sin eventos registrados todavía.</Typography>
                ) : (
                  <>
                    {/* Mobile Cards */}
                    <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                      <Stack spacing={1}>
                        {historyEntries.map((h) => (
                          <Card key={h.id} sx={{ p: 1.5 }}>
                            <Typography variant="body2" fontWeight={600}>{HISTORY_EVENT_LABELS[h.event] || h.event}</Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {new Date(h.at).toLocaleString('es-AR')}
                              {h.actor ? ` · ${h.actor.lastname}, ${h.actor.name}` : ''}
                              {h.recipients.length > 0 ? ` → ${h.recipients.map((r) => `${r.lastname}, ${r.name}`).join('; ')}` : ''}
                            </Typography>
                            {h.comment && <Typography variant="body2" sx={{ mt: 0.5 }}>{h.comment}</Typography>}
                          </Card>
                        ))}
                      </Stack>
                    </Box>
                    {/* Desktop Table */}
                    <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow><TableCell>Fecha</TableCell><TableCell>Evento</TableCell><TableCell>De → Para</TableCell><TableCell>Comentario</TableCell></TableRow>
                          </TableHead>
                          <TableBody>
                            {historyEntries.map((h) => (
                              <TableRow key={h.id}>
                                <TableCell>{new Date(h.at).toLocaleString('es-AR')}</TableCell>
                                <TableCell>{HISTORY_EVENT_LABELS[h.event] || h.event}</TableCell>
                                <TableCell>
                                  {h.actor ? `${h.actor.lastname}, ${h.actor.name}` : '—'}
                                  {h.recipients.length > 0 ? ` → ${h.recipients.map((r) => `${r.lastname}, ${r.name}`).join('; ')}` : ''}
                                </TableCell>
                                <TableCell>{h.comment || '—'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  </>
                )}
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>{viewOnly ? 'Cerrar' : 'Cancelar'}</Button>
          {!viewOnly && (
            <Button variant="contained" onClick={handleSubmit} disabled={processing}>Guardar</Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Confirmar eliminación */}
      <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)}>
        <DialogTitle>Eliminar Pedido de Cotización</DialogTitle>
        <DialogContent>
          <Typography>¿Eliminar {deleteDialog?.number}? Esta acción no se puede deshacer.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(null)}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={processing}>Eliminar</Button>
        </DialogActions>
      </Dialog>

      {/* Cambio de estado (handoff) */}
      <Dialog open={statusDialog.open} onClose={() => setStatusDialog({ open: false, qr: null, target: '' })} maxWidth="xs" fullWidth>
        <DialogTitle>
          {statusDialog.target === 'pending_review' && 'Entregar a gerencia'}
          {statusDialog.target === 'in_progress' && statusDialog.qr?.status === 'pending_review' && 'Devolver al responsable'}
          {statusDialog.target === 'cancelled' && 'Cancelar Pedido de Cotización'}
          {statusDialog.target === 'pending' && 'Reabrir Pedido de Cotización'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {needsReassignOnTransition && (
              <Autocomplete
                multiple
                options={assignableUsers}
                getOptionLabel={(u) => `${u.name} ${u.lastname}`}
                value={assignableUsers.filter((u) => statusAssigneeIds.includes(u.id))}
                onChange={(_e, value) => setStatusAssigneeIds(value.map((u) => u.id))}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={statusDialog.target === 'pending_review' ? 'Gerencia' : 'Responsables'}
                    placeholder={statusDialog.target === 'pending_review' ? 'Elegí a quién se lo entregás' : 'Elegí a quién se lo devolvés'}
                  />
                )}
                isOptionEqualToValue={(a, b) => a.id === b.id}
              />
            )}
            {statusDialog.target === 'cancelled' && (
              <Typography variant="body2" color="text.secondary">Se puede reabrir después desde el listado.</Typography>
            )}
            {needsReassignOnTransition && (
              <TextField
                label={isReturnTransition ? 'Comentario *' : 'Comentario'}
                fullWidth
                multiline
                rows={2}
                value={statusComment}
                onChange={(e) => setStatusComment(e.target.value)}
                error={isReturnTransition && !statusComment.trim()}
                helperText={isReturnTransition
                  ? 'Obligatorio — contale al responsable por qué se lo devolvés'
                  : 'Opcional — se avisa a quien lo recibe y queda en la línea de tiempo'}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog({ open: false, qr: null, target: '' })}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleConfirmStatusChange}
            disabled={processing || (needsReassignOnTransition && statusAssigneeIds.length === 0) || commentMissing}
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
