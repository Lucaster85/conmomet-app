'use client';
import React from 'react';
import { 
  Container, 
  Typography, 
  Button, 
  Box, 
  Card, 
  CardContent, 
  CardMedia,
  AppBar,
  Toolbar,
  IconButton,
  Paper,
  Stack
} from '@mui/material';
import { 
  ArrowForward, 
  Business, 
  Analytics, 
  Security,
  Phone,
  Email,
  LocationOn,
  Menu as MenuIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import ImageSlider from '../components/ImageSlider';
import CardSlider from '../components/CardSlider';

export default function LandingPage() {
  const router = useRouter();

  const handleLoginClick = () => {
    router.push('/login');
  };

  // Imágenes para el slider del dashboard
  const dashboardImages = [
    '/api/placeholder/600/400', // Placeholder URLs - reemplazar con imágenes reales
    '/api/placeholder/600/401',
    '/api/placeholder/600/402',
  ];

  // Datos para el slider de noticias
  const newsCards = [
    {
      title: 'Nuevas Funcionalidades',
      description: 'Descubre las últimas características que hemos añadido para mejorar tu experiencia de usuario.',
    },
    {
      title: 'Casos de Éxito',
      description: 'Lee sobre cómo nuestros clientes han transformado sus negocios usando nuestra plataforma.',
    },
    {
      title: 'Mejores Prácticas',
      description: 'Aprende las mejores estrategias para maximizar el potencial de tu negocio con nuestros consejos.',
    },
    {
      title: 'Actualizaciones de Seguridad',
      description: 'Conoce las últimas mejoras en seguridad implementadas para proteger tus datos.',
    },
    {
      title: 'Integración con APIs',
      description: 'Nueva funcionalidad de integración con servicios externos para expandir las capacidades del sistema.',
    },
    {
      title: 'Análisis Avanzado',
      description: 'Herramientas de análisis mejoradas para obtener insights más profundos de tu negocio.',
    },
  ];

  return (
    <Box>
      {/* Navigation Bar */}
      <AppBar position="fixed" elevation={1} sx={{ bgcolor: 'background.paper' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: 'primary.main', fontWeight: 'bold' }}>
            Conmomet
          </Typography>
          <Button 
            variant="outlined" 
            onClick={handleLoginClick}
            sx={{ mr: 2 }}
          >
            Iniciar Sesión
          </Button>
          <IconButton edge="end" color="primary">
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          display: 'flex',
          alignItems: 'center',
          pt: 8
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
            <Box sx={{ flex: 1, minWidth: '300px' }}>
              <Typography 
                variant="h1" 
                sx={{ 
                  color: 'white', 
                  mb: 3,
                  fontSize: { xs: '2.5rem', md: '3.5rem' }
                }}
              >
                Bienvenido a Conmomet
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ color: 'rgba(255,255,255,0.9)', mb: 4 }}
              >
                La solución integral para la gestión de tu negocio. 
                Optimiza procesos, analiza datos y toma decisiones inteligentes.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button 
                  variant="contained" 
                  size="large"
                  endIcon={<ArrowForward />}
                  onClick={handleLoginClick}
                  sx={{ 
                    bgcolor: 'white', 
                    color: 'primary.main',
                    '&:hover': { bgcolor: 'grey.100' }
                  }}
                >
                  Comenzar Ahora
                </Button>
                <Button 
                  variant="outlined" 
                  size="large"
                  sx={{ 
                    color: 'white', 
                    borderColor: 'white',
                    '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' }
                  }}
                >
                  Ver Demo
                </Button>
              </Box>
            </Box>
            <Box sx={{ flex: 1, minWidth: '300px' }}>
              <ImageSlider 
                images={dashboardImages}
                height={400}
                autoPlay={true}
                interval={4000}
              />
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h2" textAlign="center" sx={{ mb: 2 }}>
          Características Principales
        </Typography>
        <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
          Todo lo que necesitas para hacer crecer tu negocio
        </Typography>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center' }}>
          <Card sx={{ maxWidth: 350, textAlign: 'center', p: 3, flex: '1 1 300px' }}>
            <Business sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" sx={{ mb: 2 }}>
              Gestión Empresarial
            </Typography>
            <Typography color="text.secondary">
              Administra todos los aspectos de tu empresa desde una sola plataforma. 
              Control total de procesos y operaciones.
            </Typography>
          </Card>
          
          <Card sx={{ maxWidth: 350, textAlign: 'center', p: 3, flex: '1 1 300px' }}>
            <Analytics sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" sx={{ mb: 2 }}>
              Análisis Avanzado
            </Typography>
            <Typography color="text.secondary">
              Obtén insights valiosos con reportes detallados y análisis en tiempo real 
              para tomar decisiones informadas.
            </Typography>
          </Card>
          
          <Card sx={{ maxWidth: 350, textAlign: 'center', p: 3, flex: '1 1 300px' }}>
            <Security sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" sx={{ mb: 2 }}>
              Seguridad Total
            </Typography>
            <Typography color="text.secondary">
              Tus datos están protegidos con los más altos estándares de seguridad 
              y encriptación de nivel empresarial.
            </Typography>
          </Card>
        </Box>
      </Container>

      {/* Articles Section */}
      <Box sx={{ bgcolor: 'background.default', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h2" textAlign="center" sx={{ mb: 6 }}>
            Últimas Novedades
          </Typography>
          
          <CardSlider 
            cards={newsCards}
            visibleCards={3}
          />
        </Container>
      </Box>

      {/* Footer */}
      <Paper 
        component="footer" 
        sx={{ 
          bgcolor: 'grey.900', 
          color: 'white', 
          py: 6 
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            <Box sx={{ flex: '1 1 300px' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Conmomet
              </Typography>
              <Typography color="grey.400">
                La plataforma de gestión empresarial que necesitas para 
                hacer crecer tu negocio de manera inteligente.
              </Typography>
            </Box>
            
            <Box sx={{ flex: '1 1 300px' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Contacto
              </Typography>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Phone sx={{ mr: 1, fontSize: 20 }} />
                  <Typography color="grey.400">
                    +54 11 1234-5678
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Email sx={{ mr: 1, fontSize: 20 }} />
                  <Typography color="grey.400">
                    contacto@conmomet.com
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocationOn sx={{ mr: 1, fontSize: 20 }} />
                  <Typography color="grey.400">
                    Buenos Aires, Argentina
                  </Typography>
                </Box>
              </Stack>
            </Box>
            
            <Box sx={{ flex: '1 1 300px' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Enlaces Rápidos
              </Typography>
              <Stack spacing={1}>
                <Typography color="grey.400" sx={{ cursor: 'pointer', '&:hover': { color: 'white' } }}>
                  Sobre Nosotros
                </Typography>
                <Typography color="grey.400" sx={{ cursor: 'pointer', '&:hover': { color: 'white' } }}>
                  Servicios
                </Typography>
                <Typography color="grey.400" sx={{ cursor: 'pointer', '&:hover': { color: 'white' } }}>
                  Soporte
                </Typography>
                <Typography color="grey.400" sx={{ cursor: 'pointer', '&:hover': { color: 'white' } }}>
                  Términos y Condiciones
                </Typography>
              </Stack>
            </Box>
          </Box>
          
          <Box sx={{ borderTop: '1px solid', borderColor: 'grey.700', pt: 3, mt: 4, textAlign: 'center' }}>
            <Typography color="grey.400">
              © 2024 Conmomet. Todos los derechos reservados.
            </Typography>
          </Box>
        </Container>
      </Paper>
    </Box>
  );
}