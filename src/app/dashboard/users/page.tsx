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
import { User, UserService } from '../../../utils/api';
import UserForm from './UserForm';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
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
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (err) {
      console.error('Error loading users:', err);
      if (err instanceof Error && err.name === 'UnauthorizedError') {
        window.location.href = '/login';
        return;
      }
      setError(err instanceof Error ? err.message : 'Error al cargar usuarios');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    const q = search.toLowerCase();
    return (
      user.name.toLowerCase().includes(q) ||
      user.lastname.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      user.cuit.includes(q)
    );
  });

  // Manejar creación/edición exitosa
  const handleUserSaved = () => {
    setOpenDialog(false);
    setEditingUser(null);
    loadUsers();
  };

  const handleOpenCreate = () => {
    setEditingUser(null);
    setOpenDialog(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setOpenDialog(true);
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Typography variant="h4" fontWeight="bold">
          Gestión de Usuarios
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadUsers}
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
            Nuevo Usuario
          </Button>
        </Box>
      </Box>

      {/* Search Bar */}
      <TextField
        placeholder="Buscar por nombre, email o CUIT..."
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
        {filteredUsers.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={4}>
            No hay usuarios que coincidan con la búsqueda
          </Typography>
        ) : (
          <Stack spacing={2}>
            {filteredUsers.map((user) => (
              <Paper key={user.id} sx={{ p: 2, borderRadius: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box flex={1}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {user.lastname}, {user.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {user.email}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      CUIT: {user.cuit}
                    </Typography>
                    <Box display="flex" gap={1} flexWrap="wrap" mt={1}>
                      <Chip
                        label={user.role?.name || 'Sin rol'}
                        color="primary"
                        variant="outlined"
                        size="small"
                      />
                      {(user.phone || user.celphone) && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                          📞 {user.celphone || user.phone}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Box display="flex" flexDirection="column" gap={0.5}>
                    <IconButton size="small" color="primary" onClick={() => handleOpenEdit(user)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, user })}>
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
                <TableCell><strong>Usuario</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell><strong>CUIT</strong></TableCell>
                <TableCell><strong>Contacto</strong></TableCell>
                <TableCell><strong>Rol</strong></TableCell>
                <TableCell><strong>Creación</strong></TableCell>
                <TableCell align="center"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No hay usuarios registrados
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {user.lastname}, {user.name}
                      </Typography>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.cuit}</TableCell>
                    <TableCell>
                      <Box>
                        {user.celphone && <Typography variant="caption" display="block">📱 {user.celphone}</Typography>}
                        {user.phone && <Typography variant="caption" display="block">📞 {user.phone}</Typography>}
                        {!user.celphone && !user.phone && '—'}
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
                      <Box display="flex" justifyContent="center" gap={0.5}>
                        <Tooltip title="Editar">
                          <IconButton size="small" color="primary" onClick={() => handleOpenEdit(user)}>
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
      </Box>

      {/* Dialog para crear/editar usuario */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</DialogTitle>
        <DialogContent dividers>
          <UserForm 
            user={editingUser || undefined} 
            onSuccessAction={handleUserSaved} 
            onCancel={() => setOpenDialog(false)}
          />
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