import { redirect } from 'next/navigation';

// Artículos pasó a ser una pestaña de «Sitio web público» (FLOWS.md §86). Se deja la ruta vieja para
// que no se rompan los marcadores ni los enlaces que ya existían.
export default function ArticlesRedirect() {
  redirect('/dashboard/public-site?tab=articles');
}
