import { BudgetCurrency, BudgetMaterialItem, Material, MaterialProviderPrice } from './api';

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

// Antigüedad del costo de una línea de presupuesto, comparado contra el precio vigente del
// catálogo para (material, proveedor) — ver FLOWS.md §19c.
//   'catalog': el costo de la línea es el mismo que el del pañol ahora mismo.
//   'edited':  el usuario tocó el costo en esta sesión de edición (gana sobre cualquier otra
//              señal), o el pañol no tiene precio cargado para este par (nada con qué comparar).
//   'stale':   el pañol cambió después de que esta línea se cargó/guardó — precio desactualizado.
//   null:      línea sin vincular a un material, o sin precio que mostrar.
export type MaterialCostStatus =
  | { kind: 'catalog'; priceUpdatedAt?: string | null }
  | { kind: 'edited' }
  | { kind: 'stale'; catalogCost: number; catalogCurrency: BudgetCurrency | null }
  | null;

export const materialCostStatus = (
  item: Pick<BudgetMaterialItem, 'material_id' | 'provider_id' | 'material_cost_snapshot' | 'material_cost_currency' | 'cost_edited'>,
  material: Material | undefined,
): MaterialCostStatus => {
  if (!item.material_id) return null;
  if (item.cost_edited) return { kind: 'edited' };

  const price = findPrice(material, item.provider_id);
  if (!price || !hasCost(price)) return null;

  if (item.material_cost_snapshot == null) return { kind: 'catalog', priceUpdatedAt: price.updatedAt };

  // DECIMAL llega como string ("100.00") — comparar en centavos evita falsos "desactualizado"
  // por precisión de punto flotante o por tipo (mismo criterio que lineCost/sortPricesByValue).
  const sameValue = Math.round(Number(item.material_cost_snapshot) * 100) === Math.round(Number(price.cost) * 100);
  const sameCurrency = (item.material_cost_currency ?? null) === (price.currency ?? null);
  if (sameValue && sameCurrency) return { kind: 'catalog', priceUpdatedAt: price.updatedAt };

  return { kind: 'stale', catalogCost: Number(price.cost), catalogCurrency: price.currency };
};
