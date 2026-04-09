'use client';
import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Close as CloseIcon, CloudUpload as CloudUploadIcon, Image as ImageIcon } from '@mui/icons-material';
import { MediaService, Media, CreateMediaData, UpdateMediaData } from '@/utils/api';

interface ArticleFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editItem?: Media | null;
}

export default function ArticleForm({ open, onClose, onSuccess, editItem }: ArticleFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [order, setOrder] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!editItem;

  useEffect(() => {
    if (open) {
      if (editItem) {
        setTitle(editItem.title || '');
        setDescription(editItem.description || '');
        setOrder(editItem.order !== undefined && editItem.order !== null ? String(editItem.order) : '');
        setPreview(editItem.url);
      } else {
        setTitle('');
        setDescription('');
        setOrder('');
        setPreview(null);
      }
      setFile(null);
      setError(null);
    }
  }, [open, editItem]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (!dropped) return;
    setFile(dropped);
    setPreview(URL.createObjectURL(dropped));
  };

  const handleSubmit = async () => {
    if (!isEditing && !file) {
      setError('Seleccioná una imagen para continuar.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isEditing && editItem) {
        const payload: UpdateMediaData = {
          title: title || undefined,
          description: description || undefined,
          order: order !== '' ? parseInt(order) : undefined,
        };
        if (file) payload.file = file;
        await MediaService.update(editItem.id, payload);
      } else {
        const payload: CreateMediaData = {
          file: file!,
          type: 'slider',
          title: title || undefined,
          description: description || undefined,
          order: order !== '' ? parseInt(order) : undefined,
        };
        await MediaService.upload(payload);
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.05)',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1, pt: 3, px: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" fontWeight={700} letterSpacing="-0.02em" color="#1E293B">
            {isEditing ? 'Editar artículo' : 'Nuevo artículo'}
          </Typography>
          <IconButton onClick={onClose} size="small" sx={{ color: '#64748B' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 2 }}>
        <Stack spacing={3}>
          {error && <Alert severity="error" sx={{ borderRadius: '10px' }}>{error}</Alert>}

          {/* Zona de carga de imagen */}
          <Box
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            sx={{
              border: '2px dashed',
              borderColor: file || preview ? 'primary.main' : '#E2E8F0',
              borderRadius: '12px',
              p: 2,
              textAlign: 'center',
              cursor: 'pointer',
              bgcolor: '#F8FAFC',
              transition: 'all 0.2s ease-in-out',
              '&:hover': { borderColor: 'primary.main', bgcolor: 'rgba(25,118,210,0.03)' },
              overflow: 'hidden',
              minHeight: 180,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {preview ? (
              <Box
                component="img"
                src={preview}
                alt="Preview"
                sx={{ maxHeight: 220, maxWidth: '100%', borderRadius: '8px', objectFit: 'cover' }}
              />
            ) : (
              <Stack alignItems="center" spacing={1}>
                <ImageIcon sx={{ fontSize: 40, color: '#94A3B8' }} />
                <Typography variant="body2" color="#64748B">
                  Arrastrá una imagen o hacé clic para seleccionar
                </Typography>
                <Typography variant="caption" color="#94A3B8">
                  JPG, PNG, WEBP
                </Typography>
              </Stack>
            )}
          </Box>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleFileChange}
          />
          {preview && (
            <Button
              size="small"
              startIcon={<CloudUploadIcon />}
              onClick={() => fileInputRef.current?.click()}
              sx={{ alignSelf: 'flex-start', textTransform: 'none', borderRadius: '8px' }}
              variant="outlined"
            >
              Cambiar imagen
            </Button>
          )}

          <TextField
            label="Título (opcional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            size="small"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />

          <TextField
            label="Descripción (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={3}
            size="small"
            inputProps={{ maxLength: 255 }}
            helperText={`${description.length}/255`}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />

          <TextField
            label="Orden"
            value={order}
            onChange={(e) => setOrder(e.target.value.replace(/\D/g, ''))}
            fullWidth
            size="small"
            type="number"
            inputProps={{ min: 0 }}
            helperText="Menor número aparece primero"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
        <Button
          onClick={onClose}
          disabled={loading}
          sx={{ borderRadius: '10px', textTransform: 'none', color: '#64748B' }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          sx={{ borderRadius: '10px', textTransform: 'none', minWidth: 120 }}
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : isEditing ? 'Guardar cambios' : 'Crear artículo'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
