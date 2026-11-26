'use client';
import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Alert, Box, Tab, Tabs, Typography } from '@mui/material';
import { LanguageOutlined as TitleIcon } from '@mui/icons-material';
import FeedbackModal from '@/components/FeedbackModal';
import GearSpinner from '@/components/GearSpinner';
import ArticlesTab from '@/components/settings/site/ArticlesTab';
import BlockTextsTab from '@/components/settings/site/BlockTextsTab';
import ClientsTab from '@/components/settings/site/ClientsTab';
import LinksTab from '@/components/settings/site/LinksTab';
import ServicesTab from '@/components/settings/site/ServicesTab';
import { SiteContentService, type SiteAdminData, type SiteDefaults } from '@/utils/api';
import { useAuth, userHasPermission } from '@/utils/auth';

type TabKey = 'texts' | 'services' | 'clients' | 'links' | 'articles';

// Las cuatro primeras se gobiernan con system_settings_update (el ABM del contenido); «Artículos» con media_read,
// el permiso que ya tenía su pantalla. Cada pestaña se ofrece solo a quien puede usarla.
const SITE_TABS: { key: TabKey; label: string }[] = [
  { key: 'texts', label: 'Textos de las secciones' },
  { key: 'services', label: 'Servicios' },
  { key: 'clients', label: 'Clientes' },
  { key: 'links', label: 'Contacto y enlaces' },
];
const ARTICLES_TAB: { key: TabKey; label: string } = { key: 'articles', label: 'Artículos' };

// Sitio web público (FLOWS.md §86): el contenido que el cliente edita solo, más las obras de «Nuestro trabajo»
// (Artículos). La estructura y los colores del sitio los define el manifiesto de la marca y no se tocan desde acá.
function SiteContentScreen() {
  const { user } = useAuth();
  const canSite = userHasPermission(user, 'system_settings_update');
  const canArticles = userHasPermission(user, 'media_read');
  const requestedTab = useSearchParams().get('tab');

  const tabs = useMemo(() => [...(canSite ? SITE_TABS : []), ...(canArticles ? [ARTICLES_TAB] : [])], [canSite, canArticles]);
  const [tab, setTab] = useState<TabKey | null>(null);
  const activeTab = tabs.find((t) => t.key === (tab ?? requestedTab))?.key ?? tabs[0]?.key;

  const [data, setData] = useState<SiteAdminData | null>(null);
  const [defaults, setDefaults] = useState<SiteDefaults | null>(null);
  const [loading, setLoading] = useState(canSite);
  const [noSite, setNoSite] = useState(false);
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
    if (!canSite) {
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
  }, [canSite]);

  if (loading) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px"><GearSpinner /></Box>;
  }

  const header = (
    <Box display="flex" alignItems="center" gap={1} mb={1}>
      <TitleIcon color="primary" sx={{ fontSize: 32 }} />
      <Typography variant="h4" fontWeight={700} letterSpacing="-0.02em" color="#1E293B">Sitio web público</Typography>
    </Box>
  );

  if (tabs.length === 0 || !activeTab) {
    return <Box>{header}<Alert severity="error">No tenés permiso para editar el sitio web público.</Alert></Box>;
  }

  const renderTab = () => {
    if (activeTab === 'articles') return <ArticlesTab />;
    if (noSite || !data || !defaults) {
      return <Alert severity="info">Este ambiente no tiene un sitio web público configurado, así que no hay nada para editar acá.</Alert>;
    }
    const props = { data, defaults, reload, onSuccess: setSuccess, onError: setError };
    if (activeTab === 'texts') return <BlockTextsTab {...props} />;
    if (activeTab === 'services') return <ServicesTab {...props} />;
    if (activeTab === 'clients') return <ClientsTab {...props} />;
    return <LinksTab {...props} />;
  };

  return (
    <Box>
      {header}
      <Typography variant="body2" color="text.secondary" mb={3}>
        Cambiá los textos, servicios, clientes y datos de contacto de la web, y las obras de «Nuestro trabajo». Los
        cambios pueden tardar hasta 5 minutos en verse. La estructura y los colores del sitio no se editan desde acá.
      </Typography>

      <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />
      <FeedbackModal open={!!success} onClose={() => setSuccess('')} message={success} type="success" />

      <Tabs value={activeTab} onChange={(_, v: TabKey) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        {tabs.map((t) => <Tab key={t.key} value={t.key} label={t.label} />)}
      </Tabs>
      {renderTab()}
    </Box>
  );
}

// useSearchParams (para abrir directo en una pestaña, ej. desde el redirect de /dashboard/articles) exige un
// límite de Suspense.
export default function PublicSitePage() {
  return (
    <Suspense fallback={<Box display="flex" justifyContent="center" alignItems="center" minHeight="400px"><GearSpinner /></Box>}>
      <SiteContentScreen />
    </Suspense>
  );
}
