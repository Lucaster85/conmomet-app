'use client';
import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AppDialog from '@/components/common/AppDialog';
import { CloseOutlined as CloseIcon, SendOutlined as SendIcon } from '@mui/icons-material';
import GearSpinner from '../GearSpinner';
import { CONTACT_REASON_OPTIONS } from '../../utils/contactInquiries';

const API_BASE_URL =
  (typeof window !== 'undefined' && (window as { __ENV__?: { API_BASE_URL?: string } }).__ENV__?.API_BASE_URL) ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://localhost:4000';

interface ContactModalProps {
  open: boolean;
  onClose: () => void;
}

interface FormData {
  motivo: string;
  nombre: string;
  empresa: string;
  telefono: string;
  email: string;
  mensaje: string;
  // Campo trampa (ver FLOWS.md §58): oculto para las personas; un bot que completa todo lo que
  // encuentra lo llena, y el servidor descarta ese envío sin avisarle.
  website: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const initialForm: FormData = {
  motivo: '',
  nombre: '',
  empresa: '',
  telefono: '',
  email: '',
  mensaje: '',
  website: '',
};

// El form tiene noValidate (para mostrar nuestros propios mensajes), así que la validación mínima
// es nuestra. El servidor repite estas mismas reglas.
function validate(form: FormData): Partial<Record<keyof FormData | 'contacto', string>> {
  const errors: Partial<Record<keyof FormData | 'contacto', string>> = {};
  if (!form.motivo) errors.motivo = 'Elegí el motivo de tu consulta.';
  if (!form.nombre.trim()) errors.nombre = 'Ingresá tu nombre.';
  if (!form.mensaje.trim()) errors.mensaje = 'Escribí tu mensaje.';
  const email = form.email.trim();
  const phone = form.telefono.trim();
  if (!email && !phone) errors.contacto = 'Dejanos un teléfono o un email para poder responderte.';
  if (email && !EMAIL_RE.test(email)) errors.email = 'El email no es válido.';
  return errors;
}

export default function ContactModal({ open, onClose }: ContactModalProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [form, setForm] = useState<FormData>(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<ReturnType<typeof validate>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const next = { ...form, [e.target.name]: e.target.value };
    setForm(next);
    // Una vez que intentó enviar, los errores se actualizan mientras corrige.
    if (submitted) setErrors(validate(next));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate(form);
    setSubmitted(true);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/public/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        // El servidor responde un texto legible en 400 (datos inválidos) y 429 (demasiados envíos).
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'No pudimos enviar tu mensaje. Probá de nuevo en unos minutos.');
      }

      setSuccess(true);
      setForm(initialForm);
      setSubmitted(false);
      setErrors({});
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error al enviar el mensaje.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
    setForm(initialForm);
    setError(null);
    setSuccess(false);
    setSubmitted(false);
    setErrors({});
  };

  return (
    <AppDialog
      open={open}
      onClose={handleClose}
      fullScreen={fullScreen}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : '16px',
          p: 0,
        },
      }}
    >
      <DialogTitle
        sx={{
          px: 3,
          pt: 3,
          pb: 1,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700} letterSpacing="-0.02em">
            Contactanos
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Completá el formulario y te respondemos a la brevedad.
          </Typography>
        </Box>
        <IconButton
          onClick={handleClose}
          size="small"
          sx={{ mt: '-4px', mr: '-8px', color: 'text.secondary' }}
          aria-label="Cerrar"
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pt: 2, pb: 3 }}>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {error && <Alert severity="error">{error}</Alert>}
            {success && <Alert severity="success">¡Mensaje enviado! Te contactaremos a la brevedad.</Alert>}
            <TextField
              select
              label="Motivo de la consulta"
              name="motivo"
              value={form.motivo}
              onChange={handleChange}
              required
              fullWidth
              error={!!errors.motivo}
              helperText={errors.motivo}
            >
              {CONTACT_REASON_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Nombre"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              required
              fullWidth
              autoComplete="name"
              error={!!errors.nombre}
              helperText={errors.nombre}
            />
            <TextField
              label="Empresa (opcional)"
              name="empresa"
              value={form.empresa}
              onChange={handleChange}
              fullWidth
              autoComplete="organization"
            />
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField
                label="Teléfono"
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                fullWidth
                error={!!errors.contacto}
                autoComplete="tel"
                inputProps={{ inputMode: 'tel' }}
              />
              <TextField
                label="Email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                fullWidth
                autoComplete="email"
                error={!!errors.contacto || !!errors.email}
                helperText={errors.email}
              />
            </Box>
            <Typography variant="caption" color={errors.contacto ? 'error' : 'text.secondary'} sx={{ mt: -1 }}>
              {errors.contacto || 'Completá al menos uno: teléfono o email.'}
            </Typography>
            <TextField
              label="Mensaje"
              name="mensaje"
              value={form.mensaje}
              onChange={handleChange}
              required
              fullWidth
              multiline
              rows={4}
              autoComplete="off"
              error={!!errors.mensaje}
              helperText={errors.mensaje}
            />
            {/* Campo trampa: fuera de pantalla, sin foco ni autocompletado ni lectura por lectores de
                pantalla. Una persona nunca lo ve; un bot sí lo completa (ver FLOWS.md §58). */}
            <Box aria-hidden sx={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
              <label>
                No completar este campo
                <input
                  type="text"
                  name="website"
                  value={form.website}
                  onChange={handleChange}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </label>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
              <Box
                component="img"
                src="/brand/logo-landing.svg"
                alt="Conmomet S.A."
                sx={{ height: 44, width: 'auto', display: 'block' }}
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                endIcon={loading ? <GearSpinner size={18} /> : <SendIcon />}
                disabled={loading || success}
                sx={{
                  borderRadius: '10px',
                  px: 4,
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {loading ? 'Enviando...' : 'Enviar mensaje'}
              </Button>
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </AppDialog>
  );
}
