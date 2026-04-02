'use client';
import React from 'react';
import { Box, Card, Container, Typography } from '@mui/material';
import { Analytics, Business, Security } from '@mui/icons-material';

export default function FeaturesSection() {
  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Typography variant="h2" textAlign="center" sx={{ mb: 2 }}>
        Características Principales
      </Typography>
      <Typography
        variant="h6"
        textAlign="center"
        color="text.secondary"
        sx={{ mb: 6 }}
      >
        Todo lo que necesitas para hacer crecer tu empresa de manera eficiente
        y segura.
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 4,
          justifyContent: "center",
        }}
      >
        <Card sx={{ maxWidth: 350, textAlign: "center", p: 3, flex: "1 1 300px" }}>
          <Business sx={{ fontSize: 60, color: "primary.main", mb: 2 }} />
          <Typography variant="h5" sx={{ mb: 2 }}>
            Montajes
          </Typography>
          <Typography color="text.secondary">
            Contrucciones Metálicas-Cálculos Estructurales.
          </Typography>
        </Card>

        <Card sx={{ maxWidth: 350, textAlign: "center", p: 3, flex: "1 1 300px" }}>
          <Analytics sx={{ fontSize: 60, color: "primary.main", mb: 2 }} />
          <Typography variant="h5" sx={{ mb: 2 }}>
            Torneria Industrial
          </Typography>
          <Typography color="text.secondary">
            Torneria de precisión, piezas únicas y series cortas para la industria.
          </Typography>
        </Card>

        <Card sx={{ maxWidth: 350, textAlign: "center", p: 3, flex: "1 1 300px" }}>
          <Analytics sx={{ fontSize: 60, color: "primary.main", mb: 2 }} />
          <Typography variant="h5" sx={{ mb: 2 }}>
            Plegados
          </Typography>
          <Typography color="text.secondary">
            Plegados de precisión, piezas únicas y series cortas para la industria.
          </Typography>
        </Card>

        <Card sx={{ maxWidth: 350, textAlign: "center", p: 3, flex: "1 1 300px" }}>
          <Security sx={{ fontSize: 60, color: "primary.main", mb: 2 }} />
          <Typography variant="h5" sx={{ mb: 2 }}>
            Seguridad
          </Typography>
          <Typography color="text.secondary">
            Comprometidos con la seguridad laboral y el bienestar de nuestros empleados.
          </Typography>
        </Card>
      </Box>
    </Container>
  );
}
