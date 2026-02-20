import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthContext';
import { apiConfig } from '@/config/api';
import { X } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

const signupSchema = loginSchema.extend({
  name: z.string().optional(),
  phone: z.string().optional(),
});

const verifySchema = z.object({
  code: z.string().length(6, 'Código deve ter 6 dígitos').regex(/^\d+$/, 'Apenas números'),
});

type SignupFormData = z.infer<typeof signupSchema>;
type VerifyFormData = z.infer<typeof verifySchema>;

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'signup';
}

export function AuthModal({ isOpen, onClose, defaultMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(defaultMode);
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [pendingVerifyUserId, setPendingVerifyUserId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const { login, signup, verifyEmail } = useAuth();

  const form = useForm<SignupFormData>({
    resolver: zodResolver(mode === 'login' ? loginSchema : signupSchema),
  });

  const verifyForm = useForm<VerifyFormData>({
    resolver: zodResolver(verifySchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    setLoading(true);
    setError('');

    try {
      if (mode === 'login') {
        await login({ email: data.email, password: data.password });
        form.reset();
        onClose();
      } else {
        const result = await signup(data);
        if (result.kind === 'verification_required') {
          setPendingVerifyUserId(result.userId);
          setStep('verify');
          setError('');
          setResendCountdown(60);
          return;
        }
        form.reset();
        onClose();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao autenticar');
    } finally {
      setLoading(false);
    }
  };

  const onVerifySubmit = async (data: VerifyFormData) => {
    if (!pendingVerifyUserId) return;
    setLoading(true);
    setError('');

    try {
      await verifyEmail(pendingVerifyUserId, data.code);
      verifyForm.reset();
      setPendingVerifyUserId(null);
      setStep('form');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Código inválido ou expirado');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError('');
    setStep('form');
    setPendingVerifyUserId(null);
    form.reset();
    verifyForm.reset();
  };

  const backToForm = () => {
    setStep('form');
    setPendingVerifyUserId(null);
    setError('');
    verifyForm.reset();
  };

  const handleResendCode = async () => {
    if (resendCountdown > 0) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${apiConfig.baseURL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: pendingVerifyUserId }),
      });
      if (!res.ok) throw new Error('Erro ao reenviar código');
      setResendCountdown(60);
    } catch {
      setError('Não foi possível reenviar o código. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setTimeout(() => setResendCountdown(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setStep('form');
      setPendingVerifyUserId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const inputBase = 'w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-[#7C3AED] focus:ring-0 font-body';
  const labelBase = 'block text-sm font-medium text-gray-700 mb-1 font-body';

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto border border-gray-100 shadow-xl">
        <button
          onClick={step === 'verify' ? backToForm : onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-[#7C3AED] transition-colors"
          type="button"
          aria-label={step === 'verify' ? 'Voltar' : 'Fechar'}
        >
          <X size={24} />
        </button>

        {step === 'verify' ? (
          <>
            <h2 className="font-display text-2xl text-[#7C3AED] mb-2">
              Confirme seu e-mail
            </h2>
            <p className="font-body text-gray-600 text-sm mb-6">
              Enviamos um código de 6 dígitos para o seu e-mail. Digite abaixo:
            </p>

            <form onSubmit={verifyForm.handleSubmit(onVerifySubmit)} className="space-y-4">
              <div>
                <label className={labelBase}>Código</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  className={`${inputBase} text-center text-2xl tracking-[0.5em]`}
                  {...verifyForm.register('code')}
                />
                {verifyForm.formState.errors.code && (
                  <p className="text-red-500 text-xs mt-1 font-body">
                    {verifyForm.formState.errors.code.message}
                  </p>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <p className="text-red-600 text-sm font-body">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#7C3AED] hover:bg-[#5B21B6] text-white py-3 rounded-full font-display text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02]"
              >
                {loading ? 'Verificando...' : 'Confirmar'}
              </button>

              <button
                type="button"
                onClick={handleResendCode}
                disabled={resendCountdown > 0 || loading}
                className="w-full font-body text-sm text-[#7C3AED] hover:text-[#5B21B6] disabled:text-gray-400 transition-colors py-2"
              >
                {resendCountdown > 0
                  ? `Reenviar código em ${resendCountdown}s`
                  : 'Não recebeu? Reenviar código'}
              </button>
            </form>

            <button
              type="button"
              onClick={backToForm}
              className="mt-4 w-full text-[#7C3AED] hover:text-[#5B21B6] text-sm font-body font-medium"
            >
              ← Voltar ao cadastro
            </button>
          </>
        ) : (
          <>
            <h2 className="font-display text-2xl text-[#7C3AED] mb-6">
              {mode === 'login' ? 'Entrar' : 'Criar Conta'}
            </h2>

            {mode === 'signup' && (
              <div className="bg-[#7C3AED]/5 border border-[#7C3AED]/20 rounded-xl p-4 mb-6">
                <p className="text-[#7C3AED] text-sm font-medium font-body">
                  🎁 Ganhe 5 créditos grátis após confirmar seu e-mail!
                </p>
                <p className="text-[#7C3AED]/80 text-xs mt-1 font-body">
                  Use para gerar suas próprias estampas com IA
                </p>
              </div>
            )}

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {mode === 'signup' && (
                <>
                  <div>
                    <label className={labelBase}>Nome (opcional)</label>
                    <input
                      type="text"
                      {...form.register('name')}
                      className={inputBase}
                      placeholder="Seu nome"
                    />
                  </div>

                  <div>
                    <label className={labelBase}>Telefone (opcional)</label>
                    <input
                      type="tel"
                      {...form.register('phone')}
                      className={inputBase}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </>
              )}

              <div>
                <label className={labelBase}>Email</label>
                <input
                  type="email"
                  {...form.register('email')}
                  className={inputBase}
                  placeholder="seu@email.com"
                />
                {form.formState.errors.email && (
                  <p className="text-red-500 text-xs mt-1 font-body">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <label className={labelBase}>Senha</label>
                <input
                  type="password"
                  {...form.register('password')}
                  className={inputBase}
                  placeholder="••••••••"
                />
                {form.formState.errors.password && (
                  <p className="text-red-500 text-xs mt-1 font-body">{form.formState.errors.password.message}</p>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <p className="text-red-600 text-sm font-body">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#7C3AED] hover:bg-[#5B21B6] text-white py-3 rounded-full font-display text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02]"
              >
                {loading
                  ? 'Carregando...'
                  : mode === 'login'
                    ? 'Entrar'
                    : 'Criar Conta'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={toggleMode}
                type="button"
                className="text-[#7C3AED] hover:text-[#5B21B6] text-sm font-medium font-body"
              >
                {mode === 'login'
                  ? 'Não tem conta? Cadastre-se'
                  : 'Já tem conta? Entre'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
