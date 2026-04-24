'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  Stack,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Button
} from '@mui/material';
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { useAuth } from '../../utils/auth';
import { EntityDocumentService, EntityDocument } from '../../utils/api';
import FeedbackModal from '../../components/FeedbackModal';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [expiringDocs, setExpiringDocs] = useState<EntityDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [error, setError] = useState('');

  const getUserWelcomeMessage = () => {
    if (user?.fullName) return `Bienvenido de vuelta, ${user.fullName}`;
    if (user?.name) return `Bienvenido de vuelta, ${user.name}`;
    return 'Bienvenido de vuelta';
  };

  useEffect(() => {
    const fetchExpirations = async () => {
      try {
        setLoadingDocs(true);
        // Fetch ALL documents and filter here for now. 
        // In the future, we could add a `status=expiring_soon,expired` query param to the backend
        const allDocs = await EntityDocumentService.getAll();
        
        const criticalDocs = allDocs.filter(doc => 
          doc.computed_status === 'expiring_soon' || doc.computed_status === 'expired'
        );
        
        // Sort: expired first, then expiring_soon, then by date
        criticalDocs.sort((a, b) => {
          if (a.computed_status === 'expired' && b.computed_status !== 'expired') return -1;
          if (a.computed_status !== 'expired' && b.computed_status === 'expired') return 1;
          if (!a.expiration_date || !b.expiration_date) return 0;
          return new Date(a.expiration_date).getTime() - new Date(b.expiration_date).getTime();
        });

        setExpiringDocs(criticalDocs);
      } catch (err: unknown) {
        const e = err as Error;
        setError(e.message || 'Error al cargar alertas de vencimientos');
      } finally {
        setLoadingDocs(false);
      }
    };

    fetchExpirations();
  }, []);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
        {getUserWelcomeMessage()}
      </Typography>

      <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />

      {/* Content Sections */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        
        {/* Widget: Alertas de Vencimientos */}
        <Paper sx={{ flex: '1 1 500px', p: 3, borderRadius: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Alertas de Vencimientos
            </Typography>
            <Chip 
              label={`${expiringDocs.length} alertas`} 
              color={expiringDocs.length > 0 ? "error" : "success"} 
              size="small" 
            />
          </Box>

          {loadingDocs ? (
            <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
          ) : expiringDocs.length === 0 ? (
            <Box textAlign="center" py={4} bgcolor="grey.50" borderRadius={2}>
              <Typography color="text.secondary">¡Todo al día! No hay documentos por vencer.</Typography>
            </Box>
          ) : (
            <List sx={{ width: '100%', bgcolor: 'background.paper', p: 0 }}>
              {expiringDocs.map((doc) => {
                const isExpired = doc.computed_status === 'expired';
                
                let entityLabel = "Global";
                if (doc.entity_type === 'employee') entityLabel = "Empleado";
                if (doc.entity_type === 'vehicle') entityLabel = "Vehículo";
                
                return (
                  <ListItem
                    key={doc.id}
                    sx={{
                      mb: 1,
                      border: 1,
                      borderColor: isExpired ? 'error.light' : 'warning.light',
                      borderRadius: 1,
                      bgcolor: isExpired ? 'error.50' : 'warning.50',
                    }}
                    secondaryAction={
                      <Button 
                        size="small" 
                        variant="outlined" 
                        color={isExpired ? "error" : "warning"}
                        onClick={() => {
                          if (doc.entity_type === 'employee') {
                            router.push(`/dashboard/employees/${doc.entity_id}`);
                          }
                        }}
                      >
                        Ver Detalle
                      </Button>
                    }
                  >
                    <ListItemIcon>
                      {isExpired ? <ErrorIcon color="error" /> : <WarningIcon color="warning" />}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography fontWeight="bold">{doc.title}</Typography>
                          <Chip label={entityLabel} size="small" variant="outlined" />
                        </Box>
                      }
                      secondary={
                        <React.Fragment>
                          <Typography variant="body2" component="span" display="block">
                            {doc.notes || 'Sin notas'}
                          </Typography>
                          <Typography variant="caption" color={isExpired ? "error" : "warning.dark"} fontWeight="bold">
                            {isExpired ? 'Venció el: ' : 'Vence el: '}
                            {doc.expiration_date ? new Date(doc.expiration_date + 'T00:00:00').toLocaleDateString('es-AR') : ''}
                          </Typography>
                        </React.Fragment>
                      }
                    />
                  </ListItem>
                );
              })}
            </List>
          )}
        </Paper>

        {/* Other future widgets can go here */}
        <Paper sx={{ flex: '1 1 300px', p: 3, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
            Accesos Rápidos
          </Typography>
          <Stack spacing={2}>
            <Button variant="outlined" startIcon={<AssignmentIcon />} onClick={() => router.push('/dashboard/employees')}>
              Gestión de Personal
            </Button>
            <Button variant="outlined" startIcon={<AssignmentIcon />} onClick={() => router.push('/dashboard/attendance')}>
              Presentismo
            </Button>
          </Stack>
        </Paper>

      </Box>
    </Box>
  );
}