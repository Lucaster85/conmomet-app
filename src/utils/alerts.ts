// Vocabulario compartido de los avisos del tablero con acuse de vista (ver FLOWS.md §36).
// Espejo de api_conmomet/helpers/alertTypes.js — si se suma un tipo, va en los dos lados.

export type AlertType =
  | 'quote_request'
  | 'entity_document'
  | 'oca_budget'
  | 'safety_equipment'
  | 'tool_in_repair'
  | 'salary_advance_deletion'
  | 'loan_change';

// Orden fijo de la barra de resumen, para que los chips no bailen de lugar según cuál termine de
// cargar primero. De más accionable a más informativo.
export const ALERT_ORDER: AlertType[] = [
  'quote_request',
  'entity_document',
  'oca_budget',
  'safety_equipment',
  'tool_in_repair',
  'salary_advance_deletion',
  'loan_change',
];

// Etiqueta corta para el chip de la barra (la tarjeta usa su propio título largo).
export const ALERT_SHORT_LABEL: Record<AlertType, string> = {
  quote_request: 'PC',
  entity_document: 'Vencimientos',
  oca_budget: 'OCA a presupuestar',
  safety_equipment: 'EPP',
  tool_in_repair: 'Herramientas',
  salary_advance_deletion: 'Adelantos anulados',
  loan_change: 'Préstamos modificados',
};

// Cuántos items no vistos se muestran en una tarjeta antes de resumir el resto en "y N más".
// El punto de todo el flujo es que el tablero no crezca sin límite: sin tope, 10 PC no vistos
// vuelven a dar la pantalla gigante que esto viene a resolver.
export const MAX_VISIBLE_ITEMS = 5;

/**
 * Un item del detalle de un aviso: su id (lo que se guarda como `entity_id`) y su revisión.
 *
 * La revisión es un string OPACO para el backend: la calcula cada aviso con los datos que ya
 * recibe, y define qué significa "cambió algo relevante" para él. Si difiere de la guardada, el
 * item vuelve a mostrarse aunque esté marcado como visto — así marcar visto no entierra
 * novedades (te comentaron el PC, el documento pasó de por-vencer a vencido).
 *
 * Tope de 80 caracteres: es el largo de la columna, y el backend rechaza con 400 lo que pase de
 * ahí en vez de truncar en silencio (truncar dejaría el item reapareciendo para siempre, porque
 * la revisión guardada nunca volvería a coincidir con la calculada).
 */
export interface AlertItemRef {
  entity_id: number;
  revision: string;
}
