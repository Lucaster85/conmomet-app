'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { 
  ClientService, 
  CreateClientData 
} from '../../../utils/api';

interface CreateClientFormProps {
  onSuccessAction: () => void;
}

export default function CreateClientForm({ onSuccessAction }: CreateClientFormProps) {
  const [formData, setFormData] = useState<CreateClientData>({
    razonSocial: '',
    email: '',
    phone: '',
  });

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Cargar roles y permisos al montar el componente
  useEffect(() => {
    console.log('🚀 CreateClientForm useEffect ejecutándose...');
  }, []);

  // Manejar cambios en los campos del formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Validar formulario
  const validateForm = (): string | null => {
    if (!formData.razonSocial.trim()) return 'El nombre es obligatorio';
    if (!formData.email.trim()) return 'El email es obligatorio';
    
    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return 'El email no tiene un formato válido';
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

      await ClientService.create(formData);
      setSuccess('Cliente creado exitosamente');
      
      // Resetear formulario
      setFormData({
        razonSocial: '',
        email: '',
        phone: '',
      });

      // Llamar callback de éxito después de un breve delay
      setTimeout(() => {
        onSuccessAction();
      }, 1500);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear cliente');
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
            label="Razon Social *"
            name="razonSocial"
            value={formData.razonSocial}
            onChange={handleInputChange}
            placeholder="Ingrese la razón social"
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
        </Box>

        {/* Botones */}
        <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
          <Button
            type="submit"
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
            disabled={loading}
            size="large"
          >
            {loading ? 'Creando...' : 'Crear Cliente'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}