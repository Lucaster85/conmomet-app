'use client';
import React from 'react';
import { Box, Container, Paper, Stack, Typography } from '@mui/material';
import { Checkroom, Email, Facebook, Instagram, LocationOn, Phone, WhatsApp } from '@mui/icons-material';

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
        <Box sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 4,
          alignItems: { xs: "center", md: "stretch" },
        }}>
          {/* Logo */}
          <Box sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flex: { md: "0 0 auto" },
            mb: { xs: 2, md: 0 },
          }}>
            <Box
              component="img"
              src="/img/logos/conmomet-logo-blue.svg"
              alt="Conmomet"
              sx={{ height: { xs: 80, md: 100 }, width: "auto", filter: "brightness(0) invert(1)", opacity: 0.85 }}
            />
          </Box>

          {/* Columns */}
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 4, flex: 1 }}>
            <Box sx={{ flex: "1 1 250px" }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Conmomet S.A.
              </Typography>
              <Typography color="grey.400">
                Conmomet S.A. es una empresa líder en soluciones industriales, ofreciendo servicios de montajes, tornería y plegados para clientes en toda la zona costera de la provincia de Buenos Aires.
              </Typography>
            </Box>

            <Box sx={{ flex: "1 1 250px" }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Contacto
              </Typography>
              <Stack spacing={1}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <WhatsApp sx={{ mr: 1, fontSize: 20 }} />
                  <Typography
                    component="a"
                    href="https://wa.me/5492262679570"
                    target="_blank"
                    rel="noopener noreferrer"
                    color="grey.400"
                    sx={{ textDecoration: "none", "&:hover": { color: "white" } }}
                  >
                    WhatsApp +54 9 2262 679570
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Phone sx={{ mr: 1, fontSize: 20 }} />
                  <Typography
                    component="a"
                    href="tel:+542262679570"
                    color="grey.400"
                    sx={{ textDecoration: "none", "&:hover": { color: "white" } }}
                  >
                    Cotizaciones (2262) 679570
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Phone sx={{ mr: 1, fontSize: 20 }} />
                  <Typography
                    component="a"
                    href="tel:+542262610787"
                    color="grey.400"
                    sx={{ textDecoration: "none", "&:hover": { color: "white" } }}
                  >
                    Administración (2262) 610787
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Email sx={{ mr: 1, fontSize: 20 }} />
                  <Typography
                    component="a"
                    href="mailto:montajes@conmomet.com.ar"
                    color="grey.400"
                    sx={{ textDecoration: "none", "&:hover": { color: "white" } }}
                  >
                    montajes@conmomet.com.ar
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <LocationOn sx={{ mr: 1, fontSize: 20 }} />
                  <Typography
                    component="a"
                    href="https://www.google.com/maps/search/?api=1&query=578+N%C2%B01682%2C+Quequén%2C+Buenos+Aires%2C+Argentina+7631"
                    target="_blank"
                    rel="noopener noreferrer"
                    color="grey.400"
                    sx={{ textDecoration: "none", "&:hover": { color: "white" } }}
                  >
                    578 N°1682, Quequén, Buenos Aires, Argentina
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <Box sx={{ flex: "1 1 250px" }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Enlaces Rápidos
              </Typography>
              <Stack spacing={1}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Instagram sx={{ mr: 1, fontSize: 20 }} />
                  <Typography
                    component="a"
                    href="https://www.instagram.com/conmomet_s.a"
                    target="_blank"
                    rel="noopener noreferrer"
                    color="grey.400"
                    sx={{ textDecoration: "none", "&:hover": { color: "white" } }}
                  >
                    @conmomet_s.a
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Facebook sx={{ mr: 1, fontSize: 20 }} />
                  <Typography
                    component="a"
                    href="https://www.facebook.com/p/conmomet_sa-100083225145876/"
                    target="_blank"
                    rel="noopener noreferrer"
                    color="grey.400"
                    sx={{ textDecoration: "none", "&:hover": { color: "white" } }}
                  >
                    conmomet_s.a
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <LocationOn sx={{ mr: 1, fontSize: 20 }} />
                  <Typography
                    component="a"
                    href="https://www.google.com/maps/search/?api=1&query=578+N%C2%B01682%2C+Quequén%2C+Buenos+Aires%2C+Argentina+7631"
                    target="_blank"
                    rel="noopener noreferrer"
                    color="grey.400"
                    sx={{ textDecoration: "none", "&:hover": { color: "white" } }}
                  >
                    Veni a conocernos
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Checkroom sx={{ mr: 1, fontSize: 20 }} />
                  <Typography
                    component="a"
                    href="https://www.instagram.com/indumet_"
                    target="_blank"
                    rel="noopener noreferrer"
                    color="grey.400"
                    sx={{ textDecoration: "none", "&:hover": { color: "white" } }}
                  >
                    Indumet
                  </Typography>
                </Box>
              </Stack>
            </Box>
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
            © 2025 Conmomet S.A. Todos los derechos reservados. Powered by Lucaster Web Studio.
          </Typography>
        </Box>
      </Container>
    </Paper>
  );
}
