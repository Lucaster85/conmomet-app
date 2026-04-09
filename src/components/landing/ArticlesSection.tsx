'use client';
import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, CircularProgress } from '@mui/material';
import CardSlider from '../CardSlider';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

interface SliderMedia {
  id: number;
  title?: string;
  description?: string;
  url: string;
  order?: number;
}

export default function ArticlesSection() {
  const [cards, setCards] = useState<{ title: string; description: string; image: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/public/media/type/slider`)
      .then((res) => res.json())
      .then((data) => {
        const items: SliderMedia[] = Array.isArray(data) ? data : (data.data || []);
        const sorted = [...items].sort((a, b) => {
          const orderA = a.order ?? Infinity;
          const orderB = b.order ?? Infinity;
          return orderA - orderB;
        });
        setCards(
          sorted.map((item) => ({
            title: item.title || '',
            description: item.description || '',
            image: item.url,
          }))
        );
      })
      .catch(() => setCards([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box sx={{ bgcolor: 'background.default', py: 8 }}>
      <Container maxWidth="lg">
        <Typography variant="h2" textAlign="center" sx={{ mb: 6 }}>
          Nuestro Trabajo
        </Typography>
        {loading ? (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress />
          </Box>
        ) : cards.length > 0 ? (
          <CardSlider cards={cards} visibleCards={3} />
        ) : null}
      </Container>
    </Box>
  );
}
