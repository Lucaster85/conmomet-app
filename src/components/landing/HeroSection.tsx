'use client';
import React from 'react';
import { Box, Button, Container, Typography } from '@mui/material';
import { ArrowForward } from '@mui/icons-material';

interface HeroSectionProps {
  onContactClick: () => void;
}

export default function HeroSection({ onContactClick }: HeroSectionProps) {
  return (
    <Box
      sx={{
        position: "relative",
        minHeight: "75vh",
        display: "flex",
        alignItems: "center",
        pt: 8,
        backgroundImage: "url('img/dashboardSlider/grain-steel-silo.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          bgcolor: "rgba(0,0,0,0.45)",
        },
      }}
    >
      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
        <Box sx={{ maxWidth: { xs: "100%", md: "55%" } }}>
          <Typography
            variant="h1"
            sx={{
              color: "white",
              mb: 3,
              fontSize: { xs: "2.5rem", md: "3.5rem" },
              textShadow: "0 2px 8px rgba(0,0,0,0.5)",
            }}
          >
            Conmomet S.A.
          </Typography>
          <Typography
            variant="h5"
            sx={{
              color: "rgba(255,255,255,0.95)",
              mb: 4,
              textShadow: "0 1px 4px rgba(0,0,0,0.5)",
            }}
          >
            Experiencia y compromiso.
          </Typography>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForward />}
              onClick={onContactClick}
              sx={{
                bgcolor: "white",
                color: "primary.main",
                "&:hover": { bgcolor: "grey.100" },
              }}
            >
              Quiero que me contacten
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
