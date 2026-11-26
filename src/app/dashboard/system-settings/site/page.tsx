import { redirect } from 'next/navigation';

// «Sitio web público» salió de Configuración General y pasó al grupo «Web» del menú (FLOWS.md §86).
export default function SiteSettingsRedirect() {
  redirect('/dashboard/public-site');
}
