'use client';
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Divider,
  Chip
} from '@mui/material';
import {
  Badge as BadgeIcon,
  Work as WorkIcon,
  CalendarMonth as CalendarIcon,
  AssignmentInd as DniIcon,
  Checkroom as ShirtIcon
} from '@mui/icons-material';
import { SelfService, Employee } from '@/utils/api';
import dayjs from 'dayjs';

export default function PortalDashboard() {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await SelfService.getMyProfile();
        setEmployee(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Error al cargar perfil');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={8}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !employee) {
    return (
      <Alert severity="error" sx={{ mt: 4 }}>
        {error || 'No se pudo cargar la información del legajo.'}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={600} mb={3}>
        Mi Legajo
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <BadgeIcon color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  Datos Personales
                </Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">Nombre y Apellido</Typography>
                  <Typography variant="body1" fontWeight={500}>{employee.name} {employee.lastname}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">DNI / Documento</Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <DniIcon fontSize="small" color="action" />
                    <Typography variant="body1">{employee.dni}</Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">CUIL</Typography>
                  <Typography variant="body1">{employee.cuil}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">Fecha de Nacimiento</Typography>
                  <Typography variant="body1">{employee.birth_date ? dayjs(employee.birth_date).format('DD/MM/YYYY') : '-'}</Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="text.secondary">Dirección</Typography>
                  <Typography variant="body1">{employee.address || '-'}</Typography>
                </Grid>
              </Grid>

              <Box mt={4} mb={2} display="flex" alignItems="center" gap={1}>
                <WorkIcon color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  Datos Laborales
                </Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">Puesto / Cargo</Typography>
                  <Typography variant="body1" fontWeight={500}>{employee.position || '-'}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">Fecha de Ingreso</Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <CalendarIcon fontSize="small" color="action" />
                    <Typography variant="body1">{dayjs(employee.hire_date).format('DD/MM/YYYY')}</Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">Estado</Typography>
                  <Box mt={0.5}>
                    <Chip 
                      label={employee.status === 'active' ? 'Activo' : (employee.status === 'vacation' || employee.status === 'medical_leave') ? 'De Licencia' : 'Inactivo'} 
                      color={employee.status === 'active' ? 'success' : (employee.status === 'vacation' || employee.status === 'medical_leave') ? 'warning' : 'default'}
                      size="small"
                    />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <ShirtIcon color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  Talles (EPP)
                </Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />

              <Box display="flex" flexDirection="column" gap={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Calzado</Typography>
                  <Typography variant="body1" fontWeight={500}>{employee.shoe_size || 'No registrado'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Remera / Camisa</Typography>
                  <Typography variant="body1" fontWeight={500}>{employee.shirt_size || 'No registrado'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Pantalón</Typography>
                  <Typography variant="body1" fontWeight={500}>{employee.pant_size || 'No registrado'}</Typography>
                </Box>
              </Box>
              
              <Box mt={3} p={2} bgcolor="info.50" borderRadius={2}>
                <Typography variant="body2" color="info.main">
                  Si necesitás actualizar tus datos personales o talles, por favor comunicate con el área de Recursos Humanos.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
