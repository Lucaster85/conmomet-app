'use client';
import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Paper,
  Stack,
} from '@mui/material';
import {
  TrendingUp,
  People,
  Business,
  Assessment,
} from '@mui/icons-material';
import { useAuth } from '../../utils/auth';

const stats = [
  {
    title: 'Total Usuarios',
    value: '1,234',
    change: '+12%',
    trend: 'up',
    icon: <People sx={{ fontSize: 40, color: 'primary.main' }} />,
  },
  {
    title: 'Empresas Activas',
    value: '567',
    change: '+8%',
    trend: 'up',
    icon: <Business sx={{ fontSize: 40, color: 'success.main' }} />,
  },
  {
    title: 'Reportes Generados',
    value: '89',
    change: '+15%',
    trend: 'up',
    icon: <Assessment sx={{ fontSize: 40, color: 'info.main' }} />,
  },
  {
    title: 'Crecimiento',
    value: '23%',
    change: '+5%',
    trend: 'up',
    icon: <TrendingUp sx={{ fontSize: 40, color: 'warning.main' }} />,
  },
];

export default function DashboardPage() {
  const { user } = useAuth();

  const getUserWelcomeMessage = () => {
    if (user?.fullName) return `Bienvenido de vuelta, ${user.fullName}`;
    if (user?.name) return `Bienvenido de vuelta, ${user.name}`;
    return 'Bienvenido de vuelta';
  };
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
        {getUserWelcomeMessage()}
      </Typography>

      {/* Statistics Cards */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 3,
          mb: 4,
        }}
      >
        {stats.map((stat, index) => (
          <Card
            key={index}
            sx={{
              flex: '1 1 250px',
              minWidth: 250,
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                    {stat.title}
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'success.main' }}>
                    {stat.change} vs mes anterior
                  </Typography>
                </Box>
                <Box sx={{ opacity: 0.7 }}>
                  {stat.icon}
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Content Sections */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 3,
        }}
      >
        {/* Actividad Reciente */}
        <Paper sx={{ flex: '1 1 400px', p: 3, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
            Actividad Reciente
          </Typography>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                }}
              />
              <Box>
                <Typography variant="body2">
                  Nuevo usuario registrado: Juan Pérez
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Hace 5 minutos
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: 'success.main',
                }}
              />
              <Box>
                <Typography variant="body2">
                  Reporte mensual generado exitosamente
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Hace 15 minutos
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: 'warning.main',
                }}
              />
              <Box>
                <Typography variant="body2">
                  Empresa ABC actualizó su perfil
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Hace 1 hora
                </Typography>
              </Box>
            </Box>
          </Stack>
        </Paper>

        {/* Resumen del Sistema */}
        <Paper sx={{ flex: '1 1 300px', p: 3, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
            Estado del Sistema
          </Typography>
          <Stack spacing={3}>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Uso del Servidor
              </Typography>
              <Box
                sx={{
                  width: '100%',
                  height: 8,
                  bgcolor: 'grey.200',
                  borderRadius: 1,
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    width: '68%',
                    height: '100%',
                    bgcolor: 'primary.main',
                  }}
                />
              </Box>
              <Typography variant="caption" color="text.secondary">
                68% en uso
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Base de Datos
              </Typography>
              <Box
                sx={{
                  width: '100%',
                  height: 8,
                  bgcolor: 'grey.200',
                  borderRadius: 1,
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    width: '45%',
                    height: '100%',
                    bgcolor: 'success.main',
                  }}
                />
              </Box>
              <Typography variant="caption" color="text.secondary">
                45% en uso
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Almacenamiento
              </Typography>
              <Box
                sx={{
                  width: '100%',
                  height: 8,
                  bgcolor: 'grey.200',
                  borderRadius: 1,
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    width: '82%',
                    height: '100%',
                    bgcolor: 'warning.main',
                  }}
                />
              </Box>
              <Typography variant="caption" color="text.secondary">
                82% en uso
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}