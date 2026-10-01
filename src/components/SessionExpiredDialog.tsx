'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogActions, Button, Box, Typography } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { onSessionExpired } from '../utils/sessionExpiry';

// Se monta una sola vez por shell autenticado (dashboard/layout.tsx y portal/layout.tsx) y
// escucha a sessionExpiry.ts — es el único lugar que pinta el aviso de "se venció la sesión",
// sin importar quién lo detectó (el chequeo local del JWT, un 401 del backend, o
// ProtectedRoute al volver el foco a la pestaña).
export default function SessionExpiredDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    return onSessionExpired(() => setOpen(true));
  }, []);

  const handleReLogin = () => {
    // replace, no push: que el botón Atrás no vuelva a la página que ya no es usable.
    router.replace('/login?session_expired=true');
  };

  return (
    <Dialog open={open} disableEscapeKeyDown>
      <DialogContent sx={{ textAlign: 'center', pt: 4, px: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <AccessTimeIcon sx={{ fontSize: 48, color: 'warning.main' }} />
        </Box>
        <Typography variant="h6" gutterBottom>
          Tu sesión expiró
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Por seguridad cerramos la sesión después de un rato de inactividad.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
        <Button variant="contained" onClick={handleReLogin}>
          Volver a iniciar sesión
        </Button>
      </DialogActions>
    </Dialog>
  );
}
