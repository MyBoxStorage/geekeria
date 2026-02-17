import { Lock, RefreshCcw, Truck } from 'lucide-react';

const badges = [
  {
    icon: Lock,
    title: 'PAGAMENTO SEGURO',
    subtitle: 'via Mercado Pago',
    color: 'text-[#00843D]',
    bg: 'bg-[#00843D]/10',
  },
  {
    icon: RefreshCcw,
    title: 'TROCA FÁCIL',
    subtitle: 'em até 7 dias',
    color: 'text-[#002776]',
    bg: 'bg-[#002776]/10',
  },
  {
    icon: Truck,
    title: 'ENVIO RASTREADO',
    subtitle: 'para todo Brasil',
    color: 'text-[#002776]',
    bg: 'bg-[#002776]/10',
  },
] as const;

interface TrustBadgesProps {
  variant: 'pdp' | 'cart';
}

export function TrustBadges({ variant }: TrustBadgesProps) {
  if (variant === 'cart') {
    return (
      <div className="flex items-center justify-center gap-4 py-3 px-2">
        {badges.map(({ icon: Icon, title, color }) => (
          <div key={title} className="flex items-center gap-1.5">
            <Icon className={`w-3.5 h-3.5 ${color} shrink-0`} />
            <span className="font-body text-[11px] text-gray-500 leading-tight">
              {title.charAt(0) + title.slice(1).toLowerCase()}
            </span>
          </div>
        ))}
      </div>
    );
  }

  // variant === 'pdp'
  return (
    <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
      {badges.map(({ icon: Icon, title, subtitle, color, bg }) => (
        <div key={title} className="text-center space-y-2">
          <div
            className={`w-9 h-9 mx-auto rounded-full ${bg} flex items-center justify-center`}
          >
            <Icon className={`w-4 h-4 ${color}`} />
          </div>
          <div>
            <p className="font-display text-xs text-gray-900 leading-tight">
              {title}
            </p>
            <p className="font-body text-[11px] text-gray-500 leading-tight mt-0.5">
              {subtitle}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
