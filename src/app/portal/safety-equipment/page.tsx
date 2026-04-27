'use client';
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import { SelfService, SafetyEquipment } from '@/utils/api';
import dayjs from 'dayjs';

export default function PortalSafetyEquipment() {
  const [equipments, setEquipments] = useState<SafetyEquipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEpp = async () => {
      try {
        const data = await SelfService.getMySafetyEquipment();
        setEquipments(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Error al cargar EPP');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchEpp();
  }, []);

  if (loading) return <Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>;
  if (error) return <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>;

  return (
    <Box>
      <Typography variant="h5" fontWeight={600} mb={3}>
        Mi Equipo de Protección Personal (EPP)
      </Typography>

      {/* Mobile Cards */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {equipments.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={4}>No tenés entregas de EPP registradas.</Typography>
        ) : (
          <Box display="flex" flexDirection="column" gap={2}>
            {equipments.map((epp) => (
              <Card key={epp.id} sx={{ borderRadius: 3, p: 2, boxShadow: '0 2px 4px rgb(0 0 0 / 0.1)' }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {epp.eppItem ? epp.eppItem.name : 'Desconocido'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {epp.eppItem ? epp.eppItem.category : '-'}
                    </Typography>
                    {epp.size_delivered && (
                      <Typography variant="caption" display="block" color="text.secondary" mt={0.5}>
                        Talle: {epp.size_delivered}
                      </Typography>
                    )}
                  </Box>
                  <Chip 
                    label={epp.condition === 'new' ? 'Nuevo' : 'Usado'} 
                    size="small"
                    color={epp.condition === 'new' ? 'success' : 'warning'}
                    variant="outlined"
                  />
                </Box>
                <Box display="flex" justifyContent="space-between" mt={2} pt={1} borderTop="1px solid #f0f0f0">
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">Entregado</Typography>
                    <Typography variant="body2">{dayjs(epp.delivered_date).format('DD/MM/YYYY')}</Typography>
                  </Box>
                  <Box textAlign="right">
                    <Typography variant="caption" color="text.secondary" display="block">Cantidad</Typography>
                    <Typography variant="body2">{epp.quantity || 1}</Typography>
                  </Box>
                </Box>
              </Card>
            ))}
          </Box>
        )}
      </Box>

      {/* Desktop Table */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <Card sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: 'grey.50' }}>
                <TableRow>
                  <TableCell>Fecha de Entrega</TableCell>
                  <TableCell>Artículo</TableCell>
                  <TableCell>Categoría</TableCell>
                  <TableCell align="center">Cantidad</TableCell>
                  <TableCell align="center">Condición</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {equipments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                      <Typography color="text.secondary">No tenés entregas de EPP registradas.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  equipments.map((epp) => (
                    <TableRow key={epp.id} hover>
                      <TableCell>{dayjs(epp.delivered_date).format('DD/MM/YYYY')}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>
                        {epp.eppItem ? epp.eppItem.name : 'Desconocido'}
                        {epp.size_delivered && <Typography variant="caption" display="block" color="text.secondary">Talle: {epp.size_delivered}</Typography>}
                      </TableCell>
                      <TableCell>
                        {epp.eppItem ? epp.eppItem.category : '-'}
                      </TableCell>
                      <TableCell align="center">{epp.quantity || 1}</TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={epp.condition === 'new' ? 'Nuevo' : 'Usado'} 
                          size="small"
                          color={epp.condition === 'new' ? 'success' : 'warning'}
                          variant="outlined"
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Box>
    </Box>
  );
}
