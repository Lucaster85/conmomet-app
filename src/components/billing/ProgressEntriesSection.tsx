'use client';
import React, { useEffect, useState } from 'react';
import {
  Alert, Box, Button, Card, Chip, DialogActions, DialogContent, DialogTitle, IconButton, InputAdornment, Link as MuiLink, MenuItem, Stack, TextField,
  Tooltip, Typography,
} from '@mui/material';
import { AddOutlined as AddIcon, DeleteOutline as DeleteIcon, EditOutlined as EditIcon, UploadFileOutlined as UploadIcon } from '@mui/icons-material';
import AppDialog from '@/components/common/AppDialog';
import FeedbackModal from '../FeedbackModal';
import { useFileViewer } from '@/components/common/FileViewer';
import DateField from '../DateField';
import { BillingDocsService, BudgetBillingDetail, BudgetProgressEntry, ProgressCertificateStatus, ProgressSource } from '../../utils/api';
import {
  BILLING_FILE_ACCEPT, formatDate, formatPercent, PROGRESS_SOURCE_LABELS, PROGRESS_STATUS_LABELS, todayISO, validateBillingFiles,
} from '../../utils/billing';

interface Props {
  detail: BudgetBillingDetail;
  canWrite: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  onChanged: (message: string, warnings?: string[]) => void;
  onError: (message: string) => void;
}

// Avance real de obra (FLOWS.md §72): una medición PARALELA a la de horas (no la modifica), cargada a mano o desde un certificado del cliente. Va en el
// detalle de facturación, al lado del avance por horas.
export default function ProgressEntriesSection({ detail, canWrite, canUpdate, canDelete, onChanged, onError }: Props) {
  const { fileLinkProps } = useFileViewer();
  const { budget, billing, progress_entries: entries } = detail;
  const real = billing.real_progress;

  const [dialog, setDialog] = useState<{ entry: BudgetProgressEntry | null } | null>(null);
  const [confirm, setConfirm] = useState<BudgetProgressEntry | null>(null);
  const [busy, setBusy] = useState(false);

  const handleDelete = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      await BillingDocsService.deleteProgress(confirm.id);
      setConfirm(null);
      onChanged('Avance eliminado');
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Error al eliminar el avance');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }} flexWrap="wrap" gap={1}>
        <Typography variant="h6" fontWeight={700}>Avance real de obra</Typography>
        {canWrite && <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => setDialog({ entry: null })}>Cargar avance</Button>}
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Es una medición aparte de la de horas: no la cambia. Se carga a mano o desde un certificado del cliente (el certificado cuenta cuando está aprobado).
      </Typography>

      {real ? (
        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap" sx={{ mb: 1.5 }}>
          <Typography variant="body1">
            Avance real vigente: <strong>{formatPercent(real.percent)}</strong>{' '}
            <Typography component="span" variant="body2" color="text.secondary">
              al {formatDate(real.date)} · {real.source === 'certificate' ? `certificado ${real.certificate_number}` : 'cargado a mano'}
            </Typography>
          </Typography>
          {billing.overbilled_vs_real && (
            <Tooltip title={`Se facturó ${formatPercent(billing.labor_billed_percent)} de la mano de obra y el avance real es ${formatPercent(real.percent)}.`}>
              <Chip size="small" color="warning" label="Facturado > avance real" />
            </Tooltip>
          )}
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>Todavía no hay avance real cargado.</Typography>
      )}

      <Stack spacing={1.5}>
        {entries.map((entry) => {
          const status = entry.status ? PROGRESS_STATUS_LABELS[entry.status] : null;
          return (
            <Card key={entry.id} sx={{ p: 2, borderRadius: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1} flexWrap="wrap">
                <Box>
                  <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                    <Typography variant="subtitle1" fontWeight={700}>{formatPercent(entry.percent)}</Typography>
                    <Typography variant="body2" color="text.secondary">{formatDate(entry.date)}</Typography>
                    <Chip size="small" variant="outlined" label={entry.source === 'certificate' ? `Certificado ${entry.certificate_number}` : PROGRESS_SOURCE_LABELS.manual} />
                    {status && <Chip size="small" color={status.color} label={status.label} />}
                    {!entry.counts && <Chip size="small" variant="outlined" label="No cuenta todavía" />}
                  </Box>
                  {entry.notes && <Typography variant="body2" sx={{ mt: 0.5 }}>{entry.notes}</Typography>}
                </Box>
                <Box display="flex" gap={0.5}>
                  {canUpdate && <Button size="small" startIcon={<EditIcon />} onClick={() => setDialog({ entry })}>Editar</Button>}
                  {canDelete && <IconButton size="small" aria-label="Eliminar avance" onClick={() => setConfirm(entry)}><DeleteIcon fontSize="small" /></IconButton>}
                </Box>
              </Box>
              {entry.files.length > 0 && (
                <Stack spacing={0.25} sx={{ mt: 1 }}>
                  {entry.files.map((file) => <MuiLink key={file.id} variant="body2" {...fileLinkProps(file.file_url, file.file_name)}>{file.file_name}</MuiLink>)}
                </Stack>
              )}
            </Card>
          );
        })}
      </Stack>

      <ProgressEntryDialog
        open={!!dialog} entry={dialog?.entry || null} budgetId={budget.id} onClose={() => setDialog(null)}
        onSaved={(message, warnings) => { setDialog(null); onChanged(message, warnings); }}
      />

      <AppDialog open={!!confirm} onClose={busy ? undefined : () => setConfirm(null)} fullWidth maxWidth="xs">
        <DialogTitle>Eliminar avance</DialogTitle>
        <DialogContent>
          <Typography variant="body2">¿Eliminar el avance del {confirm ? formatDate(confirm.date) : ''} ({confirm ? formatPercent(confirm.percent) : ''}) con sus archivos? No se puede deshacer.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm(null)} disabled={busy}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={busy}>Eliminar</Button>
        </DialogActions>
      </AppDialog>
    </Box>
  );
}

