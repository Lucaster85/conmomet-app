'use client';
import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Checkbox,
  FormControlLabel,
  Tooltip,
  Divider,
  InputAdornment,
  Grid,
  Switch,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
  Search as SearchIcon,
  Key as KeyIcon,
} from '@mui/icons-material';
import { RoleService, PermissionService, Role, Permission } from '@/utils/api';

function toErrorMsg(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  try { return JSON.stringify(err); } catch { return 'Error desconocido'; }
}

// Permisos sugeridos para el sistema
const SUGGESTED_PERMISSIONS = [
  'admin_granted',
  'users_read', 'users_write', 'users_update', 'users_delete',
  'roles_read', 'roles_write', 'roles_update', 'roles_delete',
  'permissions_read', 'permissions_write', 'permissions_update', 'permissions_delete',
  'media_read', 'media_write', 'media_update', 'media_delete',
  'clients_read', 'clients_write', 'clients_update', 'clients_delete',
  'providers_read', 'providers_write', 'providers_update', 'providers_delete',
];

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create / Edit role dialog
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleHasDashboardAccess, setRoleHasDashboardAccess] = useState(true);
  const [savingRole, setSavingRole] = useState(false);

  // Delete role dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Manage permissions dialog
  const [permDialogOpen, setPermDialogOpen] = useState(false);
  const [permTarget, setPermTarget] = useState<Role | null>(null);
  const [selectedPermIds, setSelectedPermIds] = useState<Set<number>>(new Set());
  const [savingPerms, setSavingPerms] = useState(false);
  const [permSearch, setPermSearch] = useState('');

  // Create permission dialog
  const [createPermOpen, setCreatePermOpen] = useState(false);
  const [newPermName, setNewPermName] = useState('');
  const [creatingPerm, setCreatingPerm] = useState(false);
  const [createPermError, setCreatePermError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rolesData, permsData] = await Promise.all([
        RoleService.getAll(),
        PermissionService.getAll(),
      ]);
      setRoles(rolesData);
      setPermissions(permsData);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === 'string'
          ? err
          : 'Error al cargar los datos';
      setError(
        msg === 'Sin autorización' || msg === 'Unauthoriced' || msg === 'UNAUTHORIZED'
          ? 'No tenés permisos para ver roles. Reiniciá el servidor para que el seeder asigne admin_granted al rol admin, luego volvé a iniciar sesión.'
          : msg
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Role CRUD ---
  const handleOpenCreate = () => {
    setEditingRole(null);
    setRoleName('');
    setRoleHasDashboardAccess(true);
    setRoleDialogOpen(true);
  };

  const handleOpenEdit = (role: Role) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleHasDashboardAccess(role.has_dashboard_access ?? true);
    setRoleDialogOpen(true);
  };

  const handleSaveRole = async () => {
    if (!roleName.trim()) return;
    setSavingRole(true);
    try {
      if (editingRole) {
        await RoleService.update(editingRole.id, roleName.trim(), roleHasDashboardAccess);
      } else {
        await RoleService.create(roleName.trim(), roleHasDashboardAccess);
      }
      setRoleDialogOpen(false);
      fetchData();
    } catch (err: unknown) {
      setError(toErrorMsg(err));
    } finally {
      setSavingRole(false);
    }
  };

  const handleOpenDelete = (role: Role) => {
    setDeleteTarget(role);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await RoleService.delete(deleteTarget.id);
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      fetchData();
    } catch (err: unknown) {
      setError(toErrorMsg(err));
    } finally {
      setDeleting(false);
    }
  };

  // --- Permissions management ---
  const handleOpenPerms = (role: Role) => {
    setPermTarget(role);
    const currentIds = new Set((role.permissions || []).map(p => p.id));
    setSelectedPermIds(currentIds);
    setPermSearch('');
    setPermDialogOpen(true);
  };

  const togglePerm = (id: number) => {
    setSelectedPermIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSavePerms = async () => {
    if (!permTarget) return;
    setSavingPerms(true);
    try {
      await RoleService.setPermissions(permTarget.id, Array.from(selectedPermIds));
      setPermDialogOpen(false);
      fetchData();
    } catch (err: unknown) {
      setError(toErrorMsg(err));
    } finally {
      setSavingPerms(false);
    }
  };

  // --- Create permission ---
  const handleCreatePerm = async () => {
    if (!newPermName.trim()) return;
    setCreatingPerm(true);
    setCreatePermError(null);
    try {
      const created = await PermissionService.create([newPermName.trim()]);
      setPermissions(prev => [...prev, ...created]);
      // Auto-select newly created permission if managing a role
      if (created.length > 0) {
        setSelectedPermIds(prev => new Set([...prev, created[0].id]));
      }
      setNewPermName('');
      setCreatePermOpen(false);
    } catch (err: unknown) {
      setCreatePermError(toErrorMsg(err));
    } finally {
      setCreatingPerm(false);
    }
  };

  const handleDeletePerm = async (perm: Permission) => {
    try {
      await PermissionService.delete(perm.id);
      setPermissions(prev => prev.filter(p => p.id !== perm.id));
      setSelectedPermIds(prev => { const next = new Set(prev); next.delete(perm.id); return next; });
    } catch (err: unknown) {
      setError(toErrorMsg(err));
    }
  };

  const filteredPermissions = permissions.filter(p =>
    p.name.toLowerCase().includes(permSearch.toLowerCase())
  );

  const missingSuggested = SUGGESTED_PERMISSIONS.filter(
    name => !permissions.some(p => p.name === name)
  );

  const handleCreateSuggestedBulk = async () => {
    if (missingSuggested.length === 0) return;
    try {
      const created = await PermissionService.create(missingSuggested);
      setPermissions(prev => [...prev, ...created]);
    } catch (err: unknown) {
      setError(toErrorMsg(err));
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h5" fontWeight={700} letterSpacing="-0.02em" color="#1E293B">
            Roles y Permisos
          </Typography>
          <Typography variant="body2" color="#64748B" mt={0.5}>
            Gestioná los roles y sus permisos de acceso
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
        >
          Nuevo rol
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2, borderRadius: '10px' }}>
          {error}
        </Alert>
      )}

      {/* Suggested permissions banner */}
      {!loading && missingSuggested.length > 0 && (
        <Alert
          severity="warning"
          sx={{ mb: 3, borderRadius: '10px' }}
          action={
            <Button color="inherit" size="small" onClick={handleCreateSuggestedBulk}
              sx={{ textTransform: 'none', fontWeight: 600 }}>
              Crear todos
            </Button>
          }
        >
          Faltan {missingSuggested.length} permisos del sistema ({missingSuggested.slice(0, 3).join(', ')}{missingSuggested.length > 3 ? '...' : ''}). Creá los permisos sugeridos para habilitar el acceso.
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {roles.map(role => (
            <Grid key={role.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card sx={{
                borderRadius: '16px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
                border: '1px solid rgba(0,0,0,0.06)',
                transition: 'all 0.2s ease-in-out',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.08)' },
              }}>
                <CardContent sx={{ pb: 1 }}>
                  <Stack direction="row" alignItems="center" gap={1} mb={1.5}>
                    <SecurityIcon sx={{ color: '#1976d2', fontSize: 20 }} />
                    <Typography variant="h6" fontWeight={600} color="#1E293B" fontSize="1rem">
                      {role.name}
                    </Typography>
                    {role.has_dashboard_access === false && (
                       <Chip label="Solo Portal" size="small" color="warning" sx={{ height: 20, fontSize: '0.65rem' }} />
                    )}
                  </Stack>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, minHeight: 32 }}>
                    {(role.permissions || []).length === 0 ? (
                      <Typography variant="caption" color="#94A3B8" fontStyle="italic">
                        Sin permisos asignados
                      </Typography>
                    ) : (
                      (role.permissions || []).map(p => (
                        <Chip
                          key={p.id}
                          label={p.name}
                          size="small"
                          sx={{
                            fontSize: '0.7rem',
                            height: 22,
                            bgcolor: p.name === 'admin_granted' ? 'rgba(25,118,210,0.12)' : 'rgba(100,116,139,0.1)',
                            color: p.name === 'admin_granted' ? '#1976d2' : '#475569',
                            fontWeight: p.name === 'admin_granted' ? 700 : 400,
                          }}
                        />
                      ))
                    )}
                  </Box>
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2, pt: 0.5 }}>
                  <Button
                    size="small"
                    startIcon={<KeyIcon fontSize="small" />}
                    onClick={() => handleOpenPerms(role)}
                    sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' }}
                  >
                    Permisos
                  </Button>
                  <Box sx={{ flex: 1 }} />
                  <Tooltip title="Editar nombre">
                    <IconButton size="small" onClick={() => handleOpenEdit(role)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Eliminar rol">
                    <IconButton size="small" color="error" onClick={() => handleOpenDelete(role)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          ))}

          {roles.length === 0 && (
            <Grid size={{ xs: 12 }}>
              <Box textAlign="center" py={8} color="#94A3B8">
                <SecurityIcon sx={{ fontSize: 48, mb: 1 }} />
                <Typography>No hay roles creados todavía.</Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      )}

      {/* Permissions list section */}
      {!loading && (
        <Box mt={5}>
          <Divider sx={{ mb: 3 }} />
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
            <Typography variant="h6" fontWeight={600} color="#1E293B">
              Permisos disponibles ({permissions.length})
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => { setNewPermName(''); setCreatePermError(null); setCreatePermOpen(true); }}
              sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
            >
              Nuevo permiso
            </Button>
          </Stack>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {permissions.map(p => (
              <Chip
                key={p.id}
                label={p.name}
                onDelete={() => handleDeletePerm(p)}
                sx={{
                  bgcolor: p.name === 'admin_granted' ? 'rgba(25,118,210,0.1)' : 'rgba(100,116,139,0.08)',
                  color: p.name === 'admin_granted' ? '#1976d2' : '#475569',
                  fontWeight: p.name === 'admin_granted' ? 700 : 400,
                  '& .MuiChip-deleteIcon': { color: 'rgba(0,0,0,0.3)', '&:hover': { color: '#ef4444' } },
                }}
              />
            ))}
            {permissions.length === 0 && (
              <Typography variant="body2" color="#94A3B8" fontStyle="italic">
                No hay permisos creados. Usá &quot;Crear todos&quot; en el aviso de arriba para empezar rápido.
              </Typography>
            )}
          </Box>
        </Box>
      )}

      {/* Create / Edit Role dialog */}
      <Dialog open={roleDialogOpen} onClose={() => setRoleDialogOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle fontWeight={700}>
          {editingRole ? 'Editar rol' : 'Nuevo rol'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Nombre del rol"
            value={roleName}
            onChange={e => setRoleName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSaveRole(); }}
            sx={{ mt: 1, mb: 3 }}
            inputProps={{ maxLength: 50 }}
          />
          <FormControlLabel
            control={<Switch checked={roleHasDashboardAccess} onChange={e => setRoleHasDashboardAccess(e.target.checked)} color="primary" />}
            label={<Typography fontWeight={600}>Acceso al Dashboard</Typography>}
          />
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5, ml: 4 }}>
            Si se desactiva, los usuarios con este rol solo podrán acceder a su Portal del Empleado (útil para operarios).
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setRoleDialogOpen(false)} sx={{ textTransform: 'none' }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveRole}
            disabled={!roleName.trim() || savingRole}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}
          >
            {savingRole ? <CircularProgress size={18} color="inherit" /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Role dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle fontWeight={700}>Eliminar rol</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que querés eliminar el rol <strong>{deleteTarget?.name}</strong>? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ textTransform: 'none' }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={deleting}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}
          >
            {deleting ? <CircularProgress size={18} color="inherit" /> : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manage Permissions dialog */}
      <Dialog open={permDialogOpen} onClose={() => setPermDialogOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle fontWeight={700}>
          Permisos de &quot;{permTarget?.name}&quot;
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            placeholder="Buscar permiso..."
            value={permSearch}
            onChange={e => setPermSearch(e.target.value)}
            size="small"
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: '#94A3B8' }} />
                </InputAdornment>
              ),
            }}
          />

          {filteredPermissions.length === 0 ? (
            <Typography variant="body2" color="#94A3B8" textAlign="center" py={2}>
              {permissions.length === 0
                ? 'No hay permisos creados aún. Creá permisos desde la sección inferior.'
                : 'No se encontraron permisos con ese nombre.'}
            </Typography>
          ) : (
            <Box sx={{ maxHeight: 320, overflowY: 'auto' }}>
              {filteredPermissions.map(p => (
                <FormControlLabel
                  key={p.id}
                  control={
                    <Checkbox
                      checked={selectedPermIds.has(p.id)}
                      onChange={() => togglePerm(p.id)}
                      size="small"
                    />
                  }
                  label={
                    <Typography
                      variant="body2"
                      fontWeight={p.name === 'admin_granted' ? 700 : 400}
                      color={p.name === 'admin_granted' ? '#1976d2' : '#1E293B'}
                    >
                      {p.name}
                    </Typography>
                  }
                  sx={{ display: 'flex', m: 0, py: 0.5, '&:hover': { bgcolor: '#F8FAFC', borderRadius: '6px' } }}
                />
              ))}
            </Box>
          )}

          <Divider sx={{ my: 2 }} />
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={() => { setNewPermName(''); setCreatePermError(null); setCreatePermOpen(true); }}
            sx={{ textTransform: 'none', fontSize: '0.8rem' }}
          >
            Crear nuevo permiso
          </Button>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Typography variant="caption" color="#64748B" sx={{ flex: 1 }}>
            {selectedPermIds.size} permiso{selectedPermIds.size !== 1 ? 's' : ''} seleccionado{selectedPermIds.size !== 1 ? 's' : ''}
          </Typography>
          <Button onClick={() => setPermDialogOpen(false)} sx={{ textTransform: 'none' }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSavePerms}
            disabled={savingPerms}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}
          >
            {savingPerms ? <CircularProgress size={18} color="inherit" /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Permission dialog */}
      <Dialog open={createPermOpen} onClose={() => setCreatePermOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle fontWeight={700}>Nuevo permiso</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Nombre del permiso"
            placeholder="ej: media_read"
            value={newPermName}
            onChange={e => setNewPermName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreatePerm(); }}
            helperText={createPermError || 'Formato sugerido: recurso_acción (ej: users_read)'}
            error={!!createPermError}
            sx={{ mt: 1 }}
            inputProps={{ maxLength: 60 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setCreatePermOpen(false)} sx={{ textTransform: 'none' }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleCreatePerm}
            disabled={!newPermName.trim() || creatingPerm}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}
          >
            {creatingPerm ? <CircularProgress size={18} color="inherit" /> : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
