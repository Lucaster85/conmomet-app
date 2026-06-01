import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Box,
  Tooltip,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  Paper,
  Divider,
  Stack,
  Zoom,
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { Client, ClientSupervisor, ClientSupervisorService } from '../../../utils/api';

interface ClientSupervisorsDialogProps {
  open: boolean;
  onClose: () => void;
  client: Client | null;
}

export default function ClientSupervisorsDialog({ open, onClose, client }: ClientSupervisorsDialogProps) {
  const [supervisors, setSupervisors] = useState<ClientSupervisor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Load supervisors
  const loadSupervisors = useCallback(async () => {
    if (!client) return;
    try {
      setLoading(true);
      setError('');
      const data = await ClientSupervisorService.getAll(client.id);
      setSupervisors(data);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Error al cargar supervisores.');
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    if (open && client) {
      loadSupervisors();
      resetForm();
    }
  }, [open, client, loadSupervisors]);

  const resetForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setName('');
    setLastname('');
    setEmail('');
    setPhone('');
    setIsActive(true);
    setError('');
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleOpenEdit = (supervisor: ClientSupervisor) => {
    setError('');
    setEditingId(supervisor.id);
    setName(supervisor.name);
    setLastname(supervisor.lastname);
    setEmail(supervisor.email || '');
    setPhone(supervisor.phone || '');
    setIsActive(supervisor.is_active);
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;
    if (!name || !lastname) {
      setError('Nombre y Apellido son obligatorios.');
      return;
    }

    try {
      setError('');
      setSuccess('');
      if (editingId) {
        // Update
        await ClientSupervisorService.update(editingId, {
          name,
          lastname,
          email: email || undefined,
          phone: phone || undefined,
          is_active: isActive,
        });
        setSuccess('Supervisor actualizado correctamente.');
      } else {
        // Create
        await ClientSupervisorService.create({
          client_id: client.id,
          name,
          lastname,
          email: email || undefined,
          phone: phone || undefined,
          is_active: isActive,
        });
        setSuccess('Supervisor creado correctamente.');
      }
      resetForm();
      loadSupervisors();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar supervisor.');
    }
  };

  const handleToggleActive = async (supervisor: ClientSupervisor) => {
    try {
      setError('');
      setSuccess('');
      const updated = await ClientSupervisorService.update(supervisor.id, {
        is_active: !supervisor.is_active,
      });
      setSuccess(`Supervisor ${updated.is_active ? 'activado' : 'desactivado'} correctamente.`);
      loadSupervisors();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar estado.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este supervisor?')) return;
    try {
      setError('');
      setSuccess('');
      await ClientSupervisorService.delete(id);
      setSuccess('Supervisor eliminado correctamente.');
      loadSupervisors();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar supervisor.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6" fontWeight="bold">
            Supervisores del Cliente
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            {client?.razonSocial}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <Divider />

      <DialogContent sx={{ p: 3, minHeight: '350px' }}>
        {/* Alerts */}
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        {/* Action Header */}
        {!isFormOpen && (
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreate}
              size="small"
            >
              Agregar Supervisor
            </Button>
          </Box>
        )}

        {/* Form Drawer (Inline zoom effect) */}
        {isFormOpen && (
          <Zoom in={isFormOpen}>
            <Paper component="form" onSubmit={handleSave} sx={{ p: 2.5, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                {editingId ? 'Editar Supervisor' : 'Nuevo Supervisor'}
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }}>
                <TextField
                  label="Nombre"
                  required
                  size="small"
                  fullWidth
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <TextField
                  label="Apellido"
                  required
                  size="small"
                  fullWidth
                  value={lastname}
                  onChange={(e) => setLastname(e.target.value)}
                />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }}>
                <TextField
                  label="Email"
                  type="email"
                  size="small"
                  fullWidth
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <TextField
                  label="Teléfono"
                  size="small"
                  fullWidth
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </Stack>
              <Box display="flex" justifyContent="space-between" alignItems="center" mt={2} flexWrap="wrap" gap={1}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={isActive ? 'Activo' : 'Inactivo'}
                />
                <Box display="flex" gap={1}>
                  <Button
                    variant="outlined"
                    startIcon={<CancelIcon />}
                    onClick={resetForm}
                    size="small"
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="contained"
                    type="submit"
                    startIcon={<SaveIcon />}
                    color="primary"
                    size="small"
                  >
                    Guardar
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Zoom>
        )}

        {/* Loading Spinner */}
        {loading && supervisors.length === 0 ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={5}>
            <CircularProgress size={30} />
          </Box>
        ) : (
          /* Table of Supervisors */
          <TableContainer component={Paper} elevation={1} sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell><strong>Supervisor</strong></TableCell>
                  <TableCell><strong>Email</strong></TableCell>
                  <TableCell><strong>Teléfono</strong></TableCell>
                  <TableCell align="center"><strong>Estado</strong></TableCell>
                  <TableCell align="center"><strong>Acciones</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {supervisors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        No hay supervisores registrados para este cliente.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  supervisors.map((supervisor) => (
                    <TableRow key={supervisor.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {supervisor.lastname}, {supervisor.name}
                        </Typography>
                      </TableCell>
                      <TableCell>{supervisor.email || '—'}</TableCell>
                      <TableCell>{supervisor.phone || '—'}</TableCell>
                      <TableCell align="center">
                        <FormControlLabel
                          control={
                            <Switch
                              checked={supervisor.is_active}
                              onChange={() => handleToggleActive(supervisor)}
                              size="small"
                            />
                          }
                          label={supervisor.is_active ? 'Activo' : 'Inactivo'}
                          sx={{ m: 0, '& .MuiFormControlLabel-label': { fontSize: '0.8rem' } }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" justifyContent="center" gap={0.5}>
                          <Tooltip title="Editar">
                            <IconButton size="small" color="primary" onClick={() => handleOpenEdit(supervisor)}>
                              <EditIcon fontSize="inherit" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton size="small" color="error" onClick={() => handleDelete(supervisor.id)}>
                              <DeleteIcon fontSize="inherit" />
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
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined" size="small">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
