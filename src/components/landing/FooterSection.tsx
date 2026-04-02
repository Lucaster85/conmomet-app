'use client';
import React from 'react';
import { Box, Container, Paper, Stack, Typography } from '@mui/material';
import { Email, LocationOn, Phone } from '@mui/icons-material';

export default function FooterSection() {
  return (
    <Paper
      component="footer"
      sx={{
        bgcolor: "grey.900",
        color: "white",
        py: 6,
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          <Box sx={{ flex: "1 1 300px" }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Conmomet
            </Typography>
            <Typography color="grey.400">
              La plataforma de gestión empresarial que necesitas para hacer
              crecer tu negocio de manera inteligente.
            </Typography>
          </Box>

          <Box sx={{ flex: "1 1 300px" }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Contacto
            </Typography>
            <Stack spacing={1}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Phone sx={{ mr: 1, fontSize: 20 }} />
                <Typography color="grey.400">+54 11 1234-5678</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Email sx={{ mr: 1, fontSize: 20 }} />
                <Typography color="grey.400">contacto@conmomet.com</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <LocationOn sx={{ mr: 1, fontSize: 20 }} />
                <Typography color="grey.400">
                  Quequen, Buenos Aires, Argentina
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Box sx={{ flex: "1 1 300px" }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Enlaces Rápidos
            </Typography>
            <Stack spacing={1}>
              <Typography color="grey.400" sx={{ cursor: "pointer", "&:hover": { color: "white" } }}>
                Sobre Nosotros
              </Typography>
              <Typography color="grey.400" sx={{ cursor: "pointer", "&:hover": { color: "white" } }}>
                Servicios
              </Typography>
              <Typography color="grey.400" sx={{ cursor: "pointer", "&:hover": { color: "white" } }}>
                Soporte
              </Typography>
              <Typography color="grey.400" sx={{ cursor: "pointer", "&:hover": { color: "white" } }}>
                Términos y Condiciones
              </Typography>
            </Stack>
          </Box>
        </Box>

        <Box
          sx={{
            borderTop: "1px solid",
            borderColor: "grey.700",
            pt: 3,
            mt: 4,
            textAlign: "center",
          }}
        >
          <Typography color="grey.400">
            © 2025 Conmomet. Todos los derechos reservados.
          </Typography>
        </Box>
      </Container>
    </Paper>
  );
}
