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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { User, UserService } from '../../../utils/api';
import CreateUserForm from './CreateUserForm';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{open: boolean, user: User | null}>({
    open: false,
    user: null
  });

  // Cargar usuarios
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const usersData = await UserService.getAll();
      // Asegurar que usersData es un array
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (err) {
      console.error('Error loading users:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar usuarios');
      setUsers([]); // Resetear a array vacío en caso de error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🚀 UsersPage useEffect ejecutándose...');
    loadUsers();
  }, []);

  // Manejar creación exitosa
  const handleUserCreated = () => {
    setOpenCreateDialog(false);
    loadUsers();
  };

  // Manejar eliminación
  const handleDeleteUser = async () => {
    if (!deleteDialog.user) return;

    try {
      await UserService.delete(deleteDialog.user.id);
      setDeleteDialog({ open: false, user: null });
      loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar usuario');
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Gestión de Usuarios
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadUsers}
          >
            Actualizar
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenCreateDialog(true)}
          >
            Nuevo Usuario
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Tabla de usuarios */}
      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell><strong>ID</strong></TableCell>
              <TableCell><strong>Nombre Completo</strong></TableCell>
              <TableCell><strong>Email</strong></TableCell>
              <TableCell><strong>CUIT</strong></TableCell>
              <TableCell><strong>Teléfono</strong></TableCell>
              <TableCell><strong>Rol</strong></TableCell>
              <TableCell><strong>Fecha Creación</strong></TableCell>
              <TableCell align="center"><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!Array.isArray(users) || users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No hay usuarios registrados
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {user.name} {user.lastname}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.cuit}</TableCell>
                  <TableCell>
                    <Box>
                      {user.celphone && (
                        <Typography variant="body2">
                          📱 {user.celphone}
                        </Typography>
                      )}
                      {user.phone && (
                        <Typography variant="body2">
                          📞 {user.phone}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.role?.name || 'Sin rol'}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell align="center">
                    <Box display="flex" gap={0.5}>
                      <Tooltip title="Ver detalles">
                        <IconButton size="small" color="info">
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton size="small" color="primary">
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteDialog({ open: true, user })}
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

      {/* Dialog para crear usuario */}
      <Dialog 
        open={openCreateDialog} 
        onClose={() => setOpenCreateDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Crear Nuevo Usuario</DialogTitle>
        <DialogContent>
                  <CreateUserForm onSuccessAction={handleUserCreated} />
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación para eliminar */}
      <Dialog 
        open={deleteDialog.open} 
        onClose={() => setDeleteDialog({ open: false, user: null })}
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar al usuario{' '}
            <strong>{deleteDialog.user?.name} {deleteDialog.user?.lastname}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialog({ open: false, user: null })}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleDeleteUser} 
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