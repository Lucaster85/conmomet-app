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
        backgroundAttachment: { xs: "scroll", md: "fixed" },
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
              fontSize: { xs: "2.5rem", md: "4rem" },
              fontWeight: 700,
              letterSpacing: "-0.02em",
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
              fontWeight: 400,
              letterSpacing: "-0.01em",
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
                borderRadius: "12px",
                px: 4,
                py: 1.5,
                fontWeight: 600,
                transition: "all 0.2s ease-in-out",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
                "&:hover": { 
                  bgcolor: "grey.50",
                  transform: "translateY(-4px)",
                  boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.2), 0 4px 6px -4px rgb(0 0 0 / 0.1)"
                },
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
