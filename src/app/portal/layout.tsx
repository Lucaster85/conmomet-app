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
  Button
} from '@mui/material';
import {
  Logout as LogoutIcon,
  AccountCircle,
  Badge as BadgeIcon,
  Article as ArticleIcon,
  AccessTime as TimeIcon,
  Security as SecurityIcon,
  Payments as PaymentsIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../utils/auth';
import ProtectedRoute from '../../components/ProtectedRoute';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

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
    { label: 'Mi EPP', path: '/portal/safety-equipment', icon: <SecurityIcon /> },
    { label: 'Liquidaciones', path: '/portal/payroll', icon: <PaymentsIcon /> },
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
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', color: 'primary.main', flexGrow: 1 }}>
              Conmomet <Typography component="span" variant="subtitle1" color="text.secondary">| Portal del Empleado</Typography>
            </Typography>

            {user?.has_dashboard_access && (
              <Button 
                startIcon={<ArrowBackIcon />} 
                onClick={() => router.push('/dashboard')}
                sx={{ mr: 2 }}
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
              <IconButton size="large" onClick={handleProfileMenuOpen} color="inherit">
                <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main' }}>
                  {getUserInitials()}
                </Avatar>
              </IconButton>
            </Box>
          </Toolbar>
          
          <Box sx={{ borderTop: 1, borderColor: 'divider', px: 2 }}>
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

        <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
          {children}
        </Container>
      </Box>
    </ProtectedRoute>
  );
}
