import { useSearchParams, Link } from 'react-router-dom';
import { XCircle, Home, AlertCircle, RotateCcw, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { buildWhatsAppLink } from '@/utils/whatsapp';

export default function CheckoutFailure() {
  const [searchParams] = useSearchParams();
  const statusDetail = searchParams.get('status_detail');

  const getErrorMessage = (detail: string | null): string => {
    const messages: Record<string, string> = {
      cc_rejected_insufficient_amount:
        'Saldo insuficiente no cartão. Tente outro cartão ou método de pagamento.',
      cc_rejected_bad_filled_security_code:
        'Código de segurança incorreto. Verifique e tente novamente.',
      cc_rejected_bad_filled_date:
        'Data de validade incorreta. Verifique e tente novamente.',
      cc_rejected_bad_filled_other:
        'Dados do cartão incorretos. Verifique e tente novamente.',
      cc_rejected_bad_filled_card_number:
        'Número do cartão incorreto. Verifique e tente novamente.',
      cc_rejected_call_for_authorize:
        'Seu banco precisa autorizar o pagamento. Entre em contato com ele.',
      cc_rejected_card_disabled:
        'Cartão desabilitado. Entre em contato com seu banco.',
      cc_rejected_duplicated_payment:
        'Pagamento duplicado detectado. Se já pagou, aguarde a confirmação.',
      cc_rejected_max_attempts:
        'Limite de tentativas atingido. Tente com outro cartão.',
      cc_rejected_high_risk:
        'Pagamento recusado por segurança. Tente com outro cartão.',
      cc_rejected_blacklist:
        'Pagamento não autorizado. Entre em contato com seu banco.',
      cc_rejected_other_reason:
        'Pagamento não aprovado. Tente com outro cartão ou método.',
      rejected: 'Pagamento não aprovado. Tente outro método de pagamento.',
    };

    return detail
      ? messages[detail] || 'O pagamento não pôde ser processado. Tente novamente.'
      : 'O pagamento não pôde ser processado. Tente novamente.';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-500/10 via-red-500/5 to-[#002776]/10 p-4">
      <Card className="max-w-lg w-full shadow-2xl border-0 rounded-xl overflow-hidden">
        <CardContent className="p-6 sm:p-8 text-center">
          {/* Ícone com animação */}
          <div className="mb-6">
            <div className="relative inline-flex items-center justify-center">
              <div
                className="absolute inset-0 bg-red-500/20 rounded-full animate-ping"
                style={{ animationDuration: '2s' }}
              />
              <XCircle className="w-20 h-20 sm:w-24 sm:h-24 text-red-500 relative z-10" />
            </div>
          </div>

          {/* Título */}
          <h1 className="font-display text-3xl sm:text-4xl text-[#002776] mb-3 tracking-wide">
            Pagamento Recusado
          </h1>

          {/* Subtítulo */}
          <p className="text-base sm:text-lg text-[#002776]/70 mb-6 font-body">
            Não foi possível processar seu pagamento.
          </p>

          {/* Badge de status */}
          <div className="mb-6">
            <span className="inline-flex items-center gap-2 bg-red-500/15 text-red-600 border border-red-500/30 rounded-full px-4 py-2 text-sm font-medium">
              <AlertCircle className="w-4 h-4" />
              Pagamento Não Aprovado
            </span>
          </div>

          {/* Detalhe do erro */}
          {statusDetail && (
            <div className="mb-6 p-4 sm:p-5 bg-red-50 rounded-xl border border-red-200">
              <p className="text-sm text-red-800 font-body">
                {getErrorMessage(statusDetail)}
              </p>
            </div>
          )}

          {/* Não tem status_detail — mensagem genérica */}
          {!statusDetail && (
            <div className="mb-6 p-4 sm:p-5 bg-red-50 rounded-xl border border-red-200">
              <p className="text-sm text-red-800 font-body">
                {getErrorMessage(null)}
              </p>
            </div>
          )}

          {/* Dicas */}
          <div className="mb-6 p-4 sm:p-5 bg-[#002776]/5 rounded-xl border border-[#002776]/10">
            <p className="text-sm font-semibold text-[#002776] mb-3 font-body">
              O que você pode fazer:
            </p>
            <ul className="text-xs text-[#002776]/60 space-y-2 text-left font-body">
              <li className="flex items-start gap-2">
                <span className="text-[#002776]/40 mt-0.5">•</span>
                Verifique os dados do cartão e tente novamente
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#002776]/40 mt-0.5">•</span>
                Certifique-se de ter saldo ou limite disponível
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#002776]/40 mt-0.5">•</span>
                Experimente outro método de pagamento (ex.: PIX)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#002776]/40 mt-0.5">•</span>
                Se o problema persistir, entre em contato com seu banco
              </li>
            </ul>
          </div>

          {/* CTAs */}
          <div className="space-y-3">
            <Link to="/catalogo" className="block">
              <Button
                className="w-full bg-[#00843D] hover:bg-[#006633] text-white rounded-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg font-display"
                size="lg"
                aria-label="Tentar novamente"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                TENTAR NOVAMENTE
              </Button>
            </Link>
            <Link to="/catalogo" className="block">
              <Button
                className="w-full border-2 border-[#00843D] text-[#00843D] hover:bg-[#00843D] hover:text-white rounded-lg transition-all duration-300"
                size="lg"
                variant="outline"
                aria-label="Voltar ao catálogo"
              >
                <Home className="w-4 h-4 mr-2" />
                VOLTAR AO CATÁLOGO
              </Button>
            </Link>
            <Button
              variant="ghost"
              className="w-full text-[#25D366] hover:text-[#128C7E] hover:bg-[#25D366]/10 rounded-lg transition-all duration-300"
              size="lg"
              asChild
            >
              <a
                href={buildWhatsAppLink(
                  statusDetail
                    ? `Olá! Meu pagamento não foi aprovado e preciso de ajuda para finalizar a compra. Motivo: ${getErrorMessage(statusDetail).split('.')[0].toLowerCase()}. Pode me orientar?`
                    : 'Olá! Meu pagamento não foi aprovado e preciso de ajuda para finalizar a compra. Pode me orientar?'
                )}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                FALAR NO WHATSAPP
              </a>
            </Button>
          </div>

          {/* Footer */}
          <p className="text-xs text-[#002776]/50 mt-6 font-body">
            Precisa de ajuda? Fale com a gente pelo WhatsApp.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
