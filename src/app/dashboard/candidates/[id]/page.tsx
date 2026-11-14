'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Alert, Box, Button, Card, Chip, DialogActions, DialogContent, DialogTitle, Divider, IconButton,
  Link, MenuItem, Paper, Stack, TextField, Tooltip, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import AppDialog from '@/components/common/AppDialog';
import { useFileViewer } from '@/components/common/FileViewer';
import FeedbackModal from '../../../../components/FeedbackModal';
import GearSpinner from '../../../../components/GearSpinner';
import CandidateFormFields, { emptyCandidateForm } from '../../../../components/candidates/CandidateFormFields';
import CandidateDuplicateAlerts from '../../../../components/candidates/CandidateDuplicateAlerts';
import CandidateFilePicker from '../../../../components/candidates/CandidateFilePicker';
import {
  ArrowBackOutlined as BackIcon, EditOutlined as EditIcon, DeleteOutlined as DeleteIcon,
  AddOutlined as AddIcon, AttachFileOutlined as AttachIcon, WhatsApp as WhatsAppIcon,
  HistoryOutlined as HistoryIcon,
} from '@mui/icons-material';
import {
  Candidate, CandidateApplication, CandidateFormValues, CandidateHistoryEntry, CandidateRejectionReason,
  CandidateService, CandidateStage, CandidateUploadFile, LookupCategory, LookupService,
} from '../../../../utils/api';
import { useAuth, userHasPermission } from '../../../../utils/auth';
import { buildWhatsAppLink } from '../../../../utils/whatsapp';
import {
  CANDIDATE_FILE_KIND_LABELS, CANDIDATE_REJECTION_LABELS, CANDIDATE_REJECTION_OPTIONS, CANDIDATE_SOURCE_LABELS,
  CANDIDATE_STAGE_LABELS, CANDIDATE_TRANSITIONS, fullName, isOpenStage,
} from '../../../../utils/candidates';

const formatDate = (iso?: string | null) => {
  if (!iso) return '—';
  // Las fechas sin hora (YYYY-MM-DD) se leen como locales: sin esto se corren un día para atrás.
  const date = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(iso + 'T00:00:00') : new Date(iso);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('es-AR');
};
const formatDateTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }) : '—';
const formatSize = (bytes?: number | null) =>
  !bytes ? '' : bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

// Texto de cada acción de etapa. Los destinos que cierran o reabren llevan un verbo propio.
const STAGE_ACTION_LABELS: Partial<Record<CandidateStage, string>> = {
  screening: 'Pasar a revisión',
  interview: 'Pasar a entrevista',
  offer: 'Hacer oferta',
  rejected: 'Rechazar',
  withdrawn: 'Marcar como retirada',
};

function toFormValues(c: Candidate): CandidateFormValues {
  return {
    name: c.name,
    lastname: c.lastname,
    dni: c.dni || '',
    cuil: c.cuil || '',
    email: c.email || '',
    phone: c.phone || '',
    birth_date: c.birth_date || '',
    address: c.address || '',
    locality: c.locality || '',
    trade: c.trade || '',
    category_id: c.category_id ? String(c.category_id) : '',
    years_experience: c.years_experience !== null && c.years_experience !== undefined ? String(c.years_experience) : '',
    has_driver_license: !!c.has_driver_license,
    notes: c.notes || '',
    // El origen "web" no se elige a mano: el campo se oculta y no se envía (ver más abajo).
    source: c.source === 'web' ? 'in_person' : c.source,
  };
}

const EVENT_LABELS: Record<CandidateHistoryEntry['event'], string> = {
  created: 'Postulación creada',
  stage_changed: 'Cambio de etapa',
  reopened: 'Postulación reabierta',
  resubmitted: 'Volvió a enviar su CV',
  converted: 'Dado de alta como empleado',
};

function DataRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
      <Typography variant="body2" component="div" sx={{ wordBreak: 'break-word' }}>{children || '—'}</Typography>
    </Box>
  );
}

