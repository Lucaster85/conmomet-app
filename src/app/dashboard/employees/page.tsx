'use client';
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, CircularProgress, Tooltip, TextField, Stack,
  Chip, InputAdornment, Divider, MenuItem, Select, FormControl, InputLabel,
  FormHelperText
} from '@mui/material';
import FeedbackModal from '../../../components/FeedbackModal';
import DateField from '../../../components/DateField';
import AddressAutocomplete from '../../../components/AddressAutocomplete';
import CurrencyInput from '../../../components/CurrencyInput';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Refresh as RefreshIcon, Search as SearchIcon, Visibility as VisibilityIcon,
  Link as LinkIcon, LinkOff as LinkOffIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { Employee, EmployeeService, CreateEmployeeData, User, UserService, CategoryService, Category } from '../../../utils/api';

const STATUS_LABELS: Record<string, { label: string; color: 'success' | 'error' | 'warning' | 'info' }> = {
  active: { label: 'Activo', color: 'success' },
  inactive: { label: 'Inactivo', color: 'error' },
  vacation: { label: 'Vacaciones', color: 'warning' },
  medical_leave: { label: 'Licencia', color: 'info' },
};

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; employee: Employee | null }>({ open: false, employee: null });

  const emptyForm: CreateEmployeeData & { status?: string; pay_type?: string; monthly_salary?: number; vacation_days_override?: number | null } = {
    name: '', lastname: '', dni: '', cuil: '', address: '', phone: '', email: '',
    position: '', hire_date: '', birth_date: '', hourly_rate: 0, pay_type: 'hourly', monthly_salary: 0, notes: '',
    shoe_size: '', shirt_size: '', pant_size: '', user_id: undefined, vacation_days_override: null, category_id: null,
  };
  const [form, setForm] = useState(emptyForm);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await EmployeeService.getAll();
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar empleados');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await UserService.getAll();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await CategoryService.getAll();
      setCategories(data);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  useEffect(() => { loadEmployees(); loadUsers(); loadCategories(); }, []);;

  // Usuarios que NO están vinculados a otro empleado (excepto el que estamos editando)
  const availableUsers = users.filter(u => {
    const linkedToAnother = employees.some(emp => emp.user_id === u.id && emp.id !== editingEmployee?.id);
    return !linkedToAnother;
  });

  const filtered = employees.filter((e) => {
    const q = search.toLowerCase();
    return `${e.name} ${e.lastname} ${e.dni}`.toLowerCase().includes(q);
  });

  const handleOpenCreate = () => {
    setEditingEmployee(null);
    setForm({ ...emptyForm });
    setOpenDialog(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setForm({
      name: emp.name, lastname: emp.lastname, dni: emp.dni, cuil: emp.cuil,
      address: emp.address || '', phone: emp.phone || '', email: emp.email || '',
      position: emp.position || '', hire_date: emp.hire_date, birth_date: emp.birth_date || '', hourly_rate: emp.hourly_rate,
      pay_type: emp.pay_type || 'hourly',
      monthly_salary: emp.monthly_salary || 0,
      notes: emp.notes || '', status: emp.status,
      shoe_size: emp.shoe_size || '', shirt_size: emp.shirt_size || '', pant_size: emp.pant_size || '',
      user_id: emp.user_id || undefined,
      vacation_days_override: emp.vacation_days_override,
      category_id: emp.category_id || null,
    });
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    const isMonthly = form.pay_type === 'monthly';
    if (!form.name || !form.lastname || !form.dni || !form.cuil || !form.hire_date) {
      setError('Nombre, Apellido, DNI, CUIL y Fecha de ingreso son obligatorios');
      return;
    }
    if (!isMonthly && !form.hourly_rate) {
      setError('El valor hora es obligatorio para empleados por hora');
      return;
    }
    if (isMonthly && !form.monthly_salary) {
      setError('El sueldo mensual es obligatorio para empleados mensualizados');
      return;
    }
    try {
      if (editingEmployee) {
        await EmployeeService.update(editingEmployee.id, form);
        setSuccess('Empleado actualizado');
      } else {
        await EmployeeService.create(form);
        setSuccess('Empleado creado');
      }
      setOpenDialog(false);
      loadEmployees();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  const handleUserLink = (userIdVal: string | number) => {
    const uId = userIdVal ? Number(userIdVal) : undefined;
    if (!uId) {
      setForm(prev => ({ ...prev, user_id: undefined }));
      return;
    }

    const u = availableUsers.find(user => user.id === uId);
    if (u) {
      setForm(prev => ({
        ...prev,
        user_id: uId,
        name: u.name || prev.name,
        lastname: u.lastname || prev.lastname,
        email: u.email || prev.email,
        phone: u.phone || prev.phone,
        cuil: !prev.cuil ? u.cuit : prev.cuil, // Only fill cuil if empty
      }));
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.employee) return;
    try {
      await EmployeeService.delete(deleteDialog.employee.id);
      setDeleteDialog({ open: false, employee: null });
      setSuccess('Empleado eliminado');
      loadEmployees();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  const formatCurrency = (val: number) => `$${Number(val).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

  if (loading) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px"><CircularProgress /></Box>;
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Typography variant="h4" fontWeight="bold">Empleados</Typography>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadEmployees} size="small">Actualizar</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate} size="small">Nuevo Empleado</Button>
        </Box>
      </Box>

      {/* Search */}
      <TextField
        placeholder="Buscar por nombre, apellido o DNI..."
        fullWidth size="small" sx={{ mb: 2 }}
        value={search} onChange={(e) => setSearch(e.target.value)}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
      />

      <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />
      <FeedbackModal open={!!success} onClose={() => setSuccess('')} message={success} type="success" />

      {/* Mobile Cards */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {filtered.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={4}>No hay empleados</Typography>
        ) : (
          <Stack spacing={2}>
            {filtered.map((emp) => (
              <Paper key={emp.id} sx={{ p: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box flex={1}>
                    <Typography variant="subtitle1" fontWeight="bold">{emp.lastname}, {emp.name}</Typography>
                    <Typography variant="body2" color="text.secondary">DNI: {emp.dni}</Typography>
                    {emp.position && <Typography variant="body2">{emp.position}</Typography>}
                    <Typography variant="body2" fontWeight="medium">
                      {emp.pay_type === 'monthly' ? `${formatCurrency(emp.monthly_salary || 0)} /mes (Fijo)` : `${formatCurrency(emp.hourly_rate)} /hora`}
                    </Typography>
                    <Chip label={STATUS_LABELS[emp.status]?.label || emp.status} color={STATUS_LABELS[emp.status]?.color || 'default'} size="small" sx={{ mt: 0.5 }} />
                  </Box>
                  <Box>
                    <IconButton size="small" color="info" onClick={() => router.push(`/dashboard/employees/${emp.id}`)}><VisibilityIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="primary" onClick={() => handleOpenEdit(emp)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, employee: emp })}><DeleteIcon fontSize="small" /></IconButton>
                  </Box>
                </Box>
              </Paper>
            ))}
          </Stack>
        )}
      </Box>

      {/* Desktop Table */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <TableContainer component={Paper} elevation={2}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell><strong>Empleado</strong></TableCell>
                <TableCell><strong>DNI</strong></TableCell>
                <TableCell><strong>Puesto</strong></TableCell>
                <TableCell><strong>Remuneración</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell align="center"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><Typography variant="body2" color="text.secondary">No hay empleados</Typography></TableCell></TableRow>
              ) : (
                filtered.map((emp) => (
                  <TableRow key={emp.id} hover>
                    <TableCell>
                      <Typography fontWeight="medium">{emp.lastname}, {emp.name}</Typography>
                      {emp.phone && <Typography variant="caption" color="text.secondary">📞 {emp.phone}</Typography>}
                      {emp.user && (
                        <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                          <LinkIcon sx={{ fontSize: 14 }} color="primary" />
                          <Typography variant="caption" color="primary.main">{emp.user.email}</Typography>
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>{emp.dni}</TableCell>
                    <TableCell>{emp.position || '—'}</TableCell>
                    <TableCell>
                      <Typography variant="body2">{emp.pay_type === 'monthly' ? formatCurrency(emp.monthly_salary || 0) : formatCurrency(emp.hourly_rate)}</Typography>
                      <Typography variant="caption" color="text.secondary">{emp.pay_type === 'monthly' ? 'por mes' : 'por hora'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={STATUS_LABELS[emp.status]?.label || emp.status} color={STATUS_LABELS[emp.status]?.color || 'default'} size="small" />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Ver Legajo"><IconButton size="small" color="info" onClick={() => router.push(`/dashboard/employees/${emp.id}`)}><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Editar"><IconButton size="small" color="primary" onClick={() => handleOpenEdit(emp)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Eliminar"><IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, employee: emp })}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingEmployee ? 'Editar Empleado' : 'Nuevo Empleado'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {!editingEmployee && availableUsers.length > 0 && (
              <Box mb={1}>
                <Typography variant="h6" gutterBottom color="primary.main" sx={{ fontSize: '1.05rem' }}>
                  Vincular Usuario (Opcional)
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Seleccione un usuario existente para autocompletar los datos personales.
                </Typography>
                <FormControl fullWidth variant="outlined">
                  <InputLabel id="user-link-label">Usuario Vinculado</InputLabel>
                  <Select
                    labelId="user-link-label"
                    value={form.user_id || ''}
                    onChange={(e) => handleUserLink(e.target.value as string | number)}
                    label="Usuario Vinculado"
                  >
                    <MenuItem value="">
                      <Box display="flex" alignItems="center" gap={1}>
                        <LinkOffIcon fontSize="small" color="disabled" />
                        <em>Sin usuario vinculado</em>
                      </Box>
                    </MenuItem>
                    {availableUsers.map((u) => (
                      <MenuItem key={u.id} value={u.id}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <LinkIcon fontSize="small" color="primary" />
                          {u.name} {u.lastname} ({u.email})
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    Vincular un usuario permite al empleado acceder al Portal de Autogestión.
                  </FormHelperText>
                </FormControl>
                <Divider sx={{ mt: 3 }} />
              </Box>
            )}

            {editingEmployee && form.user_id && (
              <Box mb={1}>
                <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'block' }}>
                  Cuenta de Usuario Vinculada
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={form.user_id || ''}
                    onChange={(e) => handleUserLink(e.target.value as string | number)}
                    displayEmpty
                  >
                    <MenuItem value="">
                      <Box display="flex" alignItems="center" gap={1}>
                        <LinkOffIcon fontSize="small" color="disabled" />
                        <em>Desvincular usuario</em>
                      </Box>
                    </MenuItem>
                    <MenuItem value={form.user_id}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <LinkIcon fontSize="small" color="primary" />
                        <em>Usuario vinculado (ID: {form.user_id})</em>
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
                <Divider sx={{ mt: 3 }} />
              </Box>
            )}

            <Typography variant="h6" gutterBottom color="primary.main" sx={{ fontSize: '1.05rem', mt: editingEmployee || availableUsers.length > 0 ? 0 : 2 }}>
              Datos Personales
            </Typography>
            <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }}>
              <TextField label="Nombre *" fullWidth value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <TextField label="Apellido *" fullWidth value={form.lastname} onChange={(e) => setForm({ ...form, lastname: e.target.value })} />
            </Box>
            <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }}>
              <TextField label="DNI *" fullWidth value={form.dni} onChange={(e) => setForm({ ...form, dni: e.target.value })} />
              <TextField label="CUIL *" fullWidth value={form.cuil} onChange={(e) => setForm({ ...form, cuil: e.target.value })} />
            </Box>
            <TextField label="Puesto" fullWidth value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="Ej: Soldador, Tornero" />
            <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }}>
              <DateField label="Fecha Ingreso *" fullWidth value={form.hire_date} onChange={(val) => setForm({ ...form, hire_date: val })} InputLabelProps={{ shrink: true }} />
              <DateField label="Fecha Nacimiento" fullWidth value={form.birth_date || ''} onChange={(val) => setForm({ ...form, birth_date: val })} InputLabelProps={{ shrink: true }} />
            </Box>
            <TextField label="Tipo de Pago" select fullWidth value={form.pay_type || 'hourly'} onChange={(e) => setForm({ ...form, pay_type: e.target.value })}
              SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
              <option value="hourly">Jornalizado (por hora)</option>
              <option value="monthly">Mensualizado (sueldo fijo)</option>
            </TextField>
            {form.pay_type === 'monthly' ? (
              <CurrencyInput label="Sueldo Mensual *" fullWidth value={form.monthly_salary || 0} onChange={(value) => setForm({ ...form, monthly_salary: value ?? 0 })} />
            ) : (
              <>
                <CurrencyInput label="Arreglo Particular (valor hora) *" fullWidth value={form.hourly_rate} onChange={(value) => setForm({ ...form, hourly_rate: value ?? 0 })} helperText="Valor hora acordado con el empleado" />
                <Box>
                  <TextField
                    label="Categoría (CCT)"
                    select
                    fullWidth
                    value={form.category_id ?? ''}
                    onChange={(e) => setForm({ ...form, category_id: e.target.value ? Number(e.target.value) : null })}
                    SelectProps={{ native: true }}
                    InputLabelProps={{ shrink: true }}
                    helperText="Categoría del convenio colectivo de trabajo"
                  >
                    <option value="">— Sin categoría —</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </TextField>
                  {form.category_id && categories.find(c => c.id === form.category_id) && (
                    <Box mt={1} p={1.5} sx={{ bgcolor: 'primary.50', borderRadius: 1, border: '1px solid', borderColor: 'primary.200' }}>
                      <Typography variant="caption" color="text.secondary">Valor hora gremio (CCT)</Typography>
                      <Typography variant="body2" fontWeight={700} color="primary.main">
                        ${Number(categories.find(c => c.id === form.category_id)!.guild_hourly_rate).toLocaleString('es-AR', { minimumFractionDigits: 2 })} / hora
                      </Typography>
                    </Box>
                  )}
                </Box>
              </>
            )}
            <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }}>
              <TextField label="Teléfono" fullWidth value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <TextField label="Email" fullWidth value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Box>
            <AddressAutocomplete label="Dirección" fullWidth value={form.address ?? ''} onChange={(v) => setForm({ ...form, address: v })} />
            <Divider sx={{ my: 1 }}>
              <Typography variant="caption" color="text.secondary">Licencias y Vacaciones</Typography>
            </Divider>
            <TextField 
              label="Días de vacaciones (sobre-escribir)" 
              type="number"
              fullWidth 
              value={form.vacation_days_override === null ? '' : form.vacation_days_override} 
              onChange={(e) => setForm({ ...form, vacation_days_override: e.target.value ? Number(e.target.value) : null })} 
              helperText="Dejar vacío para usar la escala legal (Art. 150 LCT). Poner 0 para empleados sin vacaciones."
            />
            <Divider sx={{ my: 1 }}>
              <Typography variant="caption" color="text.secondary">Talles (para EPP)</Typography>
            </Divider>
            <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }}>
              <TextField label="Talle Calzado" fullWidth value={form.shoe_size} onChange={(e) => setForm({ ...form, shoe_size: e.target.value })} placeholder="Ej: 42" />
              <TextField label="Talle Remera" fullWidth value={form.shirt_size} onChange={(e) => setForm({ ...form, shirt_size: e.target.value })} placeholder="Ej: L, XL" />
              <TextField label="Talle Pantalón" fullWidth value={form.pant_size} onChange={(e) => setForm({ ...form, pant_size: e.target.value })} placeholder="Ej: 44, M" />
            </Box>
            <Divider sx={{ my: 1 }} />
            {editingEmployee && (
              <TextField label="Estado" select fullWidth value={form.status || 'active'} onChange={(e) => setForm({ ...form, status: e.target.value })}
                SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
                <option value="vacation">Vacaciones</option>
                <option value="medical_leave">Licencia Médica</option>
              </TextField>
            )}
            <TextField label="Notas" fullWidth multiline rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">{editingEmployee ? 'Guardar' : 'Crear'}</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, employee: null })}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>¿Eliminar a <strong>{deleteDialog.employee?.name} {deleteDialog.employee?.lastname}</strong>?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, employee: null })}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Eliminar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
