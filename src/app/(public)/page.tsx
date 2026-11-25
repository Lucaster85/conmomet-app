import type { Metadata } from 'next';
import { getEnvironmentConfig } from '../../config/environment';
import ArticlesSection from '../../components/landing/ArticlesSection';
import ClientsSection from '../../components/landing/ClientsSection';
import FeaturesSection from '../../components/landing/FeaturesSection';
import NosotrosSection from '../../components/landing/NosotrosSection';
import FloatingCta from '../../components/public/FloatingCta';
import Hero from '../../components/public/Hero';

// Server component: la landing ya no necesita estado (el modal de contacto se reemplaza por una
// sección en la etapa 4), así que puede exportar metadata real, con el prefijo del ambiente.
export function generateMetadata(): Metadata {
  const { label, legalName } = getEnvironmentConfig();
  const title = `${label ? `[${label}] ` : ''}${legalName} | Soluciones integrales en montajes metalúrgicos`;
  const description = `${legalName}: montajes metalúrgicos, tornería y plegados para la industria, en toda la zona costera de la provincia de Buenos Aires.`;
  return {
    title,
    description,
    openGraph: { title, description, type: 'website', locale: 'es_AR', siteName: legalName },
  };
}

// Las secciones de contenido todavía son las anteriores (MUI): se rehacen en la etapa 3.
// `#contacto` apunta provisoriamente al pie hasta que llegue la sección de contacto (etapa 4).
export default function LandingPage() {
  return (
    <>
      <Hero />
      <div id="nosotros"><NosotrosSection /></div>
      <div id="servicios"><FeaturesSection /></div>
      <div id="nuestro-trabajo"><ArticlesSection /></div>
      <div id="clientes"><ClientsSection /></div>
      <FloatingCta />
    </>
  );
}
