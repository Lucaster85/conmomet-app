'use client';
import React from 'react';
import { Box, Card, CardActionArea, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';

export interface IconTileItem {
  key: string;
  label: string;
  path: string;
  icon: React.ReactNode;
}

interface IconTileGridProps {
  items: IconTileItem[];
  columns?: { xs: number; sm: number };
}

export default function IconTileGrid({ items, columns = { xs: 3, sm: 2 } }: IconTileGridProps) {
  const router = useRouter();

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: `repeat(${columns.xs}, 1fr)`, sm: `repeat(${columns.sm}, 1fr)` },
        gap: { xs: 1.5, sm: 2 },
      }}
    >
      {items.map((item) => (
        <Box
          key={item.key}
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
