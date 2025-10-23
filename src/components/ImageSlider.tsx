'use client';
import React, { useState, useEffect } from 'react';
import { Box, IconButton, useTheme } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';

interface ImageSliderProps {
  images: string[];
  height?: number;
  autoPlay?: boolean;
  interval?: number;
}

export default function ImageSlider({ 
  images, 
  height = 400, 
  autoPlay = true, 
  interval = 3000 
}: ImageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const theme = useTheme();

  useEffect(() => {
    if (!autoPlay) return;

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      );
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, interval, images.length]);

  const goToPrevious = () => {
    setCurrentIndex(currentIndex === 0 ? images.length - 1 : currentIndex - 1);
  };

  const goToNext = () => {
    setCurrentIndex(currentIndex === images.length - 1 ? 0 : currentIndex + 1);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (!images.length) return null;

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height,
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: 'rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Imagen actual */}
      <Box
        component="img"
        src={images[currentIndex]}
        alt={`Slide ${currentIndex + 1}`}
        sx={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transition: 'opacity 0.5s ease-in-out',
        }}
        onError={(e) => {
          // Fallback si la imagen no carga
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />

      {/* Overlay con placeholder si no hay imagen */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(0,0,0,0.1)',
          color: 'white',
          fontSize: '1.2rem',
          fontWeight: 'bold',
        }}
      >
        Dashboard Preview {currentIndex + 1}
      </Box>

      {/* Botones de navegación */}
      <IconButton
        onClick={goToPrevious}
        sx={{
          position: 'absolute',
          left: 16,
          bgcolor: 'rgba(255,255,255,0.2)',
          color: 'white',
          '&:hover': {
            bgcolor: 'rgba(255,255,255,0.3)',
          },
        }}
      >
        <ChevronLeft />
      </IconButton>

      <IconButton
        onClick={goToNext}
        sx={{
          position: 'absolute',
          right: 16,
          bgcolor: 'rgba(255,255,255,0.2)',
          color: 'white',
          '&:hover': {
            bgcolor: 'rgba(255,255,255,0.3)',
          },
        }}
      >
        <ChevronRight />
      </IconButton>

      {/* Indicadores */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 1,
        }}
      >
        {images.map((_, index) => (
          <Box
            key={index}
            onClick={() => goToSlide(index)}
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              bgcolor: index === currentIndex ? 'white' : 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              transition: 'background-color 0.3s ease',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.8)',
              },
            }}
          />
        ))}
      </Box>
    </Box>
  );
}