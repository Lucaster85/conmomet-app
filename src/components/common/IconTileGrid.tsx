'use client';
import React from 'react';
import { Box, Card, CardActionArea, Typography, Badge } from '@mui/material';
import { useRouter } from 'next/navigation';

export interface IconTileItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  // Navega a una ruta — comportamiento original (usado por el home del dashboard y el portal).
  path?: string;
  // Alternativa a `path`: dispara un callback en vez de navegar — usado para conmutar una
  // sección local dentro de la misma página (ej. el detalle de Proyecto, que no tiene rutas
  // separadas por pestaña). Si están los dos, `onClick` gana.
  onClick?: () => void;
  // Contador chico sobre el ícono (ej. cantidad de adicionales) — se omite si es 0/undefined.
  badge?: number;
}

interface IconTileGridProps {
  items: IconTileItem[];
  columns?: { xs: number; sm: number };
  // Key del item actualmente seleccionado — lo resalta con un borde. Pensado para el caso de
  // "onClick" (navegación local), no tiene sentido cuando los items navegan a otra página.
  activeKey?: string;
}

export default function IconTileGrid({ items, columns = { xs: 3, sm: 2 }, activeKey }: IconTileGridProps) {
  const router = useRouter();

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: `repeat(${columns.xs}, 1fr)`, sm: `repeat(${columns.sm}, 1fr)` },
        gap: { xs: 1.5, sm: 2 },
      }}
    >
      {items.map((item) => {
        const isActive = !!activeKey && item.key === activeKey;
        return (
          <Box
            key={item.key}
            sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75, cursor: 'pointer' }}
            onClick={() => (item.onClick ? item.onClick() : item.path && router.push(item.path))}
          >
            {/* containerType habilita unidades `cqi` (% del ancho del propio Card) en el ícono de
                adentro, así el ícono escala con el tamaño real del botón en cualquier pantalla, en
                vez de quedar en un tamaño fijo que se ve chico en teléfonos grandes. */}
            <Card
              sx={{
                aspectRatio: '1', width: '100%', borderRadius: 3, containerType: 'inline-size',
                ...(isActive && { border: '2px solid', borderColor: 'primary.main', bgcolor: 'primary.50' }),
              }}
            >
              <CardActionArea
                aria-label={item.label}
                aria-current={isActive || undefined}
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
                <Badge badgeContent={item.badge} color="secondary" invisible={!item.badge}>
                  {item.icon}
                </Badge>
              </CardActionArea>
            </Card>
            <Typography
              variant="caption"
              textAlign="center"
              lineHeight={1.2}
              sx={{ color: isActive ? 'primary.main' : 'text.secondary', fontWeight: isActive ? 600 : 400, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
            >
              {item.label}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}
