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
              Conmomet S.A. es una empresa líder en soluciones industriales, ofreciendo servicios de montajes, tornería y plegados para clientes en toda la zona costera de la provincia de Buenos Aires.
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
                Instagran
              </Typography>
              <Typography color="grey.400" sx={{ cursor: "pointer", "&:hover": { color: "white" } }}>
                otra cosa
              </Typography>
              <Typography color="grey.400" sx={{ cursor: "pointer", "&:hover": { color: "white" } }}>
                algo mas
              </Typography>
              <Typography color="grey.400" sx={{ cursor: "pointer", "&:hover": { color: "white" } }}>
                politicas de privacidad
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
