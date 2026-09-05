'use client';
import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { VisibilityOutlined as Visibility, VisibilityOffOutlined as VisibilityOff, ArrowBackOutlined as ArrowBack } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth, TokenManager } from '../../utils/auth';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [accountError, setAccountError] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('password_changed') === 'true') setPasswordChanged(true);
    if (params.get('account_error') === 'true') setAccountError(true);
  }, []);

  // Verificar si ya está autenticado
  useEffect(() => {
    if (TokenManager.isAuthenticated()) {
      const currentUser = TokenManager.getUser();
      if (currentUser && currentUser.has_dashboard_access === false) {
        router.push('/portal');
      } else {
        router.push('/dashboard');
      }
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(''); // Limpiar error al escribir
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.email || !formData.password) {
      setError('Por favor, completa todos los campos.');
      setLoading(false);
      return;
    }

    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      const currentUser = TokenManager.getUser();
      if (currentUser && currentUser.has_dashboard_access === false) {
        router.push('/portal');
      } else {
        router.push('/dashboard');
      }
    } else {
      setError(result.error || 'Credenciales incorrectas. Verifica tu correo y contraseña.');
    }
    
    setLoading(false);
  };

  const handleBackToHome = () => {
    router.push('/');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={24}
          sx={{
            p: 4,
            borderRadius: 3,
            position: 'relative',
          }}
        >
          {/* Botón de regresar */}
          <IconButton
            onClick={handleBackToHome}
            sx={{
              position: 'absolute',
              top: 16,
              left: 16,
              color: 'primary.main',
            }}
          >
            <ArrowBack />
          </IconButton>

          {/* Header */}
          <Box textAlign="center" sx={{ mb: 4, mt: 2 }}>
            <Box display="flex" justifyContent="center" sx={{ mb: 1 }}>
              <Image
                src="/img/logos/logo-conmomet-ROJO.png"
                alt="Conmomet S.A."
                width={192}
                height={58}
                style={{ objectFit: 'contain', width: 'auto', maxHeight: 58 }}
                priority
              />
            </Box>
            <Typography variant="h6" color="text.secondary">
              Iniciar Sesión
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Accede a tu cuenta para continuar
            </Typography>
          </Box>

          {passwordChanged && !error && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Tu contraseña se actualizó correctamente. Iniciá sesión con la nueva.
            </Alert>
          )}

          {accountError && !error && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              Tu cuenta no tiene un acceso configurado correctamente. Contactá a administración.
            </Alert>
          )}

          {/* Alerta de error */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Formulario */}
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Correo Electrónico"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                mt: 2,
                mb: 2,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #60a5fa 0%, #1d4ed8 100%)',
                boxShadow: '0 2px 8px rgba(29, 78, 216, 0.35)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
                  boxShadow: '0 4px 12px rgba(29, 78, 216, 0.45)',
                },
              }}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}