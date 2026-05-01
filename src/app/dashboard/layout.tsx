'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,

  useTheme,
  useMediaQuery,
  Collapse,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,

  Settings as SettingsIcon,
  Logout as LogoutIcon,
  AccountCircle,
  Business,
  Article as ArticleIcon,
  AdminPanelSettings as RolesIcon,
  Factory as FactoryIcon,
  Badge as BadgeIcon,
  AccessTime as TimeIcon,
  EventAvailable as EventAvailableIcon,
  Payments as PaymentsIcon,
  Money as MoneyIcon,
  Security as SecurityIcon,
  ExpandLess,
  ExpandMore,
  BeachAccess as BeachAccessIcon,
  CalendarMonth as CalendarIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../utils/auth';
import ProtectedRoute from '../../components/ProtectedRoute';

const drawerWidth = 280;

const menuGroups = [
  {
    title: '',
    items: [
      { text: 'Inicio', icon: <DashboardIcon />, path: '/dashboard' }
    ]
  },
  {
    title: 'Personal',
    items: [
      { text: 'Empleados', icon: <BadgeIcon />, path: '/dashboard/employees' },
      { text: 'Licencias y Vacaciones', icon: <BeachAccessIcon />, path: '/dashboard/leave-requests' },
      { text: 'Carga de Horas', icon: <TimeIcon />, path: '/dashboard/time-entries' },
      { text: 'Presentismo', icon: <EventAvailableIcon />, path: '/dashboard/attendance' },
      { text: 'EPP', icon: <SecurityIcon />, path: '/dashboard/safety-equipment' },
    ]
  },
  {
    title: 'Contabilidad',
    items: [
      { text: 'Quincenas y Pagos', icon: <PaymentsIcon />, path: '/dashboard/pay-periods' },
      { text: 'Adelantos', icon: <MoneyIcon />, path: '/dashboard/salary-advances' },
    ]
  },
  {
    title: 'Gestión de Clientes',
    items: [
      { text: 'Clientes', icon: <Business />, path: '/dashboard/clients' },
      { text: 'Plantas', icon: <FactoryIcon />, path: '/dashboard/plants' },
    ]
  },
  {
    title: 'Gestión de Usuarios',
    items: [
      { text: 'Usuarios', icon: <PeopleIcon />, path: '/dashboard/users' },
      { text: 'Roles y Permisos', icon: <RolesIcon />, path: '/dashboard/roles' },
    ]
  },
  { title: 'Web', items: [{ text: 'Artículos', icon: <ArticleIcon />, path: '/dashboard/articles' }] },
  {
    title: 'Configuración',
    items: [
      { text: 'Categorías (CCT)', icon: <CategoryIcon />, path: '/dashboard/categories' },
      { text: 'Conceptos de Liquidación', icon: <CategoryIcon />, path: '/dashboard/payroll-concepts' },
      { text: 'Feriados', icon: <CalendarIcon />, path: '/dashboard/holidays' },
    ]
  },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const router = useRouter();
  const { user, logout } = useAuth();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    'Personal': false,
    'Contabilidad': false,
    'Gestión de Clientes': false,
    'Gestión de Usuarios': false,
    'Web': false,
  });

  const handleGroupToggle = (title: string) => {
    setOpenGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  // Redirección si no tiene acceso al dashboard
  useEffect(() => {
    if (user && user.has_dashboard_access === false) {
      router.replace('/portal');
    }
  }, [user, router]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

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

  const handleNavigation = (path: string) => {
    router.push(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  // Obtener iniciales del usuario
  const getUserInitials = () => {
    if (!user?.name) return 'U';
    const initials = `${user.name?.[0] || ''}${user.lastname?.[0] || ''}`.toUpperCase();
    return initials || user.email?.[0]?.toUpperCase() || 'U';
  };

  // Obtener nombre completo del usuario
  const getUserDisplayName = () => {
    if (user?.fullName) return user.fullName;
    if (user?.name && user?.lastname) return `${user.name} ${user.lastname}`;
    if (user?.name) return user.name;
    return user?.email || 'Usuario';
  };

  // Obtener rol del usuario
  const getUserRole = () => {
    return user?.roleName || user?.role || 'Usuario';
  };

  const drawer = (
    <Box>
      <Toolbar sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider', minHeight: { xs: 56, sm: 64 }, justifyContent: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', py: 1 }}>
          <Image
            src="/img/logos/logo-conmomet-ROJO.png"
            alt="Conmomet S.A."
            width={192}
            height={58}
            style={{ objectFit: 'contain', width: 'auto', maxHeight: 58 }}
            priority
          />
        </Box>
      </Toolbar>
      <Divider />
      <List sx={{ pt: 2 }}>
        {menuGroups.map((group, groupIndex) => (
          <React.Fragment key={groupIndex}>
            {group.title && (
              <ListItemButton 
                onClick={() => handleGroupToggle(group.title)}
                sx={{ 
                  py: 1, 
                  px: 2, 
                  mt: groupIndex > 0 ? 1 : 0,
                  '&:hover': { bgcolor: 'transparent' }
                }}
              >
                <ListItemText 
                  primary={group.title} 
                  primaryTypographyProps={{ 
                    color: 'text.secondary', 
                    fontWeight: 'bold', 
                    textTransform: 'uppercase', 
                    fontSize: '0.75rem', 
                    lineHeight: '24px' 
                  }} 
                />
                {openGroups[group.title] ? <ExpandLess sx={{ color: 'text.secondary', fontSize: 20 }} /> : <ExpandMore sx={{ color: 'text.secondary', fontSize: 20 }} />}
              </ListItemButton>
            )}
            <Collapse in={group.title === '' || openGroups[group.title]} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {group.items.map((item) => (
                  <ListItem key={item.text} disablePadding sx={{ px: 1, mb: 0.5 }}>
                    <ListItemButton
                      onClick={() => handleNavigation(item.path)}
                      sx={{
                        minHeight: 44,
                        borderRadius: 1,
                        mx: 1,
                        pl: group.title ? 3 : 2, // Indent items if they belong to a group
                        '&:hover': {
                          bgcolor: 'primary.light',
                          color: 'white',
                        },
                      }}
                    >
                      <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: '0.9rem' }} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Collapse>
            {groupIndex < menuGroups.length - 1 && <Divider sx={{ my: 1, mx: 2, opacity: 0.5 }} />}
          </React.Fragment>
        ))}
      </List>
    </Box>
  );

  return (
    <ProtectedRoute>
      <Box sx={{ display: 'flex' }}>
        {/* App Bar */}
        <AppBar
          position="fixed"
          sx={{
            width: { md: `calc(100% - ${drawerWidth}px)` },
            ml: { md: `${drawerWidth}px` },
            bgcolor: 'background.paper',
            color: 'text.primary',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
              
            </Typography>

            {/* Usuario logueado */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  {getUserDisplayName()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {getUserRole()}
                </Typography>
              </Box>
              <IconButton
                size="large"
                edge="end"
                aria-label="account of current user"
                aria-haspopup="true"
                onClick={handleProfileMenuOpen}
                color="inherit"
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                  {getUserInitials()}
                </Avatar>
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Menu del perfil */}
        <Menu
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={Boolean(anchorEl)}
          onClose={handleProfileMenuClose}
        >
          <MenuItem onClick={handleProfileMenuClose}>
            <ListItemIcon>
              <AccountCircle fontSize="small" />
            </ListItemIcon>
            <ListItemText>Mi Perfil</ListItemText>
          </MenuItem>
          {user?.employee_id && (
            <MenuItem onClick={() => { handleProfileMenuClose(); router.push('/portal'); }}>
              <ListItemIcon>
                <BadgeIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Mi Portal</ListItemText>
            </MenuItem>
          )}
          <MenuItem onClick={handleProfileMenuClose}>
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Configuración</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Cerrar Sesión</ListItemText>
          </MenuItem>
        </Menu>

        {/* Drawer */}
        <Box
          component="nav"
          sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        >
          {/* Mobile drawer */}
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile.
            }}
            sx={{
              display: { xs: 'block', md: 'none' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
          >
            {drawer}
          </Drawer>
          
          {/* Desktop drawer */}
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', md: 'block' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
            open
          >
            {drawer}
          </Drawer>
        </Box>

        {/* Main content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { md: `calc(100% - ${drawerWidth}px)` },
            minHeight: '100vh',
            bgcolor: 'background.default',
          }}
        >
          <Toolbar />
          {children}
        </Box>
      </Box>
    </ProtectedRoute>
  );
}