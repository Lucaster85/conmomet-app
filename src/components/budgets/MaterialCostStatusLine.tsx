import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { MaterialCostStatus, formatMaterialPrice } from '../../utils/materialPrices';
import { relativeTime } from '../../utils/dates';

interface Props {
  status: MaterialCostStatus;
  // Grilla desktop: fuente más chica y botón de texto para que entre en la columna de costo.
  // Tarjeta mobile/tablet: botón outlined, mejor target de toque.
  dense?: boolean;
  onUseCatalogPrice?: () => void;
}

// Renglón bajo el input de costo con la antigüedad del precio (ver FLOWS.md §19c). Texto en
// flujo, nunca tooltip: tiene que verse en mobile. Un solo renglón, estados mutuamente excluyentes.
export default function MaterialCostStatusLine({ status, dense, onUseCatalogPrice }: Props) {
  if (!status) return null;

  const fontSize = dense ? '0.7rem' : undefined;

  if (status.kind === 'catalog') {
    const rel = relativeTime(status.priceUpdatedAt);
    if (!rel) return null; // sin fecha válida: mejor no mostrar nada que mentir con "Actualizado "
    return (
      <Typography variant="caption" color="text.secondary" sx={{ fontSize }}>
        {`Actualizado ${rel}`}
      </Typography>
    );
  }

  if (status.kind === 'edited') {
    return (
      <Typography variant="caption" color="text.secondary" sx={{ fontSize }}>
        Actualizado en este presupuesto
      </Typography>
    );
  }

  return (
    <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
      <Typography variant="caption" color="error.main" sx={{ fontSize }}>
        Precio desactualizado
      </Typography>
      <Button
        size="small"
        variant={dense ? 'text' : 'outlined'}
        color="error"
        onClick={onUseCatalogPrice}
        sx={{ fontSize, lineHeight: 1.2, py: 0, minWidth: 0 }}
      >
        {`Actualizar a ${formatMaterialPrice(status.catalogCost, status.catalogCurrency)}`}
      </Button>
    </Box>
  );
}
