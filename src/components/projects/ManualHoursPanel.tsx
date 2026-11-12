'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, Card, DialogActions, DialogContent, DialogTitle, MenuItem, Paper, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import AppDialog from '@/components/common/AppDialog';
import { AddOutlined as AddIcon } from '@mui/icons-material';
import GearSpinner from '../GearSpinner';
import FeedbackModal from '../FeedbackModal';
import { HourBucket, ManualHourEntry, ManualHoursService } from '../../utils/api';
import { useAuth, userHasPermission } from '../../utils/auth';

interface Props {
  projectId: number;
  // Bolsas de horas del proyecto/adicional: de ahí salen los rubros del formulario y cuánto queda en
  // cada uno. Sin budgets_read vienen sin `budgeted_hours` (solo se ve lo consumido).
  hourBuckets?: HourBucket[];
  projectStatus?: string;
  // El padre vuelve a pedir el proyecto/adicional para refrescar las barras de horas.
  onChanged: () => void;
}

const GENERAL = 'general';

interface RubroOption {
  key: string;
  typeId: number | null;
  name: string;
  budgeted?: number; // ausente si el usuario no puede ver lo presupuestado
  consumed: number;
}

const todayIso = () => new Date().toLocaleDateString('en-CA');

const formatDate = (iso?: string | null) => {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y.slice(2)}`;
};

const formatHours = (n: number) => `${n.toLocaleString('es-AR', { maximumFractionDigits: 2 })} hs`;

const personName = (p?: { name: string; lastname: string } | null) => (p ? `${p.lastname}, ${p.name}` : '—');

// Horas manuales de un proyecto o adicional (FLOWS.md §56): horas sin empleado, con un detalle, que
// descuentan de la bolsa del rubro. Sirven para registrar y estimar cuánto llevó realmente la obra;
// nunca tocan el presupuesto, las horas de empleados, la liquidación ni el costo de mano de obra.
// No se editan ni se borran: se anulan con motivo y quedan visibles, tachadas.
export default function ProjectManualHoursPanel({ projectId, hourBuckets, projectStatus, onChanged }: Props) {
  const { user } = useAuth();
  const canRead = userHasPermission(user, 'time_entries_read');
  const canWrite = userHasPermission(user, 'time_entries_write');
  const canVoid = userHasPermission(user, 'time_entries_update');
  const projectClosed = projectStatus === 'completed' || projectStatus === 'cancelled';

  const [entries, setEntries] = useState<ManualHourEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [bucketKey, setBucketKey] = useState(GENERAL);
  const [hours, setHours] = useState('');
  const [date, setDate] = useState(todayIso());
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const [voidTarget, setVoidTarget] = useState<ManualHourEntry | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [voiding, setVoiding] = useState(false);

  const load = useCallback(async () => {
    if (!canRead) { setLoading(false); return; }
    try {
      setLoading(true);
      setEntries(await ManualHoursService.list(projectId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al obtener las horas manuales');
    } finally {
      setLoading(false);
    }
  }, [projectId, canRead]);

  useEffect(() => { load(); }, [load]);

  // Rubros que se pueden elegir: las bolsas del proyecto + "Generales" (siempre disponible).
  const options = useMemo(() => {
    const list: RubroOption[] = (hourBuckets || []).map((b) => ({
      key: b.budget_item_type_id === null ? GENERAL : String(b.budget_item_type_id),
      typeId: b.budget_item_type_id,
      name: b.item_type_name,
      budgeted: b.budgeted_hours,
      consumed: b.consumed_hours,
    }));
    if (!list.some((o) => o.key === GENERAL)) {
      list.push({ key: GENERAL, typeId: null, name: 'Generales', consumed: 0 });
    }
    return list;
  }, [hourBuckets]);

  const selected = options.find((o) => o.key === bucketKey) || options[0];
  const hoursNumber = Number(hours);
  // Lo que queda en la bolsa (solo si hay horas presupuestadas y el usuario puede verlas).
  const budgeted = selected?.budgeted;
  const hasBudget = typeof budgeted === 'number' && budgeted > 0;
  const remaining = hasBudget ? budgeted - selected.consumed : null;
  const overBy = hasBudget && hoursNumber > 0 && selected.consumed + hoursNumber > budgeted
    ? selected.consumed + hoursNumber - budgeted
    : 0;

  const openForm = () => {
    setBucketKey(options[0]?.key ?? GENERAL);
    setHours('');
    setDate(todayIso());
    setDescription('');
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!(hoursNumber > 0)) { setError('Las horas deben ser mayores a cero.'); return; }
    if (!description.trim()) { setError('El detalle es obligatorio.'); return; }
    try {
      setSaving(true);
      await ManualHoursService.create({
        project_id: projectId,
        budget_item_type_id: selected?.typeId ?? null,
        hours: hoursNumber,
        date,
        description: description.trim(),
      });
      setFormOpen(false);
      await load();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar las horas manuales');
    } finally {
      setSaving(false);
    }
  };

  const handleVoid = async () => {
    if (!voidTarget) return;
    if (!voidReason.trim()) { setError('El motivo de la anulación es obligatorio.'); return; }
    try {
      setVoiding(true);
      await ManualHoursService.void(voidTarget.id, voidReason.trim());
      setVoidTarget(null);
      setVoidReason('');
      await load();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al anular las horas manuales');
    } finally {
      setVoiding(false);
    }
  };

  const rubroLabel = (e: ManualHourEntry) => e.itemType?.name || 'Generales';

  const voidedLine = (e: ManualHourEntry) =>
    `Anulada por ${personName(e.voider)} el ${formatDate(e.voided_at)}: ${e.void_reason || '—'}`;

  const voidButton = (e: ManualHourEntry) => (canVoid && e.status === 'active' ? (
    <Button size="small" color="error" onClick={() => { setVoidTarget(e); setVoidReason(''); }}>Anular</Button>
  ) : null);

  if (!canRead && !canWrite) return null;

  return (
    <Box sx={{ mb: 3 }}>
      <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />

      <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1} mb={1}>
        <Box>
          <Typography variant="h6">Horas manuales</Typography>
          <Typography variant="body2" color="text.secondary">
            Horas sin empleado, con su detalle, que descuentan de la bolsa del rubro. Sirven para saber cuánto llevó la obra:
            no modifican el presupuesto, las horas de los empleados ni la liquidación.
          </Typography>
        </Box>
        {canWrite && !projectClosed && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openForm}>Cargar horas manuales</Button>
        )}
      </Box>

      {!canRead ? null : loading ? (
        <Box display="flex" justifyContent="center" py={3}><GearSpinner size={28} /></Box>
      ) : entries.length === 0 ? (
        <Typography color="text.secondary" textAlign="center" py={2}>No hay horas manuales cargadas.</Typography>
      ) : (
        <>
          {/* Mobile Cards */}
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            <Stack spacing={2}>
              {entries.map((e) => (
                <Card key={e.id} sx={{ p: 2, borderRadius: 2, opacity: e.status === 'voided' ? 0.65 : 1 }}>
                  <Box display="flex" justifyContent="space-between" gap={1}>
                    <Box sx={{ textDecoration: e.status === 'voided' ? 'line-through' : 'none' }}>
                      <Typography fontWeight={600}>{formatHours(e.hours)} · {rubroLabel(e)}</Typography>
                      <Typography variant="body2" color="text.secondary">{formatDate(e.date)} · {personName(e.author)}</Typography>
                    </Box>
                    {voidButton(e)}
                  </Box>
                  <Typography variant="body2" sx={{ mt: 1, textDecoration: e.status === 'voided' ? 'line-through' : 'none', whiteSpace: 'pre-wrap' }}>
                    {e.description}
                  </Typography>
                  {e.status === 'voided' && <Typography variant="caption" color="error">{voidedLine(e)}</Typography>}
                </Card>
              ))}
            </Stack>
          </Box>

          {/* Desktop Table */}
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <TableContainer component={Paper} elevation={1}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Rubro</TableCell>
                    <TableCell align="right">Horas</TableCell>
                    <TableCell>Detalle</TableCell>
                    <TableCell>Cargado por</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {entries.map((e) => {
                    const voided = e.status === 'voided';
                    const strike = { textDecoration: voided ? 'line-through' : 'none', color: voided ? 'text.disabled' : undefined };
                    return (
                      <TableRow key={e.id}>
                        <TableCell sx={strike}>{formatDate(e.date)}</TableCell>
                        <TableCell sx={strike}>{rubroLabel(e)}</TableCell>
                        <TableCell align="right" sx={strike}>{formatHours(e.hours)}</TableCell>
                        <TableCell sx={{ maxWidth: 360 }}>
                          <Typography variant="body2" sx={{ ...strike, whiteSpace: 'pre-wrap' }}>{e.description}</Typography>
                          {voided && <Typography variant="caption" color="error" display="block">{voidedLine(e)}</Typography>}
                        </TableCell>
                        <TableCell sx={strike}>{personName(e.author)}</TableCell>
                        <TableCell align="right">{voidButton(e)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </>
      )}

      {/* Cargar horas manuales */}
      <AppDialog open={formOpen} onClose={() => !saving && setFormOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Cargar horas manuales</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField select label="Rubro" value={selected?.key ?? GENERAL} onChange={(e) => setBucketKey(e.target.value)} fullWidth>
              {options.map((o) => {
                const left = typeof o.budgeted === 'number' && o.budgeted > 0 ? o.budgeted - o.consumed : null;
                return (
                  <MenuItem key={o.key} value={o.key}>
                    {o.name}{left !== null ? ` — quedan ${formatHours(Math.max(0, left))}` : ''}
                  </MenuItem>
                );
              })}
            </TextField>
            <Box display="flex" gap={2} flexWrap="wrap">
              <TextField
                label="Horas" type="number" value={hours} onChange={(e) => setHours(e.target.value)}
                inputProps={{ min: 0, step: 0.5 }} sx={{ flex: 1, minWidth: 140 }} required
              />
              <TextField
                label="Fecha" type="date" value={date} onChange={(e) => setDate(e.target.value)}
                InputLabelProps={{ shrink: true }} inputProps={{ max: todayIso() }} sx={{ flex: 1, minWidth: 160 }}
              />
            </Box>
            <TextField
              label="Detalle" placeholder="Ej: armado en taller" value={description} onChange={(e) => setDescription(e.target.value)}
              multiline minRows={2} maxRows={6} required fullWidth
              helperText="Obligatorio. Contá qué se hizo en esas horas."
            />
            {remaining !== null && overBy === 0 && (
              <Typography variant="body2" color="text.secondary">
                En {selected.name} quedan {formatHours(Math.max(0, remaining))} de las {formatHours(budgeted as number)} presupuestadas.
              </Typography>
            )}
            {overBy > 0 && (
              <Alert severity="warning">
                Con estas horas {selected.name} se pasa en {formatHours(overBy)}: lleva {formatHours(selected.consumed + hoursNumber)} de {formatHours(budgeted as number)} presupuestadas. Podés guardarlas igual.
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)} disabled={saving}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !(hoursNumber > 0) || !description.trim()}>
            {saving ? <GearSpinner size={20} /> : 'Guardar'}
          </Button>
        </DialogActions>
      </AppDialog>

      {/* Anular */}
      <AppDialog open={!!voidTarget} onClose={() => !voiding && setVoidTarget(null)} fullWidth maxWidth="sm">
        <DialogTitle>Anular horas manuales</DialogTitle>
        <DialogContent>
          {voidTarget && (
            <Typography variant="body2" sx={{ mb: 2 }}>
              Se van a anular {formatHours(voidTarget.hours)} de {rubroLabel(voidTarget)} del {formatDate(voidTarget.date)}. Dejan de
              descontar de la bolsa del rubro, pero quedan visibles con el motivo.
            </Typography>
          )}
          <TextField
            label="Motivo de la anulación" value={voidReason} onChange={(e) => setVoidReason(e.target.value)}
            multiline minRows={2} maxRows={6} required fullWidth autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVoidTarget(null)} disabled={voiding}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={handleVoid} disabled={voiding || !voidReason.trim()}>
            {voiding ? <GearSpinner size={20} /> : 'Anular'}
          </Button>
        </DialogActions>
      </AppDialog>
    </Box>
  );
}
