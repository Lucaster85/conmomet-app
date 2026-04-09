'use client';
import React, { useState } from 'react';
import {
  AppBar, Box, Button, Divider, Drawer, IconButton,
  List, ListItem, ListItemButton, ListItemText,
  Toolbar, Typography,
} from '@mui/material';
import { Menu as MenuIcon, AccountCircle as AccountCircleIcon } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import HeroSection from '../components/landing/HeroSection';
import NosotrosSection from '../components/landing/NosotrosSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import ArticlesSection from '../components/landing/ArticlesSection';
import ClientsSection from '../components/landing/ClientsSection';
import FooterSection from '../components/landing/FooterSection';
import ContactModal from '../components/landing/ContactModal';

const navItems = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Nosotros', href: '#nosotros' },
  { label: 'Servicios', href: '#servicios' },
  { label: 'Nuestro trabajo', href: '#nuestro-trabajo' },
  { label: 'Clientes', href: '#clientes' },
];

export default function LandingPage() {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);

  const handleLoginClick = () => {
    router.push('/login');
  };

  const handleNavClick = (href: string) => {
    const id = href.replace('#', '');
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
    setDrawerOpen(false);
  };

  const mobileDrawer = (
    <Box sx={{ width: 240 }} role="presentation">
      <List>
        {navItems.map((item) => (
          <ListItem key={item.href} disablePadding>
            <ListItemButton onClick={() => handleNavClick(item.href)}>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Button
          variant="outlined"
          fullWidth
          onClick={() => { setDrawerOpen(false); handleLoginClick(); }}
        >
          Iniciar Sesión
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box>
      {/* Navigation Bar */}
      <AppBar position="fixed" elevation={1} sx={{ bgcolor: "background.paper" }}>
        <Toolbar>
          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1, cursor: 'pointer' }}
            onClick={() => handleNavClick('#inicio')}
          >
            <Box
              component="img"
              src="/img/logos/conmomet-logo-blue.svg"
              alt="Conmomet"
              sx={{ height: { xs: 40, md: 60 }, width: 'auto' }}
            />
            <Typography
              variant="h6"
              component="div"
              sx={{ color: "primary.main", fontWeight: "bold", fontSize: { xs: '1.25rem', md: '1.875rem' } }}
            >
              Conmomet S.A.
            </Typography>
          </Box>

          {/* Nav links — solo en desktop */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, mr: 2 }}>
            {navItems.map((item) => (
              <Button
                key={item.href}
                onClick={() => handleNavClick(item.href)}
                sx={{ color: 'text.primary', fontSize: { md: '0.975rem' } }}
              >
                {item.label}
              </Button>
            ))}
          </Box>

          {/* Botón login — solo en desktop */}
          <IconButton
            onClick={handleLoginClick}
            color="primary"
            sx={{ display: { xs: 'none', md: 'inline-flex' } }}
            aria-label="Iniciar Sesión"
          >
            <AccountCircleIcon sx={{ fontSize: 32 }} />
          </IconButton>

          {/* Menú hamburguesa — solo en mobile */}
          <IconButton
            edge="end"
            color="primary"
            onClick={() => setDrawerOpen(true)}
            sx={{ display: { xs: 'inline-flex', md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Drawer mobile */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        {mobileDrawer}
      </Drawer>

        <ContactModal open={contactModalOpen} onClose={() => setContactModalOpen(false)} />
        <Box id="inicio"><HeroSection onContactClick={() => setContactModalOpen(true)} /></Box>
      <Box id="nosotros"><NosotrosSection /></Box>
      <Box id="servicios"><FeaturesSection /></Box>
      <Box id="nuestro-trabajo"><ArticlesSection /></Box>
      <Box id="clientes"><ClientsSection /></Box>
      <FooterSection />
    </Box>
  );
}
