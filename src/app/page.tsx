'use client';
import React, { useState } from 'react';
import { Box } from '@mui/material';
import LandingHeader from '../components/landing/LandingHeader';
import HeroSection from '../components/landing/HeroSection';
import NosotrosSection from '../components/landing/NosotrosSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import ArticlesSection from '../components/landing/ArticlesSection';
import ClientsSection from '../components/landing/ClientsSection';
import FooterSection from '../components/landing/FooterSection';
import ContactModal from '../components/landing/ContactModal';

export default function LandingPage() {
  const [contactModalOpen, setContactModalOpen] = useState(false);

  return (
    <Box>
      <LandingHeader />
      <ContactModal open={contactModalOpen} onClose={() => setContactModalOpen(false)} />
      <Box id="inicio"><HeroSection onContactClick={() => setContactModalOpen(true)} /></Box>
      <Box id="nosotros"><NosotrosSection /></Box>
      <Box id="servicios"><FeaturesSection /></Box>
      <Box id="nuestro-trabajo"><ArticlesSection /></Box>
      <Box id="clientes"><ClientsSection /></Box>
      <FooterSection />
    </Box>
  );
}
