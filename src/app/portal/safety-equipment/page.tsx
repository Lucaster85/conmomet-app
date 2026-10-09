'use client';
import React, { useEffect, useState } from 'react';
import { Box, Typography, Alert } from '@mui/material';
import { SecurityOutlined as TitleIcon } from '@mui/icons-material';
import { SelfService, SafetyEquipment } from '@/utils/api';
import GearSpinner from '@/components/GearSpinner';
import EppDeliveriesList from '@/components/safety-equipment/EppDeliveriesList';

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

  if (loading) return <Box display="flex" justifyContent="center" mt={8}><GearSpinner /></Box>;
  if (error) return <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>;

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1} mb={3}>
        <TitleIcon color="primary" sx={{ fontSize: 28 }} />
        <Typography variant="h5" fontWeight={600}>
          Mi Equipo de Protección Personal (EPP)
        </Typography>
      </Box>

      <EppDeliveriesList deliveries={equipments} variant="compact" emptyMessage="No tenés entregas de EPP registradas." />
    </Box>
  );
}
