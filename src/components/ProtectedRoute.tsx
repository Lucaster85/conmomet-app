'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography } from '@mui/material';
import { TokenManager } from '../utils/auth';
import GearSpinner from './GearSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = TokenManager.isAuthenticated();
      setIsAuthenticated(authenticated);
      setIsLoading(false);

      if (!authenticated) {
        // Guarda a dónde iba (ej. la ficha de una herramienta escaneada por QR) para volver
        // ahí después de loguearse, en vez de tirarlo siempre al dashboard genérico.
        const target = window.location.pathname + window.location.search;
        router.push(`/login?redirect=${encodeURIComponent(target)}`);
      }
    };

    checkAuth();
  }, [router]);

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
    return null; // El redirect ya se maneja en el useEffect
  }

  return <>{children}</>;
}