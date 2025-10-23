'use client';
import React, { useState } from 'react';
import { Box, IconButton, Card, CardContent, CardMedia, Typography } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';

interface NewsCard {
  title: string;
  description: string;
  image?: string;
}

interface CardSliderProps {
  cards: NewsCard[];
  visibleCards?: number;
}

export default function CardSlider({ cards, visibleCards = 3 }: CardSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const maxIndex = Math.max(0, cards.length - visibleCards);

  const goToPrevious = () => {
    setCurrentIndex(currentIndex === 0 ? maxIndex : currentIndex - 1);
  };

  const goToNext = () => {
    setCurrentIndex(currentIndex === maxIndex ? 0 : currentIndex + 1);
  };

  const getVisibleCards = () => {
    const visible = [];
    for (let i = 0; i < visibleCards && i < cards.length; i++) {
      const cardIndex = (currentIndex + i) % cards.length;
      visible.push({ ...cards[cardIndex], index: cardIndex });
    }
    return visible;
  };

  if (!cards.length) return null;

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      {/* Contenedor de tarjetas */}
      <Box
        sx={{
          display: 'flex',
          gap: 4,
          overflow: 'hidden',
          px: { xs: 2, md: 6 }, // Espacio para los botones
        }}
      >
        {getVisibleCards().map((card, displayIndex) => (
          <Card
            key={`${card.index}-${displayIndex}`}
            sx={{
              flex: `0 0 ${100 / visibleCards}%`,
              maxWidth: 350,
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              },
            }}
          >
            <CardMedia
              component="div"
              sx={{
                height: 200,
                bgcolor: 'grey.300',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundImage: card.image ? `url(${card.image})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {!card.image && (
                <Typography variant="body2" color="text.secondary">
                  Imagen del artículo
                </Typography>
              )}
            </CardMedia>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {card.title}
              </Typography>
              <Typography color="text.secondary">
                {card.description}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Botones de navegación */}
      {cards.length > visibleCards && (
        <>
          <IconButton
            onClick={goToPrevious}
            sx={{
              position: 'absolute',
              left: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: 'background.paper',
              boxShadow: 2,
              '&:hover': {
                bgcolor: 'background.paper',
                boxShadow: 4,
              },
            }}
          >
            <ChevronLeft />
          </IconButton>

          <IconButton
            onClick={goToNext}
            sx={{
              position: 'absolute',
              right: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: 'background.paper',
              boxShadow: 2,
              '&:hover': {
                bgcolor: 'background.paper',
                boxShadow: 4,
              },
            }}
          >
            <ChevronRight />
          </IconButton>
        </>
      )}

      {/* Indicadores */}
      {cards.length > visibleCards && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mt: 3,
            gap: 1,
          }}
        >
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <Box
              key={index}
              onClick={() => setCurrentIndex(index)}
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: index === currentIndex ? 'primary.main' : 'grey.300',
                cursor: 'pointer',
                transition: 'background-color 0.3s ease',
                '&:hover': {
                  bgcolor: index === currentIndex ? 'primary.dark' : 'grey.400',
                },
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}