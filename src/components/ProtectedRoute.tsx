'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Box, Typography } from '@mui/material';
import { TokenManager } from '../utils/auth';
import { handleSessionExpired } from '../utils/sessionExpiry';
import GearSpinner from './GearSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = () => {
      // Distinguir "había un token y venció/es inválido" (dispara el cartel) de "nunca hubo
      // sesión" (primera visita directa a una URL del dashboard): a este segundo caso no le
      // corresponde el mensaje de "tu sesión expiró".
      const hadToken = !!TokenManager.getToken();
      const authenticated = TokenManager.isAuthenticated();
      setIsAuthenticated(authenticated);
      setIsLoading(false);

      if (!authenticated) {
        if (hadToken) handleSessionExpired();
        // Guarda a dónde iba (ej. la ficha de una herramienta escaneada por QR) para volver
        // ahí después de loguearse, en vez de tirarlo siempre al dashboard genérico.
        const target = window.location.pathname + window.location.search;
        router.replace(`/login?redirect=${encodeURIComponent(target)}`);
      }
    };

    checkAuth();

    // El layout del dashboard/portal no se desmonta al navegar entre páginas (el App Router
    // solo cambia el segmento hijo), así que sin esto un vencimiento a mitad de sesión nunca
    // se detectaba hasta refrescar a mano. Se re-chequea al volver el foco a la pestaña (el
    // caso real: la dejó abierta y volvió al otro día) y al cambiar de ruta.
    const handleFocusOrVisibility = () => {
      if (document.visibilityState === 'hidden') return;
      checkAuth();
    };
    window.addEventListener('focus', handleFocusOrVisibility);
    document.addEventListener('visibilitychange', handleFocusOrVisibility);
    return () => {
      window.removeEventListener('focus', handleFocusOrVisibility);
      document.removeEventListener('visibilitychange', handleFocusOrVisibility);
    };
  }, [router, pathname]);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2,
        }}
      >
        <GearSpinner size={40} />
        <Typography variant="body1" color="text.secondary">
          Verificando autenticación...
        </Typography>
      </Box>
    );
  }

  if (!isAuthenticated) {
    // Nunca pantalla en blanco: ProtectedRoute envuelve el shell completo (AppBar + Drawer +
    // contenido), así que un `return null` acá se veía como la app colgada sin menú.
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2,
        }}
      >
        <GearSpinner size={40} />
        <Typography variant="body1" color="text.secondary">
          Redirigiendo al inicio de sesión...
        </Typography>
      </Box>
    );
  }

  return <>{children}</>;
}
