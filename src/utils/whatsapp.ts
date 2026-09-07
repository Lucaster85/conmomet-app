// Link `wa.me` armado en el cliente — no hay integración real de WhatsApp Business API (se
// descartó por costo/esfuerzo: cuenta verificada ante Meta, plantillas aprobadas, costo por
// conversación). Abre WhatsApp con el mensaje precargado; quien lo dispara aprieta "enviar" a
// mano. Usado hoy en invitación al portal, préstamos y adelantos.
export function buildWhatsAppLink(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
