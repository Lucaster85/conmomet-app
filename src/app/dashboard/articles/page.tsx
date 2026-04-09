'use client';
import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  SwapVert as SortIcon,
} from '@mui/icons-material';
import { MediaService, Media } from '@/utils/api';
import ArticleForm from './ArticleForm';
import ArticleSortModal from './ArticleSortModal';

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<Media | null>(null);

  const [sortOpen, setSortOpen] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Media | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await MediaService.getByType('slider');
      setArticles(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar los artículos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleOpenCreate = () => {
    setEditItem(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (item: Media) => {
    setEditItem(item);
    setFormOpen(true);
  };

  const handleOpenDelete = (item: Media) => {
    setDeleteTarget(item);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await MediaService.delete(deleteTarget.id);
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      fetchArticles();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      setDeleting(false);
    }
  };

  const truncate = (text: string, max: number) =>
    text.length > max ? text.slice(0, max) + '...' : text;

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#F8FAFC', minHeight: '100vh' }}>
      {/* Header */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        mb={4}
        gap={2}
      >
        <Box>
          <Typography
            variant="h5"
            fontWeight={700}
            letterSpacing="-0.02em"
            color="#1E293B"
          >
            Artículos
          </Typography>
          <Typography variant="body2" color="#64748B" mt={0.5}>
            Gestión de imágenes para la sección de artículos
          </Typography>
        </Box>
        <Stack direction="row" gap={1}>
          <Button
            variant="outlined"
            startIcon={<SortIcon />}
            onClick={() => setSortOpen(true)}
            disabled={articles.length < 2}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
          >
            Ordenar
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
          >
            Nuevo artículo
          </Button>
        </Stack>
      </Stack>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '10px' }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Loading */}
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
          <CircularProgress />
        </Box>
      ) : articles.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 10,
            bgcolor: 'white',
            borderRadius: '16px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
          }}
        >
          <ImageIcon sx={{ fontSize: 56, color: '#CBD5E1', mb: 2 }} />
          <Typography variant="h6" color="#64748B" fontWeight={600}>
            No hay artículos todavía
          </Typography>
          <Typography variant="body2" color="#94A3B8" mt={1} mb={3}>
            Creá el primero haciendo clic en &quot;Nuevo artículo&quot;
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
            sx={{ borderRadius: '10px', textTransform: 'none' }}
          >
            Nuevo artículo
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {articles.map((article) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={article.id}>
              <Card
                sx={{
                  borderRadius: '16px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  },
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <CardMedia
                  component="img"
                  image={article.url}
                  alt={article.title || 'Artículo'}
                  sx={{
                    height: 160,
                    objectFit: 'cover',
                    borderRadius: '16px 16px 0 0',
                    bgcolor: '#F1F5F9',
                  }}
                />
                <CardContent sx={{ flex: 1, pb: 1 }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.5}>
                    {article.order !== null && article.order !== undefined && (
                      <Chip
                        label={`#${article.order}`}
                        size="small"
                        sx={{
                          fontSize: '0.7rem',
                          height: 20,
                          bgcolor: 'rgba(25,118,210,0.08)',
                          color: 'primary.main',
                          fontWeight: 600,
                        }}
                      />
                    )}
                  </Stack>
                  <Typography
                    variant="subtitle2"
                    fontWeight={700}
                    color="#1E293B"
                    letterSpacing="-0.01em"
                    noWrap
                    title={article.title}
                  >
                    {article.title || <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>Sin título</span>}
                  </Typography>
                  {article.description && (
                    <Typography variant="caption" color="#64748B" sx={{ mt: 0.5, display: 'block', lineHeight: 1.5 }}>
                      {truncate(article.description, 80)}
                    </Typography>
                  )}
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2, pt: 0, justifyContent: 'flex-end', gap: 0.5 }}>
                  <Tooltip title="Editar">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenEdit(article)}
                      sx={{
                        color: '#64748B',
                        borderRadius: '8px',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': { bgcolor: 'rgba(25,118,210,0.08)', color: 'primary.main' },
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Eliminar">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDelete(article)}
                      sx={{
                        color: '#64748B',
                        borderRadius: '8px',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': { bgcolor: 'rgba(239,68,68,0.08)', color: 'error.main' },
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Form modal */}
      <ArticleForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={fetchArticles}
        editItem={editItem}
      />

      {/* Sort modal */}
      <ArticleSortModal
        open={sortOpen}
        onClose={() => setSortOpen(false)}
        items={articles}
        onSuccess={fetchArticles}
      />

      {/* Delete confirmation */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#1E293B', letterSpacing: '-0.02em' }}>
          Confirmar eliminación
        </DialogTitle>
        <DialogContent>
          <DialogContentText color="#64748B">
            ¿Estás seguro de que querés eliminar{' '}
            <strong>{deleteTarget?.title || 'este artículo'}</strong>? Esta acción no se puede deshacer y eliminará la imagen del almacenamiento.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleting}
            sx={{ borderRadius: '10px', textTransform: 'none', color: '#64748B' }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={deleting}
            sx={{ borderRadius: '10px', textTransform: 'none', minWidth: 100 }}
          >
            {deleting ? <CircularProgress size={18} color="inherit" /> : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
