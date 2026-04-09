'use client';
import React, { useState } from 'react';
import {
  AppBar, Box, Button, Divider, Drawer, IconButton,
  List, ListItem, ListItemButton, ListItemText,
  Toolbar, Typography,
} from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import HeroSection from '../components/landing/HeroSection';
import NosotrosSection from '../components/landing/NosotrosSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import ArticlesSection from '../components/landing/ArticlesSection';
import ClientsSection from '../components/landing/ClientsSection';
import FooterSection from '../components/landing/FooterSection';

const navItems = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Servicios', href: '#servicios' },
  { label: 'Nuestro trabajo', href: '#nuestro-trabajo' },
  { label: 'Clientes', href: '#clientes' },
];

export default function LandingPage() {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

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
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, color: "primary.main", fontWeight: "bold", cursor: 'pointer' }}
            onClick={() => handleNavClick('#inicio')}
          >
            Conmomet S.A.
          </Typography>

          {/* Nav links — solo en desktop */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, mr: 2 }}>
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

          {/* Botón login — solo en desktop */}
          <Button
            variant="outlined"
            onClick={handleLoginClick}
            sx={{ display: { xs: 'none', md: 'inline-flex' } }}
          >
            Iniciar Sesión
          </Button>

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

      <Box id="inicio"><HeroSection onContactClick={handleLoginClick} /></Box>
      <Box id="nosotros"><NosotrosSection /></Box>
      <Box id="servicios"><FeaturesSection /></Box>
      <Box id="nuestro-trabajo"><ArticlesSection /></Box>
      <Box id="clientes"><ClientsSection /></Box>
      <FooterSection />
    </Box>
  );
}
