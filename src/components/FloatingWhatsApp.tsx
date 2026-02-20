import { MessageCircle } from 'lucide-react';
import { buildWhatsAppLink } from '@/utils/whatsapp';

const WA_MESSAGE = 'Olá! Preciso de ajuda com minha compra na GEEKERIA. Pode me orientar?';

export function FloatingWhatsApp() {
  return (
    <a
      href={buildWhatsAppLink(WA_MESSAGE)}
      target="_blank"
      rel="noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 w-14 h-14 bg-[#25D366] hover:bg-[#128C7E] rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"
    >
      <MessageCircle className="w-7 h-7 text-white" />
    </a>
  );
}
