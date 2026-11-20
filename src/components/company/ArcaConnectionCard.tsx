'use client';
import React, { useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import { CheckCircleOutline as OkIcon, ErrorOutline as FailIcon, WifiTetheringOutlined as TestIcon } from '@mui/icons-material';
import GearSpinner from '../GearSpinner';
import { ArcaStatus, ArcaTestResult, CompanySettingsService } from '../../utils/api';
import { formatCuit } from '../../utils/cuit';

const ENV_LABEL = { homologacion: 'HOMOLOGACIÓN (pruebas)', produccion: 'PRODUCCIÓN' } as const;

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
}

function StepRow({ ok, label, detail }: { ok: boolean; label: string; detail?: React.ReactNode }) {
  return (
    <Box display="flex" gap={1} alignItems="flex-start">
      {ok ? <OkIcon color="success" fontSize="small" sx={{ mt: 0.25 }} /> : <FailIcon color="error" fontSize="small" sx={{ mt: 0.25 }} />}
      <Box>
        <Typography variant="body2" fontWeight={600}>{label}</Typography>
        {detail && <Typography variant="body2" color={ok ? 'text.secondary' : 'error'} component="div">{detail}</Typography>}
      </Box>
    </Box>
  );
}

interface Props {
  arca: ArcaStatus;
  onError: (message: string) => void;
}

