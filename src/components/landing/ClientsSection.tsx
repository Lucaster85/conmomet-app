'use client';
import React, { useState } from 'react';
import { Box, Container, IconButton, Typography } from '@mui/material';
import { ArrowBackIos, ArrowForwardIos } from '@mui/icons-material';

interface Client {
  name: string;
  shortName: string;
}

const clients: Client[] = [
  { name: 'Cargill', shortName: 'CAR' },
  { name: 'Molinos Río de la Plata', shortName: 'MRP' },
  { name: 'Arcor', shortName: 'ARC' },
  { name: 'Bunge', shortName: 'BUN' },
  { name: 'Louis Dreyfus', shortName: 'LDC' },
  { name: 'AGD', shortName: 'AGD' },
  { name: 'Mastellone', shortName: 'MAS' },
  { name: 'Nidera', shortName: 'NID' },
];

const VISIBLE = 4;

export default function ClientsSection() {
  const [index, setIndex] = useState(0);

  const maxIndex = clients.length - VISIBLE;

  const prev = () => setIndex((i) => Math.max(i - 1, 0));
  const next = () => setIndex((i) => Math.min(i + 1, maxIndex));

  const visible = clients.slice(index, index + VISIBLE);

  return (
    <Box sx={{ py: 8, bgcolor: 'grey.50' }}>
      <Container maxWidth="lg">
        <Typography
          variant="h2"
          textAlign="center"
          sx={{ mb: 2, fontSize: { xs: '2rem', md: '2.75rem' } }}
        >
          Confían en nosotros
        </Typography>
        <Typography
          variant="body1"
          textAlign="center"
          color="text.secondary"
          sx={{ mb: 6, maxWidth: 560, mx: 'auto' }}
        >
          Empresas líderes del sector confían en Conmomet para sus proyectos.
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Flecha izquierda */}
          <IconButton
            onClick={prev}
            disabled={index === 0}
            size="small"
            sx={{ color: 'primary.main', flexShrink: 0, p: { xs: 0.5, md: 1 } }}
          >
            <ArrowBackIos fontSize="small" />
          </IconButton>

          {/* Cards visibles */}
          <Box
            sx={{
              flex: 1,
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
              gap: { xs: 1.5, md: 3 },
              overflow: 'hidden',
            }}
          >
            {visible.map((client) => (
              <Box
                key={client.name}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: { xs: 1, md: 1.5 },
                  p: { xs: 1.5, md: 3 },
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  minHeight: { xs: 90, md: 120 },
                  transition: 'box-shadow 0.2s',
                  '&:hover': { boxShadow: 3 },
                }}
              >
                {/* Placeholder logo: círculo con sigla */}
                <Box
                  sx={{
                    width: { xs: 40, md: 56 },
                    height: { xs: 40, md: 56 },
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ color: 'white', fontWeight: 'bold', fontSize: { xs: '0.6rem', md: '0.75rem' }, letterSpacing: 1 }}
                  >
                    {client.shortName}
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  textAlign="center"
                  sx={{ fontWeight: 500, color: 'text.primary', lineHeight: 1.3, fontSize: { xs: '0.7rem', md: '0.875rem' } }}
                >
                  {client.name}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Flecha derecha */}
          <IconButton
            onClick={next}
            disabled={index >= maxIndex}
            size="small"
            sx={{ color: 'primary.main', flexShrink: 0, p: { xs: 0.5, md: 1 } }}
          >
            <ArrowForwardIos fontSize="small" />
          </IconButton>
        </Box>

        {/* Dots de paginación */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 4 }}>
          {Array.from({ length: maxIndex + 1 }).map((_, i) => (
            <Box
              key={i}
              onClick={() => setIndex(i)}
              sx={{
                width: i === index ? 24 : 8,
                height: 8,
                borderRadius: 4,
                bgcolor: i === index ? 'primary.main' : 'grey.300',
                cursor: 'pointer',
                transition: 'all 0.25s',
              }}
            />
          ))}
        </Box>
      </Container>
    </Box>
  );
}
