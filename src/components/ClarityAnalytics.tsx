'use client';
import Script from 'next/script';

// Microsoft Clarity (analytics de uso: heatmaps, grabación de sesiones) — ver FLOWS.md flujo 40.
// Carga SOLO si window.__ENV__.CLARITY_PROJECT_ID viene seteado, lo cual solo pasa en el servicio
// de Railway de producción (ver layout.tsx). En desarrollo y en el ambiente de testing la variable
// no existe, así que este componente no renderiza nada — no hay ningún if (NODE_ENV) acá.
export default function ClarityAnalytics() {
  if (typeof window === 'undefined') return null;

  const projectId = window.__ENV__?.CLARITY_PROJECT_ID;
  if (!projectId) return null;

  return (
    <Script
      id="microsoft-clarity"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "${projectId}");
        `,
      }}
    />
  );
}
