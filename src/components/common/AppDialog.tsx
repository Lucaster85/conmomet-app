'use client';
import { Dialog, type DialogProps } from '@mui/material';

/**
 * Dialog de la app: igual al de MUI pero el click en el backdrop NO lo cierra,
 * para no perder lo que el usuario estaba cargando (ej. un presupuesto).
 * Se cierra solo desde los botones del propio dialog (o con Escape).
 * Usar este componente en lugar de `Dialog` de '@mui/material'.
 */
export default function AppDialog({ onClose, ...props }: DialogProps) {
  const handleClose: DialogProps['onClose'] = (event, reason) => {
    if (reason === 'backdropClick') return;
    onClose?.(event, reason);
  };

  return <Dialog {...props} onClose={handleClose} />;
}
