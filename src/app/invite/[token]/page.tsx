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
  CircularProgress,
} from '@mui/material';
import { VisibilityOutlined as Visibility, VisibilityOffOutlined as VisibilityOff } from '@mui/icons-material';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { TokenManager, buildCleanUser } from '../../../utils/auth';
import { PublicInvitationService } from '../../../utils/api';

type Stage = 'validating' | 'invalid' | 'form' | 'submitting' | 'success';

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export default function InviteAcceptPage() {
  const params = useParams();
  const router = useRouter();
  const token = String(params.token);

  const [stage, setStage] = useState<Stage>('validating');
  const [invalidMessage, setInvalidMessage] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    PublicInvitationService.validate(token)
      .then((data) => {
        if (cancelled) return;
        setEmployeeName(data.employeeName);
        setStage('form');
      })
      .catch((err) => {
        if (cancelled) return;
        setInvalidMessage(err instanceof Error ? err.message : 'Invitación inválida.');
        setStage('invalid');
      });
    return () => { cancelled = true; };
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setStage('submitting');
    try {
      const result = await PublicInvitationService.accept(token, password);
      const cleanUser = buildCleanUser(result.user);
      TokenManager.saveToken(result.token);
      TokenManager.saveUser(cleanUser);
      setStage('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear tu usuario.');
      setStage('form');
    }
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
        <Paper elevation={24} sx={{ p: 4, borderRadius: 3 }}>
          <Box textAlign="center" sx={{ mb: 4, mt: 1 }}>
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
              Portal del Empleado
            </Typography>
          </Box>

          {stage === 'validating' && (
            <Box display="flex" flexDirection="column" alignItems="center" py={4} gap={2}>
              <CircularProgress />
              <Typography color="text.secondary">Validando invitación…</Typography>
            </Box>
          )}

          {stage === 'invalid' && (
            <Box textAlign="center" py={2}>
              <Alert severity="error" sx={{ mb: 3 }}>{invalidMessage}</Alert>
              <Button variant="outlined" onClick={() => router.push('/login')}>Ir al login</Button>
            </Box>
          )}

          {(stage === 'form' || stage === 'submitting') && (
            <>
              <Typography textAlign="center" sx={{ mb: 3 }}>
                Hola <strong>{employeeName}</strong>, creá tu contraseña para acceder al portal.
              </Typography>

              {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

              <Box component="form" onSubmit={handleSubmit}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Contraseña"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  helperText="Mínimo 8 caracteres"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Confirmar contraseña"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  sx={{ mb: 3 }}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={stage === 'submitting'}
                  sx={{
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
                  {stage === 'submitting' ? 'Creando cuenta…' : 'Crear mi cuenta'}
                </Button>
              </Box>
            </>
          )}

          {stage === 'success' && (
            <Box textAlign="center" py={1}>
              <Alert severity="success" sx={{ mb: 3 }}>¡Tu cuenta se creó correctamente!</Alert>
              <Typography variant="h6" sx={{ mb: 1 }}>Guardá el acceso en tu celular</Typography>
              {isIOS() ? (
                <Typography color="text.secondary" sx={{ mb: 3 }}>
                  Tocá el ícono de <strong>Compartir</strong> en la barra del navegador y elegí
                  <strong> &quot;Agregar a inicio&quot;</strong> para tener el Portal como un ícono en tu celular.
                </Typography>
              ) : (
                <Typography color="text.secondary" sx={{ mb: 3 }}>
                  Tocá el menú (⋮) de tu navegador y elegí <strong>&quot;Agregar a pantalla de inicio&quot;</strong>
                  {' '}para tener el Portal como un ícono en tu celular.
                </Typography>
              )}
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={() => router.push('/portal')}
                sx={{
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
                Entendido, ir al portal
              </Button>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
