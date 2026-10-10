'use client';
import React, { useState } from 'react';
import {
  Box, Typography, Stack, IconButton, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
} from '@mui/material';
import AddIcon from '@mui/icons-material/AddOutlined';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import GearSpinner from '@/components/GearSpinner';
import { EmployeeSize, EmployeeSizeService, EppItem } from '@/utils/api';

interface EmployeeSizesPanelProps {
  employeeId: number;
  sizes: EmployeeSize[];
  catalog: EppItem[];
  onChanged: () => void;
  onError?: (message: string) => void;
}

// Talles adicionales de EPP (campera, guantes de soldador, etc.), además de los 3 básicos
// (Calzado/Remera/Pantalón) que siguen siendo columnas de Employee. Compartido entre el legajo
// del empleado y el diálogo "Por Empleado" del módulo de EPP, mismo criterio que
// EppDeliveriesList — no depende del permiso de sueldos, los talles no son información salarial.
// No renderiza su propio título/divider: cada lugar que lo usa ya tiene su propia cabecera de
// sección (evita duplicar "Talles (EPP)" dos veces en el legajo).
export default function EmployeeSizesPanel({ employeeId, sizes, catalog, onChanged, onError }: EmployeeSizesPanelProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ epp_item_id: '', size: '' });
  const [saving, setSaving] = useState(false);

  const handleOpen = (existing?: EmployeeSize) => {
    setForm(existing ? { epp_item_id: String(existing.epp_item_id), size: existing.size } : { epp_item_id: '', size: '' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.epp_item_id || !form.size) {
      onError?.('Elegí un artículo y un talle.');
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      await EmployeeSizeService.upsert(employeeId, { epp_item_id: Number(form.epp_item_id), size: form.size });
      setDialogOpen(false);
      onChanged();
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Error al guardar el talle');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (existing: EmployeeSize) => {
    try {
      await EmployeeSizeService.upsert(employeeId, { epp_item_id: existing.epp_item_id, size: '' });
      onChanged();
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Error al eliminar el talle');
    }
  };

  return (
    <Box>
      {sizes.length > 0 && (
        <Stack spacing={1} mb={2}>
          {sizes.map((s) => (
            <Box key={s.id} display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">{s.eppItem?.name || 'Artículo'}</Typography>
                <Typography variant="body1" fontWeight={500}>{s.size}</Typography>
              </Box>
              <Box>
                <IconButton size="small" onClick={() => handleOpen(s)}><EditIcon fontSize="small" /></IconButton>
                <IconButton size="small" color="error" onClick={() => handleDelete(s)}><DeleteIcon fontSize="small" /></IconButton>
              </Box>
            </Box>
          ))}
        </Stack>
      )}

      <Button size="small" startIcon={<AddIcon />} onClick={() => handleOpen()}>
        Agregar talle
      </Button>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Talle adicional</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Artículo *" select fullWidth value={form.epp_item_id}
              onChange={(e) => setForm({ ...form, epp_item_id: e.target.value })}
              SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
              <option value="">Seleccionar artículo</option>
              {catalog.filter(i => i.size_type !== 'none').map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </TextField>
            <TextField label="Talle *" fullWidth value={form.size}
              onChange={(e) => setForm({ ...form, size: e.target.value })}
              placeholder="Ej: XL, 44" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>
            {saving ? <GearSpinner size={20} /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
