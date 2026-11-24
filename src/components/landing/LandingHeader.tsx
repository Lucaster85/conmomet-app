'use client';
import React, { useState } from 'react';
import {
  AppBar, Box, Button, Divider, Drawer, IconButton,
  List, ListItem, ListItemButton, ListItemText,
  Toolbar, Typography,
} from '@mui/material';
import { MenuOutlined as MenuIcon, AccountCircleOutlined as AccountCircleIcon } from '@mui/icons-material';
import { usePathname, useRouter } from 'next/navigation';

const navItems = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Nosotros', href: '#nosotros' },
  { label: 'Servicios', href: '#servicios' },
  { label: 'Nuestro trabajo', href: '#nuestro-trabajo' },
  { label: 'Clientes', href: '#clientes' },
];

export const JOBS_PATH = '/trabaja-con-nosotros';

// Barra de navegación de la web institucional, compartida por la landing y por "Trabajá con
// nosotros" (ver FLOWS.md §60). Antes vivía dentro de src/app/page.tsx.
//
// Los links de sección (#nosotros…) hacen scroll cuando se está en la landing, y llevan a `/#seccion`
// cuando se está en otra página — sin eso, en /trabaja-con-nosotros apuntarían a ids que no existen.
export default function LandingHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const onLanding = pathname === '/';

  const handleNavClick = (href: string) => {
    setDrawerOpen(false);
    if (!onLanding) {
      router.push(`/${href}`);
      return;
    }
    document.getElementById(href.replace('#', ''))?.scrollIntoView({ behavior: 'smooth' });
  };

  const goTo = (path: string) => {
    setDrawerOpen(false);
    router.push(path);
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
        <ListItem disablePadding>
          <ListItemButton onClick={() => goTo(JOBS_PATH)} selected={pathname === JOBS_PATH}>
            <ListItemText primary="Trabajá con nosotros" primaryTypographyProps={{ fontWeight: 600, color: 'primary' }} />
          </ListItemButton>
        </ListItem>
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Button variant="outlined" fullWidth onClick={() => goTo('/login')}>
          Iniciar Sesión
        </Button>
      </Box>
    </Box>
  );

  return (
    <>
      <AppBar position="fixed" elevation={1} sx={{ bgcolor: 'background.paper' }}>
        <Toolbar>
          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1, cursor: 'pointer' }}
            onClick={() => handleNavClick('#inicio')}
          >
            <Box
              component="img"
              src="/brand/logo-landing.svg"
              alt="Conmomet"
              sx={{ height: { xs: 40, md: 60 }, width: 'auto' }}
            />
            <Typography
              variant="h6"
              component="div"
              sx={{ color: 'primary.main', fontWeight: 'bold', fontSize: { xs: '1.25rem', md: '1.875rem' } }}
            >
              Conmomet S.A.
            </Typography>
          </Box>

          {/* Nav links — solo en desktop */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, mr: 2 }}>
            {navItems.map((item) => (
              <Button key={item.href} onClick={() => handleNavClick(item.href)} sx={{ color: 'text.primary', fontSize: { md: '0.975rem' } }}>
                {item.label}
              </Button>
            ))}
            <Button variant="outlined" onClick={() => goTo(JOBS_PATH)} sx={{ fontSize: { md: '0.975rem' } }}>
              Trabajá con nosotros
            </Button>
          </Box>

          {/* Botón login — solo en desktop */}
          <IconButton
            onClick={() => goTo('/login')}
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
            aria-label="Abrir menú"
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        {mobileDrawer}
      </Drawer>
    </>
  );
}
