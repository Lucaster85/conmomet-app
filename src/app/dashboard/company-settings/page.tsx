'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { BusinessOutlined as TitleIcon } from '@mui/icons-material';
import GearSpinner from '@/components/GearSpinner';
import FeedbackModal from '@/components/FeedbackModal';
import ArcaConnectionCard from '@/components/company/ArcaConnectionCard';
import CompanyProfileCard from '@/components/company/CompanyProfileCard';
import PointsOfSaleCard from '@/components/company/PointsOfSaleCard';
import BankAccountsCard from '@/components/company/BankAccountsCard';
import { CompanySettings, CompanySettingsService } from '@/utils/api';

// Configuración → "Datos de mi empresa": el emisor de las facturas, sus puntos de venta y cuentas bancarias, y el
// estado de la conexión con ARCA (PLAN_ARCA.md §3.0, FLOWS.md §64). Permiso: company_settings_update.
export default function CompanySettingsPage() {
  const [data, setData] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    try {
      setData(await CompanySettingsService.get());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los datos de la empresa');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px"><GearSpinner /></Box>;
  }

  return (
    <Box sx={{ maxWidth: 960 }}>
      <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />
      <FeedbackModal open={!!success} onClose={() => setSuccess('')} message={success} type="success" />

      <Box mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <TitleIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" fontWeight={700} letterSpacing="-0.02em" color="#1E293B">Datos de mi empresa</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          El emisor de las facturas: sus datos fiscales, puntos de venta, cuentas bancarias y la conexión con ARCA.
        </Typography>
      </Box>

      {data && (
        <>
          <ArcaConnectionCard arca={data.arca} onError={setError} />
          <CompanyProfileCard
            profile={data.profile}
            onSaved={(profile) => { setData((d) => (d ? { ...d, profile } : d)); load(); }}
            onSuccess={setSuccess}
            onError={setError}
          />
          <PointsOfSaleCard points={data.points_of_sale} arca={data.arca} onChanged={load} onSuccess={setSuccess} onError={setError} />
          <BankAccountsCard accounts={data.bank_accounts} onChanged={load} onSuccess={setSuccess} onError={setError} />
        </>
      )}
    </Box>
  );
}
