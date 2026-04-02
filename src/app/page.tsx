'use client';
import React from 'react';
import { AppBar, Box, Button, IconButton, Toolbar, Typography, useMediaQuery, useTheme } from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import HeroSection from '../components/landing/HeroSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import ArticlesSection from '../components/landing/ArticlesSection';
import FooterSection from '../components/landing/FooterSection';

const navItems = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Servicios', href: '#servicios' },
  { label: 'Novedades', href: '#novedades' },
];

export default function LandingPage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleLoginClick = () => {
    router.push('/login');
  };

  const handleNavClick = (href: string) => {
    const id = href.replace('#', '');
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <Box>
      {/* Navigation Bar */}
      <AppBar position="fixed" elevation={1} sx={{ bgcolor: "background.paper" }}>
        <Toolbar>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, color: "primary.main", fontWeight: "bold", cursor: 'pointer' }}
            onClick={() => handleNavClick('#inicio')}
          >
            Conmomet S.A.
          </Typography>

          {/* Nav links — solo en desktop */}
          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 1, mr: 2 }}>
              {navItems.map((item) => (
                <Button
                  key={item.href}
                  onClick={() => handleNavClick(item.href)}
                  sx={{ color: 'text.primary' }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          )}

          <Button variant="outlined" onClick={handleLoginClick} sx={{ mr: isMobile ? 1 : 0 }}>
            Iniciar Sesión
          </Button>

          {/* Menú hamburguesa — solo en mobile */}
          {isMobile && (
            <IconButton edge="end" color="primary">
              <MenuIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      <Box id="inicio"><HeroSection onContactClick={handleLoginClick} /></Box>
      <Box id="servicios"><FeaturesSection /></Box>
      <Box id="novedades"><ArticlesSection /></Box>
      <FooterSection />
    </Box>
  );
}
