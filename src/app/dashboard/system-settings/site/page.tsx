'use client';
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Alert, Box, Button, Tab, Tabs, Typography } from '@mui/material';
import { ArrowBackOutlined as BackIcon, LanguageOutlined as TitleIcon } from '@mui/icons-material';
import FeedbackModal from '@/components/FeedbackModal';
import GearSpinner from '@/components/GearSpinner';
import BlockTextsTab from '@/components/settings/site/BlockTextsTab';
import ClientsTab from '@/components/settings/site/ClientsTab';
import LinksTab from '@/components/settings/site/LinksTab';
import ServicesTab from '@/components/settings/site/ServicesTab';
import { SiteContentService, type SiteAdminData, type SiteDefaults } from '@/utils/api';
import { useAuth, userHasPermission } from '@/utils/auth';

const TABS = ['Textos de las secciones', 'Servicios', 'Clientes', 'Contacto y enlaces'];

// Sitio web público (FLOWS.md §86): el contenido que el cliente edita solo. La estructura y los colores del sitio
// los define el manifiesto de la marca y no se tocan desde acá. Vive dentro de Configuración General y lo
// gobierna system_settings_update, igual que el resto.
export default function SiteContentPage() {
  const { user } = useAuth();
  const allowed = userHasPermission(user, 'system_settings_update');

  const [data, setData] = useState<SiteAdminData | null>(null);
  const [defaults, setDefaults] = useState<SiteDefaults | null>(null);
  const [loading, setLoading] = useState(true);
  const [noSite, setNoSite] = useState(false);
  const [tab, setTab] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Recarga sin tapar la pantalla con el spinner: las pestañas conservan lo que el usuario estaba mirando.
  const reload = useCallback(async () => {
    try {
      setData(await SiteContentService.getAll());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el contenido del sitio web');
    }
  }, []);

  useEffect(() => {
    if (!allowed) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const [content, manifest] = await Promise.all([
          SiteContentService.getAll(),
          SiteContentService.getDefaults().catch(() => null),
        ]);
        setData(content);
        setDefaults(manifest);
        setNoSite(!manifest);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar el contenido del sitio web');
      } finally {
        setLoading(false);
      }
    })();
  }, [allowed]);

  if (loading) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px"><GearSpinner /></Box>;
  }

  const header = (
    <>
      <Button component={Link} href="/dashboard/system-settings" startIcon={<BackIcon />} size="small" sx={{ mb: 1 }}>Configuración General</Button>
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        <TitleIcon color="primary" sx={{ fontSize: 32 }} />
        <Typography variant="h4" fontWeight={700} letterSpacing="-0.02em" color="#1E293B">Sitio web público</Typography>
      </Box>
    </>
  );

  if (!allowed) {
    return <Box>{header}<Alert severity="error">No tenés permiso para editar el sitio web público.</Alert></Box>;
  }

  return (
    <Box>
      {header}
      <Typography variant="body2" color="text.secondary" mb={3}>
        Cambiá los textos, servicios, clientes y datos de contacto de la web. Los cambios pueden tardar hasta 5
        minutos en verse. La estructura y los colores del sitio no se editan desde acá.
      </Typography>

      <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />
      <FeedbackModal open={!!success} onClose={() => setSuccess('')} message={success} type="success" />

      {noSite || !data || !defaults ? (
        <Alert severity="info">Este ambiente no tiene un sitio web público configurado, así que no hay nada para editar.</Alert>
      ) : (
        <>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
            {TABS.map((label) => <Tab key={label} label={label} />)}
          </Tabs>
          {(() => {
            const props = { data, defaults, reload, onSuccess: setSuccess, onError: setError };
            return [<BlockTextsTab key="b" {...props} />, <ServicesTab key="s" {...props} />, <ClientsTab key="c" {...props} />, <LinksTab key="l" {...props} />][tab];
          })()}
        </>
      )}
    </Box>
  );
}