// Estado de la conexión con ARCA y "Probar conexión". El certificado, la clave y el ambiente NO se editan acá: son
// variables de entorno del servidor (PLAN_ARCA.md §4b). Esta tarjeta solo muestra lo que el servidor tiene cargado.
export default function ArcaConnectionCard({ arca, onError }: Props) {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<ArcaTestResult | null>(null);

  const handleTest = async () => {
    setTesting(true);
    try {
      setResult(await CompanySettingsService.testArcaConnection());
    } catch (err) {
      setResult(null);
      onError(err instanceof Error ? err.message : 'Error al probar la conexión con ARCA');
    } finally {
      setTesting(false);
    }
  };

  const cert = arca.certificate;

  return (
    <Card sx={{ borderRadius: 3, mb: 3 }}>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} mb={1}>
          <Typography variant="h6" fontWeight={600}>Conexión con ARCA</Typography>
          {arca.enabled && arca.env ? (
            <Chip
              label={ENV_LABEL[arca.env]}
              color={arca.env === 'produccion' ? 'error' : 'warning'}
              sx={{ fontWeight: 700 }}
            />
          ) : (
            <Chip label="Apagada" variant="outlined" />
          )}
        </Box>

        <Typography variant="body2" color="text.secondary" mb={2}>
          La emisión de facturas desde la app usa el certificado y el ambiente que tiene cargados el servidor. No se
          configuran desde esta pantalla.
        </Typography>

        <Stack spacing={1.5}>
          {!arca.enabled && !arca.config_error && (
            <Alert severity="info">
              La integración con ARCA está apagada en este servidor (no hay ambiente configurado). Las facturas se siguen
              cargando a mano.
            </Alert>
          )}
          {arca.config_error && <Alert severity="error">{arca.config_error}</Alert>}

          {arca.enabled && (
            <Typography variant="body2">
              <strong>CUIT emisor:</strong> {formatCuit(arca.cuit)}
            </Typography>
          )}

          {arca.enabled && cert && cert.ok && (
            <Typography variant="body2">
              <strong>Certificado:</strong> {cert.subject || 'sin titular'} — vence el{' '}
              {cert.expires_at ? new Date(cert.expires_at).toLocaleDateString('es-AR') : '—'}
              {typeof cert.days_left === 'number' ? ` (en ${cert.days_left} días)` : ''}
            </Typography>
          )}
          {arca.enabled && cert && !cert.ok && <Alert severity="error">{cert.error}</Alert>}
          {arca.enabled && cert && cert.ok && cert.expiring_soon && (
            <Alert severity="warning">
              El certificado vence pronto. Si no se renueva, la emisión se corta sin aviso: hay que generar uno nuevo en ARCA
              y cargarlo en el servidor.
            </Alert>
          )}

          {arca.enabled && arca.cuit_matches_profile === false && (
            <Alert severity={arca.cuit_mismatch_blocks ? 'error' : 'info'}>
              {arca.cuit_mismatch_blocks
                ? 'El CUIT de la conexión con ARCA no coincide con el CUIT de los datos de la empresa. En producción no se puede emitir así.'
                : 'El CUIT de la conexión con ARCA no coincide con el de los datos de la empresa. En homologación es esperable si se prueba con otro CUIT.'}
            </Alert>
          )}
          {arca.enabled && arca.env === 'homologacion' && (
            <Alert severity="warning">
              Ambiente de pruebas: las facturas que se emitan <strong>no tienen validez fiscal</strong>.
            </Alert>
          )}
        </Stack>

        <Box mt={2}>
          <Button
            variant="contained"
            startIcon={testing ? undefined : <TestIcon />}
            onClick={handleTest}
            disabled={testing || !arca.enabled}
          >
            {testing ? <GearSpinner size={20} /> : 'Probar conexión'}
          </Button>
        </Box>

        {result && (
          <Stack spacing={1.25} mt={2.5}>
            <StepRow
              ok={result.dummy.ok}
              label="Servidores de ARCA"
              detail={result.dummy.ok
                ? `Aplicación: ${result.dummy.servers.app_server} · Base: ${result.dummy.servers.db_server} · Autenticación: ${result.dummy.servers.auth_server}`
                : result.dummy.error}
            />
            <StepRow
              ok={result.login.ok}
              label="Inicio de sesión (WSAA)"
              detail={result.login.ok
                ? `${result.login.source === 'cache' ? 'Se reutilizó el ticket vigente' : 'Se pidió un ticket nuevo'} — válido hasta ${formatDateTime(result.login.expires_at)}`
                : result.login.error}
            />
            {result.points_of_sale && (
              <StepRow
                ok={result.points_of_sale.ok}
                label="Puntos de venta habilitados en ARCA"
                detail={result.points_of_sale.ok
                  ? (result.points_of_sale.items.length > 0
                    ? result.points_of_sale.items.map((p) => `${String(p.number).padStart(4, '0')}${p.blocked ? ' (bloqueado)' : ''}`).join(' · ')
                    : (arca.env === 'homologacion' ? 'Ninguno (en homologación suele venir vacío).' : 'ARCA no lista ningún punto de venta para web services.'))
                  : result.points_of_sale.error}
              />
            )}
            {result.last_authorized && (
              result.last_authorized.items.length === 0 ? (
                <StepRow ok label="Último comprobante autorizado" detail="No hay puntos de venta de tipo web service cargados." />
              ) : (
                result.last_authorized.items.map((row) => (
                  <StepRow
                    key={`${row.pos_number}-${row.cbte_tipo}`}
                    ok={row.ok}
                    label={`Último ${row.label} — punto de venta ${String(row.pos_number).padStart(4, '0')}`}
                    detail={row.ok ? (row.number ? `N° ${String(row.number).padStart(8, '0')}` : 'Todavía no se emitió ninguno') : row.error}
                  />
                ))
              )
            )}
            {result.fce_tracking && (
              <StepRow
                ok={result.fce_tracking.ok}
                label="Seguimiento de FCE (wsfecred)"
                detail={result.fce_tracking.ok
                  ? `Servicio autorizado y respondiendo. ${result.fce_tracking.source === 'cache' ? 'Se reutilizó el ticket vigente' : 'Se pidió un ticket nuevo'} — válido hasta ${formatDateTime(result.fce_tracking.expires_at)}`
                  : result.fce_tracking.error}
              />
            )}
            {result.usd_rate && (
              <StepRow
                ok={result.usd_rate.ok}
                label="Cotización del dólar según ARCA"
                detail={result.usd_rate.ok ? `$ ${result.usd_rate.rate.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}${result.usd_rate.date ? ` (${result.usd_rate.date})` : ''}` : result.usd_rate.error}
              />
            )}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
