import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';

import MuiXProvider from "./MuiXProvider";

// Fuerza renderizado dinámico por request, para que process.env se lea en runtime
export const dynamic = 'force-dynamic';

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Conmomet App",
  description: "Sistema de gestión Conmomet",
  icons: {
    icon: "/img/logos/conmomet-logo-blue.svg",
    apple: "/icons/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest",
  // iOS exige esto para permitir Web Push: la app tiene que poder instalarse en la pantalla de
  // inicio y abrir en modo standalone, no alcanza con el manifest solo (ver FLOWS.md flujo 28).
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Conmomet",
  },
};

// themeColor vive acá y no en `metadata` — Next 15 lo movió a un export aparte; dejarlo en
// metadata no tira error pero se ignora en silencio.
export const viewport: Viewport = {
  themeColor: "#F44336",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const runtimeEnv = JSON.stringify({
    API_BASE_URL: process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || '',
    GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || '',
  }).replace(/</g, '\\u003c');

  return (
    <html lang="es-AR">
      <body
        className={`${plusJakartaSans.variable} antialiased`}
      >
        {/* Runtime env vars — leídas en el servidor, disponibles en el cliente */}
        <script dangerouslySetInnerHTML={{ __html: `window.__ENV__ = ${runtimeEnv};` }} />
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <MuiXProvider>
            {children}
          </MuiXProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
