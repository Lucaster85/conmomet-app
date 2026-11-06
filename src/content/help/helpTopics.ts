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
    // Categoría propia, mismo criterio que "Flota" y "Documentación": la pantalla de inicio es
    // transversal — junta avisos de Clientes, Personal, Pañol y Documentación — así que no cuelga
    // de ningún grupo del menú.
    id: 'tablero-avisos',
    category: 'Inicio',
    title: 'Avisos del inicio y campanita de notificaciones',
    keywords: [
      'aviso', 'avisos', 'tablero', 'inicio', 'pantalla principal', 'pantalla de inicio',
      'marcar como visto', 'visto', 'vistos', 'ojito', 'pendiente', 'pendientes', 'contador',
      'contadores', 'notificacion', 'notificación', 'notificaciones', 'campanita', 'campana',
      'alerta', 'alertas', 'ocultar', 'volver a mostrar', 'resumen', 'leido', 'leído', 'sin leer',
      'no leidas', 'no leídas', 'marcar todas', 'historial', 'push', 'celular', 'badge',
      'numerito', 'novedades', 'adicionales para presupuestar', 'adicional finalizado', 'presupuestos esperando respuesta',
    ],
    file: 'tablero-avisos.md',
  },
  {
    // Misma categoría que los avisos del inicio: las notas son personales y transversales, no
    // cuelgan de ningún grupo del menú.
    id: 'notas-rapidas',
    category: 'Inicio',
    title: 'Notas rápidas',
    keywords: [
      'nota', 'notas', 'nota rapida', 'nota rápida', 'notas rapidas', 'notas rápidas', 'pendiente',
      'pendientes', 'recordatorio', 'recordatorios', 'idea', 'ideas', 'anotar', 'apuntar',
      'vencimiento', 'tachar', 'completar', 'completada', 'completadas', 'deshacer', 'eliminar',
      'boton flotante', 'botón flotante', 'lapiz', 'lápiz', 'alt n', 'bloc de notas', 'to do',
    ],
    file: 'notas-rapidas.md',
  },
  {
    // Misma categoría que los avisos del inicio y las notas: el panel de filtros y el switch
    // "Ver terminados"/"Ver inactivos" son transversales a casi todos los listados, no cuelgan
    // de ningún grupo del menú (ver FLOWS.md §52).
    id: 'listados-filtros',
    category: 'Inicio',
    title: 'Filtros de los listados',
    keywords: [
      'filtro', 'filtros', 'panel de filtros', 'buscar', 'busqueda', 'búsqueda',
      'limpiar filtros', 'ver terminados', 'ver inactivos', 'ver anuladas', 'mostrar resueltos',
      'terminado', 'terminados', 'cancelado', 'rechazado', 'completado', 'inactivo', 'anulado',
      'no aparece', 'desapareció', 'desaparecio', 'donde esta', 'dónde está',
    ],
    file: 'listados-filtros.md',
  },
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
    id: 'epp',
    category: 'Personal',
    title: 'Entrega de EPP, vencimientos y talles',
    keywords: [
      'epp', 'elemento de proteccion', 'elemento de protección', 'entrega', 'vencimiento',
      'renovacion', 'renovación', 'talle', 'botin', 'botín', 'pantalon', 'pantalón', 'guantes',
      'catalogo', 'catálogo', 'vida util', 'vida útil', 'casco',
    ],
    file: 'epp.md',
  },
  {
    id: 'liquidaciones',
    category: 'Contabilidad',
    title: 'Liquidaciones',
    keywords: [
      'liquidacion', 'liquidación', 'quincena', 'sueldo', 'jornalizado', 'mensualizado',
      'confirmar', 'pagar', 'adelanto', 'prestamo', 'préstamo', 'retroactivo', 'pep',
      'cerrar', 'cerrar quincena', 'dolares', 'dólares', 'dolar', 'dólar', 'usd',
      'cotizacion', 'cotización', 'tipo de cambio', 'bna',
      'cancelado', 'rechazado', 'terminado', 'terminados', 'ver terminados', 'no aparece',
    ],
    file: 'liquidaciones.md',
  },
  {
    id: 'prestamos',
    category: 'Contabilidad',
    title: 'Préstamos y cuotas',
    keywords: [
      'prestamo', 'préstamo', 'prestamos', 'préstamos', 'cuota', 'cuotas', 'quincenal',
      'quincenales', 'mensual', 'mensuales', 'interes', 'interés', 'frecuencia', 'aprobar',
      'marcar como pagado', 'entrega', 'liquidar', 'baja', 'renuncia', 'despido', 'atrasada',
      'atrasadas', 'mensualizado', 'amortizacion', 'amortización', 'a discrecion', 'a discreción',
      'reprogramar', 'reprogramacion', 'reprogramación', 'cancelar', 'cancelacion', 'cancelación',
      'dolares', 'dólares', 'dolar', 'dólar', 'usd', 'cotizacion', 'cotización',
      'tipo de cambio', 'bna', 'cotizacion de entrega', 'cotización de entrega',
      'cancelado', 'terminado', 'terminados', 'ver terminados', 'no aparece', 'desapareció',
      'filtro', 'filtros',
    ],
    file: 'prestamos.md',
  },
  {
    id: 'egresos',
    category: 'Personal',
    title: 'Egresos de empleados (renuncia, despido, mutuo acuerdo)',
    keywords: [
      'baja', 'dar de baja', 'egreso', 'egresos', 'renuncia', 'despido', 'despedir', 'telegrama',
      'carta documento', 'indemnizacion', 'indemnización', 'preaviso', 'liquidacion final',
      'liquidación final', 'acuerdo', 'cuotas', 'seclo', 'art 80', 'art. 80', 'certificado de trabajo',
      'mutuo acuerdo', 'retiro voluntario', 'inactivo', 'legajo', 'anular',
    ],
    file: 'egresos.md',
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
      'terminado', 'terminados', 'ver terminados', 'no aparece',
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
      'de baja', 'terminado', 'terminados', 'ver terminados', 'no aparece',
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
      'presupuesto', 'obra', 'completado', 'cancelado', 'terminado', 'terminados',
      'ver terminados', 'no aparece',
    ],
    file: 'proyectos.md',
  },
  {
    id: 'pedidos-cotizacion',
    category: 'Gestión de Clientes',
    title: 'Pedidos de Cotización',
    keywords: [
      'pedido de cotizacion', 'pedido de cotización', 'pedidos de cotizacion',
      'pedidos de cotización', 'pc', 'cotizacion', 'cotización', 'vencimiento',
      'presentacion', 'presentación', 'asignar', 'asignacion', 'asignación', 'responsable',
      'responsables', 'reasignar', 'gerencia', 'gerente', 'margen', 'margenes', 'márgenes',
      'validar', 'validacion', 'validación', 'aviso', 'avisos', 'notificacion', 'notificación',
      'notificaciones', 'push', 'celular', 'telefono', 'teléfono', 'iphone', 'android',
      'pantalla de inicio', 'activar notificaciones',
      'cancelar', 'cancelado', 'flujo', 'circuito', 'diagrama', 'estados', 'proyecto',
      'entregar', 'aprobar', 'rechazar', 'cotizado',
      'comentario', 'comentarios', 'linea de tiempo', 'línea de tiempo', 'historial', 'ver',
      'terminado', 'terminados', 'ver terminados', 'no aparece',
    ],
    file: 'pedidos-cotizacion.md',
  },
  {
    id: 'adicionales',
    category: 'Gestión de Clientes',
    title: 'Adicionales',
    keywords: [
      'adicional', 'adicionales', 'urgente', 'urgencia', 'proyecto padre', 'padre', 'subproyecto',
      'codigo', 'código', 'a-2026', 'materiales', 'presupuesto rechazado', 'rechazo',
      'nuevo presupuesto', 'historial de presupuestos', 'sin pedido de cotizacion',
      'sin pedido de cotización', 'finalizar', 'finalización', 'finalizacion', 'terminado',
      'responsable', 'notificar', 'notificar finalización', 'completado', 'cancelado',
      'ver terminados', 'no aparece',
    ],
    file: 'adicionales.md',
  },
  {
    id: 'seguimiento',
    category: 'Gestión de Clientes',
    title: 'Seguimiento de proyectos y adicionales',
    keywords: [
      'seguimiento', 'nota', 'notas', 'bitacora', 'bitácora', 'registro', 'fotos', 'foto',
      'celular', 'obra', 'proyecto', 'adicional', 'se compro', 'se compró', 'trabajo realizado',
    ],
    file: 'seguimiento.md',
  },
  {
    id: 'presupuestos',
    category: 'Gestión de Clientes',
    title: 'Presupuestos',
    keywords: [
      'presupuesto', 'presupuestos', 'cotizacion', 'cotización', 'mano de obra', 'materiales',
      'importar excel', 'bonificacion', 'bonificación', 'descuento', 'aprobar', 'rechazar',
      'enviar', 'duplicar', 'generar proyecto', 'rubro', 'margen', 'costo', 'proveedor',
      'descargar excel', 'exportar', 'edicion simultanea', 'edición simultánea', 'conflicto',
      'esta editando', 'guardó cambios', 'recargar', 'historial', 'quien modifico',
      'quién modificó', 'cambios', 'auditoria', 'auditoría', 'precio desactualizado',
      'antigüedad del precio', 'antiguedad del precio', 'precio viejo', 'seguimiento',
      'respuesta del cliente', 'esperando aprobación', 'esperando aprobacion', 'esperando respuesta',
      'terminado', 'terminados', 'ver terminados', 'no aparece',
    ],
    file: 'presupuestos.md',
  },
  {
    id: 'facturacion',
    category: 'Facturación',
    title: 'Facturación',
    keywords: [
      'factura', 'facturas', 'facturar', 'facturacion', 'facturación', 'iva', 'alicuota', 'alícuota',
      'saldo', 'por facturar', 'cobro', 'cobrada', 'cobranza', 'anular', 'corregir', 'sin factura',
      'factura libre', 'cuit', 'arca', 'afip', 'anticipo', 'avance', 'mano de obra', 'materiales',
      'punto de venta', 'comprobante', 'pdf', 'anulada', 'ver terminados', 'no aparece',
    ],
    file: 'facturacion.md',
  },
  {
    id: 'materiales',
    category: 'Pañol',
    title: 'Materiales y Proveedores',
    keywords: [
      'material', 'materiales', 'catalogo', 'catálogo', 'proveedor', 'proveedores', 'precio',
      'precios', 'costo', 'costos', 'sin especificar', 'kg x ml', 'kg por metro', 'unidad',
      'importar excel', 'plantilla', 'historial de costos',
    ],
    file: 'materiales.md',
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
