'use client';
import React, { useEffect, useState } from 'react';
import {
  Autocomplete, Box, Button, Card, Chip, DialogActions, DialogContent, DialogTitle, MenuItem, Paper, Rating,
  Stack, TextField, Typography,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs, { Dayjs } from 'dayjs';
import AppDialog from '@/components/common/AppDialog';
import GearSpinner from '../GearSpinner';
import { AddOutlined as AddIcon, WhatsApp as WhatsAppIcon } from '@mui/icons-material';
import {
  Candidate, CandidateInterview, CandidateInterviewService, InterviewModality, InterviewRecommendation,
} from '../../utils/api';
import { buildWhatsAppLink } from '../../utils/whatsapp';
import {
  INTERVIEW_MODALITY_LABELS, INTERVIEW_RECOMMENDATION_LABELS, INTERVIEW_STATUS_LABELS, formatInterviewWhen, fullName,
} from '../../utils/candidates';

interface Props {
  candidate: Candidate;
  canWrite: boolean; // agendar
  canUpdate: boolean; // reprogramar, cancelar, cargar el resultado
  hasOpenApplication: boolean;
  // Aviso de éxito + recarga de la ficha.
  onChanged: (message: string) => Promise<void> | void;
  onError: (message: string) => void;
}

type Interviewer = { id: number; name: string; lastname: string };

interface FormState {
  when: Dayjs | null;
  duration: string;
  modality: InterviewModality;
  location: string;
  interviewers: Interviewer[];
}

const emptyForm = (): FormState => ({ when: dayjs().add(1, 'day').hour(10).minute(0).second(0), duration: '60', modality: 'in_person', location: '', interviewers: [] });

// El texto que se le manda al postulante por WhatsApp (lo envía quien aprieta "enviar", no el sistema).
function whatsappText(candidate: Candidate, interview: CandidateInterview): string {
  const date = new Date(interview.scheduled_at);
  const day = date.toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', weekday: 'long', day: 'numeric', month: 'long' });
  const time = date.toLocaleTimeString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', hour: '2-digit', minute: '2-digit' });
  const where = interview.location ? (interview.modality === 'video' ? ` Link: ${interview.location}.` : ` Lugar: ${interview.location}.`) : '';
  return `Hola ${candidate.name}, te esperamos en Conmomet para la entrevista el ${day} a las ${time} hs (${INTERVIEW_MODALITY_LABELS[interview.modality].toLowerCase()}).${where} Avisanos si no podés asistir.`;
}

// Entrevistas del postulante (ver FLOWS.md §61): agendar, reprogramar, cancelar, cargar el resultado y avisar
// al postulante por WhatsApp.
export default function CandidateInterviewsSection({ candidate, canWrite, canUpdate, hasOpenApplication, onChanged, onError }: Props) {
  const interviews = candidate.interviews || [];
  const [processing, setProcessing] = useState(false);
  const [interviewers, setInterviewers] = useState<Interviewer[]>([]);

  const [scheduleDialog, setScheduleDialog] = useState<{ mode: 'create' | 'edit'; interview?: CandidateInterview } | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [resultDialog, setResultDialog] = useState<CandidateInterview | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [recommendation, setRecommendation] = useState<InterviewRecommendation | ''>('');
  const [feedback, setFeedback] = useState('');
  const [closeDialog, setCloseDialog] = useState<{ interview: CandidateInterview; status: 'cancelled' | 'no_show' } | null>(null);

  // El catálogo de entrevistadores solo hace falta al abrir el diálogo de agenda.
  useEffect(() => {
    if (!scheduleDialog || interviewers.length > 0) return;
    CandidateInterviewService.getInterviewers().then(setInterviewers).catch(() => setInterviewers([]));
  }, [scheduleDialog, interviewers.length]);

  const run = async (action: () => Promise<void>) => {
    try {
      setProcessing(true);
      await action();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Ocurrió un error');
    } finally {
      setProcessing(false);
    }
  };

  const openCreate = () => {
    setForm(emptyForm());
    setScheduleDialog({ mode: 'create' });
  };

  const openEdit = (interview: CandidateInterview) => {
    setForm({
      when: dayjs(interview.scheduled_at),
      duration: String(interview.duration_minutes),
      modality: interview.modality,
      location: interview.location || '',
      interviewers: interview.interviewers || [],
    });
    setScheduleDialog({ mode: 'edit', interview });
  };

  const formValid = !!form.when && form.when.isValid() && form.interviewers.length > 0 && Number(form.duration) >= 5;

  const handleSchedule = () => {
    if (!scheduleDialog || !formValid || !form.when) return;
    const values = {
      scheduled_at: form.when.toISOString(),
      duration_minutes: Number(form.duration),
      modality: form.modality,
      location: form.location,
      interviewer_ids: form.interviewers.map((u) => u.id),
    };
    run(async () => {
      if (scheduleDialog.mode === 'edit' && scheduleDialog.interview) {
        await CandidateInterviewService.update(candidate.id, scheduleDialog.interview.id, values);
      } else {
        await CandidateInterviewService.create(candidate.id, values);
      }
      const edited = scheduleDialog.mode === 'edit';
      setScheduleDialog(null);
      await onChanged(edited ? 'Entrevista actualizada.' : 'Entrevista agendada.');
    });
  };

  const openResult = (interview: CandidateInterview) => {
    setResultDialog(interview);
    setRating(interview.rating ?? null);
    setRecommendation(interview.recommendation ?? '');
    setFeedback(interview.feedback || '');
  };

  const handleResult = () => {
    if (!resultDialog || !rating || !recommendation) return;
    run(async () => {
      await CandidateInterviewService.saveResult(candidate.id, resultDialog.id, { rating, recommendation, feedback });
      setResultDialog(null);
      await onChanged('Resultado guardado.');
    });
  };

  const handleClose = () => {
    if (!closeDialog) return;
    run(async () => {
      await CandidateInterviewService.update(candidate.id, closeDialog.interview.id, { status: closeDialog.status });
      const message = closeDialog.status === 'no_show' ? 'Marcada como "no vino".' : 'Entrevista cancelada.';
      setCloseDialog(null);
      await onChanged(message);
    });
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Typography variant="h6" fontWeight="bold">Entrevistas</Typography>
        {canWrite && hasOpenApplication && (
          <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={openCreate}>Agendar entrevista</Button>
        )}
      </Box>

      {interviews.length === 0 ? (
        <Typography color="text.secondary">Todavía no hay entrevistas.</Typography>
      ) : (
        <Stack spacing={2}>
          {interviews.map((interview) => {
            const status = INTERVIEW_STATUS_LABELS[interview.status];
            const recommendationInfo = interview.recommendation ? INTERVIEW_RECOMMENDATION_LABELS[interview.recommendation] : null;
            return (
              <Card key={interview.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1} flexWrap="wrap">
                  <Box minWidth={0}>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ textTransform: 'capitalize' }}>{formatInterviewWhen(interview.scheduled_at)} hs</Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {interview.duration_minutes} min · {INTERVIEW_MODALITY_LABELS[interview.modality]}{interview.location ? ` · ${interview.location}` : ''}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Entrevista: {(interview.interviewers || []).map(fullName).join(', ') || '—'}
                    </Typography>
                  </Box>
                  <Chip label={status.label} color={status.color} size="small" />
                </Box>

                {interview.status === 'completed' && (
                  <Box sx={{ mt: 1.5 }}>
                    <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                      <Rating value={interview.rating ?? 0} readOnly size="small" />
                      {recommendationInfo && <Chip label={`Recomienda: ${recommendationInfo.label}`} color={recommendationInfo.color} size="small" variant="outlined" />}
                    </Box>
                    {interview.feedback && <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>{interview.feedback}</Typography>}
                  </Box>
                )}

                <Box display="flex" gap={1} mt={2} flexWrap="wrap">
                  {interview.status === 'scheduled' && candidate.phone && (
                    <Button size="small" color="success" startIcon={<WhatsAppIcon />} component="a" target="_blank" rel="noopener noreferrer"
                      href={buildWhatsAppLink(candidate.phone, whatsappText(candidate, interview))}>
                      Avisar por WhatsApp
                    </Button>
                  )}
                  {canUpdate && interview.status === 'scheduled' && (
                    <>
                      <Button size="small" variant="contained" onClick={() => openResult(interview)}>Cargar resultado</Button>
                      <Button size="small" onClick={() => openEdit(interview)}>Reprogramar</Button>
                      <Button size="small" onClick={() => setCloseDialog({ interview, status: 'no_show' })}>No vino</Button>
                      <Button size="small" color="error" onClick={() => setCloseDialog({ interview, status: 'cancelled' })}>Cancelar</Button>
                    </>
                  )}
                  {canUpdate && interview.status === 'completed' && (
                    <Button size="small" onClick={() => openResult(interview)}>Corregir resultado</Button>
                  )}
                </Box>
              </Card>
            );
          })}
        </Stack>
      )}

      {/* Agendar / reprogramar */}
      <AppDialog open={!!scheduleDialog} onClose={() => setScheduleDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{scheduleDialog?.mode === 'edit' ? 'Reprogramar entrevista' : 'Agendar entrevista'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <DateTimePicker
              label="Fecha y hora *"
              format="DD/MM/YYYY HH:mm"
              ampm={false}
              value={form.when}
              onChange={(value) => setForm((prev) => ({ ...prev, when: value }))}
              slotProps={{ textField: { fullWidth: true } }}
            />
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField label="Duración (minutos)" type="number" fullWidth value={form.duration} onChange={(e) => setForm((prev) => ({ ...prev, duration: e.target.value }))} inputProps={{ min: 5, max: 480 }} />
              <TextField label="Modalidad" select fullWidth value={form.modality} onChange={(e) => setForm((prev) => ({ ...prev, modality: e.target.value as InterviewModality }))}>
                {(Object.keys(INTERVIEW_MODALITY_LABELS) as InterviewModality[]).map((m) => <MenuItem key={m} value={m}>{INTERVIEW_MODALITY_LABELS[m]}</MenuItem>)}
              </TextField>
            </Box>
            <TextField
              label={form.modality === 'video' ? 'Link de la videollamada' : form.modality === 'phone' ? 'Teléfono o referencia' : 'Lugar'}
              fullWidth
              value={form.location}
              onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
            />
            <Autocomplete<Interviewer, true>
              multiple
              options={interviewers}
              value={form.interviewers}
              onChange={(_, value) => setForm((prev) => ({ ...prev, interviewers: value }))}
              getOptionLabel={(u) => fullName(u)}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              renderInput={(params) => <TextField {...params} label="Entrevistadores *" helperText="Reciben un aviso en la campanita." />}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleDialog(null)} disabled={processing}>Cancelar</Button>
          <Button variant="contained" onClick={handleSchedule} disabled={processing || !formValid}>
            {processing ? <GearSpinner size={20} /> : scheduleDialog?.mode === 'edit' ? 'Guardar' : 'Agendar'}
          </Button>
        </DialogActions>
      </AppDialog>

      {/* Resultado */}
      <AppDialog open={!!resultDialog} onClose={() => setResultDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Resultado de la entrevista</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">Puntaje *</Typography>
              <Rating value={rating} onChange={(_, value) => setRating(value)} size="large" />
            </Box>
            <TextField label="Recomendación *" select fullWidth value={recommendation} onChange={(e) => setRecommendation(e.target.value as InterviewRecommendation)}>
              {(Object.keys(INTERVIEW_RECOMMENDATION_LABELS) as InterviewRecommendation[]).map((r) => <MenuItem key={r} value={r}>{INTERVIEW_RECOMMENDATION_LABELS[r].label}</MenuItem>)}
            </TextField>
            <TextField label="Devolución" fullWidth multiline rows={4} value={feedback} onChange={(e) => setFeedback(e.target.value)}
              helperText="Cargar el resultado no cambia la etapa de la postulación: pasarla a oferta o rechazarla se hace aparte." />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResultDialog(null)} disabled={processing}>Cancelar</Button>
          <Button variant="contained" onClick={handleResult} disabled={processing || !rating || !recommendation}>
            {processing ? <GearSpinner size={20} /> : 'Guardar'}
          </Button>
        </DialogActions>
      </AppDialog>

      {/* Cancelar / no vino */}
      <AppDialog open={!!closeDialog} onClose={() => setCloseDialog(null)}>
        <DialogTitle>{closeDialog?.status === 'no_show' ? 'Marcar como "no vino"' : 'Cancelar entrevista'}</DialogTitle>
        <DialogContent>
          <Typography>
            {closeDialog?.status === 'no_show'
              ? 'El postulante no se presentó a la entrevista. Queda registrado en el historial.'
              : 'La entrevista deja de estar agendada. Queda registrado en el historial.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCloseDialog(null)} disabled={processing}>Volver</Button>
          <Button variant="contained" color="error" onClick={handleClose} disabled={processing}>Confirmar</Button>
        </DialogActions>
      </AppDialog>
    </Paper>
  );
}
