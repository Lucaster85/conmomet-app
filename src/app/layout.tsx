import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';

import MuiXProvider from "./MuiXProvider";

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
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const runtimeEnv = JSON.stringify({
    API_BASE_URL: process.env.API_BASE_URL || '',
    GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY || '',
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
