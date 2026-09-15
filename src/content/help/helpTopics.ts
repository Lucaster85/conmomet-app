export interface HelpTopic {
  id: string;
  category: string;
  title: string;
  keywords: string[];
  file: string;
}

// Índice de temas de la sección de Ayuda. Se va completando de a un flujo por vez.
// `category` reutiliza los mismos nombres de grupo que ya existen en el menú lateral
// (ver menuGroups en src/app/dashboard/layout.tsx) para que la Ayuda se organice igual
// que el resto de la app.
export const HELP_TOPICS: HelpTopic[] = [
  {
    id: 'crear-oca',
    category: 'Gestión de Clientes',
    title: 'Creación de OCAs (Remitos)',
    keywords: [
      'oca', 'remito', 'remitos', 'presentar', 'aprobar', 'rechazar', 'anular',
      'corregir', 'horas hombre', 'horas grua', 'horas grúa', 'supervisor',
    ],
    file: 'crear-oca.md',
  },
  {
    id: 'carga-horas',
    category: 'Personal',
    title: 'Carga de Horas',
    keywords: [
      'horas', 'carga de horas', 'jornada', 'ingreso', 'egreso', 'llegada tarde',
      'recargo', 'feriado', 'aprobar', 'anular', 'pep', 'concepto', 'mensualizado',
      'quincena', 'supervisor', 'grua', 'grúa',
    ],
    file: 'carga-horas.md',
  },
];
