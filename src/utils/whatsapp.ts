const WHATSAPP_E164 = '5524981313689';

export function buildWhatsAppLink(message: string): string {
  return `https://wa.me/${WHATSAPP_E164}?text=${encodeURIComponent(message)}`;
}
