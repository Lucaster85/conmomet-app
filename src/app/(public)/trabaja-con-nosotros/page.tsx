import type { Metadata } from 'next';
import { getEnvironmentConfig } from '../../../config/environment';
import JobApplicationForm from '../../../components/public/JobApplicationForm';

// "Trabajá con nosotros" (ver FLOWS.md §60): página pública, sin sesión. Lo que se envía queda como una
// postulación en Personal → Postulantes y avisa al equipo. La página es server component para tener su
// propia metadata; el formulario es el único cliente.
export function generateMetadata(): Metadata {
  const { label, legalName } = getEnvironmentConfig();
  const title = `${label ? `[${label}] ` : ''}Trabajá con nosotros | ${legalName}`;
  return {
    title,
    description: `Dejanos tus datos y tu CV: cuando surja una búsqueda que se ajuste a tu perfil, ${legalName} se comunica con vos.`,
  };
}

export default function JobApplicationPage() {
  return <JobApplicationForm />;
}
