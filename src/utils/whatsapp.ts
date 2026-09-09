// Normaliza un teléfono argentino a lo que WhatsApp necesita para celulares: 549 + código de
// área + número (sin 0 inicial, sin "15", sin espacios). Acepta lo que un admin tipearía al
// cargar el dato de un empleado — con o sin 0, con o sin "15", con o sin +54/9 ya puestos —
// porque el área+número puede tener distinta cantidad de dígitos según la región (11 para
// CABA/GBA, 2262 para Necochea/Quequén, etc.), así que no asumimos un largo fijo de área.
export function normalizeArgentinaMobile(phone: string): string {
  let digits = (phone || '').replace(/\D/g, '');

  if (digits.startsWith('54')) {
    digits = digits.slice(2);
    if (digits.startsWith('9')) digits = digits.slice(1);
  }

  digits = digits.replace(/^0/, '');

  // El "15" de discado local para celulares se inserta justo después del código de área. Como
  // no sabemos cuántos dígitos tiene el código de área, lo sacamos solo si al hacerlo el
  // resultado queda en el largo esperado (10 = área + número) — así evitamos borrar un "15"
  // que sea parte real del número.
  if (digits.length === 12) {
    const without15 = digits.replace('15', '');
    if (without15.length === 10) digits = without15;
  }

  return `549${digits}`;
}

// Link `wa.me` armado en el cliente — no hay integración real de WhatsApp Business API (se
// descartó por costo/esfuerzo: cuenta verificada ante Meta, plantillas aprobadas, costo por
// conversación). Abre WhatsApp con el mensaje precargado; quien lo dispara aprieta "enviar" a
// mano. Usado hoy en invitación al portal, préstamos y adelantos — siempre con teléfonos de
// empleados argentinos, por eso normaliza a celular AR antes de armar el link.
export function buildWhatsAppLink(phone: string, message: string): string {
  return `https://wa.me/${normalizeArgentinaMobile(phone)}?text=${encodeURIComponent(message)}`;
}
