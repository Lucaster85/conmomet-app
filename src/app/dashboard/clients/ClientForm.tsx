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
import { SaveOutlined as SaveIcon, SearchOutlined as SearchIcon } from '@mui/icons-material';
import {
  ClientService,
  CreateClientData,
  Client,
  PadronPerson
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
    fce_transfer_option: client?.fce_transfer_option || null,
    fiscal_street: client?.fiscal_street || '',
    fiscal_locality: client?.fiscal_locality || '',
    fiscal_province: client?.fiscal_province || '',
  });
  // El CUIT se edita con la máscara XX-XXXXXXXX-X y se envía solo con dígitos.
  const [cuit, setCuit] = useState(formatCuit(client?.cuit));

  const [loading, setLoading] = useState(false);
  // Consulta del CUIT en el padrón de ARCA (FLOWS.md §73): completa lo que esté vacío y avisa qué se completó.
  const [padronLoading, setPadronLoading] = useState(false);
  const [padronMessage, setPadronMessage] = useState<{ severity: 'success' | 'warning' | 'info'; text: string } | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handlePadronLookup = async () => {
    setPadronLoading(true);
    setPadronMessage(null);
    try {
      const person: PadronPerson = await ClientService.padronLookup(cuit);
      const filled: string[] = [];
      setFormData((prev) => {
        const next = { ...prev };
        // Solo se completa lo vacío: lo que ya cargó una persona no se pisa. La condición de IVA y el domicilio fiscal vienen de ARCA, así que esos sí se completan.
        if (!prev.razonSocial.trim() && person.legal_name) { next.razonSocial = person.legal_name; filled.push('razón social'); }
        if (person.tax_condition && prev.tax_condition !== person.tax_condition) { next.tax_condition = person.tax_condition; filled.push('condición frente al IVA'); }
        for (const [key, label] of [['fiscal_street', 'calle'], ['fiscal_locality', 'localidad'], ['fiscal_province', 'provincia']] as const) {
          const value = person[key];
          if (value && !prev[key]) { next[key] = value; filled.push(label); }
        }
        return next;
      });
      const status = person.status && person.status !== 'ACTIVO' ? ` · ATENCIÓN: la clave figura ${person.status}` : '';
      const name = person.legal_name ? `${person.legal_name}${status}` : 'sin nombre';
      const duplicate = person.existing_client && person.existing_client.id !== client?.id ? ` Ya hay un cliente con este CUIT: ${person.existing_client.razonSocial}.` : '';
      setPadronMessage({
        severity: duplicate || status ? 'warning' : 'success',
        text: `ARCA: ${name}.${filled.length ? ` Se completó: ${filled.join(', ')}.` : ' No había nada vacío para completar.'}${duplicate} Revisá los datos antes de guardar.`,
      });
    } catch (err) {
      setPadronMessage({ severity: 'warning', text: err instanceof Error ? err.message : 'No se pudo consultar el padrón de ARCA' });
    } finally {
      setPadronLoading(false);
    }
  };

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
            InputProps={{
              endAdornment: (
                <Button size="small" startIcon={<SearchIcon />} onClick={handlePadronLookup} disabled={!isValidCuit(cuit) || padronLoading} sx={{ whiteSpace: 'nowrap' }}>
                  {padronLoading ? 'Buscando…' : 'Buscar en ARCA'}
                </Button>
              ),
            }}
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
        {padronMessage && <Alert severity={padronMessage.severity} onClose={() => setPadronMessage(null)}>{padronMessage.text}</Alert>}

        <TextField
          select
          fullWidth
          label="Opción de transferencia de la FCE"
          value={formData.fce_transfer_option || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, fce_transfer_option: (e.target.value || null) as 'SCA' | 'ADC' | null }))}
          helperText="Para la Factura de Crédito Electrónica. Sin elegir, se usa la de la empresa. Algunos clientes piden una en particular (por ejemplo, ADC)."
          sx={{ mt: 2 }}
        >
          <MenuItem value=""><em>La de la empresa</em></MenuItem>
          <MenuItem value="SCA">SCA — Sistema de circulación abierta</MenuItem>
          <MenuItem value="ADC">ADC — Agente de depósito colectivo</MenuItem>
        </TextField>

        {/* Domicilio comercial fiscal: el del padrón de ARCA (puede no coincidir con el de la obra o la OC). Sale en la factura. */}
        <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
          Domicilio comercial fiscal (opcional, sale en la factura)
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
          <TextField fullWidth label="Calle y número" name="fiscal_street" value={formData.fiscal_street || ''} onChange={handleInputChange} inputProps={{ maxLength: 150 }} />
          <TextField fullWidth label="Localidad" name="fiscal_locality" value={formData.fiscal_locality || ''} onChange={handleInputChange} inputProps={{ maxLength: 100 }} />
          <TextField fullWidth label="Provincia" name="fiscal_province" value={formData.fiscal_province || ''} onChange={handleInputChange} inputProps={{ maxLength: 100 }} />
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