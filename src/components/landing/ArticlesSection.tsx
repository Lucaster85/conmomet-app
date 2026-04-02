'use client';
import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import CardSlider from '../CardSlider';

const newsCards = [
  {
    title: 'Nueva obra de Cargill en Quequen',
    description: 'Conmomet S.A. se enorgullece de anunciar la finalización de una nueva obra para Cargill en el puerto de Quequen, mejorando la infraestructura y capacidad operativa.',
    image: 'img/cardSlider/imagenEjemploObra.jpg',
  },
  {
    title: 'Armamos un nuevo silo para Cargill',
    description: 'Armamos un nuevo silo para Cargill en el puerto de Quequen, aumentando la capacidad de almacenamiento y eficiencia logística para nuestros clientes.',
    image: 'img/cardSlider/imagenEjemploObra.jpg',
  },
  {
    title: 'Tenemos una nueva Grua',
    description: 'La nueva grúa de Conmomet S.A. ya está operativa, ofreciendo mayor capacidad de carga y descarga para nuestros clientes en el puerto de Quequen.',
    image: 'img/cardSlider/imagenEjemploObra.jpg',
  },
  {
    title: 'Trabajamos en la nueva obra del puerto Quequen',
    description: 'Trabajamos en la nueva obra del puerto de Quequen, mejorando la infraestructura portuaria para facilitar el comercio y la logística en la región.',
    image: 'img/cardSlider/imagenEjemploObra.jpg',
  },
  {
    title: 'Nueva plegadora Saraza',
    description: 'La nueva plegadora Saraza de Conmomet S.A. ya está operativa, mejorando la eficiencia y precisión en nuestros procesos de producción.',
    image: 'img/cardSlider/imagenEjemploObra.jpg',
  },
  {
    title: 'Sumamos al equipo',
    description: 'Conmomet S.A. da la bienvenida a nuevos miembros en nuestro equipo, fortaleciendo nuestra capacidad para ofrecer soluciones innovadoras y de alta calidad.',
    image: 'img/cardSlider/imagenEjemploObra.jpg',
  },
];

export default function ArticlesSection() {
  return (
    <Box sx={{ bgcolor: "background.default", py: 8 }}>
      <Container maxWidth="lg">
        <Typography variant="h2" textAlign="center" sx={{ mb: 6 }}>
          Últimas Novedades
        </Typography>
        <CardSlider cards={newsCards} visibleCards={3} />
      </Container>
    </Box>
  );
}
