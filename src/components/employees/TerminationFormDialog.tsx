'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, DialogActions, DialogContent, DialogTitle, FormControlLabel, IconButton, MenuItem,
  Radio, RadioGroup, Step, StepLabel, Stepper, Stack, Switch, TextField, Typography, Card, Divider,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUploadOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import dayjs from 'dayjs';
import AppDialog from '@/components/common/AppDialog';
import DateField from '@/components/DateField';
import CurrencyInput from '@/components/CurrencyInput';
import {
  Employee, EmployeeTermination, EmployeeTerminationService, LookupService, LookupDocumentCategory,
  TerminationFormData, TerminationNoticeGiven, TerminationType, TERMINATION_TYPE_LABELS,
} from '@/utils/api';

const TYPE_DESCRIPTIONS: Record<TerminationType, string> = {
  resignation: 'El empleado renuncia (art. 240). Solo es válida por telegrama o ante autoridad.',
  dismissal_with_cause: 'La empresa despide por una causa que tiene que constar por escrito (art. 242).',
  dismissal_without_cause: 'La empresa despide sin causa (art. 245): corresponde indemnización.',
  mutual_agreement: 'Retiro voluntario formalizado ante escribano o autoridad (art. 241).',
};

const SUGGESTED_DOCUMENT: Record<TerminationType, string | null> = {
  resignation: 'Telegrama de renuncia',
  dismissal_with_cause: 'Telegrama / carta documento de despido',
  dismissal_without_cause: 'Telegrama / carta documento de despido',
  mutual_agreement: 'Acta / escritura de mutuo acuerdo',
};

const STEPS = ['Tipo', 'Fechas y preaviso', 'Causa y notas', 'Documentos', 'Resumen'];

interface StagedDocument {
  title: string;
  categoryId: number | '';
  file: File;
}

interface Props {
  open: boolean;
  employee: Pick<Employee, 'id' | 'name' | 'lastname' | 'hire_date'>;
  /** Si viene, el diálogo edita ese borrador (el tipo no cambia y los documentos se cargan desde la pestaña). */
  termination?: EmployeeTermination | null;
  canSeeAmounts: boolean;
  onClose: () => void;
  onSaved: (termination: EmployeeTermination) => void;
  onError: (message: string) => void;
}

const emptyForm = (): TerminationFormData => ({
  type: 'resignation',
  termination_date: dayjs().format('YYYY-MM-DD'),
  notice_date: '',
  notice_given: 'none',
  notice_start_date: '',
  notice_end_date: '',
  cause_description: '',
  employee_notice_omitted: false,
  cct_cap_amount: null,
  notes: '',
});

