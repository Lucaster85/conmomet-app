'use client';
import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import {
  Box, Card, CardContent, CardMedia, IconButton,
  Typography, useMediaQuery, useTheme,
} from '@mui/material';
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

// 11% peek on each side → card width = 78% of container
const PEEK_RATIO = 0.11;
const CARD_RATIO = 1 - 2 * PEEK_RATIO; // 0.78
const CARD_GAP = 16; // px between cards

export default function CardSlider({ cards, visibleCards = 3 }: CardSliderProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [currentIndex, setCurrentIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);

  const desktopMaxIndex = Math.max(0, cards.length - visibleCards);
  const mobileMaxIndex = cards.length - 1;

  // Measure container synchronously before paint to avoid flicker
  useLayoutEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  useEffect(() => {
    setCurrentIndex(0);
  }, [isMobile]);

  const getTranslateX = (index: number) => {
    if (!containerWidth) return 0;
    const cardW = containerWidth * CARD_RATIO;
    const peekOffset = containerWidth * PEEK_RATIO;
    return peekOffset - index * (cardW + CARD_GAP);
  };

  const goTo = (index: number) => {
    const max = isMobile ? mobileMaxIndex : desktopMaxIndex;
    setCurrentIndex(Math.max(0, Math.min(max, index)));
  };
  const goToPrev = () =>
    setCurrentIndex((p) => (p === 0 ? (isMobile ? mobileMaxIndex : desktopMaxIndex) : p - 1));
  const goToNext = () =>
    setCurrentIndex((p) => {
      const max = isMobile ? mobileMaxIndex : desktopMaxIndex;
      return p === max ? 0 : p + 1;
    });

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsDragging(true);
    setDragOffset(0);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setDragOffset(e.touches[0].clientX - touchStartX.current);
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    setIsDragging(false);
    setDragOffset(0);
    if (delta < -50) goToNext();
    else if (delta > 50) goToPrev();
  };

  if (!cards.length) return null;

  // ── MOBILE / TABLET: swipeable peek slider ──────────────────────────────
  if (isMobile) {
    const tx = getTranslateX(currentIndex) + dragOffset;

    return (
      <Box sx={{ position: 'relative', width: '100%' }}>
        {/* overflow clip */}
        <Box
          ref={containerRef}
          sx={{ overflow: 'hidden', width: '100%', py: 2 }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* sliding track */}
          <Box
            sx={{
              display: 'flex',
              gap: `${CARD_GAP}px`,
              transition: isDragging
                ? 'none'
                : 'transform 0.38s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              transform: `translateX(${tx}px)`,
              willChange: 'transform',
            }}
          >
            {cards.map((card, i) => {
              const isActive = i === currentIndex;
              return (
                <Card
                  key={i}
                  sx={{
                    flex: `0 0 ${CARD_RATIO * 100}%`,
                    transition: 'transform 0.38s ease, box-shadow 0.38s ease',
                    transform: isActive ? 'translateY(-10px)' : 'translateY(4px)',
                    boxShadow: isActive
                      ? '0 20px 48px rgba(0,0,0,0.18)'
                      : '0 2px 8px rgba(0,0,0,0.07)',
                    // Disable the theme hover on mobile (touch devices)
                    '&:hover': {
                      transform: isActive ? 'translateY(-10px)' : 'translateY(4px)',
                      boxShadow: isActive
                        ? '0 20px 48px rgba(0,0,0,0.18)'
                        : '0 2px 8px rgba(0,0,0,0.07)',
                    },
                    userSelect: 'none',
                  }}
                >
                  <CardMedia
                    component="div"
                    sx={{
                      height: 180,
                      bgcolor: 'grey.300',
                      backgroundImage: card.image ? `url(${card.image})` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      {card.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {card.description}
                    </Typography>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        </Box>

        {/* Pill dots */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, gap: '6px', alignItems: 'center' }}>
          {cards.map((_, i) => (
            <Box
              key={i}
              onClick={() => goTo(i)}
              sx={{
                height: 8,
                width: i === currentIndex ? 24 : 8,
                borderRadius: 4,
                bgcolor: i === currentIndex ? 'primary.main' : 'grey.300',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </Box>
      </Box>
    );
  }

  // ── DESKTOP: original navigation ───────────────────────────────────────
  const desktopCards: (NewsCard & { originalIndex: number })[] = [];
  for (let i = 0; i < visibleCards && i < cards.length; i++) {
    const idx = (currentIndex + i) % cards.length;
    desktopCards.push({ ...cards[idx], originalIndex: idx });
  }

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <Box sx={{ display: 'flex', gap: 4, overflow: 'hidden', px: 6 }}>
        {desktopCards.map((card, di) => (
          <Card
            key={`${card.originalIndex}-${di}`}
            sx={{
              flex: `0 0 calc(${100 / visibleCards}% - ${(32 * (visibleCards - 1)) / visibleCards}px)`,
            }}
          >
            <CardMedia
              component="div"
              sx={{
                height: 200,
                bgcolor: 'grey.300',
                backgroundImage: card.image ? `url(${card.image})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {!card.image && (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                  Imagen del artículo
                </Typography>
              )}
            </CardMedia>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {card.title}
              </Typography>
              <Typography color="text.secondary">{card.description}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {cards.length > visibleCards && (
        <>
          <IconButton
            onClick={goToPrev}
            sx={{
              position: 'absolute', left: 0, top: '45%',
              transform: 'translateY(-50%)',
              bgcolor: 'background.paper', boxShadow: 2,
              '&:hover': { bgcolor: 'background.paper', boxShadow: 4 },
            }}
          >
            <ChevronLeft />
          </IconButton>
          <IconButton
            onClick={goToNext}
            sx={{
              position: 'absolute', right: 0, top: '45%',
              transform: 'translateY(-50%)',
              bgcolor: 'background.paper', boxShadow: 2,
              '&:hover': { bgcolor: 'background.paper', boxShadow: 4 },
            }}
          >
            <ChevronRight />
          </IconButton>

          {/* Pill dots */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, gap: '6px', alignItems: 'center' }}>
            {Array.from({ length: desktopMaxIndex + 1 }).map((_, i) => (
              <Box
                key={i}
                onClick={() => goTo(i)}
                sx={{
                  height: 8,
                  width: i === currentIndex ? 24 : 8,
                  borderRadius: 4,
                  bgcolor: i === currentIndex ? 'primary.main' : 'grey.300',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </Box>
        </>
      )}
    </Box>
  );
}