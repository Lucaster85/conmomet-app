'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Typography,
  Alert,
  CircularProgress,
  FormGroup,
  Paper,
  Divider,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { 
  UserService, 
  RoleService, 
  PermissionService, 
  Role, 
  Permission, 
  CreateUserData 
} from '../../../utils/api';

interface CreateUserFormProps {
  onSuccessAction: () => void;
}

export default function CreateUserForm({ onSuccessAction }: CreateUserFormProps) {
  const [formData, setFormData] = useState<CreateUserData>({
    name: '',
    lastname: '',
    email: '',
    password: '',
    role_id: 0,
    cuit: '',
    phone: '',
    celphone: '',
    permissions: [],
  });

  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Cargar roles y permisos al montar el componente
  useEffect(() => {
    console.log('🚀 CreateUserForm useEffect ejecutándose...');
    const loadData = async () => {
      try {
        setLoadingData(true);
        console.log('📥 Iniciando carga de roles y permisos...');
        const [rolesData, permissionsData] = await Promise.all([
          RoleService.getAll(),
          PermissionService.getAll(),
        ]);
        
        console.log('📋 Datos recibidos:', { rolesData, permissionsData });
        
        // Asegurar que los datos sean arrays
        setRoles(Array.isArray(rolesData) ? rolesData : []);
        setPermissions(Array.isArray(permissionsData) ? permissionsData : []);
      } catch (err) {
        console.error('Error loading roles and permissions:', err);
        setError('Error al cargar datos de roles y permisos');
        // Resetear a arrays vacíos en caso de error
        setRoles([]);
        setPermissions([]);
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, []);

  // Manejar cambios en los campos del formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Manejar cambios en el select de rol
  const handleRoleChange = (event: any) => {
    setFormData(prev => ({
      ...prev,
      role_id: event.target.value,
    }));
  };

  // Manejar cambios en los permisos
  const handlePermissionChange = (permissionId: number, checked: boolean) => {
    setFormData(prev => {
      const newPermissions = checked
        ? [...(prev.permissions || []), permissionId]
        : (prev.permissions || []).filter(id => id !== permissionId);
      
      return {
        ...prev,
        permissions: newPermissions,
      };
    });
  };

  // Validar formulario
  const validateForm = (): string | null => {
    if (!formData.name.trim()) return 'El nombre es obligatorio';
    if (!formData.lastname.trim()) return 'El apellido es obligatorio';
    if (!formData.email.trim()) return 'El email es obligatorio';
    if (!formData.password.trim()) return 'La contraseña es obligatoria';
    if (!formData.role_id) return 'Debe seleccionar un rol';
    if (!formData.cuit.trim()) return 'El CUIT es obligatorio';
    
    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return 'El email no tiene un formato válido';
    }
    
    // Validar CUIT (debe ser numérico)
    if (!/^\d+$/.test(formData.cuit)) {
      return 'El CUIT debe contener solo números';
    }
    
    // Validar contraseña
    if (formData.password.length < 6) {
      return 'La contraseña debe tener al menos 6 caracteres';
    }

    return null;
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      await UserService.create(formData);
      setSuccess('Usuario creado exitosamente');
      
      // Resetear formulario
      setFormData({
        name: '',
        lastname: '',
        email: '',
        password: '',
        role_id: 0,
        cuit: '',
        phone: '',
        celphone: '',
        permissions: [],
      });

      // Llamar callback de éxito después de un breve delay
      setTimeout(() => {
        onSuccessAction();
      }, 1500);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear usuario');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ p: 2 }}>
      {/* Alertas */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Información Personal */}
        <Typography variant="h6" gutterBottom>
          Información Personal
        </Typography>

        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' }, 
          gap: 2 
        }}>
          <TextField
            fullWidth
            label="Nombre *"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Ingrese el nombre"
            required
          />

          <TextField
            fullWidth
            label="Apellido *"
            name="lastname"
            value={formData.lastname}
            onChange={handleInputChange}
            placeholder="Ingrese el apellido"
            required
          />
        </Box>

        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' }, 
          gap: 2 
        }}>
          <TextField
            fullWidth
            label="Email *"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="usuario@ejemplo.com"
            required
          />

          <TextField
            fullWidth
            label="Contraseña *"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Mínimo 6 caracteres"
            required
          />
        </Box>

        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' }, 
          gap: 2 
        }}>
          <TextField
            fullWidth
            label="CUIT *"
            name="cuit"
            value={formData.cuit}
            onChange={handleInputChange}
            placeholder="11111111111"
            required
          />

          <FormControl fullWidth required>
            <InputLabel>Rol *</InputLabel>
            <Select
              value={formData.role_id}
              onChange={handleRoleChange}
              label="Rol *"
            >
              <MenuItem value={0} disabled>
                {Array.isArray(roles) && roles.length > 0 ? 'Seleccione un rol' : 'No hay roles disponibles'}
              </MenuItem>
              {Array.isArray(roles) && roles.map((role) => (
                <MenuItem key={role.id} value={role.id}>
                  {role.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Información de Contacto */}
        <Divider sx={{ my: 2 }} />
        <Typography variant="h6" gutterBottom>
          Información de Contacto
        </Typography>

        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' }, 
          gap: 2 
        }}>
          <TextField
            fullWidth
            label="Teléfono Fijo"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="011-1234-5678"
          />

          <TextField
            fullWidth
            label="Teléfono Celular"
            name="celphone"
            value={formData.celphone}
            onChange={handleInputChange}
            placeholder="11-1234-5678"
          />
        </Box>

        {/* Permisos Adicionales */}
        <Divider sx={{ my: 2 }} />
        <Typography variant="h6" gutterBottom>
          Permisos Adicionales (Opcional)
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Los permisos del rol se asignan automáticamente. Aquí puede agregar permisos adicionales.
        </Typography>

        <Paper variant="outlined" sx={{ p: 2, maxHeight: 200, overflow: 'auto' }}>
          <FormGroup>
            {Array.isArray(permissions) && permissions.length > 0 ? (
              permissions.map((permission) => (
                <FormControlLabel
                  key={permission.id}
                  control={
                    <Checkbox
                      checked={formData.permissions?.includes(permission.id) || false}
                      onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                    />
                  }
                  label={permission.name}
                />
              ))
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                No hay permisos disponibles
              </Typography>
            )}
          </FormGroup>
        </Paper>

        {/* Botones */}
        <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
          <Button
            type="submit"
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
            disabled={loading}
            size="large"
          >
            {loading ? 'Creando...' : 'Crear Usuario'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}