'use client';
import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Stack, Alert,
  IconButton, InputAdornment,
} from '@mui/material';
import { VisibilityOutlined as Visibility, VisibilityOffOutlined as VisibilityOff } from '@mui/icons-material';
import { UserService } from '@/utils/api';
import { TokenManager } from '@/utils/auth';

interface ChangePasswordDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function ChangePasswordDialog({ open, onClose }: ChangePasswordDialogProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess(false);
    onClose();
  };

  const handleSubmit = async () => {
    setError('');
    if (!currentPassword || !newPassword) {
      setError('Completá la contraseña actual y la nueva.');
      return;
    }
    if (newPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas nuevas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      await UserService.changeMyPassword(currentPassword, newPassword);
      setSuccess(true);
      // La contraseña cambió: cerramos la sesión actual y mandamos a loguearse de nuevo con la
      // nueva, en vez de dejar al usuario con el token viejo como si nada hubiera pasado.
      TokenManager.removeToken();
      window.location.href = '/login?password_changed=true';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar la contraseña.');
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Cambiar contraseña</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {success && <Alert severity="success">Contraseña actualizada correctamente.</Alert>}
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Contraseña actual"
            type={showPasswords ? 'text' : 'password'}
            fullWidth
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPasswords(!showPasswords)} edge="end">
                    {showPasswords ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            label="Contraseña nueva"
            type={showPasswords ? 'text' : 'password'}
            fullWidth
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            helperText="Mínimo 8 caracteres"
          />
          <TextField
            label="Confirmar contraseña nueva"
            type={showPasswords ? 'text' : 'password'}
            fullWidth
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{success ? 'Cerrar' : 'Cancelar'}</Button>
        {!success && (
          <Button variant="contained" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Guardando…' : 'Cambiar contraseña'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