export default function TerminationFormDialog({ open, employee, termination, canSeeAmounts, onClose, onSaved, onError }: Props) {
  const editing = !!termination;
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<TerminationFormData>(emptyForm());
  const [staged, setStaged] = useState<StagedDocument[]>([]);
  const [categories, setCategories] = useState<LookupDocumentCategory[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setStaged([]);
    if (termination) {
      setForm({
        type: termination.type,
        termination_date: termination.termination_date,
        notice_date: termination.notice_date || '',
        notice_given: termination.notice_given,
        notice_start_date: termination.notice_start_date || '',
        notice_end_date: termination.notice_end_date || '',
        cause_description: termination.cause_description || '',
        employee_notice_omitted: termination.employee_notice_omitted,
        cct_cap_amount: termination.cct_cap_amount != null ? Number(termination.cct_cap_amount) : null,
        notes: termination.notes || '',
      });
    } else {
      setForm(emptyForm());
    }
    LookupService.getEmployeeDocumentCategories().then(setCategories).catch(() => setCategories([]));
  }, [open, termination]);

  const set = <K extends keyof TerminationFormData>(key: K, value: TerminationFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const isDismissalWithoutCause = form.type === 'dismissal_without_cause';
  const showCap = canSeeAmounts && (isDismissalWithoutCause || form.type === 'mutual_agreement');
  const stepsToShow = editing ? STEPS.filter((s) => s !== 'Documentos') : STEPS;
  const currentLabel = stepsToShow[step];
  const lastStep = step === stepsToShow.length - 1;

  const stepError = useMemo(() => {
    if (currentLabel === 'Fechas y preaviso') {
      if (!form.termination_date) return 'La fecha de egreso es obligatoria.';
      if (employee.hire_date && form.termination_date < employee.hire_date) {
        return 'La fecha de egreso no puede ser anterior a la fecha de ingreso.';
      }
      if (
        isDismissalWithoutCause && form.notice_given !== 'none' && form.notice_start_date && form.notice_end_date
        && form.notice_end_date < form.notice_start_date
      ) {
        return 'El fin del preaviso no puede ser anterior a su inicio.';
      }
    }
    if (currentLabel === 'Causa y notas' && form.type === 'dismissal_with_cause' && !form.cause_description?.trim()) {
      return 'La causa del despido es obligatoria.';
    }
    return '';
  }, [currentLabel, form, employee.hire_date, isDismissalWithoutCause]);

  const buildPayload = (): TerminationFormData => ({
    ...form,
    notice_date: form.notice_date || null,
    notice_start_date: form.notice_start_date || null,
    notice_end_date: form.notice_end_date || null,
    cause_description: form.cause_description?.trim() || null,
    notes: form.notes?.trim() || null,
  });

  const handleAddFile = (file: File | undefined) => {
    if (!file) return;
    const suggestedName = SUGGESTED_DOCUMENT[form.type];
    const suggested = categories.find((c) => c.name === suggestedName);
    setStaged((prev) => [
      ...prev,
      { title: file.name.replace(/\.[^.]+$/, ''), categoryId: suggested && prev.length === 0 ? suggested.id : '', file },
    ]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let saved: EmployeeTermination;
      if (termination) {
        saved = await EmployeeTerminationService.update(termination.id, buildPayload());
      } else {
        saved = await EmployeeTerminationService.create({ ...buildPayload(), employee_id: employee.id });
        for (const doc of staged) {
          await EmployeeTerminationService.uploadDocument(
            saved.id,
            { title: doc.title || doc.file.name, document_category_id: doc.categoryId || null },
            doc.file
          );
        }
        saved = await EmployeeTerminationService.getById(saved.id);
      }
      onSaved(saved);
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Error al guardar el egreso');
    } finally {
      setSaving(false);
    }
  };

  const categoryName = (id: number | '') => categories.find((c) => c.id === id)?.name || 'Sin categoría';
  const fmt = (d?: string | null) => (d ? dayjs(d).format('DD/MM/YYYY') : '—');

  return (
    <AppDialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {editing ? 'Editar egreso' : 'Dar de baja'} — {employee.lastname}, {employee.name}
      </DialogTitle>
      <DialogContent>
        <Stepper activeStep={step} alternativeLabel sx={{ mb: 3, mt: 1, display: { xs: 'none', sm: 'flex' } }}>
          {stepsToShow.map((label) => (
            <Step key={label}><StepLabel>{label}</StepLabel></Step>
          ))}
        </Stepper>
        <Typography variant="subtitle2" color="text.secondary" sx={{ display: { xs: 'block', sm: 'none' }, mb: 2 }}>
          Paso {step + 1} de {stepsToShow.length}: {currentLabel}
        </Typography>

        {currentLabel === 'Tipo' && (
          <RadioGroup value={form.type} onChange={(e) => set('type', e.target.value as TerminationType)}>
            <Stack spacing={1.5}>
              {(Object.keys(TERMINATION_TYPE_LABELS) as TerminationType[]).map((type) => (
                <Card
                  key={type}
                  variant="outlined"
                  sx={{
                    p: 1.5, borderRadius: 2, cursor: editing ? 'default' : 'pointer',
                    borderColor: form.type === type ? 'primary.main' : 'divider',
                    opacity: editing && form.type !== type ? 0.5 : 1,
                  }}
                  onClick={() => { if (!editing) set('type', type); }}
                >
                  <FormControlLabel
                    value={type}
                    disabled={editing}
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography fontWeight={600}>{TERMINATION_TYPE_LABELS[type]}</Typography>
                        <Typography variant="body2" color="text.secondary">{TYPE_DESCRIPTIONS[type]}</Typography>
                      </Box>
                    }
                    sx={{ alignItems: 'flex-start', m: 0 }}
                  />
                </Card>
              ))}
            </Stack>
          </RadioGroup>
        )}

        {currentLabel === 'Fechas y preaviso' && (
          <Stack spacing={2.5}>
            <DateField
              label="Último día de la relación laboral"
              value={form.termination_date}
              onChange={(v) => set('termination_date', v)}
              fullWidth
              required
            />
            <DateField
              label="Fecha de la comunicación (telegrama)"
              value={form.notice_date}
              onChange={(v) => set('notice_date', v)}
              fullWidth
            />
            {form.type === 'resignation' && (
              <FormControlLabel
                control={<Switch checked={!!form.employee_notice_omitted} onChange={(e) => set('employee_notice_omitted', e.target.checked)} />}
                label="El empleado no dio los 15 días de preaviso"
              />
            )}
            {isDismissalWithoutCause && (
              <>
                <TextField
                  select
                  label="¿La empresa dio preaviso?"
                  value={form.notice_given}
                  onChange={(e) => set('notice_given', e.target.value as TerminationNoticeGiven)}
                  fullWidth
                >
                  <MenuItem value="none">No, sin preaviso</MenuItem>
                  <MenuItem value="full">Sí, completo</MenuItem>
                  <MenuItem value="partial">Sí, parcial</MenuItem>
                </TextField>
                {form.notice_given !== 'none' && (
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <DateField label="Inicio del preaviso" value={form.notice_start_date} onChange={(v) => set('notice_start_date', v)} fullWidth />
                    <DateField label="Fin del preaviso" value={form.notice_end_date} onChange={(v) => set('notice_end_date', v)} fullWidth />
                  </Stack>
                )}
              </>
            )}
            {showCap && (
              <CurrencyInput
                label="Tope del convenio (art. 245) — opcional"
                value={form.cct_cap_amount}
                onChange={(v) => set('cct_cap_amount', v)}
                helperText="3 × el promedio de remuneraciones del convenio aplicable. Se usa en el cálculo de la indemnización."
                fullWidth
              />
            )}
            {form.termination_date > dayjs().format('YYYY-MM-DD') && (
              <Alert severity="info">
                La fecha de egreso es futura. Podés guardar el borrador ahora, pero el egreso se confirma a partir de esa fecha:
                hasta entonces el empleado sigue activo.
              </Alert>
            )}
          </Stack>
        )}

        {currentLabel === 'Causa y notas' && (
          <Stack spacing={2.5}>
            <TextField
              label={form.type === 'dismissal_with_cause' ? 'Causa del despido (obligatoria)' : 'Motivo / causa (opcional)'}
              value={form.cause_description || ''}
              onChange={(e) => set('cause_description', e.target.value)}
              multiline
              minRows={3}
              fullWidth
              required={form.type === 'dismissal_with_cause'}
              helperText={form.type === 'dismissal_with_cause' ? 'Tiene que ser la misma que figura en la carta documento: no se puede cambiar después (art. 243).' : undefined}
            />
            <TextField
              label="Notas internas"
              value={form.notes || ''}
              onChange={(e) => set('notes', e.target.value)}
              multiline
              minRows={2}
              fullWidth
            />
          </Stack>
        )}

        {currentLabel === 'Documentos' && (
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Adjuntá los papeles que ya tengas
              {SUGGESTED_DOCUMENT[form.type] ? <> (conviene: <strong>{SUGGESTED_DOCUMENT[form.type]}</strong>)</> : null}.
              También se pueden cargar después desde la pestaña Egreso.
            </Typography>
            {staged.map((doc, idx) => (
              <Card key={idx} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                <Stack direction="row" spacing={1} alignItems="flex-start">
                  <Stack spacing={1.5} flex={1}>
                    <TextField
                      size="small"
                      label="Título"
                      value={doc.title}
                      onChange={(e) => setStaged((prev) => prev.map((d, i) => (i === idx ? { ...d, title: e.target.value } : d)))}
                      fullWidth
                    />
                    <TextField
                      size="small"
                      select
                      label="Categoría"
                      value={doc.categoryId}
                      onChange={(e) => setStaged((prev) => prev.map((d, i) => (i === idx ? { ...d, categoryId: e.target.value === '' ? '' : Number(e.target.value) } : d)))}
                      fullWidth
                    >
                      <MenuItem value="">Sin categoría</MenuItem>
                      {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                    </TextField>
                    <Typography variant="caption" color="text.secondary">{doc.file.name}</Typography>
                  </Stack>
                  <IconButton aria-label="Quitar" onClick={() => setStaged((prev) => prev.filter((_, i) => i !== idx))}>
                    <DeleteIcon />
                  </IconButton>
                </Stack>
              </Card>
            ))}
            <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />}>
              Agregar archivo
              <input
                type="file"
                hidden
                onChange={(e) => {
                  handleAddFile(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </Button>
          </Stack>
        )}

        {currentLabel === 'Resumen' && (
          <Stack spacing={1.5}>
            <Alert severity="info">
              Se carga como <strong>borrador</strong>: el empleado sigue activo hasta que se confirme el egreso.
            </Alert>
            <SummaryRow label="Tipo" value={TERMINATION_TYPE_LABELS[form.type]} />
            <SummaryRow label="Último día" value={fmt(form.termination_date)} />
            <SummaryRow label="Comunicación" value={fmt(form.notice_date)} />
            {form.type === 'resignation' && (
              <SummaryRow label="Preaviso del empleado" value={form.employee_notice_omitted ? 'No dio los 15 días' : 'Cumplido'} />
            )}
            {isDismissalWithoutCause && (
              <SummaryRow
                label="Preaviso de la empresa"
                value={form.notice_given === 'none' ? 'Sin preaviso' : `${form.notice_given === 'full' ? 'Completo' : 'Parcial'} (${fmt(form.notice_start_date)} – ${fmt(form.notice_end_date)})`}
              />
            )}
            {form.cause_description?.trim() && <SummaryRow label="Causa" value={form.cause_description.trim()} />}
            {!editing && (
              <>
                <Divider />
                <SummaryRow
                  label="Documentos"
                  value={staged.length === 0 ? 'Ninguno por ahora' : staged.map((d) => `${d.title} (${categoryName(d.categoryId)})`).join(', ')}
                />
              </>
            )}
          </Stack>
        )}

        {stepError && <Alert severity="warning" sx={{ mt: 2 }}>{stepError}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Box flex={1} />
        {step > 0 && <Button onClick={() => setStep(step - 1)} disabled={saving}>Atrás</Button>}
        {!lastStep ? (
          <Button variant="contained" onClick={() => setStep(step + 1)} disabled={!!stepError}>Siguiente</Button>
        ) : (
          <Button variant="contained" color="primary" onClick={handleSave} disabled={saving || !!stepError}>
            {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Cargar egreso'}
          </Button>
        )}
      </DialogActions>
    </AppDialog>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <Box display="flex" gap={2}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 150 }}>{label}</Typography>
      <Typography variant="body2" fontWeight={500} sx={{ whiteSpace: 'pre-wrap' }}>{value}</Typography>
    </Box>
  );
}