export default function CandidateDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { fileLinkProps } = useFileViewer();
  const { user } = useAuth();
  const canWrite = userHasPermission(user, 'candidates_write');
  const canUpdate = userHasPermission(user, 'candidates_update');
  const canDelete = userHasPermission(user, 'candidates_delete');
  const id = Number(params.id);

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [history, setHistory] = useState<CandidateHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processing, setProcessing] = useState(false);
  const [categories, setCategories] = useState<LookupCategory[]>([]);

  // Edición de datos
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<CandidateFormValues>(emptyCandidateForm());
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Cambio de etapa
  const [stageDialog, setStageDialog] = useState<{ application: CandidateApplication; target: CandidateStage } | null>(null);
  const [stageComment, setStageComment] = useState('');
  const [rejectionReason, setRejectionReason] = useState<CandidateRejectionReason | ''>('');

  // Nueva postulación
  const [newAppOpen, setNewAppOpen] = useState(false);
  const [newPosition, setNewPosition] = useState('');
  const [newCover, setNewCover] = useState('');

  // Papeles
  const [addFilesOpen, setAddFilesOpen] = useState(false);
  const [newFiles, setNewFiles] = useState<CandidateUploadFile[]>([]);
  const [removeFileId, setRemoveFileId] = useState<number | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      setHistory(await CandidateService.getHistory(id));
    } catch {
      setHistory([]);
    }
  }, [id]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setCandidate(await CandidateService.getById(id));
      await loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el postulante');
    } finally {
      setLoading(false);
    }
  }, [id, loadHistory]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!editOpen || categories.length > 0) return;
    LookupService.getCategories().then(setCategories).catch(() => setCategories([]));
  }, [editOpen, categories.length]);

  // Aplica el resultado de una acción: el backend devuelve el detalle actualizado, así que no hace
  // falta volver a pedirlo. El historial sí, porque es otro endpoint.
  const applyResult = async (updated: Candidate, message: string) => {
    setCandidate(updated);
    setSuccess(message);
    await loadHistory();
  };

  const run = async (action: () => Promise<void>) => {
    try {
      setProcessing(true);
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error');
    } finally {
      setProcessing(false);
    }
  };

  const handleOpenEdit = () => {
    if (!candidate) return;
    setForm(toFormValues(candidate));
    setSubmitAttempted(false);
    setEditOpen(true);
  };

  const handleSaveEdit = () => {
    if (!candidate) return;
    setSubmitAttempted(true);
    if (!form.name.trim() || !form.lastname.trim()) return;
    // Para un postulante de la web no se envía `source`: el backend no acepta "web" desde acá y el
    // campo está oculto, así que el valor del formulario no es una decisión de nadie.
    const { source, ...rest } = form;
    const payload = candidate.source === 'web' ? rest : { ...rest, source };
    run(async () => {
      const updated = await CandidateService.update(candidate.id, payload);
      setEditOpen(false);
      await applyResult(updated, 'Datos actualizados.');
    });
  };

  const openStageDialog = (application: CandidateApplication, target: CandidateStage) => {
    setStageDialog({ application, target });
    setStageComment('');
    setRejectionReason('');
  };

  const handleChangeStage = () => {
    if (!candidate || !stageDialog) return;
    const { application, target } = stageDialog;
    if (target === 'rejected' && !rejectionReason) return;
    run(async () => {
      const updated = await CandidateService.changeStage(candidate.id, application.id, {
        stage: target,
        comment: target === 'rejected' ? undefined : stageComment || undefined,
        rejection_reason: target === 'rejected' ? (rejectionReason as CandidateRejectionReason) : undefined,
        rejection_notes: target === 'rejected' ? stageComment || undefined : undefined,
      });
      setStageDialog(null);
      await applyResult(updated, 'Etapa actualizada.');
    });
  };

  const handleNewApplication = () => {
    if (!candidate) return;
    run(async () => {
      const updated = await CandidateService.createApplication(candidate.id, { position_of_interest: newPosition, cover_letter: newCover });
      setNewAppOpen(false);
      setNewPosition('');
      setNewCover('');
      await applyResult(updated, 'Postulación creada.');
    });
  };

  const handleAddFiles = () => {
    if (!candidate || newFiles.length === 0) return;
    // Los papeles nuevos se cuelgan de la postulación vigente, si hay una abierta.
    const open = (candidate.applications || []).find((a) => isOpenStage(a.stage));
    run(async () => {
      const updated = await CandidateService.addFiles(candidate.id, newFiles, open?.id);
      setAddFilesOpen(false);
      setNewFiles([]);
      await applyResult(updated, 'Archivos agregados.');
    });
  };

  const handleRemoveFile = () => {
    if (!candidate || removeFileId === null) return;
    run(async () => {
      const updated = await CandidateService.removeFile(candidate.id, removeFileId);
      setRemoveFileId(null);
      await applyResult(updated, 'Archivo eliminado.');
    });
  };

  const handleDelete = () => {
    if (!candidate) return;
    run(async () => {
      await CandidateService.delete(candidate.id);
      router.push('/dashboard/candidates');
    });
  };

  if (loading && !candidate) return <GearSpinner />;

  if (!candidate) {
    return (
      <Box>
        <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />
        <Button startIcon={<BackIcon />} onClick={() => router.push('/dashboard/candidates')}>Volver a Postulantes</Button>
        <Typography color="text.secondary" textAlign="center" py={6}>No se encontró el postulante.</Typography>
      </Box>
    );
  }

  const applications = candidate.applications || [];
  const files = candidate.files || [];
  const hasOpenApplication = applications.some((a) => isOpenStage(a.stage));
  const canStartNewApplication = canWrite && !hasOpenApplication && !candidate.employee_id;
  const waLink = candidate.phone ? buildWhatsAppLink(candidate.phone, `Hola ${candidate.name}, te escribimos de Conmomet por tu postulación.`) : null;

  const stageDialogTitle = stageDialog
    ? stageDialog.target === 'screening' && !isOpenStage(stageDialog.application.stage)
      ? 'Reabrir postulación'
      : STAGE_ACTION_LABELS[stageDialog.target] || 'Cambiar etapa'
    : '';

  return (
    <Box>
      <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />
      <FeedbackModal open={!!success} onClose={() => setSuccess('')} message={success} type="success" />

      <Button startIcon={<BackIcon />} onClick={() => router.push('/dashboard/candidates')} sx={{ mb: 2 }}>Volver a Postulantes</Button>

      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h5" fontWeight="bold">{fullName(candidate)}</Typography>
          <Box display="flex" alignItems="center" gap={1} mt={0.5} flexWrap="wrap">
            <Chip label={CANDIDATE_SOURCE_LABELS[candidate.source]} variant="outlined" size="small" />
            {candidate.trade && <Typography variant="body2" color="text.secondary">{candidate.trade}</Typography>}
          </Box>
        </Box>
        <Box display="flex" gap={1} flexWrap="wrap">
          {canUpdate && <Button variant="outlined" startIcon={<EditIcon />} onClick={handleOpenEdit}>Editar datos</Button>}
          {canDelete && !candidate.employee_id && (
            <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => setDeleteOpen(true)}>Eliminar</Button>
          )}
        </Box>
      </Box>

      {/* Avisos de relación con empleados — se calculan al leer, por DNI/CUIL */}
      <Stack spacing={1} mb={2}>
        {candidate.employee && (
          <Alert severity="success">
            Ya fue dado de alta como empleado:{' '}
            <Link href={`/dashboard/employees/${candidate.employee.id}`}>{fullName(candidate.employee)}</Link>.
          </Alert>
        )}
        {candidate.current_employee && (
          <Alert severity="warning">
            Este DNI o CUIL ya pertenece a <strong>{fullName(candidate.current_employee)}</strong>, que es empleado actual.
          </Alert>
        )}
        {candidate.former_employee && (
          <Alert severity="warning">
            <strong>Ex-empleado:</strong> este DNI o CUIL pertenece a {fullName(candidate.former_employee)}
            {candidate.former_employee.termination_date ? `, que egresó el ${formatDate(candidate.former_employee.termination_date)}` : ''}.
            No se lo va a poder dar de alta como empleado desde acá: el reingreso se trata aparte.
          </Alert>
        )}
      </Stack>

      {/* Datos */}
      <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
        <Typography variant="h6" fontWeight="bold" mb={2}>Datos</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
          <DataRow label="DNI">{candidate.dni}</DataRow>
          <DataRow label="CUIL">{candidate.cuil}</DataRow>
          <DataRow label="Fecha de nacimiento">{candidate.birth_date ? formatDate(candidate.birth_date) : null}</DataRow>
          <DataRow label="Teléfono">
            {candidate.phone && (
              <Box display="flex" alignItems="center" gap={0.5}>
                {candidate.phone}
                {waLink && (
                  <Tooltip title="Escribir por WhatsApp">
                    <IconButton size="small" color="success" component="a" href={waLink} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                      <WhatsAppIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            )}
          </DataRow>
          <DataRow label="Email">{candidate.email}</DataRow>
          <DataRow label="Localidad">{candidate.locality}</DataRow>
          <DataRow label="Dirección">{candidate.address}</DataRow>
          <DataRow label="Oficio o puesto de interés">{candidate.trade}</DataRow>
          <DataRow label="Categoría">{candidate.category?.name}</DataRow>
          <DataRow label="Años de experiencia">{candidate.years_experience !== null && candidate.years_experience !== undefined ? String(candidate.years_experience) : null}</DataRow>
          <DataRow label="Registro de conducir">{candidate.has_driver_license ? 'Sí' : 'No'}</DataRow>
          <DataRow label="Recomendado por">{candidate.referredBy ? fullName(candidate.referredBy) : null}</DataRow>
          <DataRow label="Cargado">
            {formatDate(candidate.createdAt)}{candidate.createdByUser ? ` por ${fullName(candidate.createdByUser)}` : ''}
          </DataRow>
        </Box>
        {candidate.notes && (
          <Box mt={2}>
            <Typography variant="caption" color="text.secondary">Notas</Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{candidate.notes}</Typography>
          </Box>
        )}
      </Paper>

      {/* Postulaciones */}
      <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
          <Typography variant="h6" fontWeight="bold">Postulaciones</Typography>
          {canStartNewApplication && (
            <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => { setNewPosition(candidate.trade || ''); setNewCover(''); setNewAppOpen(true); }}>
              Nueva postulación
            </Button>
          )}
        </Box>
        {applications.length === 0 ? (
          <Typography color="text.secondary">Todavía no tiene postulaciones.</Typography>
        ) : (
          <Stack spacing={2}>
            {applications.map((application) => {
              const { label, color } = CANDIDATE_STAGE_LABELS[application.stage];
              const targets = CANDIDATE_TRANSITIONS[application.stage];
              return (
                <Card key={application.id} sx={{ p: 2, borderRadius: 2 }} variant="outlined">
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1} flexWrap="wrap">
                    <Box minWidth={0}>
                      <Typography variant="subtitle2" fontWeight="bold">{application.position_of_interest || 'Postulación espontánea'}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(application.applied_at)} · {CANDIDATE_SOURCE_LABELS[application.source]}
                      </Typography>
                    </Box>
                    <Chip label={label} color={color} size="small" />
                  </Box>
                  {application.cover_letter && (
                    <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>{application.cover_letter}</Typography>
                  )}
                  {application.stage === 'rejected' && (
                    <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                      Motivo: {application.rejection_reason ? CANDIDATE_REJECTION_LABELS[application.rejection_reason] : '—'}
                      {application.rejection_notes ? ` — ${application.rejection_notes}` : ''}
                    </Typography>
                  )}
                  {canUpdate && targets.length > 0 && (
                    <Box display="flex" gap={1} mt={2} flexWrap="wrap">
                      {targets.map((target) => (
                        <Button
                          key={target}
                          size="small"
                          variant={target === 'rejected' || target === 'withdrawn' ? 'outlined' : 'contained'}
                          color={target === 'rejected' ? 'error' : 'primary'}
                          onClick={() => openStageDialog(application, target)}
                        >
                          {!isOpenStage(application.stage) ? 'Reabrir' : STAGE_ACTION_LABELS[target]}
                        </Button>
                      ))}
                    </Box>
                  )}
                </Card>
              );
            })}
          </Stack>
        )}
      </Paper>

      {/* Papeles */}
      <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
          <Typography variant="h6" fontWeight="bold">Papeles</Typography>
          {canWrite && (
            <Button size="small" variant="outlined" startIcon={<AttachIcon />} onClick={() => { setNewFiles([]); setAddFilesOpen(true); }}>
              Agregar archivos
            </Button>
          )}
        </Box>
        {files.length === 0 ? (
          <Typography color="text.secondary">No hay archivos cargados.</Typography>
        ) : (
          <Stack spacing={1.5} divider={<Divider flexItem />}>
            {files.map((file) => (
              <Box key={file.id} display="flex" alignItems="center" gap={1} flexWrap="wrap">
                <Chip label={CANDIDATE_FILE_KIND_LABELS[file.kind]} size="small" variant="outlined" />
                <Box flex={1} minWidth={140}>
                  <Link {...fileLinkProps(file.file_url, file.file_name || undefined)} underline="hover">{file.file_name || 'Archivo'}</Link>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {formatSize(file.size_bytes)}{file.uploader ? ` · subido por ${fullName(file.uploader)}` : ' · enviado por el postulante'}
                  </Typography>
                </Box>
                {canDelete && (
                  <Tooltip title="Eliminar archivo">
                    <IconButton size="small" color="error" onClick={() => setRemoveFileId(file.id)} aria-label="Eliminar archivo"><DeleteIcon fontSize="small" /></IconButton>
                  </Tooltip>
                )}
              </Box>
            ))}
          </Stack>
        )}
      </Paper>

      {/* Historial */}
      <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <HistoryIcon color="action" />
          <Typography variant="h6" fontWeight="bold">Historial</Typography>
        </Box>
        {history.length === 0 ? (
          <Typography color="text.secondary">Sin movimientos todavía.</Typography>
        ) : (
          <Stack spacing={1.5}>
            {history.map((entry) => (
              <Box key={entry.id}>
                <Typography variant="body2" fontWeight={600}>
                  {EVENT_LABELS[entry.event] || entry.event}
                  {entry.from_stage && entry.to_stage && (
                    <Typography component="span" variant="body2" color="text.secondary">
                      {' '}· {CANDIDATE_STAGE_LABELS[entry.from_stage]?.label} → {CANDIDATE_STAGE_LABELS[entry.to_stage]?.label}
                    </Typography>
                  )}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {formatDateTime(entry.at)} · {entry.actor ? fullName(entry.actor) : 'El postulante'}
                  {entry.position_of_interest ? ` · ${entry.position_of_interest}` : ''}
                </Typography>
                {entry.comment && <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{entry.comment}</Typography>}
              </Box>
            ))}
          </Stack>
        )}
      </Paper>

      {/* Editar datos */}
      <AppDialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="md" fullWidth fullScreen={isMobile}>
        <DialogTitle>Editar datos</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <CandidateDuplicateAlerts dni={form.dni} cuil={form.cuil} email={form.email} phone={form.phone} excludeId={candidate.id} />
            <CandidateFormFields
              values={form}
              onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
              categories={categories}
              forceShowError={submitAttempted}
              showSource={candidate.source !== 'web'}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)} disabled={processing}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveEdit} disabled={processing}>
            {processing ? <GearSpinner size={20} /> : 'Guardar'}
          </Button>
        </DialogActions>
      </AppDialog>

      {/* Cambiar etapa */}
      <AppDialog open={!!stageDialog} onClose={() => setStageDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{stageDialogTitle}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {stageDialog?.target === 'rejected' && (
              <TextField select label="Motivo del rechazo *" fullWidth value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value as CandidateRejectionReason)}>
                {CANDIDATE_REJECTION_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </TextField>
            )}
            <TextField
              label={stageDialog?.target === 'rejected' ? 'Detalle (opcional)' : 'Comentario (opcional)'}
              fullWidth
              multiline
              rows={3}
              value={stageComment}
              onChange={(e) => setStageComment(e.target.value)}
              helperText="Queda en el historial."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStageDialog(null)} disabled={processing}>Cancelar</Button>
          <Button
            variant="contained"
            color={stageDialog?.target === 'rejected' ? 'error' : 'primary'}
            onClick={handleChangeStage}
            disabled={processing || (stageDialog?.target === 'rejected' && !rejectionReason)}
          >
            {processing ? <GearSpinner size={20} /> : 'Confirmar'}
          </Button>
        </DialogActions>
      </AppDialog>

      {/* Nueva postulación */}
      <AppDialog open={newAppOpen} onClose={() => setNewAppOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nueva postulación</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Puesto al que se postula" fullWidth value={newPosition} onChange={(e) => setNewPosition(e.target.value)} />
            <TextField label="Carta o comentario" fullWidth multiline rows={3} value={newCover} onChange={(e) => setNewCover(e.target.value)} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewAppOpen(false)} disabled={processing}>Cancelar</Button>
          <Button variant="contained" onClick={handleNewApplication} disabled={processing}>
            {processing ? <GearSpinner size={20} /> : 'Crear'}
          </Button>
        </DialogActions>
      </AppDialog>

      {/* Agregar archivos */}
      <AppDialog open={addFilesOpen} onClose={() => setAddFilesOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Agregar archivos</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <CandidateFilePicker files={newFiles} onChange={setNewFiles} onError={setError} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddFilesOpen(false)} disabled={processing}>Cancelar</Button>
          <Button variant="contained" onClick={handleAddFiles} disabled={processing || newFiles.length === 0}>
            {processing ? <GearSpinner size={20} /> : 'Subir'}
          </Button>
        </DialogActions>
      </AppDialog>

      {/* Confirmar baja de un archivo */}
      <AppDialog open={removeFileId !== null} onClose={() => setRemoveFileId(null)}>
        <DialogTitle>Eliminar archivo</DialogTitle>
        <DialogContent><Typography>¿Eliminar este archivo? No se puede deshacer.</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setRemoveFileId(null)} disabled={processing}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={handleRemoveFile} disabled={processing}>Eliminar</Button>
        </DialogActions>
      </AppDialog>

      {/* Confirmar eliminación del postulante */}
      <AppDialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Eliminar postulante</DialogTitle>
        <DialogContent>
          <Typography>¿Eliminar a <strong>{fullName(candidate)}</strong>?</Typography>
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            Se borran de forma definitiva sus datos, sus postulaciones, el historial y todos sus archivos. No se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)} disabled={processing}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={processing}>Eliminar definitivamente</Button>
        </DialogActions>
      </AppDialog>
    </Box>
  );
}
