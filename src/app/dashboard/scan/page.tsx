'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, Paper, Alert } from '@mui/material';
import { QrCodeScannerOutlined as TitleIcon } from '@mui/icons-material';
import type { Html5QrcodeScanner } from 'html5-qrcode';

// Acepta tanto la URL completa (https://.../dashboard/tools/5) como, por las dudas, el path
// solo — cualquier QR generado por las fichas de Herramientas/Vehículos matchea esto.
const TOOL_OR_VEHICLE_PATH = /\/dashboard\/(tools|vehicles)\/(\d+)(?:[/?#]|$)/;

export default function ScanPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const scannedRef = useRef(false);

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    let cancelled = false;

    (async () => {
      const { Html5QrcodeScanner: Scanner } = await import('html5-qrcode');
      if (cancelled) return;

      scanner = new Scanner('qr-reader', { fps: 10, qrbox: 250 }, false);
      scanner.render(
        (decodedText: string) => {
          if (scannedRef.current) return;

          let path = decodedText;
          try {
            path = new URL(decodedText).pathname;
          } catch {
            // No era una URL absoluta — probamos el texto decodificado tal cual.
          }

          const match = path.match(TOOL_OR_VEHICLE_PATH);
          if (!match) {
            setError('QR no reconocido — no corresponde a una herramienta o vehículo de este sistema.');
            return;
          }

          scannedRef.current = true;
          setError('');
          scanner?.clear().catch(() => {});
          router.push(`/dashboard/${match[1]}/${match[2]}`);
        },
        () => {
          // Errores de frame-a-frame sin QR detectado todavía — se ignoran, son normales.
        }
      );
    })();

    return () => {
      cancelled = true;
      scanner?.clear().catch(() => {});
    };
  }, [router]);

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <TitleIcon color="primary" sx={{ fontSize: 32 }} />
        <Typography variant="h4" fontWeight={700} letterSpacing="-0.02em" color="#1E293B">Escanear QR</Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Apuntá la cámara a la etiqueta QR de una herramienta o grúa/vehículo para ir directo a su ficha. Necesita
        permiso de cámara del navegador.
      </Typography>
      {error && <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      <Paper sx={{ p: 2, maxWidth: 480 }}>
        <div id="qr-reader" />
      </Paper>
    </Box>
  );
}
