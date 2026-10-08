'use client';
import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Divider,
  MenuItem,
} from '@mui/material';
import { SaveOutlined as SaveIcon } from '@mui/icons-material';
import {
  ClientService,
  CreateClientData,
  Client
} from '../../../utils/api';
import GearSpinner from '../../../components/GearSpinner';
import { maskCuit, isValidCuit, formatCuit, TAX_CONDITION_LABELS, TaxCondition } from '../../../utils/cuit';

interface ClientFormProps {
  client?: Client;
  onSuccessAction: () => void;
  onCancel?: () => void;
}

export default function ClientForm({ client, onSuccessAction, onCancel }: ClientFormProps) {
  const isEditing = !!client;

  const [formData, setFormData] = useState<CreateClientData>({
    razonSocial: client?.razonSocial || '',
    email: client?.email || '',
    phone: client?.phone || '',
    tax_condition: client?.tax_condition || null,
  });
  // El CUIT se edita con la máscara XX-XXXXXXXX-X y se envía solo con dígitos.
  const [cuit, setCuit] = useState(formatCuit(client?.cuit));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
    if (!formData.razonSocial.trim()) return 'El nombre o razón social es obligatorio';
    if (!formData.email.trim()) return 'El email es obligatorio';
    
    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return 'El email no tiene un formato válido';
    }

    if (cuit && !isValidCuit(cuit)) {
      return 'El CUIT no es válido: revisá los 11 dígitos (el último es verificador)';
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

      const payload: CreateClientData = { ...formData, cuit: cuit ? cuit.replace(/\D/g, '') : null };

      if (isEditing && client) {
        await ClientService.update(client.id, payload);
        setSuccess('Cliente actualizado exitosamente');
      } else {
        await ClientService.create(payload);
        setSuccess('Cliente creado exitosamente');
      }
      
      // Llamar callback de éxito después de un breve delay
      setTimeout(() => {
        onSuccessAction();
      }, 1000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar cliente');
    } finally {
      setLoading(false);
    }
  };

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
          Información del Cliente
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
            placeholder="Ingrese la razón social o nombre"
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
            placeholder="cliente@ejemplo.com"
            required
          />
        </Box>

        {/* Datos fiscales: los usa Facturación y dejan preparada la integración con ARCA */}
        <Divider sx={{ my: 2 }} />
        <Typography variant="h6" gutterBottom>
          Datos Fiscales
        </Typography>

        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2
        }}>
          <TextField
            fullWidth
            label="CUIT"
            name="cuit"
            value={cuit}
            onChange={(e) => setCuit(maskCuit(e.target.value))}
            placeholder="30-12345678-9"
            inputProps={{ inputMode: 'numeric' }}
            error={cuit.length === 13 && !isValidCuit(cuit)}
            helperText={cuit.length === 13 && !isValidCuit(cuit) ? 'El dígito verificador no coincide' : 'Opcional'}
          />
          <TextField
            select
            fullWidth
            label="Condición frente al IVA"
            value={formData.tax_condition || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, tax_condition: (e.target.value || null) as TaxCondition | null }))}
            helperText="Opcional"
          >
            <MenuItem value=""><em>Sin especificar</em></MenuItem>
            {(Object.keys(TAX_CONDITION_LABELS) as TaxCondition[]).map((key) => (
              <MenuItem key={key} value={key}>{TAX_CONDITION_LABELS[key]}</MenuItem>
            ))}
          </TextField>
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
            label="Teléfono"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="011-1234-5678"
          />
        </Box>

        {/* Botones */}
        <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
          {onCancel && (
            <Button onClick={onCancel} disabled={loading}>
              Cancelar
            </Button>
          )}
          <Button
            type="submit"
            variant="contained"
            startIcon={loading ? <GearSpinner size={20} /> : <SaveIcon />}
            disabled={loading}
            size="large"
          >
            {loading ? (isEditing ? 'Guardando...' : 'Creando...') : (isEditing ? 'Guardar Cambios' : 'Crear Cliente')}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}