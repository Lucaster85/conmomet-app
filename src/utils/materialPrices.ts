import { BudgetCurrency, Material, MaterialProviderPrice } from './api';

export const currencySymbol = (currency?: BudgetCurrency | null) => (currency === 'USD' ? 'US$' : '$');

export const formatMaterialPrice = (cost: number | string | null | undefined, currency?: BudgetCurrency | null): string => {
  if (cost === null || cost === undefined || cost === '') return '';
  return `${currencySymbol(currency)}${new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(cost))}`;
};

// Un precio cuenta como "cargado" solo si tiene costo — un proveedor con cost null está
// vinculado al material pero sin precio todavía.
export const hasCost = (price: MaterialProviderPrice) => price.cost !== null && price.cost !== undefined;

export const findPrice = (material: Material | undefined | null, providerId: number | null | undefined): MaterialProviderPrice | undefined =>
  providerId ? material?.providerPrices?.find((p) => p.provider_id === providerId) : undefined;

// ARS primero, después USD; dentro de cada moneda, de menor a mayor. No se comparan montos de
// monedas distintas entre sí.
export const sortPricesByValue = (prices: MaterialProviderPrice[]): MaterialProviderPrice[] =>
  [...prices].sort((a, b) => {
    const ca = a.currency === 'USD' ? 1 : 0;
    const cb = b.currency === 'USD' ? 1 : 0;
    if (ca !== cb) return ca - cb;
    return Number(a.cost) - Number(b.cost);
  });

// "Mejor precio" del catálogo: el mínimo de la moneda ARS si hay alguno, si no el mínimo en USD.
export const bestPrice = (material: Material): MaterialProviderPrice | null => {
  const priced = sortPricesByValue((material.providerPrices || []).filter(hasCost));
  return priced[0] || null;
};
