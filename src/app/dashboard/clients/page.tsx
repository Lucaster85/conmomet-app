'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Tooltip,
  TextField,
  InputAdornment,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { Client, ClientService } from '../../../utils/api';
import ClientForm from './ClientForm';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{open: boolean, client: Client | null}>({
    open: false,
    client: null
  });

  // Cargar clientes
  const loadClients = async () => {
    try {
      setLoading(true);
      setError('');
      const clientsData = await ClientService.getAll();
      setClients(Array.isArray(clientsData) ? clientsData : []);
    } catch (err) {
      console.error('Error loading clients:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar clientes');
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const filteredClients = clients.filter((client) => {
    const q = search.toLowerCase();
    return (
      client.razonSocial.toLowerCase().includes(q) ||
      client.email.toLowerCase().includes(q) ||
      (client.phone && client.phone.includes(q))
    );
  });

  // Manejar creación/edición exitosa
  const handleClientSaved = () => {
    setOpenDialog(false);
    setEditingClient(null);
    loadClients();
  };

  const handleOpenCreate = () => {
    setEditingClient(null);
    setOpenDialog(true);
  };

  const handleOpenEdit = (client: Client) => {
    setEditingClient(client);
    setOpenDialog(true);
  };

  // Manejar eliminación
  const handleDeleteClient = async () => {
    if (!deleteDialog.client) return;

    try {
      await ClientService.delete(deleteDialog.client.id);
      setDeleteDialog({ open: false, client: null });
      loadClients();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar cliente');
    }
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Typography variant="h4" fontWeight="bold">
          Gestión de Clientes
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadClients}
            size="small"
          >
            Actualizar
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
            size="small"
          >
            Nuevo Cliente
          </Button>
        </Box>
      </Box>

      {/* Search Bar */}
      <TextField
        placeholder="Buscar por razón social o email..."
        fullWidth
        size="small"
        sx={{ mb: 3 }}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Mobile/Tablet Card View */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {filteredClients.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={4}>
            No hay clientes que coincidan con la búsqueda
          </Typography>
        ) : (
          <Stack spacing={2}>
            {filteredClients.map((client) => (
              <Paper key={client.id} sx={{ p: 2, borderRadius: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box flex={1}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {client.razonSocial}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {client.email}
                    </Typography>
                    {client.phone && (
                      <Typography variant="body2" sx={{ mt: 0.5, display: 'flex', alignItems: 'center' }}>
                        📞 {client.phone}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Desde: {formatDate(client.createdAt)}
                    </Typography>
                  </Box>
                  <Box display="flex" flexDirection="column" gap={0.5}>
                    <IconButton size="small" color="primary" onClick={() => handleOpenEdit(client)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, client })}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              </Paper>
            ))}
          </Stack>
        )}
      </Box>

      {/* Desktop Table View */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Nombre / Razón Social</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell><strong>Teléfono</strong></TableCell>
                <TableCell><strong>Fecha Creación</strong></TableCell>
                <TableCell align="center"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No hay clientes registrados
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => (
                  <TableRow key={client.id} hover>
                    <TableCell>{client.id}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {client.razonSocial}
                      </Typography>
                    </TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>{client.phone || '—'}</TableCell>
                    <TableCell>{formatDate(client.createdAt)}</TableCell>
                    <TableCell align="center">
                      <Box display="flex" justifyContent="center" gap={0.5}>
                        <Tooltip title="Editar">
                          <IconButton size="small" color="primary" onClick={() => handleOpenEdit(client)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteDialog({ open: true, client })}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Dialog para crear/editar cliente */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editingClient ? 'Editar Cliente' : 'Crear Nuevo Cliente'}</DialogTitle>
        <DialogContent dividers>
          <ClientForm 
            client={editingClient || undefined} 
            onSuccessAction={handleClientSaved} 
            onCancel={() => setOpenDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación para eliminar */}
      <Dialog 
        open={deleteDialog.open} 
        onClose={() => setDeleteDialog({ open: false, client: null })}
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar al cliente{' '}
            <strong>{deleteDialog.client?.razonSocial}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialog({ open: false, client: null })}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleDeleteClient} 
            color="error" 
            variant="contained"
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}