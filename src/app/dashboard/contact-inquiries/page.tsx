'use client';
import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box, Typography, Button, Paper, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, DialogTitle, DialogContent, DialogActions, Tooltip,
  Stack, Chip, TextField, Divider, useMediaQuery, useTheme,
} from '@mui/material';
import AppDialog from '@/components/common/AppDialog';
import FeedbackModal from '../../../components/FeedbackModal';
import GearSpinner from '../../../components/GearSpinner';
import ListFilters, { FilterSelect, FilterSwitch } from '../../../components/common/ListFilters';
import {
  ForumOutlined as TitleIcon, RefreshOutlined as RefreshIcon, VisibilityOutlined as ViewIcon,
  DeleteOutlined as DeleteIcon, PhoneOutlined as CallIcon, WhatsApp as WhatsAppIcon,
  ContentCopyOutlined as CopyIcon, CloseOutlined as CloseIcon,
} from '@mui/icons-material';
import {
  ContactInquiry, ContactInquiryService, ContactInquiryReason, ContactInquiryStatus,
} from '../../../utils/api';
import { useAuth, userHasPermission } from '../../../utils/auth';
import { buildWhatsAppLink } from '../../../utils/whatsapp';
import { relativeTime } from '../../../utils/dates';
import {
  CONTACT_REASON_LABELS, CONTACT_REASON_OPTIONS, CONTACT_STATUS_LABELS,
} from '../../../utils/contactInquiries';

// Consultas que entran por el formulario de contacto de la web (ver FLOWS.md §58). Solo se pueden
// leer, tomar, cerrar, anotar y borrar: lo que escribió el visitante no se edita, y no hay "Nueva
// consulta" porque se crean únicamente desde la landing.

const formatDateTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

const fullName = (u?: { name: string; lastname: string } | null) => (u ? `${u.name} ${u.lastname}` : '');

export default function ContactInquiriesPage() {
  return (
    <Suspense fallback={<GearSpinner />}>
      <ContactInquiriesPageContent />
    </Suspense>
  );
}

function ContactInquiriesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const canUpdate = userHasPermission(user, 'contact_inquiries_update');
  const canDelete = userHasPermission(user, 'contact_inquiries_delete');

  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processing, setProcessing] = useState(false);

  // Filtros del listado — consultan al servidor (ver FLOWS.md §39 y §52).
  const [search, setSearch] = useState('');
  const [filterReason, setFilterReason] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [includeClosed, setIncludeClosed] = useState(false);
  const hasActiveFilters = !!(search || filterReason || filterStatus || includeClosed);
  const clearFilters = () => {
    setSearch(''); setFilterReason(''); setFilterStatus(''); setIncludeClosed(false);
  };

  const [selected, setSelected] = useState<ContactInquiry | null>(null);
  const [notes, setNotes] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<ContactInquiry | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const list = await ContactInquiryService.getAll({
        q: search || undefined,
        reason: (filterReason || undefined) as ContactInquiryReason | undefined,
        status: (filterStatus || undefined) as ContactInquiryStatus | undefined,
        include_closed: includeClosed,
      });
      setInquiries(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las consultas');
    } finally {
      setLoading(false);
    }
  }, [search, filterReason, filterStatus, includeClosed]);

  // Los filtros consultan al servidor; la búsqueda por texto con un pequeño debounce.
  useEffect(() => {
    const timeout = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(timeout);
  }, [load, search]);

  const openDetail = (inquiry: ContactInquiry) => {
    setSelected(inquiry);
    setNotes(inquiry.internal_notes || '');
  };

  // Deep link: la campanita, el push y el aviso del tablero abren acá el detalle directo
  // (`?view=<id>`, igual que Pedidos de Cotización).
  const deepLinkHandled = useRef(false);
  useEffect(() => {
    if (deepLinkHandled.current || loading) return;
    const viewId = searchParams.get('view');
    if (!viewId) return;
    deepLinkHandled.current = true;

    const found = inquiries.find((i) => i.id === Number(viewId));
    if (found) {
      openDetail(found);
    } else {
      // No está en el listado (filtros activos, o ya cerrada y oculta): se busca directo.
      ContactInquiryService.getById(Number(viewId))
        .then(openDetail)
        .catch(() => setError('No se encontró la consulta.'));
    }
    router.replace('/dashboard/contact-inquiries');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const applyUpdate = async (inquiry: ContactInquiry, body: { status?: ContactInquiryStatus; internal_notes?: string }, message: string) => {
    try {
      setProcessing(true);
      const updated = await ContactInquiryService.update(inquiry.id, body);
      setSelected(updated);
      setNotes(updated.internal_notes || '');
      setSuccess(message);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar la consulta');
    } finally {
      setProcessing(false);
    }
  };

  const notesDirty = !!selected && notes.trim() !== (selected.internal_notes || '').trim();

  // Si hay notas sin guardar, viajan con el cambio de estado: así no se pierde lo que se estaba escribiendo.
  const changeStatus = (status: ContactInquiryStatus, message: string) => {
    if (!selected) return;
    applyUpdate(selected, { status, ...(notesDirty ? { internal_notes: notes } : {}) }, message);
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    try {
      setProcessing(true);
      await ContactInquiryService.delete(deleteDialog.id);
      setDeleteDialog(null);
      setSelected(null);
      setSuccess('Consulta eliminada.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar la consulta');
    } finally {
      setProcessing(false);
    }
  };

  const copyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      setSuccess('Email copiado.');
    } catch {
      setError('No se pudo copiar el email. Seleccionalo y copialo a mano.');
    }
  };

  const renderActions = (inquiry: ContactInquiry) => (
    <Box display="flex" gap={0.5}>
      <Tooltip title="Ver">
        <IconButton size="small" onClick={() => openDetail(inquiry)}><ViewIcon fontSize="small" /></IconButton>
      </Tooltip>
      {canDelete && (
        <Tooltip title="Eliminar">
          <IconButton size="small" color="error" onClick={() => setDeleteDialog(inquiry)}><DeleteIcon fontSize="small" /></IconButton>
        </Tooltip>
      )}
    </Box>
  );

  const statusChip = (status: ContactInquiryStatus) => (
    <Chip label={CONTACT_STATUS_LABELS[status].label} color={CONTACT_STATUS_LABELS[status].color} size="small" />
  );
  const reasonChip = (reason: ContactInquiryReason) => (
    <Chip label={CONTACT_REASON_LABELS[reason]} variant="outlined" size="small" />
  );

  if (loading && inquiries.length === 0 && !hasActiveFilters) return <GearSpinner />;

  const emptyMessage = hasActiveFilters
    ? 'No hay consultas que coincidan con los filtros'
    : 'No hay consultas pendientes';

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <TitleIcon color="primary" />
          <Typography variant="h5" fontWeight="bold">Consultas web</Typography>
        </Box>
        <Button startIcon={<RefreshIcon />} onClick={load}>Actualizar</Button>
      </Box>

      <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />
      <FeedbackModal open={!!success} onClose={() => setSuccess('')} message={success} type="success" />

      <ListFilters
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nombre, empresa, email, teléfono o mensaje…"
        onClear={clearFilters}
        hasActiveFilters={hasActiveFilters}
      >
        <FilterSelect
          label="Motivo"
          value={filterReason}
          onChange={setFilterReason}
          emptyLabel="Todos los motivos"
          options={CONTACT_REASON_OPTIONS}
        />
        <FilterSelect
          label="Estado"
          value={filterStatus}
          onChange={setFilterStatus}
          emptyLabel="Todos los estados"
          options={(Object.keys(CONTACT_STATUS_LABELS) as ContactInquiryStatus[]).map((value) => ({
            value,
            label: CONTACT_STATUS_LABELS[value].label,
          }))}
        />
        <FilterSwitch label="Ver terminados" checked={includeClosed} onChange={setIncludeClosed} />
      </ListFilters>

      {/* Mobile Cards */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {inquiries.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={4}>{emptyMessage}</Typography>
        ) : (
          <Stack spacing={2}>
            {inquiries.map((i) => (
              <Card key={i.id} sx={{ p: 2, borderRadius: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1} gap={1}>
                  <Box minWidth={0}>
                    <Typography variant="subtitle2" fontWeight="bold">{i.name}</Typography>
                    {i.company && <Typography variant="caption" color="text.secondary" display="block">{i.company}</Typography>}
                  </Box>
                  {statusChip(i.status)}
                </Box>
                <Box display="flex" alignItems="center" gap={1} flexWrap="wrap" mb={1}>
                  {reasonChip(i.reason)}
                  <Typography variant="caption" color="text.secondary">{relativeTime(i.createdAt)}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {i.message}
                </Typography>
                <Box mt={1}>{renderActions(i)}</Box>
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
              <TableRow>
                <TableCell>Recibida</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Empresa</TableCell>
                <TableCell>Motivo</TableCell>
                <TableCell>Mensaje</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {inquiries.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center">{emptyMessage}</TableCell></TableRow>
              ) : (
                inquiries.map((i) => (
                  <TableRow key={i.id} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDateTime(i.createdAt)}</TableCell>
                    <TableCell>{i.name}</TableCell>
                    <TableCell>{i.company || '—'}</TableCell>
                    <TableCell>{reasonChip(i.reason)}</TableCell>
                    <TableCell sx={{ maxWidth: 320 }}>
                      <Typography variant="body2" noWrap>{i.message}</Typography>
                    </TableCell>
                    <TableCell>{statusChip(i.status)}</TableCell>
                    <TableCell>{renderActions(i)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Detalle */}
      <AppDialog open={!!selected} onClose={() => setSelected(null)} maxWidth="sm" fullWidth fullScreen={isMobile}>
        {selected && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
              <Box>
                <Typography variant="h6" fontWeight="bold">{selected.name}</Typography>
                {selected.company && <Typography variant="body2" color="text.secondary">{selected.company}</Typography>}
              </Box>
              <IconButton size="small" onClick={() => setSelected(null)} aria-label="Cerrar"><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ mt: 0.5 }}>
                <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                  {statusChip(selected.status)}
                  {reasonChip(selected.reason)}
                  <Typography variant="caption" color="text.secondary">
                    Recibida el {formatDateTime(selected.createdAt)}
                  </Typography>
                </Box>

                {/* Datos de contacto con accesos rápidos: llamar y WhatsApp abren la app del
                    teléfono; el email va como texto copiable (no hay mail configurado en el sistema). */}
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Stack spacing={1.5}>
                    {selected.phone && (
                      <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                        <Typography variant="body2" sx={{ minWidth: 80 }} color="text.secondary">Teléfono</Typography>
                        <Typography variant="body2" fontWeight={600}>{selected.phone}</Typography>
                        <Box flexGrow={1} />
                        <Button size="small" variant="outlined" startIcon={<CallIcon />} component="a" href={`tel:${selected.phone}`}>
                          Llamar
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="success"
                          startIcon={<WhatsAppIcon />}
                          component="a"
                          target="_blank"
                          rel="noopener noreferrer"
                          href={buildWhatsAppLink(selected.phone, `Hola ${selected.name}, te escribimos de Conmomet por tu consulta enviada desde la web.`)}
                        >
                          WhatsApp
                        </Button>
                      </Box>
                    )}
                    {selected.email && (
                      <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                        <Typography variant="body2" sx={{ minWidth: 80 }} color="text.secondary">Email</Typography>
                        <Typography variant="body2" fontWeight={600} sx={{ wordBreak: 'break-all' }}>{selected.email}</Typography>
                        <Box flexGrow={1} />
                        <Tooltip title="Copiar email">
                          <IconButton size="small" onClick={() => copyEmail(selected.email!)} aria-label="Copiar email"><CopyIcon fontSize="small" /></IconButton>
                        </Tooltip>
                      </Box>
                    )}
                    {!selected.phone && !selected.email && (
                      <Typography variant="body2" color="text.secondary">El visitante no dejó datos de contacto.</Typography>
                    )}
                  </Stack>
                </Paper>

                <Box>
                  <Typography variant="caption" color="text.secondary">Mensaje</Typography>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    <Typography variant="body2">{selected.message}</Typography>
                  </Paper>
                </Box>

                {(selected.handledByUser || selected.closedByUser) && (
                  <Typography variant="caption" color="text.secondary" component="div">
                    {selected.handledByUser && <>Tomada por {fullName(selected.handledByUser)} · {formatDateTime(selected.handled_at)}</>}
                    {selected.closedByUser && <><br />Cerrada por {fullName(selected.closedByUser)} · {formatDateTime(selected.closed_at)}</>}
                  </Typography>
                )}

                <Divider />

                <TextField
                  label="Notas internas"
                  helperText="Solo las ve el equipo. Ej: a quién se derivó, qué se habló."
                  fullWidth
                  multiline
                  rows={3}
                  disabled={!canUpdate}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                {canUpdate && (
                  <Box>
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={!notesDirty || processing}
                      onClick={() => applyUpdate(selected, { internal_notes: notes }, 'Notas guardadas.')}
                    >
                      Guardar notas
                    </Button>
                  </Box>
                )}
              </Stack>
            </DialogContent>
            <DialogActions sx={{ flexWrap: 'wrap', gap: 1 }}>
              {canDelete && (
                <Button color="error" startIcon={<DeleteIcon />} onClick={() => setDeleteDialog(selected)} disabled={processing}>
                  Eliminar
                </Button>
              )}
              <Box flexGrow={1} />
              <Button onClick={() => setSelected(null)}>Cerrar</Button>
              {canUpdate && selected.status === 'new' && (
                <Button variant="outlined" disabled={processing} onClick={() => changeStatus('in_progress', 'Consulta tomada.')}>
                  Tomar consulta
                </Button>
              )}
              {canUpdate && selected.status !== 'closed' && (
                <Button variant="contained" disabled={processing} onClick={() => changeStatus('closed', 'Consulta cerrada.')}>
                  {processing ? <GearSpinner size={20} /> : 'Cerrar consulta'}
                </Button>
              )}
              {canUpdate && selected.status === 'closed' && (
                <Button variant="contained" disabled={processing} onClick={() => changeStatus('in_progress', 'Consulta reabierta.')}>
                  Reabrir
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </AppDialog>

      {/* Confirmar eliminación */}
      <AppDialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)}>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Eliminar la consulta de <strong>{deleteDialog?.name}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Sale del listado y del aviso del inicio. Usalo para spam o consultas duplicadas; si solo
            está resuelta, mejor cerrarla.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(null)}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={processing}>Eliminar</Button>
        </DialogActions>
      </AppDialog>
    </Box>
  );
}
