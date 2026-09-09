import React from 'react';
import {
  BadgeOutlined as BadgeIcon,
  ArticleOutlined as ArticleIcon,
  AccessTimeOutlined as TimeIcon,
  EventAvailableOutlined as EventAvailableIcon,
  SecurityOutlined as SecurityIcon,
  PaymentsOutlined as PaymentsIcon,
  RequestQuoteOutlined as RequestQuoteIcon,
} from '@mui/icons-material';

export interface PortalMenuItem {
  key: string;
  label: string;
  path: string;
  // Solo "Mi Legajo" difiere: en desktop /portal ya muestra el legajo directo, en mobile esa
  // ruta muestra la grilla de accesos y el legajo vive en /portal/profile.
  mobilePath?: string;
  icon: React.ReactElement;
  // Liquidaciones queda oculta del menú (grilla mobile y tabs desktop/tablet) por ahora — la
  // ruta /portal/payroll sigue intacta, solo no se muestra ningún botón hacia ella.
  hidden?: boolean;
}

// Fuente única de orden y contenido del menú del portal — la reusan tanto la fila de tabs
// desktop/tablet (portal/layout.tsx) como la grilla mobile (PortalHomeGrid.tsx), para que nunca
// vuelvan a mostrar los items en un orden distinto entre sí.
export const PORTAL_MENU_ITEMS: PortalMenuItem[] = [
  { key: 'legajo', label: 'Mi Legajo', path: '/portal', mobilePath: '/portal/profile', icon: <BadgeIcon /> },
  { key: 'requests', label: 'Adelantos y Préstamos', path: '/portal/requests', icon: <RequestQuoteIcon /> },
  { key: 'epp', label: 'Mi EPP', path: '/portal/safety-equipment', icon: <SecurityIcon /> },
  { key: 'documents', label: 'Documentos', path: '/portal/documents', icon: <ArticleIcon /> },
  { key: 'time-entries', label: 'Mis Horas', path: '/portal/time-entries', icon: <TimeIcon /> },
  { key: 'attendance', label: 'Mi Asistencia', path: '/portal/attendance', icon: <EventAvailableIcon /> },
  { key: 'payroll', label: 'Liquidaciones', path: '/portal/payroll', icon: <PaymentsIcon />, hidden: true },
];
