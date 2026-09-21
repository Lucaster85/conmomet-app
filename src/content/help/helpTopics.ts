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
  {
    id: 'liquidaciones',
    category: 'Contabilidad',
    title: 'Liquidaciones',
    keywords: [
      'liquidacion', 'liquidación', 'quincena', 'sueldo', 'jornalizado', 'mensualizado',
      'confirmar', 'pagar', 'adelanto', 'prestamo', 'préstamo', 'retroactivo', 'pep',
    ],
    file: 'liquidaciones.md',
  },
  {
    id: 'herramientas-reparacion',
    category: 'Pañol',
    title: 'Reparación de Herramientas',
    keywords: [
      'herramienta', 'herramientas', 'reparacion', 'reparación', 'responsable',
      'devolucion', 'devolución', 'pañol', 'aviso', 'notificacion', 'notificación',
    ],
    file: 'herramientas-reparacion.md',
  },
  {
    id: 'herramientas',
    category: 'Pañol',
    title: 'Herramientas',
    keywords: [
      'herramienta', 'herramientas', 'pañol', 'alta', 'tipo de herramienta', 'estado',
      'disponible', 'reservada', 'entregada', 'en reparacion', 'en reparación', 'de baja',
      'extraviada', 'qr', 'codigo', 'código', 'etiqueta',
    ],
    file: 'herramientas.md',
  },
  {
    id: 'asignaciones',
    category: 'Pañol',
    title: 'Asignación de Herramientas y Grúas',
    keywords: [
      'asignacion', 'asignación', 'asignaciones', 'entrega', 'entregar', 'devolucion',
      'devolución', 'devolver', 'reserva', 'reservar', 'responsable', 'condicion',
      'condición', 'completitud', 'grua', 'grúa', 'vehiculo', 'vehículo', 'pañol',
    ],
    file: 'asignaciones.md',
  },
  {
    // Categoría propia a propósito, no coincide con ningún grupo de menú actual: Vehículos hoy
    // vive dentro de "Gestión de Clientes" en el menú, pero va a crecer como módulo
    // independiente de gestión de flota, así que se documenta aparte desde ya.
    id: 'flota',
    category: 'Flota',
    title: 'Grúas y Flota',
    keywords: [
      'grua', 'grúa', 'vehiculo', 'vehículo', 'flota', 'camion', 'camión', 'patente',
      'dominio', 'vtv', 'seguro', 'legajo', 'habilitado para carga de horas',
    ],
    file: 'flota.md',
  },
  {
    id: 'clientes',
    category: 'Gestión de Clientes',
    title: 'Clientes',
    keywords: [
      'cliente', 'clientes', 'razon social', 'razón social', 'activar', 'desactivar',
      'supervisor', 'supervisores', 'tarifa', 'tarifas por rubro', 'contacto', 'obra',
      'administracion', 'administración',
    ],
    file: 'clientes.md',
  },
  {
    id: 'plantas',
    category: 'Gestión de Clientes',
    title: 'Plantas',
    keywords: [
      'planta', 'plantas', 'requisitos', 'habilitaciones', 'documentos', 'vencimiento',
      'direccion', 'dirección',
    ],
    file: 'plantas.md',
  },
  {
    id: 'proyectos',
    category: 'Gestión de Clientes',
    title: 'Proyectos',
    keywords: [
      'proyecto', 'proyectos', 'subproyecto', 'subproyectos', 'supervisor', 'supervisores',
      'presupuesto', 'obra',
    ],
    file: 'proyectos.md',
  },
  {
    id: 'presupuestos',
    category: 'Gestión de Clientes',
    title: 'Presupuestos',
    keywords: [
      'presupuesto', 'presupuestos', 'cotizacion', 'cotización', 'mano de obra', 'materiales',
      'importar excel', 'bonificacion', 'bonificación', 'descuento', 'aprobar', 'rechazar',
      'enviar', 'duplicar', 'generar proyecto', 'rubro', 'margen', 'costo',
    ],
    file: 'presupuestos.md',
  },
  {
    // Categoría propia a propósito, mismo criterio que "Flota": el sistema de documentos es
    // transversal (Empleados, Vehículos, Inicio), no vive en un único grupo de menú.
    id: 'documentacion',
    category: 'Documentación',
    title: 'Documentación y Vencimientos',
    keywords: [
      'documento', 'documentos', 'vencimiento', 'vencimientos', 'renovar', 'renovacion',
      'renovación', 'resolver', 'categoria de documento', 'categoría de documento', 'legajo',
      'alerta', 'alertas', 'vence', 'vencido', 'habilitacion', 'habilitación',
    ],
    file: 'documentacion.md',
  },
];
