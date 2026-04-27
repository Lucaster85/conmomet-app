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
import { Visibility, VisibilityOff, ArrowBack } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
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
            <Typography variant="h4" component="h1" sx={{ mb: 1, fontWeight: 'bold', color: 'primary.main' }}>
              Conmomet
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Iniciar Sesión
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Accede a tu cuenta para continuar
            </Typography>
          </Box>

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
              }}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>

            {/* Enlaces adicionales */}
            <Box textAlign="center" sx={{ mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                ¿Olvidaste tu contraseña?{' '}
                <Button variant="text" size="small" sx={{ textTransform: 'none', p: 0, minWidth: 'auto' }}>
                  Recuperar contraseña
                </Button>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}