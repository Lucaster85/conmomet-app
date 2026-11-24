'use client';
import React, { useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Chip, DialogActions, DialogContent, DialogTitle, FormControlLabel, IconButton,
  MenuItem, Paper, Stack, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import { AddOutlined as AddIcon, DeleteOutlined as DeleteIcon, EditOutlined as EditIcon, FactCheckOutlined as ValidateIcon } from '@mui/icons-material';
import AppDialog from '../common/AppDialog';
import GearSpinner from '../GearSpinner';
import { ArcaPointValidation, ArcaStatus, CompanyPointOfSale, CompanySettingsService } from '../../utils/api';

const TYPE_LABEL = { web_service: 'Web service (emite la app)', manual: 'Comprobantes en línea (carga manual)' } as const;
const STATE_LABEL = { ok: 'Habilitado en ARCA', not_found: 'ARCA no lo lista', blocked: 'Bloqueado o dado de baja en ARCA' } as const;

const pad = (n: number) => String(n).padStart(4, '0');

interface FormState { number: string; usage_description: string; type: 'web_service' | 'manual'; address: string; is_default: boolean; is_active: boolean }
const EMPTY: FormState = { number: '', usage_description: '', type: 'web_service', address: '', is_default: false, is_active: true };

interface Props {
  points: CompanyPointOfSale[];
  arca: ArcaStatus;
  onChanged: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export default function PointsOfSaleCard({ points, arca, onChanged, onSuccess, onError }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CompanyPointOfSale | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<CompanyPointOfSale | null>(null);
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<ArcaPointValidation | null>(null);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setDialogOpen(true); };
  const openEdit = (p: CompanyPointOfSale) => {
    setEditing(p);
    setForm({ number: String(p.number), usage_description: p.usage_description || '', type: p.type, address: p.address || '', is_default: p.is_default, is_active: p.is_active });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const number = Number(form.number);
    if (!Number.isInteger(number) || number < 1 || number > 99999) {
      onError('El número de punto de venta tiene que ser un entero entre 1 y 99999.');
      return;
    }
    setSaving(true);
    try {
      const payload = { number, usage_description: form.usage_description, type: form.type, address: form.address, is_default: form.is_default, is_active: form.is_active };
      if (editing) await CompanySettingsService.updatePointOfSale(editing.id, payload);
      else await CompanySettingsService.createPointOfSale(payload);
      setDialogOpen(false);
      setValidation(null);
      onSuccess(editing ? 'Punto de venta actualizado.' : 'Punto de venta creado.');
      onChanged();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Error al guardar el punto de venta');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await CompanySettingsService.deletePointOfSale(toDelete.id);
      setToDelete(null);
      setValidation(null);
      onSuccess('Punto de venta eliminado.');
      onChanged();
    } catch (err) {
      setToDelete(null);
      onError(err instanceof Error ? err.message : 'Error al eliminar el punto de venta');
    }
  };

  const handleValidate = async () => {
    setValidating(true);
    try {
      setValidation(await CompanySettingsService.validateArcaPointsOfSale());
    } catch (err) {
      setValidation(null);
      onError(err instanceof Error ? err.message : 'Error al validar con ARCA');
    } finally {
      setValidating(false);
    }
  };

  const stateOf = (id: number) => validation?.results.find((r) => r.id === id)?.state;
  const hasWebService = points.some((p) => p.type === 'web_service');

  const chips = (p: CompanyPointOfSale) => {
    const state = stateOf(p.id);
    return (
      <Box display="flex" gap={0.75} flexWrap="wrap">
        <Chip size="small" label={p.type === 'web_service' ? 'Web service' : 'Carga manual'} color={p.type === 'web_service' ? 'primary' : 'default'} variant="outlined" />
        {p.is_default && <Chip size="small" label="Predeterminado" color="info" />}
        {!p.is_active && <Chip size="small" label="Inactivo" />}
        {validation && p.type === 'web_service' && state && (
          <Chip size="small" label={STATE_LABEL[state]} color={state === 'ok' ? 'success' : (validation.enforced ? 'error' : 'warning')} />
        )}
      </Box>
    );
  };

  const actions = (p: CompanyPointOfSale) => (
    <>
      <Tooltip title="Editar"><IconButton size="small" color="primary" onClick={() => openEdit(p)}><EditIcon fontSize="small" /></IconButton></Tooltip>
      <Tooltip title="Eliminar"><IconButton size="small" color="error" onClick={() => setToDelete(p)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
    </>
  );

  return (
    <Card sx={{ borderRadius: 3, mb: 3 }}>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} mb={0.5}>
          <Typography variant="h6" fontWeight={600}>Puntos de venta</Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            <Button variant="outlined" size="small" startIcon={validating ? undefined : <ValidateIcon />} onClick={handleValidate} disabled={validating || !arca.enabled || !hasWebService}>
              {validating ? <GearSpinner size={18} /> : 'Validar con ARCA'}
            </Button>
            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openCreate}>Nuevo punto de venta</Button>
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Los puntos de venta los da de alta el cliente en ARCA. Para emitir desde la app tienen que ser de tipo
          «Web services»; los de «Comprobantes en línea» solo sirven para cargar facturas a mano.
        </Typography>

        {validation && (
          validation.has_problems ? (
            <Alert severity={validation.enforced ? 'error' : 'warning'} sx={{ mb: 2 }}>
              {validation.enforced
                ? 'Hay puntos de venta que ARCA no habilita para web services. No se va a poder emitir con ellos.'
                : 'ARCA no lista algunos puntos de venta. En homologación es esperable: no hay puntos dados de alta y se acepta cualquier número.'}
            </Alert>
          ) : (
            <Alert severity="success" sx={{ mb: 2 }}>Todos los puntos de venta de tipo web service están habilitados en ARCA.</Alert>
          )
        )}

        {/* Mobile */}
        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
          {points.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={3}>No hay puntos de venta cargados</Typography>
          ) : (
            <Stack spacing={1.5}>
              {points.map((p) => (
                <Card key={p.id} variant="outlined" sx={{ p: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">{pad(p.number)}</Typography>
                      <Typography variant="body2" color="text.secondary" mb={0.75}>{p.usage_description || 'Sin descripción de uso'}</Typography>
                      {chips(p)}
                    </Box>
                    <Box>{actions(p)}</Box>
                  </Box>
                </Card>
              ))}
            </Stack>
          )}
        </Box>

        {/* Desktop */}
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell><strong>Número</strong></TableCell>
                  <TableCell><strong>Uso</strong></TableCell>
                  <TableCell><strong>Estado</strong></TableCell>
                  <TableCell align="center"><strong>Acciones</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {points.length === 0 ? (
                  <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3 }}><Typography variant="body2" color="text.secondary">No hay puntos de venta cargados</Typography></TableCell></TableRow>
                ) : points.map((p) => (
                  <TableRow key={p.id} hover>
                    <TableCell><Typography fontWeight={600}>{pad(p.number)}</Typography></TableCell>
                    <TableCell>{p.usage_description || '—'}</TableCell>
                    <TableCell>{chips(p)}</TableCell>
                    <TableCell align="center">{actions(p)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </CardContent>

      <AppDialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Editar punto de venta' : 'Nuevo punto de venta'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Número *" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value.replace(/\D/g, '').slice(0, 5) })} inputProps={{ inputMode: 'numeric' }} fullWidth
              helperText="Tal como figura en ARCA, por ejemplo 3 para el 00003." />
            <TextField label="Para qué se usa" value={form.usage_description} onChange={(e) => setForm({ ...form, usage_description: e.target.value })} placeholder="Ej: Obras con IIBB" fullWidth />
            <TextField select label="Tipo" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as FormState['type'] })} fullWidth
              helperText="Solo los de web service se pueden usar para emitir desde la app.">
              {(Object.keys(TYPE_LABEL) as Array<keyof typeof TYPE_LABEL>).map((k) => <MenuItem key={k} value={k}>{TYPE_LABEL[k]}</MenuItem>)}
            </TextField>
            <TextField label="Domicilio asociado en ARCA (opcional)" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} fullWidth
              helperText="Si queda vacío se usa el domicilio de la empresa." />
            <FormControlLabel control={<Switch checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked, is_active: e.target.checked ? true : form.is_active })} />} label="Predeterminado" />
            <FormControlLabel control={<Switch checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked, is_default: e.target.checked ? form.is_default : false })} />} label="Activo" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>{saving ? <GearSpinner size={20} /> : (editing ? 'Guardar' : 'Crear')}</Button>
        </DialogActions>
      </AppDialog>

      <AppDialog open={!!toDelete} onClose={() => setToDelete(null)}>
        <DialogTitle>Eliminar punto de venta</DialogTitle>
        <DialogContent>
          <Typography>¿Eliminar el punto de venta <strong>{toDelete ? pad(toDelete.number) : ''}</strong>?</Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>Si ya tiene facturas, no se puede eliminar: desactivalo.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setToDelete(null)}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Eliminar</Button>
        </DialogActions>
      </AppDialog>
    </Card>
  );
}
