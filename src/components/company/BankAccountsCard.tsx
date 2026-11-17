'use client';
import React, { useState } from 'react';
import {
  Box, Button, Card, CardContent, Chip, DialogActions, DialogContent, DialogTitle, FormControlLabel, IconButton, MenuItem, Paper,
  Stack, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import { AddOutlined as AddIcon, DeleteOutlined as DeleteIcon, EditOutlined as EditIcon } from '@mui/icons-material';
import AppDialog from '../common/AppDialog';
import GearSpinner from '../GearSpinner';
import { CompanyBankAccount, CompanySettingsService } from '../../utils/api';
import { cbuDigits, formatCbu, validateCbu, validateCbuAlias } from '../../utils/cbu';

interface FormState { bank_name: string; cbu: string; alias: string; currency: '' | 'ARS' | 'USD'; is_default: boolean; is_active: boolean }
const EMPTY: FormState = { bank_name: '', cbu: '', alias: '', currency: '', is_default: false, is_active: true };

interface Props {
  accounts: CompanyBankAccount[];
  onChanged: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export default function BankAccountsCard({ accounts, onChanged, onSuccess, onError }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CompanyBankAccount | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);
  const [toDelete, setToDelete] = useState<CompanyBankAccount | null>(null);

  const cbuError = validateCbu(form.cbu);
  const aliasError = validateCbuAlias(form.alias);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setTouched(false); setDialogOpen(true); };
  const openEdit = (a: CompanyBankAccount) => {
    setEditing(a);
    setForm({ bank_name: a.bank_name, cbu: a.cbu, alias: a.alias || '', currency: a.currency || '', is_default: a.is_default, is_active: a.is_active });
    setTouched(false);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setTouched(true);
    if (!form.bank_name.trim() || cbuError || aliasError) return;
    setSaving(true);
    try {
      const payload = { bank_name: form.bank_name, cbu: form.cbu, alias: form.alias, currency: form.currency || null, is_default: form.is_default, is_active: form.is_active };
      if (editing) await CompanySettingsService.updateBankAccount(editing.id, payload);
      else await CompanySettingsService.createBankAccount(payload);
      setDialogOpen(false);
      onSuccess(editing ? 'Cuenta bancaria actualizada.' : 'Cuenta bancaria creada.');
      onChanged();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Error al guardar la cuenta bancaria');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await CompanySettingsService.deleteBankAccount(toDelete.id);
      setToDelete(null);
      onSuccess('Cuenta bancaria eliminada.');
      onChanged();
    } catch (err) {
      setToDelete(null);
      onError(err instanceof Error ? err.message : 'Error al eliminar la cuenta bancaria');
    }
  };

  const chips = (a: CompanyBankAccount) => (
    <Box display="flex" gap={0.75} flexWrap="wrap">
      {a.currency && <Chip size="small" label={a.currency} variant="outlined" />}
      {a.is_default && <Chip size="small" label="Predeterminada" color="info" />}
      {!a.is_active && <Chip size="small" label="Inactiva" />}
    </Box>
  );

  const actions = (a: CompanyBankAccount) => (
    <>
      <Tooltip title="Editar"><IconButton size="small" color="primary" onClick={() => openEdit(a)}><EditIcon fontSize="small" /></IconButton></Tooltip>
      <Tooltip title="Eliminar"><IconButton size="small" color="error" onClick={() => setToDelete(a)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
    </>
  );

  return (
    <Card sx={{ borderRadius: 3, mb: 3 }}>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} mb={0.5}>
          <Typography variant="h6" fontWeight={600}>Cuentas bancarias</Typography>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openCreate}>Nueva cuenta</Button>
        </Box>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Se elige una al facturar (viene precargada la predeterminada). El CBU y el alias se imprimen en la factura y,
          en la Factura de Crédito Electrónica, se informan a ARCA.
        </Typography>

        {/* Mobile */}
        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
          {accounts.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={3}>No hay cuentas bancarias cargadas</Typography>
          ) : (
            <Stack spacing={1.5}>
              {accounts.map((a) => (
                <Card key={a.id} variant="outlined" sx={{ p: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">{a.bank_name}</Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{formatCbu(a.cbu)}</Typography>
                      {a.alias && <Typography variant="body2" color="text.secondary" mb={0.75}>Alias: {a.alias}</Typography>}
                      {chips(a)}
                    </Box>
                    <Box>{actions(a)}</Box>
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
                  <TableCell><strong>Banco</strong></TableCell>
                  <TableCell><strong>CBU</strong></TableCell>
                  <TableCell><strong>Alias</strong></TableCell>
                  <TableCell><strong>Estado</strong></TableCell>
                  <TableCell align="center"><strong>Acciones</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {accounts.length === 0 ? (
                  <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}><Typography variant="body2" color="text.secondary">No hay cuentas bancarias cargadas</Typography></TableCell></TableRow>
                ) : accounts.map((a) => (
                  <TableRow key={a.id} hover>
                    <TableCell><Typography fontWeight={600}>{a.bank_name}</Typography></TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{formatCbu(a.cbu)}</TableCell>
                    <TableCell>{a.alias || '—'}</TableCell>
                    <TableCell>{chips(a)}</TableCell>
                    <TableCell align="center">{actions(a)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </CardContent>

      <AppDialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Editar cuenta bancaria' : 'Nueva cuenta bancaria'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Banco *" value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} fullWidth
              error={touched && !form.bank_name.trim()} helperText={touched && !form.bank_name.trim() ? 'El banco es obligatorio' : undefined} />
            <TextField label="CBU *" value={form.cbu} onChange={(e) => setForm({ ...form, cbu: cbuDigits(e.target.value) })} fullWidth
              inputProps={{ inputMode: 'numeric', maxLength: 22 }}
              error={(touched || form.cbu.length === 22) && !!cbuError} helperText={(touched || form.cbu.length === 22) ? cbuError || 'CBU válido' : '22 dígitos'} />
            <TextField label="Alias" value={form.alias} onChange={(e) => setForm({ ...form, alias: e.target.value.replace(/\s/g, '') })} fullWidth
              error={!!aliasError} helperText={aliasError || undefined} />
            <TextField select label="Moneda" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value as FormState['currency'] })} fullWidth
              helperText="Dejala vacía si la cuenta sirve para cualquier moneda.">
              <MenuItem value="">Cualquiera</MenuItem>
              <MenuItem value="ARS">Pesos (ARS)</MenuItem>
              <MenuItem value="USD">Dólares (USD)</MenuItem>
            </TextField>
            <FormControlLabel control={<Switch checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked, is_active: e.target.checked ? true : form.is_active })} />} label="Predeterminada" />
            <FormControlLabel control={<Switch checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked, is_default: e.target.checked ? form.is_default : false })} />} label="Activa" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>{saving ? <GearSpinner size={20} /> : (editing ? 'Guardar' : 'Crear')}</Button>
        </DialogActions>
      </AppDialog>

      <AppDialog open={!!toDelete} onClose={() => setToDelete(null)}>
        <DialogTitle>Eliminar cuenta bancaria</DialogTitle>
        <DialogContent>
          <Typography>¿Eliminar la cuenta de <strong>{toDelete?.bank_name}</strong>?</Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>Si ya se usó en facturas, no se puede eliminar: desactivala.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setToDelete(null)}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Eliminar</Button>
        </DialogActions>
      </AppDialog>
    </Card>
  );
}
