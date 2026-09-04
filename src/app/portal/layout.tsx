'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Container,
  Tabs,
  Tab,
  Button,
  Drawer,
  List,
  ListItemButton
} from '@mui/material';
import {
  LogoutOutlined as LogoutIcon,
  AccountCircleOutlined as AccountCircle,
  BadgeOutlined as BadgeIcon,
  ArticleOutlined as ArticleIcon,
  AccessTimeOutlined as TimeIcon,
  SecurityOutlined as SecurityIcon,
  PaymentsOutlined as PaymentsIcon,
  ArrowBackOutlined as ArrowBackIcon,
  EventAvailableOutlined as EventAvailableIcon,
  RequestQuoteOutlined as RequestQuoteIcon,
  MenuOutlined as MenuIcon,
  CloseOutlined as CloseIcon
} from '@mui/icons-material';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../utils/auth';
import ProtectedRoute from '../../components/ProtectedRoute';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Redirección si no tiene employee_id
  useEffect(() => {
    if (user && !user.employee_id) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    logout();
  };

  const getUserInitials = () => {
    if (!user?.name) return 'U';
    const initials = `${user.name?.[0] || ''}${user.lastname?.[0] || ''}`.toUpperCase();
    return initials || user.email?.[0]?.toUpperCase() || 'U';
  };

  const getUserDisplayName = () => {
    if (user?.fullName) return user.fullName;
    if (user?.name && user?.lastname) return `${user.name} ${user.lastname}`;
    return user?.name || user?.email || 'Usuario';
  };

  const tabs = [
    { label: 'Mi Legajo', path: '/portal', icon: <BadgeIcon /> },
    { label: 'Documentos', path: '/portal/documents', icon: <ArticleIcon /> },
    { label: 'Mis Horas', path: '/portal/time-entries', icon: <TimeIcon /> },
    { label: 'Mi Asistencia', path: '/portal/attendance', icon: <EventAvailableIcon /> },
    { label: 'Mi EPP', path: '/portal/safety-equipment', icon: <SecurityIcon /> },
    { label: 'Liquidaciones', path: '/portal/payroll', icon: <PaymentsIcon /> },
    { label: 'Adelantos y Préstamos', path: '/portal/requests', icon: <RequestQuoteIcon /> },
  ];

  const currentTab = tabs.findIndex(tab => pathname === tab.path) !== -1 
      ? tabs.findIndex(tab => pathname === tab.path) 
      : 0;

  if (user && !user.employee_id) {
    return null; // Don't render while redirecting
  }

  return (
    <ProtectedRoute>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
        <AppBar position="static" sx={{ bgcolor: 'background.paper', color: 'text.primary', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <Toolbar sx={{ position: 'relative' }}>
            <IconButton
              edge="start"
              onClick={() => setMobileNavOpen(true)}
              sx={{ display: { xs: 'inline-flex', sm: 'none' }, mr: 1 }}
            >
              <MenuIcon />
            </IconButton>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                minWidth: 0,
                flexGrow: { xs: 0, sm: 1 },
                position: { xs: 'absolute', sm: 'static' },
                left: { xs: '50%', sm: 'auto' },
                top: { xs: '50%', sm: 'auto' },
                transform: { xs: 'translate(-50%, -50%)', sm: 'none' },
              }}
            >
              <Box sx={{ height: { xs: 32, sm: 44 }, display: 'flex', alignItems: 'center' }}>
                <Image
                  src="/img/logos/logo-conmomet-ROJO.png"
                  alt="Conmomet"
                  width={192}
                  height={58}
                  style={{ objectFit: 'contain', width: 'auto', height: '100%' }}
                  priority
                />
              </Box>
              <Typography variant="subtitle1" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }} noWrap>
                Portal del Empleado
              </Typography>
            </Box>

            {/* Empuja el avatar a la derecha en mobile, ya que el logo quedó posicionado absoluto */}
            <Box sx={{ flexGrow: 1, display: { xs: 'block', sm: 'none' } }} />

            {user?.has_dashboard_access && (
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => router.push('/dashboard')}
                sx={{ display: { xs: 'none', sm: 'inline-flex' }, mr: 2 }}
              >
                Volver al Dashboard
              </Button>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'right' }}>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  {getUserDisplayName()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Mi Legajo
                </Typography>
              </Box>
              <IconButton onClick={handleProfileMenuOpen} color="inherit" sx={{ p: 0.5 }}>
                <Avatar
                  sx={{
                    width: 38,
                    height: 38,
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    letterSpacing: '0.02em',
                    color: 'white',
                    background: 'linear-gradient(135deg, #f87171 0%, #b91c1c 100%)',
                    boxShadow: '0 2px 8px rgba(185, 28, 28, 0.35)',
                  }}
                >
                  {getUserInitials()}
                </Avatar>
              </IconButton>
            </Box>
          </Toolbar>
          
          <Box sx={{ display: { xs: 'none', sm: 'block' }, borderTop: 1, borderColor: 'divider', px: 2 }}>
            <Tabs 
              value={currentTab} 
              variant="scrollable" 
              scrollButtons="auto"
              sx={{ minHeight: 48 }}
            >
              {tabs.map((tab, idx) => (
                <Tab 
                  key={idx} 
                  icon={tab.icon} 
                  iconPosition="start" 
                  label={tab.label} 
                  onClick={() => router.push(tab.path)}
                  sx={{ minHeight: 48, textTransform: 'none', fontWeight: 500 }}
                />
              ))}
            </Tabs>
          </Box>
        </AppBar>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleProfileMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={() => { handleProfileMenuClose(); router.push('/portal'); }}>
            <ListItemIcon><AccountCircle fontSize="small" /></ListItemIcon>
            <ListItemText>Mi Perfil</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Cerrar Sesión</ListItemText>
          </MenuItem>
        </Menu>

        <Drawer
          anchor="left"
          open={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
          sx={{ display: { xs: 'block', sm: 'none' } }}
        >
          <Box sx={{ width: 280 }} role="presentation">
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" color="primary.main">
                Portal del Empleado
              </Typography>
              <IconButton size="small" onClick={() => setMobileNavOpen(false)}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
            <Divider />
            <List sx={{ py: 1 }}>
              {tabs.map((tab, idx) => (
                <ListItemButton
                  key={idx}
                  selected={idx === currentTab}
                  onClick={() => { router.push(tab.path); setMobileNavOpen(false); }}
                  sx={{
                    py: 1.25,
                    '&.Mui-selected': { bgcolor: 'primary.50', borderRight: 3, borderColor: 'primary.main' },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: idx === currentTab ? 'primary.main' : 'inherit' }}>
                    {tab.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={tab.label}
                    slotProps={{ primary: { fontWeight: idx === currentTab ? 600 : 400 } }}
                  />
                </ListItemButton>
              ))}
            </List>
            {user?.has_dashboard_access && (
              <>
                <Divider />
                <List sx={{ py: 1 }}>
                  <ListItemButton
                    onClick={() => { router.push('/dashboard'); setMobileNavOpen(false); }}
                    sx={{ py: 1.25 }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <ArrowBackIcon />
                    </ListItemIcon>
                    <ListItemText primary="Volver al Dashboard" />
                  </ListItemButton>
                </List>
              </>
            )}
          </Box>
        </Drawer>

        <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
          {children}
        </Container>
      </Box>
    </ProtectedRoute>
  );
}
