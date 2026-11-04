'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { HeaderLogo, HeaderAvatarButton, HEADER_MIN_HEIGHT, HEADER_TOGGLE_ICON_SIZE } from '../../components/layout/HeaderChrome';
import baseTheme from '../theme';
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
  Menu,
  MenuItem,

  useTheme,
  useMediaQuery,
  Collapse,
  Tooltip,
} from '@mui/material';
import {
  AccountBalanceWalletOutlined as AccountingGroupIcon,
  BusinessCenterOutlined as ClientsGroupIcon,
  GroupsOutlined as PersonnelGroupIcon,
  LanguageOutlined as WebGroupIcon,
  ManageAccountsOutlined as UsersGroupIcon,
  WarehouseOutlined as StoreGroupIcon,
  KeyboardDoubleArrowLeftOutlined as CollapseMenuIcon,
  KeyboardDoubleArrowRightOutlined as ExpandMenuIcon,
  MenuOutlined as MenuIcon,
  DashboardOutlined as DashboardIcon,
  PeopleOutlined as PeopleIcon,
  LogoutOutlined as LogoutIcon,
  BusinessOutlined as Business,
  ArticleOutlined as ArticleIcon,
  AssignmentOutlined as AssignmentIcon,
  AdminPanelSettingsOutlined as RolesIcon,
  FactoryOutlined as FactoryIcon,
  BadgeOutlined as BadgeIcon,
  AccessTimeOutlined as TimeIcon,
  EventAvailableOutlined as EventAvailableIcon,
  PaymentsOutlined as PaymentsIcon,
  MoneyOutlined as MoneyIcon,
  SecurityOutlined as SecurityIcon,
  ExpandLessOutlined as ExpandLess,
  ExpandMoreOutlined as ExpandMore,
  BeachAccessOutlined as BeachAccessIcon,
  CalendarMonthOutlined as CalendarIcon,
  CategoryOutlined as CategoryIcon,
  FolderSpecialOutlined as FolderSpecialIcon,
  DomainOutlined as DomainIcon,
  AccountBalanceOutlined as AccountBalanceIcon,
  LocalAtmOutlined as LocalAtmIcon,
  LocalShippingOutlined as LocalShippingIcon,
  ReceiptLongOutlined as ReceiptLongIcon,
  ReceiptOutlined as InvoiceIcon,
  RequestQuoteOutlined as RequestQuoteIcon,
  PostAddOutlined as AdditionalIcon,
  DescriptionOutlined as QuoteRequestIcon,
  Inventory2Outlined as InventoryIcon,
  LockOutlined as LockIcon,
  NotificationsOutlined as NotificationsIcon,
  SettingsOutlined as SettingsIcon,
  ConstructionOutlined as ConstructionIcon,
  BuildOutlined as BuildIcon,
  SwapHorizOutlined as SwapHorizIcon,
  QrCodeScannerOutlined as QrCodeScannerIcon,
  HelpOutlineOutlined as HelpIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../utils/auth';
import ProtectedRoute from '../../components/ProtectedRoute';
import { AlertViewsProvider } from '../../components/common/AlertViewsProvider';
import { QuickNotesProvider } from '../../components/notes/QuickNotesProvider';
import QuickNotesFab from '../../components/notes/QuickNotesFab';
import QuickNotesDrawer from '../../components/notes/QuickNotesDrawer';
import NotificationBell from '../../components/common/NotificationBell';
import ChangePasswordDialog from '../../components/ChangePasswordDialog';
import PushNotificationsDialog from '../../components/common/PushNotificationsDialog';
import { reconcilePushSubscriptionOnLoad, unsubscribeFromPush, unsubscribeFromPushLocalOnly } from '../../utils/push';
import { onSessionExpired } from '../../utils/sessionExpiry';
import SessionExpiredDialog from '../../components/SessionExpiredDialog';

const drawerWidth = 280;
// Menú lateral colapsado (solo desktop): deja solo la columna de íconos para darle más ancho al
// contenido — hay listados tan anchos que no entran en el viewport con el menú desplegado.
const collapsedDrawerWidth = 72;
// Preferencia del usuario, por navegador. Solo es una comodidad: si el storage no está disponible
// (modo privado, bloqueado) el menú simplemente arranca desplegado.
const SIDEBAR_COLLAPSED_KEY = 'conmomet_sidebar_collapsed';

interface MenuItemDef {
  text: string;
  icon: React.ReactNode;
  path: string;
  requiredPermission: string | null;
}

interface MenuGroupDef {
  title: string;
  // Ícono del grupo para el menú colapsado (ver FLOWS.md §49). Los grupos sin título (Inicio y Centro de
  // Ayuda) son links sueltos y no lo necesitan: se muestran con el ícono de su único ítem.
  icon?: React.ReactNode;
  items: MenuItemDef[];
}

const menuGroups: MenuGroupDef[] = [
  {
    title: '',
    items: [
      { text: 'Inicio', icon: <DashboardIcon />, path: '/dashboard', requiredPermission: null }
    ]
  },
  {
    title: 'Personal',
    icon: <PersonnelGroupIcon />,
    items: [
      { text: 'Empleados', icon: <BadgeIcon />, path: '/dashboard/employees', requiredPermission: 'employees_read' },
      { text: 'Licencias y Vacaciones', icon: <BeachAccessIcon />, path: '/dashboard/leave-requests', requiredPermission: 'leave_requests_read' },
      { text: 'Carga de Horas', icon: <TimeIcon />, path: '/dashboard/time-entries', requiredPermission: 'time_entries_read' },
      { text: 'Presentismo', icon: <EventAvailableIcon />, path: '/dashboard/attendance', requiredPermission: 'attendance_read' },
      { text: 'EPP', icon: <SecurityIcon />, path: '/dashboard/safety-equipment', requiredPermission: 'safety_equipment_read' },
    ]
  },
  {
    title: 'Contabilidad',
    icon: <AccountingGroupIcon />,
    items: [
      { text: 'Quincenas y Pagos', icon: <PaymentsIcon />, path: '/dashboard/pay-periods', requiredPermission: 'pay_periods_read' },
      { text: 'Adelantos', icon: <MoneyIcon />, path: '/dashboard/salary-advances', requiredPermission: 'salary_advances_read' },
      { text: 'Préstamos', icon: <LocalAtmIcon />, path: '/dashboard/loans', requiredPermission: 'loans_read' },
      { text: 'Gastos Patronales', icon: <AccountBalanceIcon />, path: '/dashboard/employer-costs', requiredPermission: 'employer_costs_read' },
      { text: 'Resumen de Costos', icon: <AccountBalanceIcon />, path: '/dashboard/expense-summary', requiredPermission: 'expense_summary_read' },
    ]
  },
  {
    title: 'Gestión de Clientes',
    icon: <ClientsGroupIcon />,
    items: [
      { text: 'Clientes', icon: <Business />, path: '/dashboard/clients', requiredPermission: 'clients_read' },
      { text: 'Plantas', icon: <FactoryIcon />, path: '/dashboard/plants', requiredPermission: 'plants_read' },
      { text: 'Proyectos', icon: <AssignmentIcon />, path: '/dashboard/projects', requiredPermission: 'projects_read' },
      { text: 'Adicionales', icon: <AdditionalIcon />, path: '/dashboard/additionals', requiredPermission: 'additionals_read' },
      { text: 'Pedidos de Cotización', icon: <QuoteRequestIcon />, path: '/dashboard/quote-requests', requiredPermission: 'quote_requests_read' },
      { text: 'Presupuestos', icon: <RequestQuoteIcon />, path: '/dashboard/budgets', requiredPermission: 'budgets_read' },
      { text: 'Remitos / OCAs', icon: <ReceiptLongIcon />, path: '/dashboard/ocas', requiredPermission: 'ocas_read' },
    ]
  },
  // Separada de "Contabilidad" (todo del lado de costos y personal): va a crecer con
  // comprobantes, cobranzas, cuenta corriente e integración con ARCA.
  {
    title: 'Facturación',
    icon: <InvoiceIcon />,
    items: [
      { text: 'Facturación', icon: <InvoiceIcon />, path: '/dashboard/billing', requiredPermission: 'invoices_read' },
    ]
  },
  {
    title: 'Pañol',
    icon: <StoreGroupIcon />,
    items: [
      { text: 'Materiales', icon: <InventoryIcon />, path: '/dashboard/materials', requiredPermission: 'materials_read' },
      { text: 'Unidades de Medida', icon: <CategoryIcon />, path: '/dashboard/material-units', requiredPermission: 'material_units_read' },
      { text: 'Tipos de Herramienta', icon: <ConstructionIcon />, path: '/dashboard/tool-types', requiredPermission: 'tool_types_read' },
      { text: 'Herramientas', icon: <BuildIcon />, path: '/dashboard/tools', requiredPermission: 'tools_read' },
      { text: 'Asignaciones', icon: <SwapHorizIcon />, path: '/dashboard/asset-assignments', requiredPermission: 'asset_assignments_read' },
      { text: 'Escanear QR', icon: <QrCodeScannerIcon />, path: '/dashboard/scan', requiredPermission: null },
    ]
  },
  {
    title: 'Flota',
    icon: <LocalShippingIcon />,
    items: [
      { text: 'Vehículos', icon: <LocalShippingIcon />, path: '/dashboard/vehicles', requiredPermission: 'vehicles_read' },
    ]
  },
  {
    title: 'Gestión de Usuarios',
    icon: <UsersGroupIcon />,
    items: [
      { text: 'Usuarios', icon: <PeopleIcon />, path: '/dashboard/users', requiredPermission: 'users_read' },
      { text: 'Roles y Permisos', icon: <RolesIcon />, path: '/dashboard/roles', requiredPermission: 'roles_read' },
    ]
  },
  { title: 'Web', icon: <WebGroupIcon />, items: [{ text: 'Artículos', icon: <ArticleIcon />, path: '/dashboard/articles', requiredPermission: 'media_read' }] },
  {
    title: 'Configuración',
    icon: <SettingsIcon />,
    items: [
      { text: 'Gremios (Sindicatos)', icon: <DomainIcon />, path: '/dashboard/guilds', requiredPermission: 'guilds_read' },
      { text: 'Categorías Gastos', icon: <CategoryIcon />, path: '/dashboard/employer-cost-categories', requiredPermission: 'employer_cost_categories_read' },
      { text: 'Categorías (CCT)', icon: <CategoryIcon />, path: '/dashboard/categories', requiredPermission: 'categories_read' },
      { text: 'Rubros de Presupuesto', icon: <CategoryIcon />, path: '/dashboard/budget-item-types', requiredPermission: 'budget_item_types_read' },
      { text: 'Categorías de Documentos', icon: <FolderSpecialIcon />, path: '/dashboard/document-categories', requiredPermission: 'document_categories_read' },
      { text: 'Conceptos de Liquidación', icon: <CategoryIcon />, path: '/dashboard/payroll-concepts', requiredPermission: 'payroll_concepts_read' },
      { text: 'Feriados', icon: <CalendarIcon />, path: '/dashboard/holidays', requiredPermission: 'holidays_read' },
      { text: 'Configuración General', icon: <SettingsIcon />, path: '/dashboard/system-settings', requiredPermission: 'system_settings_update' },
    ]
  },
  {
    title: '',
    items: [
      { text: 'Centro de Ayuda', icon: <HelpIcon />, path: '/dashboard/help', requiredPermission: null },
    ]
  },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// Prueba: degradé + sombra suave (mismo efecto que el avatar del header) en los
// botones "contained" primarios, acotado al dashboard vía theme anidado.
const dashboardTheme = createTheme(baseTheme, {
  components: {
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          background: 'linear-gradient(135deg, #60a5fa 0%, #1d4ed8 100%)',
          boxShadow: '0 2px 8px rgba(29, 78, 216, 0.35)',
          '&:hover': {
            background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
            boxShadow: '0 4px 12px rgba(29, 78, 216, 0.45)',
          },
        },
      },
    },
  },
});

