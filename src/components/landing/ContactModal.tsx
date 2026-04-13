'use client';
import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Close as CloseIcon, Send as SendIcon } from '@mui/icons-material';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

interface ContactModalProps {
  open: boolean;
  onClose: () => void;
}

interface FormData {
  nombre: string;
  empresa: string;
  telefono: string;
  email: string;
  mensaje: string;
}

const initialForm: FormData = {
  nombre: '',
  empresa: '',
  telefono: '',
  email: '',
  mensaje: '',
};

export default function ContactModal({ open, onClose }: ContactModalProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [form, setForm] = useState<FormData>(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/public/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      setSuccess(true);
      setForm(initialForm);
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
  };

  return (
    <Dialog
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
              label="Nombre"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              required
              fullWidth
              autoComplete="name"
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
                required
                fullWidth
                autoComplete="tel"
                inputProps={{ inputMode: 'tel' }}
              />
              <TextField
                label="Email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                fullWidth
                autoComplete="email"
              />
            </Box>
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
            />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
              <Box
                component="img"
                src="/img/logos/conmomet-logo-blue.svg"
                alt="Conmomet S.A."
                sx={{ height: 44, width: 'auto', display: 'block' }}
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                endIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
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
    </Dialog>
  );
}