interface DialogProps {
  open: boolean;
  entry: BudgetProgressEntry | null;
  budgetId: number;
  onClose: () => void;
  onSaved: (message: string, warnings: string[]) => void;
}

function ProgressEntryDialog({ open, entry, budgetId, onClose, onSaved }: DialogProps) {
  const [date, setDate] = useState(todayISO());
  const [percent, setPercent] = useState('');
  const [source, setSource] = useState<ProgressSource>('manual');
  const [certificate, setCertificate] = useState('');
  const [status, setStatus] = useState<ProgressCertificateStatus>('presented');
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setDate(entry?.date ?? todayISO());
    setPercent(entry ? String(entry.percent) : '');
    setSource(entry?.source ?? 'manual');
    setCertificate(entry?.certificate_number ?? '');
    setStatus(entry?.status ?? 'presented');
    setNotes(entry?.notes ?? '');
    setFiles([]);
    setError('');
  }, [open, entry]);

  const handleSave = async () => {
    const value = Number(percent.replace(',', '.'));
    if (!date) { setError('Indicá la fecha.'); return; }
    if (!(value > 0 && value <= 100)) { setError('El avance tiene que estar entre 0 y 100%.'); return; }
    if (source === 'certificate' && !certificate.trim()) { setError('Indicá el número de certificado.'); return; }
    const filesError = validateBillingFiles(files);
    if (filesError) { setError(filesError); return; }

    const input = {
      budget_id: budgetId, date, percent: value, source, notes: notes.trim(),
      ...(source === 'certificate' ? { certificate_number: certificate.trim(), status } : {}),
      files,
    };
    setSaving(true);
    setError('');
    try {
      if (entry) {
        await BillingDocsService.updateProgress(entry.id, input);
        onSaved('Avance actualizado', []);
      } else {
        const { warnings } = await BillingDocsService.createProgress(input);
        onSaved('Avance cargado', warnings);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el avance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppDialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{entry ? 'Editar avance real' : 'Cargar avance real'}</DialogTitle>
      <DialogContent>
        <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Alert severity="info">El avance es <strong>acumulado</strong> (por ejemplo, 40% de la obra hasta la fecha). No puede ser menor que el de una medición anterior.</Alert>
          <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={2}>
            <DateField label="Fecha *" value={date} onChange={setDate} fullWidth />
            <TextField
              label="Avance acumulado *" value={percent} onChange={(e) => setPercent(e.target.value)} inputProps={{ inputMode: 'decimal' }}
              InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
            />
          </Box>
          <TextField select label="Origen" value={source} onChange={(e) => setSource(e.target.value as ProgressSource)} fullWidth>
            <MenuItem value="manual">Cargado a mano</MenuItem>
            <MenuItem value="certificate">Certificado del cliente</MenuItem>
          </TextField>
          {source === 'certificate' && (
            <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={2}>
              <TextField label="N° de certificado *" value={certificate} onChange={(e) => setCertificate(e.target.value)} inputProps={{ maxLength: 60 }} />
              <TextField
                select label="Estado" value={status} onChange={(e) => setStatus(e.target.value as ProgressCertificateStatus)}
                helperText="Solo cuenta como avance real cuando está aprobado."
              >
                {(Object.keys(PROGRESS_STATUS_LABELS) as ProgressCertificateStatus[]).map((s) => <MenuItem key={s} value={s}>{PROGRESS_STATUS_LABELS[s].label}</MenuItem>)}
              </TextField>
            </Box>
          )}
          <TextField label="Notas (opcional)" value={notes} onChange={(e) => setNotes(e.target.value)} fullWidth multiline minRows={2} />
          {!entry && (
            <Box>
              <Button component="label" variant="outlined" size="small" startIcon={<UploadIcon />}>
                {files.length ? `${files.length} archivo${files.length === 1 ? '' : 's'}` : 'Adjuntar certificado'}
                <input hidden multiple type="file" accept={BILLING_FILE_ACCEPT} onChange={(e) => { setFiles(Array.from(e.target.files || [])); e.target.value = ''; }} />
              </Button>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</Button>
      </DialogActions>
    </AppDialog>
  );
}