// Botón de solo ícono del menú colapsado: tooltip a la derecha con el nombre, y aria-label para
// lectores de pantalla (sin texto visible, el ícono solo no dice qué es).
function CollapsedMenuButton({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <ListItem disablePadding sx={{ px: 1, mb: 0.5 }}>
      <Tooltip title={label} placement="right" arrow>
        <ListItemButton
          aria-label={label}
          onClick={onClick}
          sx={{
            minHeight: 44,
            borderRadius: 1,
            justifyContent: 'center',
            px: 0,
            '&:hover': {
              bgcolor: 'primary.light',
              color: 'white',
            },
          }}
        >
          <ListItemIcon sx={{ color: 'inherit', minWidth: 0, justifyContent: 'center' }}>
            {icon}
          </ListItemIcon>
        </ListItemButton>
      </Tooltip>
    </ListItem>
  );
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const router = useRouter();
  const { user, logout } = useAuth();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  // Colapso del menú en desktop. Arranca en false (igual que el HTML del servidor, para no romper
  // la hidratación) y se lee del storage recién después de montar.
  const [collapsed, setCollapsed] = useState(false);
  // Las transiciones de ancho se habilitan DESPUÉS de leer la preferencia: si no, quien dejó el menú
  // colapsado vería cómo se cierra solo, con animación, en cada recarga completa.
  const [sidebarAnimated, setSidebarAnimated] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    menuGroups.forEach((g) => {
      if (g.title) {
        initialState[g.title] = false;
      }
    });
    return initialState;
  });

  const handleGroupToggle = (title: string) => {
    setOpenGroups((prev) => {
      const nextState: Record<string, boolean> = {};
      menuGroups.forEach((g) => {
        if (g.title) {
          nextState[g.title] = g.title === title ? !prev[g.title] : false;
        }
      });
      return nextState;
    });
  };

  // Tocar el ícono de un grupo en el menú colapsado: despliega el menú y deja abierto SOLO ese grupo
  // (los grupos son acordeones). Cuenta como expandir a propósito, así que también se recuerda.
  const handleGroupExpand = (title: string) => {
    setOpenGroups(() => {
      const nextState: Record<string, boolean> = {};
      menuGroups.forEach((g) => {
        if (g.title) nextState[g.title] = g.title === title;
      });
      return nextState;
    });
    setCollapsed(false);
    try {
      window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, '0');
    } catch {
      // Sin storage la preferencia no se recuerda, pero el cambio de esta sesión sí aplica.
    }
  };

  useEffect(() => {
    try {
      if (window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1') setCollapsed(true);
    } catch {
      // Storage no disponible: se queda desplegado.
    }
    const t = setTimeout(() => setSidebarAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  const handleCollapseToggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0');
    } catch {
      // Sin storage la preferencia no se recuerda, pero el cambio de esta sesión sí aplica.
    }
  };

  // Ancho real del menú en desktop. En mobile el drawer es temporal y siempre va desplegado.
  const desktopDrawerWidth = collapsed ? collapsedDrawerWidth : drawerWidth;
  const widthTransition = sidebarAnimated
    ? theme.transitions.create(['width', 'margin-left'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.shorter,
      })
    : 'none';

  // Redirección si no tiene acceso al dashboard
  useEffect(() => {
    if (user && user.has_dashboard_access === false) {
      router.replace('/portal');
    }
  }, [user, router]);

  // Capa 1 de la reconciliación de pushsubscriptionchange (ver FLOWS.md flujo 28) — en cada
  // arranque, si ya había una suscripción activa en este dispositivo, se vuelve a mandar al
  // servidor. No pide permiso ni molesta si no hay suscripción; falla en silencio.
  useEffect(() => {
    reconcilePushSubscriptionOnLoad();
  }, []);

  // Celular compartido, caso "sesión venció sola" (ver FLOWS.md flujo 28, §4): acá el token ya
  // no es válido, así que no se intenta avisar al servidor (fallaría y encadenaría otro
  // handleSessionExpired) — solo se invalida localmente, que es la defensa real.
  useEffect(() => {
    return onSessionExpired(() => {
      unsubscribeFromPushLocalOnly();
    });
  }, []);

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
    // Celular compartido (ver FLOWS.md flujo 28, §4): avisar al servidor primero (todavía hay
    // token válido) y recién después invalidar localmente — unsubscribeFromPush() ya hace esto
    // en ese orden. Con timeout de ~2s para que una red mala no cuelgue el logout, y en
    // try/finally para que un fallo no se salte el logout en sí.
    Promise.race([
      unsubscribeFromPush().catch(() => undefined),
      new Promise<void>((resolve) => setTimeout(resolve, 2000)),
    ]).finally(() => {
      logout();
    });
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

  // Verificar si el usuario tiene un permiso específico
  const userPermissions: string[] = Array.isArray((user as Record<string, unknown>)?.permissions)
    ? ((user as Record<string, unknown>).permissions as string[])
    : [];

  const hasPermission = (permission: string | null): boolean => {
    if (!permission) return true; // null = siempre visible
    if (userPermissions.includes('admin_granted')) return true; // admin ve todo
    return userPermissions.includes(permission);
  };

  // Filtrar grupos del menú según permisos del usuario
  const filteredMenuGroups = menuGroups
    .map(group => ({
      ...group,
      items: group.items.filter(item => hasPermission(item.requiredPermission)),
    }))
    .filter(group => group.items.length > 0);

  // `isCollapsed`: versión de solo íconos (únicamente el drawer de desktop). `canCollapse`: si se
  // muestra el botón para colapsar — el drawer de mobile es temporal y no lo lleva.
  const renderDrawer = (isCollapsed: boolean, canCollapse: boolean) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* disableGutters colapsado: el Toolbar trae 16–24 px de padding por lado, y en 72 px de menú
            eso deja ~24 px de contenido — el engranaje se achicaba por flex y quedaba cortado. */}
        <Toolbar disableGutters={isCollapsed} sx={{ background: 'linear-gradient(135deg, #bbdefb 0%, #e3f2fd 100%)', borderBottom: '1px solid', borderColor: 'divider', minHeight: { xs: 56, sm: 64 }, justifyContent: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', py: 1 }}>
          {isCollapsed ? (
            // El logo completo no entra en 72px: se muestra solo el engranaje (la franja izquierda
            // del mismo PNG, recortada por background-position como hace GearSpinner, sin girar).
            // En el PNG (834×284) el engranaje ocupa x 10–263 e y 16–265: a 36 px de alto queda en
            // ~1–33 px de ancho, o sea que entra entero en un cuadrado de 36. flexShrink 0 evita que
            // el flex lo achique y lo corte.
            <Box
              component="span"
              role="img"
              aria-label="Conmomet S.A."
              sx={{
                display: 'inline-block',
                flexShrink: 0,
                width: 36,
                height: 36,
                backgroundImage: 'url(/img/logos/logo-conmomet-ROJO.png)',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'left center',
                backgroundSize: 'auto 100%',
              }}
            />
          ) : (
            <Image
              src="/img/logos/logo-conmomet-ROJO.png"
              alt="Conmomet S.A."
              width={192}
              height={58}
              style={{ objectFit: 'contain', width: 'auto', maxHeight: 58 }}
              priority
            />
          )}
        </Box>
      </Toolbar>
      <Divider />
      {/* Botón de colapsar ARRIBA, fijo: la lista de abajo es lo único que scrollea (el header y esta
          fila quedan siempre a la vista, también con el menú desplegado y muchos grupos abiertos). */}
      {canCollapse && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: isCollapsed ? 'center' : 'flex-end',
            px: isCollapsed ? 0 : 1,
            py: 0.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Tooltip title={isCollapsed ? 'Expandir menú' : 'Contraer menú'} placement="right">
            <IconButton
              size="small"
              onClick={handleCollapseToggle}
              aria-label={isCollapsed ? 'Expandir el menú lateral' : 'Contraer el menú lateral'}
              aria-expanded={!isCollapsed}
            >
              {isCollapsed ? <ExpandMenuIcon /> : <CollapseMenuIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      )}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', overflowX: 'hidden' }}>
      {isCollapsed ? (
        // Un ícono por GRUPO del menú (no por ítem). Tocar el de un grupo despliega el menú y deja
        // abierto ese grupo, que es donde están sus submenús (FLOWS.md §49). Los links sueltos
        // (Inicio y Centro de Ayuda) no tienen submenú que mostrar, así que van directo a su página.
        // Las etiquetas quedan en el tooltip y en aria-label.
        <List sx={{ pt: 1 }}>
          {filteredMenuGroups.map((group, groupIndex) => {
            const standalone = !group.title;
            return (
              <React.Fragment key={groupIndex}>
                {/* Los links sueltos del final (Centro de Ayuda) se separan de los grupos. */}
                {standalone && groupIndex > 0 && <Divider sx={{ my: 1, mx: 1.5, opacity: 0.5 }} />}
                {standalone ? (
                  group.items.map((item) => (
                    <CollapsedMenuButton
                      key={item.text}
                      label={item.text}
                      icon={item.icon}
                      onClick={() => handleNavigation(item.path)}
                    />
                  ))
                ) : (
                  <CollapsedMenuButton
                    label={group.title}
                    icon={group.icon ?? group.items[0].icon}
                    onClick={() => handleGroupExpand(group.title)}
                  />
                )}
              </React.Fragment>
            );
          })}
        </List>
      ) : (
      <List sx={{ pt: 2 }}>
        {filteredMenuGroups.map((group, groupIndex) => (
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
                    //textTransform: 'uppercase', 
                    fontSize: '1rem', 
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
                        pl: group.title ? 3 : 2,
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
            {groupIndex < filteredMenuGroups.length - 1 && <Divider sx={{ my: 1, mx: 2, opacity: 0.5 }} />}
          </React.Fragment>
        ))}
      </List>
      )}
      </Box>
      {/* Pie: solo la versión. Colapsado no entra en 72px, así que no se muestra. */}
      {!isCollapsed && (
        <Box sx={{ p: 2, textAlign: 'center', borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.disabled">
            v {process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'}
          </Typography>
        </Box>
      )}
    </Box>
  );

  return (
    <ThemeProvider theme={dashboardTheme}>
    <ProtectedRoute>
    {/* Acuse de vista de los avisos del tablero (FLOWS.md §36). Va en el layout, no en la page:
        una sola carga de GET /me/alert-views para toda la banda de avisos. */}
    <AlertViewsProvider>
    {/* Notas rápidas personales (FLOWS.md §48): el provider vive acá para que el botón flotante, el
        panel y el widget de Inicio compartan una sola carga y el borrador sobreviva al cerrar el
        panel. Solo dashboard — el Portal no las tiene. */}
    <QuickNotesProvider>
      <Box sx={{ display: 'flex' }}>
        {/* App Bar */}
        <AppBar
          position="fixed"
          className="no-print"
          sx={{
            width: { md: `calc(100% - ${desktopDrawerWidth}px)` },
            ml: { md: `${desktopDrawerWidth}px` },
            transition: widthTransition,
            bgcolor: 'background.paper',
            color: 'text.primary',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <Toolbar sx={{ position: 'relative', minHeight: HEADER_MIN_HEIGHT, background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuIcon sx={{ fontSize: HEADER_TOGGLE_ICON_SIZE }} />
            </IconButton>

            <Box
              sx={{
                display: { xs: 'flex', md: 'none' },
                alignItems: 'center',
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            >
              <HeaderLogo />
            </Box>

            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>

            </Typography>

            {/* Campanita + usuario logueado */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <NotificationBell />
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  {getUserDisplayName()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {getUserRole()}
                </Typography>
              </Box>
              <HeaderAvatarButton
                edge="end"
                aria-label="account of current user"
                aria-haspopup="true"
                onClick={handleProfileMenuOpen}
                initials={getUserInitials()}
                gradient="linear-gradient(135deg, #60a5fa 0%, #1d4ed8 100%)"
                shadowColor="rgba(29, 78, 216, 0.35)"
              />
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
          {/* <MenuItem onClick={handleProfileMenuClose}>
            <ListItemIcon>
              <AccountCircle fontSize="small" />
            </ListItemIcon>
            <ListItemText>Mi Perfil</ListItemText>
          </MenuItem> */}
          {user?.employee_id && (
            <MenuItem onClick={() => { handleProfileMenuClose(); router.push('/portal'); }}>
              <ListItemIcon>
                <BadgeIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Mi Portal</ListItemText>
            </MenuItem>
          )}
          <MenuItem onClick={() => { handleProfileMenuClose(); setChangePasswordOpen(true); }}>
            <ListItemIcon>
              <LockIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Cambiar contraseña</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => { handleProfileMenuClose(); setNotificationsOpen(true); }}>
            <ListItemIcon>
              <NotificationsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Notificaciones en este dispositivo</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Cerrar Sesión</ListItemText>
          </MenuItem>
        </Menu>

        <ChangePasswordDialog
          open={changePasswordOpen || !!user?.must_change_password}
          onClose={() => setChangePasswordOpen(false)}
          forced={!!user?.must_change_password}
        />

        <PushNotificationsDialog open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />

        <SessionExpiredDialog />

        {/* Drawer */}
        <Box
          component="nav"
          className="no-print"
          sx={{ width: { md: desktopDrawerWidth }, flexShrink: { md: 0 }, transition: widthTransition }}
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
            {renderDrawer(false, false)}
          </Drawer>

          {/* Desktop drawer */}
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', md: 'block' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: desktopDrawerWidth,
                overflowX: 'hidden',
                transition: widthTransition,
              },
            }}
            open
          >
            {renderDrawer(collapsed, true)}
          </Drawer>
        </Box>

        {/* Main content */}
        <Box
          component="main"
          // Enmascarado de respaldo para Microsoft Clarity (ver FLOWS.md flujo 40). El control
          // principal es el ajuste "Mask all content" del proyecto de Clarity; esto es la defensa
          // en profundidad por si ese ajuste se desactivara por error.
          data-clarity-mask="true"
          sx={{
            flexGrow: 1,
            px: 3,
            pt: { xs: 1, md: 3 },
            pb: 3,
            width: { md: `calc(100% - ${desktopDrawerWidth}px)` },
            transition: widthTransition,
            minHeight: '100vh',
            bgcolor: 'background.default',
          }}
        >
          <Toolbar className="no-print" sx={{ minHeight: HEADER_MIN_HEIGHT }} />
          <Box className="no-print" sx={{ display: { xs: 'block', md: 'none' }, mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Hola, {getUserDisplayName()}!
            </Typography>
          </Box>
          {children}
        </Box>

        <QuickNotesFab />
        <QuickNotesDrawer />
      </Box>
    </QuickNotesProvider>
    </AlertViewsProvider>
    </ProtectedRoute>
    </ThemeProvider>
  );
}