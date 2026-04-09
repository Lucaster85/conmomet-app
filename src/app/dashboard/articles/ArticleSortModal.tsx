'use client';
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Close as CloseIcon, DragIndicator as DragIndicatorIcon } from '@mui/icons-material';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MediaService, Media } from '@/utils/api';

// ── Item sortable individual ──────────────────────────────────────────────────
function SortableItem({ item, index }: { item: Media; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  return (
    <Box
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 1.5,
        borderRadius: '10px',
        bgcolor: isDragging ? 'rgba(25,118,210,0.06)' : '#F8FAFC',
        border: '1px solid',
        borderColor: isDragging ? 'primary.main' : '#E2E8F0',
        boxShadow: isDragging
          ? '0 10px 15px -3px rgb(0 0 0 / 0.1)'
          : '0 1px 2px rgb(0 0 0 / 0.04)',
        opacity: isDragging ? 0.85 : 1,
        transition: 'box-shadow 0.2s ease-in-out, border-color 0.2s ease-in-out',
        cursor: 'default',
      }}
    >
      {/* Drag handle */}
      <Box
        {...attributes}
        {...listeners}
        sx={{
          color: '#94A3B8',
          cursor: 'grab',
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
          '&:active': { cursor: 'grabbing' },
          '&:hover': { color: 'primary.main' },
          transition: 'color 0.15s ease-in-out',
        }}
      >
        <DragIndicatorIcon fontSize="small" />
      </Box>

      {/* Número de posición */}
      <Typography
        variant="caption"
        fontWeight={700}
        sx={{
          width: 20,
          textAlign: 'center',
          color: '#94A3B8',
          flexShrink: 0,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {index + 1}
      </Typography>

      {/* Thumbnail */}
      <Box
        component="img"
        src={item.url}
        alt={item.title || 'Artículo'}
        sx={{
          width: 48,
          height: 36,
          borderRadius: '6px',
          objectFit: 'cover',
          bgcolor: '#E2E8F0',
          flexShrink: 0,
        }}
      />

      {/* Título */}
      <Typography
        variant="body2"
        fontWeight={600}
        color="#1E293B"
        noWrap
        sx={{ flex: 1, minWidth: 0 }}
      >
        {item.title || <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>Sin título</span>}
      </Typography>
    </Box>
  );
}

// ── Modal principal ───────────────────────────────────────────────────────────
interface ArticleSortModalProps {
  open: boolean;
  onClose: () => void;
  items: Media[];
  onSuccess: () => void;
}

export default function ArticleSortModal({
  open,
  onClose,
  items: initialItems,
  onSuccess,
}: ArticleSortModalProps) {
  const [items, setItems] = useState<Media[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (open) {
      setItems([...initialItems]);
      setDirty(false);
      setError(null);
    }
  }, [open, initialItems]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setItems((prev) => {
      const oldIndex = prev.findIndex((i) => i.id === active.id);
      const newIndex = prev.findIndex((i) => i.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await MediaService.reorder(items.map((i) => i.id));
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar el orden.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.05)',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1, pt: 3, px: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6" fontWeight={700} letterSpacing="-0.02em" color="#1E293B">
              Ordenar artículos
            </Typography>
            <Typography variant="caption" color="#64748B">
              Arrastrá para cambiar el orden de aparición
            </Typography>
          </Box>
          <IconButton onClick={handleClose} disabled={saving} size="small" sx={{ color: '#64748B' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }}>
            {error}
          </Alert>
        )}

        {items.length === 0 ? (
          <Typography variant="body2" color="#64748B" textAlign="center" py={4}>
            No hay artículos para ordenar.
          </Typography>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              <Stack spacing={1}>
                {items.map((item, index) => (
                  <SortableItem key={item.id} item={item} index={index} />
                ))}
              </Stack>
            </SortableContext>
          </DndContext>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
        <Button
          onClick={handleClose}
          disabled={saving}
          sx={{ borderRadius: '10px', textTransform: 'none', color: '#64748B' }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving || !dirty}
          sx={{ borderRadius: '10px', textTransform: 'none', minWidth: 130 }}
        >
          {saving ? <CircularProgress size={18} color="inherit" /> : 'Guardar orden'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
