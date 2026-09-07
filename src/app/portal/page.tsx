'use client';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import PortalHomeGrid from '@/components/portal/PortalHomeGrid';
import MyLegajoContent from '@/components/portal/MyLegajoContent';

export default function PortalRootPage() {
  const theme = useTheme();
  // Decisión en JS (no un simple display:{xs,sm} con ambos montados) a propósito: montar los dos
  // a la vez dispararía el fetch de MyLegajoContent aunque quede oculto en mobile.
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return isMobile ? <PortalHomeGrid /> : <MyLegajoContent />;
}
