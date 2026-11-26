'use client';
import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material';
import AppDialog from '@/components/common/AppDialog';
import { DragIndicatorOutlined as DragIndicatorIcon } from '@mui/icons-material';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface SortEntry {
  id: number;
  label: string;
}

function SortableRow({ entry, index }: { entry: SortEntry; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: entry.id });

  return (
    <Box
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 1.5,
        borderRadius: '10px',
        bgcolor: isDragging ? 'rgba(25,118,210,0.06)' : '#F8FAFC',
        border: '1px solid',
        borderColor: isDragging ? 'primary.main' : '#E2E8F0',
        opacity: isDragging ? 0.85 : 1,
      }}
    >
      <Box
        {...attributes}
        {...listeners}
        sx={{ color: '#94A3B8', cursor: 'grab', display: 'flex', '&:active': { cursor: 'grabbing' }, '&:hover': { color: 'primary.main' } }}
      >
        <DragIndicatorIcon fontSize="small" />
      </Box>
      <Typography variant="caption" fontWeight={700} sx={{ width: 20, textAlign: 'center', color: '#94A3B8' }}>
        {index + 1}
      </Typography>
      <Typography variant="body2" fontWeight={600} color="#1E293B" noWrap sx={{ flex: 1, minWidth: 0 }}>
        {entry.label}
      </Typography>
    </Box>
  );
}

interface SiteSortModalProps {
  open: boolean;
  title: string;
  entries: SortEntry[];
  onClose: () => void;
  /** Recibe los ids en el orden elegido; si rechaza, el modal muestra el mensaje y sigue abierto. */
  onSave: (orderedIds: number[]) => Promise<void>;
}

// Reordenar arrastrando, calcado de ArticleSortModal pero genérico para servicios, clientes y enlaces.
export default function SiteSortModal({ open, title, entries, onClose, onSave }: SiteSortModalProps) {
  const [items, setItems] = useState<SortEntry[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setItems([...entries]);
      setDirty(false);
      setError('');
    }
  }, [open, entries]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    setItems((prev) => arrayMove(prev, prev.findIndex((i) => i.id === active.id), prev.findIndex((i) => i.id === over.id)));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await onSave(items.map((i) => i.id));
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el orden.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppDialog open={open} onClose={() => !saving && onClose()} fullWidth maxWidth="xs">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" mb={2}>Arrastrá para cambiar el orden en que se muestran en el sitio.</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <Stack spacing={1}>
              {items.map((entry, index) => <SortableRow key={entry.id} entry={entry} index={index} />)}
            </Stack>
          </SortableContext>
        </DndContext>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave} disabled={!dirty || saving}>{saving ? 'Guardando…' : 'Guardar orden'}</Button>
      </DialogActions>
    </AppDialog>
  );
}
