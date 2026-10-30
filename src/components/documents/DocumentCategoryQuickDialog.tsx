'use client';
import React, { useState } from 'react';
import {
  Alert, Box, Button, DialogActions, DialogContent, DialogTitle, FormControlLabel, IconButton, Stack, Switch,
  TextField, Tooltip, Typography,
} from '@mui/material';
import AppDialog from '@/components/common/AppDialog';
import {
  AddOutlined as AddIcon, EditOutlined as EditIcon, DeleteOutlined as DeleteIcon,
  CheckOutlined as CheckIcon, CloseOutlined as CloseIcon,
} from '@mui/icons-material';
import { DocumentCategory, DocumentCategoryService } from '../../utils/api';
import { TokenManager, userHasPermission } from '../../utils/auth';

interface Props {
  open: boolean;
  onClose: () => void;
  // Las categorías son por tipo de legajo: cada diálogo solo crea de ese tipo.
  appliesTo: 'employee' | 'vehicle';
  categories: DocumentCategory[];
  // Se llama después de cada alta/cambio/baja para que el padre recargue la lista.
  onChanged: () => void | Promise<void>;
}

// ABM rápido de categorías de documento (nombre; y "específica de planta" solo en Empleados).
// La descripción y el resto se editan en Configuración → Categorías de Documentos.
export default function DocumentCategoryQuickDialog({ open, onClose, appliesTo, categories, onChanged }: Props) {
  const user = TokenManager.getUser();
  const canCreate = userHasPermission(user, 'document_categories_write');
  const canUpdate = userHasPermission(user, 'document_categories_update');
  const canDelete = userHasPermission(user, 'document_categories_delete');
  const showPlantFlag = appliesTo === 'employee';

  const [newName, setNewName] = useState('');
  const [newPlantSpecific, setNewPlantSpecific] = useState(false);
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
      setError(err instanceof Error ? err.message : 'Error al guardar la categoría');
    } finally {
      setBusy(false);
    }
  };

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    run(async () => {
      await DocumentCategoryService.create({
        name,
        applies_to: appliesTo,
        is_plant_specific: showPlantFlag ? newPlantSpecific : false,
      });
      setNewName('');
      setNewPlantSpecific(false);
    });
  };

  const handleRename = (id: number) => {
    const name = editingName.trim();
    if (!name) return;
    run(async () => {
      await DocumentCategoryService.update(id, { name });
      setEditingId(null);
    });
  };

  const handleTogglePlant = (category: DocumentCategory) =>
    run(() => DocumentCategoryService.update(category.id, { is_plant_specific: !category.is_plant_specific }));

  const handleDelete = (id: number) => run(async () => {
    await DocumentCategoryService.delete(id);
    setDeletingId(null);
  });

  return (
    <AppDialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Categorías de documento</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Alta rápida de categorías del legajo de {appliesTo === 'employee' ? 'empleados' : 'flota'}. La descripción
          y el resto se editan en Configuración → Categorías de Documentos.
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        {canCreate && (
          <Box mb={2}>
            <Stack direction="row" spacing={1}>
              <TextField size="small" fullWidth label="Nueva categoría" value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
                inputProps={{ maxLength: 150 }} />
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd} disabled={busy || !newName.trim()}>Agregar</Button>
            </Stack>
            {showPlantFlag && (
              <FormControlLabel
                control={<Switch size="small" checked={newPlantSpecific} onChange={(e) => setNewPlantSpecific(e.target.checked)} />}
                label="Específica de planta"
              />
            )}
          </Box>
        )}

        <Stack spacing={0.5}>
          {categories.length === 0 && (
            <Typography variant="body2" color="text.secondary">Todavía no hay categorías.</Typography>
          )}
          {categories.map((category) => (
            <Box key={category.id} display="flex" alignItems="center" gap={1} minHeight={40}>
              {editingId === category.id ? (
                <>
                  <TextField size="small" fullWidth autoFocus value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleRename(category.id); if (e.key === 'Escape') setEditingId(null); }}
                    inputProps={{ maxLength: 150 }} />
                  <IconButton size="small" color="primary" onClick={() => handleRename(category.id)} disabled={busy}><CheckIcon fontSize="small" /></IconButton>
                  <IconButton size="small" onClick={() => setEditingId(null)}><CloseIcon fontSize="small" /></IconButton>
                </>
              ) : deletingId === category.id ? (
                <>
                  <Typography variant="body2" flex={1}>¿Eliminar <strong>{category.name}</strong>?</Typography>
                  <Button size="small" color="error" variant="contained" onClick={() => handleDelete(category.id)} disabled={busy}>Eliminar</Button>
                  <Button size="small" onClick={() => setDeletingId(null)}>No</Button>
                </>
              ) : (
                <>
                  <Typography variant="body2" flex={1}>{category.name}</Typography>
                  {showPlantFlag && (canUpdate ? (
                    <Tooltip title="Específica de planta">
                      <Switch size="small" checked={category.is_plant_specific} onChange={() => handleTogglePlant(category)} disabled={busy} />
                    </Tooltip>
                  ) : category.is_plant_specific && (
                    <Typography variant="caption" color="text.secondary">Planta</Typography>
                  ))}
                  {canUpdate && (
                    <Tooltip title="Renombrar"><IconButton size="small" color="primary" onClick={() => { setEditingId(category.id); setEditingName(category.name); setDeletingId(null); }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                  )}
                  {canDelete && (
                    <Tooltip title="Eliminar"><IconButton size="small" color="error" onClick={() => { setDeletingId(category.id); setEditingId(null); }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
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
    </AppDialog>
  );
}
