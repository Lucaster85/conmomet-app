'use client';
import React, { useState } from 'react';
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, TextField, Tooltip, Typography,
} from '@mui/material';
import {
  AddOutlined as AddIcon, EditOutlined as EditIcon, DeleteOutlined as DeleteIcon,
  CheckOutlined as CheckIcon, CloseOutlined as CloseIcon, LockOutlined as LockIcon,
} from '@mui/icons-material';
import { MaterialProvider, MaterialProviderService } from '../../utils/api';

interface Props {
  open: boolean;
  onClose: () => void;
  providers: MaterialProvider[];
  // Se llama después de cada alta/renombre/baja para que el padre recargue la lista.
  onChanged: () => void | Promise<void>;
}

// ABM rápido de proveedores: solo nombre. El módulo completo de proveedores es futuro.
export default function ProvidersQuickDialog({ open, onClose, providers, onChanged }: Props) {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError('');
    try {
      await action();
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el proveedor');
    } finally {
      setBusy(false);
    }
  };

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    run(async () => {
      await MaterialProviderService.create(name);
      setNewName('');
    });
  };

  const handleRename = (id: number) => {
    const name = editingName.trim();
    if (!name) return;
    run(async () => {
      await MaterialProviderService.update(id, name);
      setEditingId(null);
    });
  };

  const handleDelete = (id: number) => run(async () => {
    await MaterialProviderService.delete(id);
    setDeletingId(null);
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Proveedores</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Alta rápida de proveedores (solo el nombre) para cargar el precio de cada material.
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <Stack direction="row" spacing={1} mb={2}>
          <TextField size="small" fullWidth label="Nuevo proveedor" value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
            inputProps={{ maxLength: 150 }} />
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd} disabled={busy || !newName.trim()}>Agregar</Button>
        </Stack>

        <Stack spacing={0.5}>
          {providers.map((provider) => (
            <Box key={provider.id} display="flex" alignItems="center" gap={1} minHeight={40}>
              {editingId === provider.id ? (
                <>
                  <TextField size="small" fullWidth autoFocus value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleRename(provider.id); if (e.key === 'Escape') setEditingId(null); }}
                    inputProps={{ maxLength: 150 }} />
                  <IconButton size="small" color="primary" onClick={() => handleRename(provider.id)} disabled={busy}><CheckIcon fontSize="small" /></IconButton>
                  <IconButton size="small" onClick={() => setEditingId(null)}><CloseIcon fontSize="small" /></IconButton>
                </>
              ) : deletingId === provider.id ? (
                <>
                  <Typography variant="body2" flex={1}>¿Eliminar <strong>{provider.razonSocial}</strong>? Se borran sus precios del catálogo.</Typography>
                  <Button size="small" color="error" variant="contained" onClick={() => handleDelete(provider.id)} disabled={busy}>Eliminar</Button>
                  <Button size="small" onClick={() => setDeletingId(null)}>No</Button>
                </>
              ) : (
                <>
                  <Typography variant="body2" flex={1} color={provider.is_system ? 'text.secondary' : undefined}>
                    {provider.razonSocial}
                  </Typography>
                  {provider.is_system ? (
                    <Tooltip title="Proveedor de sistema: no se puede editar ni eliminar"><LockIcon fontSize="small" color="disabled" /></Tooltip>
                  ) : (
                    <>
                      <Tooltip title="Renombrar"><IconButton size="small" color="primary" onClick={() => { setEditingId(provider.id); setEditingName(provider.razonSocial); setDeletingId(null); }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Eliminar"><IconButton size="small" color="error" onClick={() => { setDeletingId(provider.id); setEditingId(null); }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                    </>
                  )}
                </>
              )}
            </Box>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
