'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Chip, DialogActions, DialogContent, DialogTitle, Divider, IconButton,
  Link, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField,
  Tooltip, Typography,
} from '@mui/material';
import { useFileViewer } from '@/components/common/FileViewer';
import CloudUploadIcon from '@mui/icons-material/CloudUploadOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import EditIcon from '@mui/icons-material/EditOutlined';
import VisibilityIcon from '@mui/icons-material/VisibilityOutlined';
import dayjs from 'dayjs';
import AppDialog from '@/components/common/AppDialog';
import DateField from '@/components/DateField';
import GearSpinner from '@/components/GearSpinner';
import TerminationFormDialog from '@/components/employees/TerminationFormDialog';
import TerminationCalculationCard from '@/components/employees/TerminationCalculationCard';
import TerminationFinalPayrollCard from '@/components/employees/TerminationFinalPayrollCard';
import TerminationDebtCard from '@/components/employees/TerminationDebtCard';
import TerminationAgreementCard from '@/components/employees/TerminationAgreementCard';
import {
  Employee, EmployeeTermination, EmployeeTerminationService, LookupDocumentCategory, LookupService,
  TerminationDocument, TerminationStatus, TERMINATION_STATUS_LABELS, TERMINATION_TYPE_LABELS,
} from '@/utils/api';

const STATUS_COLORS: Record<TerminationStatus, 'default' | 'warning' | 'info' | 'success' | 'error'> = {
  draft: 'warning',
  confirmed: 'info',
  settled: 'success',
  cancelled: 'default',
};

const fmt = (d?: string | null) => (d ? dayjs(d).format('DD/MM/YYYY') : '—');

