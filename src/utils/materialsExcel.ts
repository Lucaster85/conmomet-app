import { BudgetCurrency } from './api';

// Plantilla, export del presupuesto e importadores (catálogo y presupuesto) salen de esta única
// definición de columnas, a propósito, para que no vuelvan a desincronizarse. Hay dos variantes:
// la del presupuesto suma "Cantidad", que en el catálogo no tiene sentido.
export type MaterialSheetVariant = 'catalog' | 'budget';

export interface MaterialSheetRow {
  description: string;
  quantity?: number | null;
  unit: string;
  provider?: string;
  cost?: number | null;
  currency?: BudgetCurrency | null;
  kg_per_meter?: number | null;
}

interface SheetColumn {
  header: string;
  width: number;
  value: (row: MaterialSheetRow) => string | number;
  // Texto de la hoja "Instrucciones" (puede variar por variante).
  help: (variant: MaterialSheetVariant) => string;
  variants?: MaterialSheetVariant[]; // por defecto, ambas
}

const COLUMNS: SheetColumn[] = [
  {
    header: 'Descripción', width: 40, value: (r) => r.description,
    help: () => 'Obligatoria. Si el material ya existe en el catálogo (sin distinguir mayúsculas) se reutiliza; si no, se crea.',
  },
  {
    header: 'Cantidad', width: 10, value: (r) => r.quantity ?? '', variants: ['budget'],
    help: () => 'Cantidad que se carga en la línea del presupuesto.',
  },
  {
    header: 'Unidad', width: 10, value: (r) => r.unit,
    help: () => 'Ej: u, m, kg. Si no existe se crea. Si se deja vacía, se usa "u".',
  },
  {
    header: 'Kg x mL', width: 10, value: (r) => r.kg_per_meter ?? '',
    help: () => 'Opcional. Kilos por metro lineal (ejes, perfiles, etc.).',
  },
  {
    header: 'Proveedor', width: 24, value: (r) => r.provider ?? '',
    help: () => 'Opcional. Si no existe se crea. Si se deja vacío, se usa "Sin especificar". El mismo material puede repetirse en varias filas, una por proveedor.',
  },
  {
    header: 'Costo Unitario', width: 16, value: (r) => r.cost ?? '',
    help: () => 'Opcional. Costo real de compra (nunca el precio al cliente). Vacío o 0 = sin precio todavía.',
  },
  {
    header: 'Moneda', width: 10, value: (r) => r.currency ?? '',
    help: (variant) => `ARS o USD. Si se deja vacía se usa ${variant === 'budget' ? 'la del presupuesto' : 'ARS'}.`,
  },
];

const columnsFor = (variant: MaterialSheetVariant) =>
  COLUMNS.filter((c) => !c.variants || c.variants.includes(variant));

async function buildWorkbook(variant: MaterialSheetVariant, rows: MaterialSheetRow[], withInstructions: boolean) {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  const columns = columnsFor(variant);

  const ws = XLSX.utils.aoa_to_sheet([
    columns.map((c) => c.header),
    ...rows.map((row) => columns.map((c) => c.value(row))),
  ]);
  ws['!cols'] = columns.map((c) => ({ wch: c.width }));
  XLSX.utils.book_append_sheet(wb, ws, 'Materiales');

  if (withInstructions) {
    const instructions = XLSX.utils.aoa_to_sheet([
      ['Cómo completar la hoja "Materiales"'],
      [''],
      ...columns.map((c) => [c.header, c.help(variant)]),
    ]);
    instructions['!cols'] = [{ wch: 18 }, { wch: 110 }];
    XLSX.utils.book_append_sheet(wb, instructions, 'Instrucciones');
  }
  return { XLSX, wb };
}

export async function downloadMaterialsTemplate(variant: MaterialSheetVariant) {
  const { XLSX, wb } = await buildWorkbook(variant, [
    { description: 'Eje SAE 1045 Ø 20 mm', quantity: 6, unit: 'm', provider: 'Aceros del Sur', cost: 15000, currency: 'ARS', kg_per_meter: 2.466 },
    { description: 'Eje SAE 1045 Ø 20 mm', quantity: 6, unit: 'm', provider: 'Metalúrgica Norte', cost: 14200, currency: 'ARS', kg_per_meter: 2.466 },
    { description: 'Bulón 1/2 x 1/4', quantity: 100, unit: 'u', provider: '', cost: null, currency: null, kg_per_meter: null },
  ], true);
  XLSX.writeFile(wb, variant === 'budget' ? 'plantilla-materiales-presupuesto.xlsx' : 'plantilla-materiales.xlsx');
}

// Misma hoja "Materiales" que la plantilla del presupuesto, con las filas cargadas — se puede
// volver a importar.
export async function exportMaterialsSheet(rows: MaterialSheetRow[], filename: string) {
  const { XLSX, wb } = await buildWorkbook('budget', rows, false);
  XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}
