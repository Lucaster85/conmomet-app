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
    'img/dashboardSlider/grain-steel-silo.jpg',
    'img/dashboardSlider/images.jpeg',
    'img/dashboardSlider/imagenEjemploObra.jpg',
  ];

  // Datos para el slider de noticias
  const newsCards = [
    {
      title: 'Nueva obra de Cargill en Quequen',
      description: 'Conmomet S.A. se enorgullece de anunciar la finalización de una nueva obra para Cargill en el puerto de Quequen, mejorando la infraestructura y capacidad operativa.',
      image: 'img/cardSlider/imagenEjemploObra.jpg'
    },
    {
      title: 'Armamos un nuevo silo para Cargill',
      description: 'Armamos un nuevo silo para Cargill en el puerto de Quequen, aumentando la capacidad de almacenamiento y eficiencia logística para nuestros clientes.',
      image: 'img/cardSlider/imagenEjemploObra.jpg'
    },
    {
      title: 'Tenemos una nueva Grua',
      description: 'La nueva grúa de Conmomet S.A. ya está operativa, ofreciendo mayor capacidad de carga y descarga para nuestros clientes en el puerto de Quequen.',
      image: 'img/cardSlider/imagenEjemploObra.jpg'
    },
    {
      title: 'Trabajamos en la nueva obra del puerto Quequen',
      description: 'Trabajamos en la nueva obra del puerto de Quequen, mejorando la infraestructura portuaria para facilitar el comercio y la logística en la región.',
      image: 'img/cardSlider/imagenEjemploObra.jpg'
    },
    {
      title: 'Nueva plegadora Saraza',
      description: 'La nueva plegadora Saraza de Conmomet S.A. ya está operativa, mejorando la eficiencia y precisión en nuestros procesos de producción.',
      image: 'img/cardSlider/imagenEjemploObra.jpg'
    },
    {
      title: 'Sumamos al equipo',
      description: 'Conmomet S.A. da la bienvenida a nuevos miembros en nuestro equipo, fortaleciendo nuestra capacidad para ofrecer soluciones innovadoras y de alta calidad.',
      image: 'img/cardSlider/imagenEjemploObra.jpg'
    },
  ];

  return (
    <Box>
      {/* Navigation Bar */}
      <AppBar
        position="fixed"
        elevation={1}
        sx={{ bgcolor: "background.paper" }}
      >
        <Toolbar>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, color: "primary.main", fontWeight: "bold" }}
          >
            Conmomet S.A.
          </Typography>
          <Button variant="outlined" onClick={handleLoginClick} sx={{ mr: 2 }}>
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
          minHeight: "100vh",
          background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
          display: "flex",
          alignItems: "center",
          pt: 8,
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 4,
            }}
          >
            <Box sx={{ flex: 1, minWidth: "300px" }}>
              <Typography
                variant="h1"
                sx={{
                  color: "white",
                  mb: 3,
                  fontSize: { xs: "2.5rem", md: "3.5rem" },
                }}
              >
                Conmomet S.A.
              </Typography>
              <Typography
                variant="h5"
                sx={{ color: "rgba(255,255,255,0.9)", mb: 4 }}
              >
                Experiencia y compromiso.
              </Typography>
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                <Button
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForward />}
                  onClick={handleLoginClick}
                  sx={{
                    bgcolor: "white",
                    color: "primary.main",
                    "&:hover": { bgcolor: "grey.100" },
                  }}
                >
                  Quiero que me contacten
                </Button>
                {/* <Button 
                  variant="outlined" 
                  size="large"
                  sx={{ 
                    color: 'white', 
                    borderColor: 'white',
                    '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' }
                  }}
                >
                  Ver Demo
                </Button> */}
              </Box>
            </Box>
            <Box sx={{ flex: 1, minWidth: "300px" }}>
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
        <Typography
          variant="h6"
          textAlign="center"
          color="text.secondary"
          sx={{ mb: 6 }}
        >
          Todo lo que necesitas para hacer crecer tu empresa de manera eficiente
          y segura.
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 4,
            justifyContent: "center",
          }}
        >
          <Card
            sx={{ maxWidth: 350, textAlign: "center", p: 3, flex: "1 1 300px" }}
          >
            <Business sx={{ fontSize: 60, color: "primary.main", mb: 2 }} />
            <Typography variant="h5" sx={{ mb: 2 }}>
              Montajes
            </Typography>
            <Typography color="text.secondary">
              Contrucciones Metálicas-Cálculos Estructurales.
            </Typography>
          </Card>

          <Card
            sx={{ maxWidth: 350, textAlign: "center", p: 3, flex: "1 1 300px" }}
          >
            <Analytics sx={{ fontSize: 60, color: "primary.main", mb: 2 }} />
            <Typography variant="h5" sx={{ mb: 2 }}>
              Torneria Industrial
            </Typography>
            <Typography color="text.secondary">
              Torneria de precisión, piezas únicas y series cortas para la
              industria.
            </Typography>
          </Card>

          <Card
            sx={{ maxWidth: 350, textAlign: "center", p: 3, flex: "1 1 300px" }}
          >
            <Analytics sx={{ fontSize: 60, color: "primary.main", mb: 2 }} />
            <Typography variant="h5" sx={{ mb: 2 }}>
              Plegados
            </Typography>
            <Typography color="text.secondary">
              Plegados de precisión, piezas únicas y series cortas para la
              industria.
            </Typography>
          </Card>
          <Card
            sx={{ maxWidth: 350, textAlign: "center", p: 3, flex: "1 1 300px" }}
          >
            <Security sx={{ fontSize: 60, color: "primary.main", mb: 2 }} />
            <Typography variant="h5" sx={{ mb: 2 }}>
              Seguridad
            </Typography>
            <Typography color="text.secondary">
              Comprometidos con la seguridad laboral y el bienestar de nuestros
              empleados.
            </Typography>
          </Card>
        </Box>
      </Container>

      {/* Articles Section */}
      <Box sx={{ bgcolor: "background.default", py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h2" textAlign="center" sx={{ mb: 6 }}>
            Últimas Novedades
          </Typography>

          <CardSlider cards={newsCards} visibleCards={3} />
        </Container>
      </Box>

      {/* Footer */}
      <Paper
        component="footer"
        sx={{
          bgcolor: "grey.900",
          color: "white",
          py: 6,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            <Box sx={{ flex: "1 1 300px" }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Conmomet
              </Typography>
              <Typography color="grey.400">
                La plataforma de gestión empresarial que necesitas para hacer
                crecer tu negocio de manera inteligente.
              </Typography>
            </Box>

            <Box sx={{ flex: "1 1 300px" }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Contacto
              </Typography>
              <Stack spacing={1}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Phone sx={{ mr: 1, fontSize: 20 }} />
                  <Typography color="grey.400">+54 11 1234-5678</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Email sx={{ mr: 1, fontSize: 20 }} />
                  <Typography color="grey.400">
                    contacto@conmomet.com
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <LocationOn sx={{ mr: 1, fontSize: 20 }} />
                  <Typography color="grey.400">
                    Quequen, Buenos Aires, Argentina
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <Box sx={{ flex: "1 1 300px" }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Enlaces Rápidos
              </Typography>
              <Stack spacing={1}>
                <Typography
                  color="grey.400"
                  sx={{ cursor: "pointer", "&:hover": { color: "white" } }}
                >
                  Sobre Nosotros
                </Typography>
                <Typography
                  color="grey.400"
                  sx={{ cursor: "pointer", "&:hover": { color: "white" } }}
                >
                  Servicios
                </Typography>
                <Typography
                  color="grey.400"
                  sx={{ cursor: "pointer", "&:hover": { color: "white" } }}
                >
                  Soporte
                </Typography>
                <Typography
                  color="grey.400"
                  sx={{ cursor: "pointer", "&:hover": { color: "white" } }}
                >
                  Términos y Condiciones
                </Typography>
              </Stack>
            </Box>
          </Box>

          <Box
            sx={{
              borderTop: "1px solid",
              borderColor: "grey.700",
              pt: 3,
              mt: 4,
              textAlign: "center",
            }}
          >
            <Typography color="grey.400">
              © 2025 Conmomet. Todos los derechos reservados.
            </Typography>
          </Box>
        </Container>
      </Paper>
    </Box>
  );
}