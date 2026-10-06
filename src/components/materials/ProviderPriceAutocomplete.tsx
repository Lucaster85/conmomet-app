'use client';
import React, { useMemo } from 'react';
import { Typography } from '@mui/material';
import CreatableSelect from '../common/CreatableSelect';
import { MaterialProvider, MaterialProviderPrice } from '../../utils/api';
import { formatMaterialPrice, hasCost, sortPricesByValue } from '../../utils/materialPrices';

interface Props {
  providers: MaterialProvider[];
  // Precios ya cargados para el material en cuestión — se muestran primero y con su valor
  // para poder comparar. Vacío en el editor de precios de un material nuevo.
  prices?: MaterialProviderPrice[];
  value: number | null;
  // Proveedor ya elegido que puede no estar en `providers` (dado de baja) — para seguir mostrando el nombre.
  valueFallback?: MaterialProvider | null;
  onChange: (provider: MaterialProvider | null) => void;
  // Alta inline: debe devolver el proveedor creado (y sumarlo a `providers` en el padre).
  onCreate: (name: string) => Promise<MaterialProvider>;
  onError?: (message: string) => void;
  showPrices?: boolean;
  excludeIds?: number[];
  label?: string;
  placeholder?: string;
  size?: 'small' | 'medium';
  disabled?: boolean;
  disableClearable?: boolean;
  fullWidth?: boolean;
}

export default function ProviderPriceAutocomplete({
  providers, prices = [], value, valueFallback, onChange, onCreate, onError, showPrices = true,
  excludeIds, label = 'Proveedor', placeholder, size = 'small', disabled, disableClearable, fullWidth = true,
}: Props) {
  const priceByProvider = useMemo(() => new Map(prices.map((p) => [p.provider_id, p])), [prices]);

  // Primero los que tienen precio (de menor a mayor por moneda), después el resto.
  const options = useMemo(() => {
    const withPrice = sortPricesByValue(prices.filter(hasCost))
      .map((price) => providers.find((p) => p.id === price.provider_id))
      .filter((p): p is MaterialProvider => !!p);
    const withPriceIds = new Set(withPrice.map((p) => p.id));
    return [...withPrice, ...providers.filter((p) => !withPriceIds.has(p.id))];
  }, [providers, prices]);

  return (
    <CreatableSelect<MaterialProvider>
      options={options}
      getLabel={(p) => p.razonSocial}
      renderSecondary={showPrices ? (p) => {
        const price = priceByProvider.get(p.id);
        return price && hasCost(price)
          ? <Typography variant="body2" fontWeight={600}>{formatMaterialPrice(price.cost, price.currency)}</Typography>
          : <Typography variant="caption" color="text.secondary">sin precio</Typography>;
      } : undefined}
      value={value}
      valueFallback={valueFallback}
      onChange={onChange}
      onCreate={onCreate}
      onError={onError}
      excludeIds={excludeIds}
      label={label}
      placeholder={placeholder}
      size={size}
      disabled={disabled}
      disableClearable={disableClearable}
      fullWidth={fullWidth}
      noOptionsText="Escribí para crear un proveedor"
    />
  );
}