interface Props {
  employee: Employee;
  terminations: EmployeeTermination[];
  canWrite: boolean;
  canConfirm: boolean;
  canSeeAmounts: boolean;
  onChanged: () => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

export default function EmployeeTerminationPanel({
  employee, terminations, canWrite, canConfirm, canSeeAmounts, onChanged, onError, onSuccess,
}: Props) {
  const { fileLinkProps } = useFileViewer();
  const current = terminations.find((t) => t.status !== 'cancelled') || null;
  const cancelled = terminations.filter((t) => t.status === 'cancelled');

  const [detail, setDetail] = useState<EmployeeTermination | null>(null);
  const [loading, setLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [art80Open, setArt80Open] = useState(false);
  const [art80Date, setArt80Date] = useState('');
  const [docOpen, setDocOpen] = useState(false);
  const [docForm, setDocForm] = useState({ title: '', notes: '', categoryId: '' as number | '' });
  const [docFile, setDocFile] = useState<File | null>(null);
  const [categories, setCategories] = useState<LookupDocumentCategory[]>([]);
  const [busy, setBusy] = useState(false);

  const currentId = current?.id;
  const load = useCallback(async () => {
    if (!currentId) {
      setDetail(null);
      return;
    }
    setLoading(true);
    try {
      setDetail(await EmployeeTerminationService.getById(currentId));
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Error al cargar el egreso');
    } finally {
      setLoading(false);
    }
    // onError cambia de identidad en cada render del padre; solo recargamos cuando cambia el egreso.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId]);

  useEffect(() => { load(); }, [load, current?.status]);

  const run = async (action: () => Promise<unknown>, successMessage: string, after?: () => void) => {
    setBusy(true);
    try {
      await action();
      after?.();
      onSuccess(successMessage);
      onChanged();
      await load();
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setBusy(false);
    }
  };

  const openDocDialog = () => {
    setDocForm({ title: '', notes: '', categoryId: '' });
    setDocFile(null);
    LookupService.getEmployeeDocumentCategories().then(setCategories).catch(() => setCategories([]));
    setDocOpen(true);
  };

  if (!current) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography color="text.secondary">
          No hay egresos cargados.{cancelled.length > 0 ? ' Hay egresos anulados en el historial.' : ''}
        </Typography>
        {cancelled.length > 0 && <CancelledList items={cancelled} />}
      </Paper>
    );
  }

  const t = detail || current;
  const docs: TerminationDocument[] = detail?.documents || [];
  const warnings = detail?.warnings || [];
  const blockers = detail?.confirm_blockers || [];
  const isDraft = t.status === 'draft';
  const canCancel = canConfirm && (t.status === 'draft' || t.status === 'confirmed');

  return (
    <Stack spacing={3}>
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2} mb={2}>
            <Box>
              <Typography variant="h6" fontWeight={600}>{TERMINATION_TYPE_LABELS[t.type]}</Typography>
              <Box mt={0.5}>
                <Chip size="small" color={STATUS_COLORS[t.status]} label={TERMINATION_STATUS_LABELS[t.status]} />
              </Box>
            </Box>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {isDraft && canWrite && (
                <Button startIcon={<EditIcon />} variant="outlined" onClick={() => setEditOpen(true)} disabled={busy}>Editar</Button>
              )}
              {isDraft && canConfirm && (
                <Button variant="contained" onClick={() => setConfirmOpen(true)} disabled={busy || blockers.length > 0}>
                  Confirmar egreso
                </Button>
              )}
              {canCancel && (
                <Button color="error" variant="outlined" onClick={() => { setCancelReason(''); setCancelOpen(true); }} disabled={busy}>
                  Anular egreso
                </Button>
              )}
            </Stack>
          </Box>
          <Divider sx={{ mb: 2 }} />

          <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={2}>
            <Field label="Último día de la relación laboral" value={fmt(t.termination_date)} />
            <Field label="Fecha de la comunicación" value={fmt(t.notice_date)} />
            {t.type === 'resignation' && (
              <Field label="Preaviso del empleado" value={t.employee_notice_omitted ? 'No dio los 15 días' : 'Cumplido'} />
            )}
            {t.type === 'dismissal_without_cause' && (
              <Field
                label="Preaviso de la empresa"
                value={t.notice_given === 'none' ? 'Sin preaviso' : `${t.notice_given === 'full' ? 'Completo' : 'Parcial'} (${fmt(t.notice_start_date)} – ${fmt(t.notice_end_date)})`}
              />
            )}
            {canSeeAmounts && t.cct_cap_amount != null && (
              <Field label="Tope del convenio (art. 245)" value={`$${Number(t.cct_cap_amount).toLocaleString('es-AR')}`} />
            )}
            {t.cause_description && <Field label="Causa" value={t.cause_description} wide />}
            {t.notes && <Field label="Notas" value={t.notes} wide />}
            {t.createdBy && <Field label="Cargado por" value={`${t.createdBy.name} ${t.createdBy.lastname}`} />}
            {t.confirmedBy && <Field label="Confirmado por" value={`${t.confirmedBy.name} ${t.confirmedBy.lastname} (${fmt(t.confirmed_at)})`} />}
          </Box>
        </CardContent>
      </Card>

      {isDraft && blockers.map((b) => <Alert key={b} severity="info">{b}</Alert>)}
      {warnings.map((w) => <Alert key={w.code} severity="warning">{w.message}</Alert>)}
      {t.status === 'confirmed' && (
        <Alert severity="info">
          El empleado quedó inactivo y ya no entra en las quincenas. Sus haberes del período en curso, el aguinaldo, las
          vacaciones y la indemnización se pagan con la <strong>liquidación final</strong> (más abajo), que se genera desde acá,
          se confirma y se paga: al pagarla se corta su acceso al portal.
        </Alert>
      )}

      {canSeeAmounts && t.status !== 'cancelled' && <TerminationCalculationCard terminationId={t.id} />}

      {canSeeAmounts && detail && (t.status === 'confirmed' || t.status === 'settled') && (
        <TerminationFinalPayrollCard termination={detail} onChanged={() => { onChanged(); load(); }} onError={onError} onSuccess={onSuccess} />
      )}
      {canSeeAmounts && detail && (t.status === 'confirmed' || t.status === 'settled') && (
        <TerminationAgreementCard termination={detail} onChanged={() => { onChanged(); load(); }} onError={onError} onSuccess={onSuccess} />
      )}
      {canSeeAmounts && detail && (t.status === 'confirmed' || t.status === 'settled') && (
        <TerminationDebtCard termination={detail} canConfirm={canConfirm} onChanged={() => { onChanged(); load(); }} onError={onError} onSuccess={onSuccess} />
      )}

      {t.status !== 'draft' && t.status !== 'cancelled' && (
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} mb={2}>Plazos legales</Typography>
            <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={2}>
              <Field label="Pago de la liquidación final (4 días hábiles, arts. 128 y 255 bis)" value={`hasta el ${fmt(detail?.payment_deadline)}`} />
              <Box>
                <Typography variant="caption" color="text.secondary">Certificado de trabajo (art. 80, 30 días)</Typography>
                <Typography variant="body1">
                  {t.art80_delivered_at ? `Entregado el ${fmt(t.art80_delivered_at)}` : `Entregar hasta el ${fmt(detail?.art80_deadline)}`}
                </Typography>
                {canWrite && (
                  <Button size="small" sx={{ mt: 0.5 }} onClick={() => { setArt80Date(t.art80_delivered_at || dayjs().format('YYYY-MM-DD')); setArt80Open(true); }}>
                    {t.art80_delivered_at ? 'Cambiar fecha de entrega' : 'Marcar como entregado'}
                  </Button>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} gap={2} flexWrap="wrap">
            <Typography variant="h6" fontWeight={600}>Documentos del egreso</Typography>
            {canWrite && (
              <Button variant="contained" startIcon={<CloudUploadIcon />} onClick={openDocDialog}>Cargar documento</Button>
            )}
          </Box>

          {loading && !detail ? (
            <Box display="flex" justifyContent="center" py={3}><GearSpinner /></Box>
          ) : (
            <>
              {/* Mobile Cards */}
              <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                {docs.length === 0 ? (
                  <Typography color="text.secondary" textAlign="center" py={4}>No hay documentos cargados</Typography>
                ) : (
                  <Stack spacing={2}>
                    {docs.map((doc) => (
                      <Card key={doc.id} sx={{ p: 2, borderRadius: 2 }}>
                        <Typography fontWeight={600}>{doc.title}</Typography>
                        <Typography variant="body2" color="text.secondary">{doc.category_name || 'Sin categoría'}</Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {fmt(doc.created_at)}{doc.uploader ? ` · ${doc.uploader.name} ${doc.uploader.lastname}` : ''}
                        </Typography>
                        {doc.notes && <Typography variant="body2" mt={0.5}>{doc.notes}</Typography>}
                        <Stack direction="row" spacing={1} mt={1}>
                          {doc.file_url && (
                            <Button size="small" startIcon={<VisibilityIcon />} {...fileLinkProps(doc.file_url)}>Ver archivo</Button>
                          )}
                          {canWrite && (
                            <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => deleteDoc(doc)} disabled={busy}>Eliminar</Button>
                          )}
                        </Stack>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Box>

              {/* Desktop Table */}
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <TableContainer component={Paper} elevation={0} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell><strong>Documento</strong></TableCell>
                        <TableCell><strong>Categoría</strong></TableCell>
                        <TableCell><strong>Cargado</strong></TableCell>
                        <TableCell><strong>Notas</strong></TableCell>
                        <TableCell align="center"><strong>Acciones</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {docs.length === 0 ? (
                        <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}><Typography color="text.secondary">No hay documentos cargados</Typography></TableCell></TableRow>
                      ) : docs.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell>{doc.title}</TableCell>
                          <TableCell>{doc.category_name || '—'}</TableCell>
                          <TableCell>{fmt(doc.created_at)}{doc.uploader ? ` · ${doc.uploader.name} ${doc.uploader.lastname}` : ''}</TableCell>
                          <TableCell>{doc.notes || '—'}</TableCell>
                          <TableCell align="center">
                            {doc.file_url && (
                              <Tooltip title="Ver archivo">
                                <IconButton size="small" component={Link} {...fileLinkProps(doc.file_url)}><VisibilityIcon fontSize="small" /></IconButton>
                              </Tooltip>
                            )}
                            {canWrite && (
                              <Tooltip title="Eliminar">
                                <IconButton size="small" color="error" onClick={() => deleteDoc(doc)} disabled={busy}><DeleteIcon fontSize="small" /></IconButton>
                              </Tooltip>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {cancelled.length > 0 && <CancelledList items={cancelled} />}

      <TerminationFormDialog
        open={editOpen}
        employee={employee}
        termination={t}
        canSeeAmounts={canSeeAmounts}
        onClose={() => setEditOpen(false)}
        onSaved={() => { setEditOpen(false); onSuccess('Egreso actualizado.'); onChanged(); load(); }}
        onError={onError}
      />

      <AppDialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirmar egreso</DialogTitle>
        <DialogContent>
          <Typography>
            {employee.lastname}, {employee.name} pasa a <strong>inactivo</strong> con último día {fmt(t.termination_date)}. Desde ahí no se le
            pueden cargar horas posteriores, adelantos ni préstamos, y deja de entrar en las quincenas.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={busy}>Volver</Button>
          <Button
            variant="contained"
            disabled={busy}
            onClick={() => run(() => EmployeeTerminationService.confirm(t.id), 'Egreso confirmado.', () => setConfirmOpen(false))}
          >
            Confirmar
          </Button>
        </DialogActions>
      </AppDialog>

      <AppDialog open={cancelOpen} onClose={() => setCancelOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Anular egreso</DialogTitle>
        <DialogContent>
          <Typography mb={2}>
            {t.status === 'confirmed'
              ? 'El empleado vuelve a estar activo y se borra la fecha de egreso. Los documentos quedan en el legajo.'
              : 'El borrador queda anulado. Los documentos quedan en el legajo.'}
          </Typography>
          <TextField
            label="Motivo de la anulación"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            multiline
            minRows={2}
            fullWidth
            required
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelOpen(false)} disabled={busy}>Volver</Button>
          <Button
            color="error"
            variant="contained"
            disabled={busy || !cancelReason.trim()}
            onClick={() => run(() => EmployeeTerminationService.cancel(t.id, cancelReason.trim()), 'Egreso anulado.', () => setCancelOpen(false))}
          >
            Anular egreso
          </Button>
        </DialogActions>
      </AppDialog>

      <AppDialog open={art80Open} onClose={() => setArt80Open(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Certificado de trabajo (art. 80)</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box pt={1}>
            <DateField label="Fecha de entrega" value={art80Date} onChange={setArt80Date} fullWidth />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setArt80Open(false)} disabled={busy}>Volver</Button>
          <Button
            variant="contained"
            disabled={busy || !art80Date}
            onClick={() => run(() => EmployeeTerminationService.update(t.id, { art80_delivered_at: art80Date }), 'Entrega registrada.', () => setArt80Open(false))}
          >
            Guardar
          </Button>
        </DialogActions>
      </AppDialog>

      <AppDialog open={docOpen} onClose={() => setDocOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Cargar documento del egreso</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} pt={1}>
            <TextField label="Título" value={docForm.title} onChange={(e) => setDocForm({ ...docForm, title: e.target.value })} fullWidth required />
            <TextField
              select
              label="Categoría"
              value={docForm.categoryId}
              onChange={(e) => setDocForm({ ...docForm, categoryId: e.target.value === '' ? '' : Number(e.target.value) })}
              fullWidth
            >
              <MenuItem value="">Sin categoría</MenuItem>
              {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </TextField>
            <TextField label="Notas" value={docForm.notes} onChange={(e) => setDocForm({ ...docForm, notes: e.target.value })} multiline minRows={2} fullWidth />
            <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />}>
              {docFile ? docFile.name : 'Elegir archivo'}
              <input type="file" hidden onChange={(e) => setDocFile(e.target.files?.[0] || null)} />
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDocOpen(false)} disabled={busy}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={busy || !docFile || !docForm.title.trim()}
            onClick={() =>
              run(
                () => EmployeeTerminationService.uploadDocument(t.id, { title: docForm.title.trim(), notes: docForm.notes, document_category_id: docForm.categoryId || null }, docFile as File),
                'Documento cargado.',
                () => setDocOpen(false)
              )
            }
          >
            {busy ? 'Subiendo...' : 'Cargar'}
          </Button>
        </DialogActions>
      </AppDialog>
    </Stack>
  );

  function deleteDoc(doc: TerminationDocument) {
    if (!window.confirm(`¿Eliminar "${doc.title}"?`)) return;
    run(() => EmployeeTerminationService.deleteDocument(t.id, doc.id), 'Documento eliminado.');
  }
}

function Field({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <Box sx={{ gridColumn: wide ? { sm: '1 / -1' } : undefined }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{value}</Typography>
    </Box>
  );
}

function CancelledList({ items }: { items: EmployeeTermination[] }) {
  return (
    <Box mt={2}>
      <Typography variant="subtitle2" color="text.secondary" mb={1}>Egresos anulados</Typography>
      <Stack spacing={1}>
        {items.map((c) => (
          <Card key={c.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
            <Typography variant="body2" fontWeight={600}>
              {TERMINATION_TYPE_LABELS[c.type]} — último día {fmt(c.termination_date)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Anulado el {fmt(c.cancelled_at)}{c.cancellation_reason ? `: ${c.cancellation_reason}` : ''}
            </Typography>
          </Card>
        ))}
      </Stack>
    </Box>
  );
}
