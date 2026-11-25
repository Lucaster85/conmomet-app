import type { Metadata } from 'next';
import { getEnvironmentConfig } from '../../config/environment';
import Clientes from '../../components/public/Clientes';
import FloatingCta from '../../components/public/FloatingCta';
import Hero from '../../components/public/Hero';
import Nosotros from '../../components/public/Nosotros';
import NuestroTrabajo from '../../components/public/NuestroTrabajo';
import Servicios from '../../components/public/Servicios';

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

// `#contacto` apunta provisoriamente al pie hasta que llegue la sección de contacto (etapa 4).
export default function LandingPage() {
  return (
    <>
      <Hero />
      <Nosotros />
      <Servicios />
      <NuestroTrabajo />
      <Clientes />
      <FloatingCta />
    </>
  );
}
