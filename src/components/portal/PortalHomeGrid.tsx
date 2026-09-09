'use client';
import React from 'react';
import { Box, Card, CardActionArea, Typography } from '@mui/material';
import {
  BadgeOutlined as BadgeIcon,
  ArticleOutlined as ArticleIcon,
  AccessTimeOutlined as TimeIcon,
  EventAvailableOutlined as EventAvailableIcon,
  SecurityOutlined as SecurityIcon,
  PaymentsOutlined as PaymentsIcon,
  RequestQuoteOutlined as RequestQuoteIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

// Nota: a propósito NO reusa el array `tabs` de portal/layout.tsx — ahí "Mi Legajo" apunta a
// `/portal` (correcto para desktop, donde esa ruta sigue mostrando el legajo directo). Acá
// necesita apuntar a `/portal/profile`, la ruta nueva creada para esta grilla.
// Orden pedido por el usuario: fila 1 Legajo/Adelantos, fila 2 EPP/Documentos, fila 3
// Horas/Asistencia. "Liquidaciones" queda oculto por ahora (hidden:true) — la ruta y la
// funcionalidad de /portal/payroll siguen intactas, solo no se muestra el botón en la grilla.
const GRID_ITEMS = [
  { label: 'Mi Legajo', path: '/portal/profile', icon: <BadgeIcon /> },
  { label: 'Adelantos y Préstamos', path: '/portal/requests', icon: <RequestQuoteIcon /> },
  { label: 'Mi EPP', path: '/portal/safety-equipment', icon: <SecurityIcon /> },
  { label: 'Documentos', path: '/portal/documents', icon: <ArticleIcon /> },
  { label: 'Mis Horas', path: '/portal/time-entries', icon: <TimeIcon /> },
  { label: 'Mi Asistencia', path: '/portal/attendance', icon: <EventAvailableIcon /> },
  { label: 'Liquidaciones', path: '/portal/payroll', icon: <PaymentsIcon />, hidden: true },
];

export default function PortalHomeGrid() {
  const router = useRouter();

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(3, 1fr)', sm: 'repeat(2, 1fr)' },
        gap: { xs: 1.5, sm: 2 },
      }}
    >
      {GRID_ITEMS.filter((item) => !item.hidden).map((item) => (
        <Box
          key={item.path}
          sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75, cursor: 'pointer' }}
          onClick={() => router.push(item.path)}
        >
          {/* containerType habilita unidades `cqi` (% del ancho del propio Card) en el ícono de
              adentro, así el ícono escala con el tamaño real del botón en cualquier pantalla, en
              vez de quedar en un tamaño fijo que se ve chico en teléfonos grandes. */}
          <Card sx={{ aspectRatio: '1', width: '100%', borderRadius: 3, containerType: 'inline-size' }}>
            <CardActionArea
              aria-label={item.label}
              sx={{
                height: '100%',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'primary.main',
                '& .MuiSvgIcon-root': { fontSize: 'clamp(20px, 32cqi, 48px)' },
              }}
            >
              {item.icon}
            </CardActionArea>
          </Card>
          <Typography
            variant="caption"
            textAlign="center"
            lineHeight={1.2}
            sx={{ color: 'text.secondary', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
          >
            {item.label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
