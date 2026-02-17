import { useState } from 'react';
import { Lock, Eye, EyeOff, Mail, Loader2 } from 'lucide-react';

interface AdminLoginProps {
  onLogin: (email: string, password: string) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
  onBack?: () => void;
}

export function AdminLogin({ onLogin, isLoading, error: externalError, onBack }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  const displayError = externalError || localError;

  const handleSubmit = async () => {
    if (!email || !password) {
      setLocalError('Preencha email e senha.');
      return;
    }
    setLocalError('');
    const success = await onLogin(email, password);
    if (!success) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 600);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage:
            'radial-gradient(circle at 50% 0%, #00843D15 0%, transparent 60%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          background: '#161616',
          border: '1px solid #2a2a2a',
          borderRadius: 16,
          padding: '48px 40px',
          width: '100%',
          maxWidth: 400,
          position: 'relative',
          borderTop: '3px solid #FFCC29',
          animation: isShaking ? 'shake 0.5s ease-in-out' : 'none',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 32,
              letterSpacing: 3,
              color: '#ffffff',
              marginBottom: 4,
            }}
          >
            BRAVOS <span style={{ color: '#FFCC29' }}>BRASIL</span>
          </div>
          <div
            style={{
              fontSize: 11,
              letterSpacing: 3,
              color: '#555',
              textTransform: 'uppercase',
            }}
          >
            Painel Administrativo
          </div>
        </div>

        {/* Lock icon */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: '#00843D20',
              border: '2px solid #00843D40',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Lock size={22} color="#00843D" />
          </div>
        </div>

        {/* Email field */}
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: 'block',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 1.5,
              color: '#666',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            Email
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setLocalError('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="admin@bravosbrasil.com.br"
              autoFocus
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '14px 48px 14px 16px',
                background: '#222',
                border: `1.5px solid ${displayError ? '#cc0000' : '#333'}`,
                borderRadius: 10,
                color: '#fff',
                fontSize: 14,
                fontFamily: "'Inter', sans-serif",
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
                opacity: isLoading ? 0.6 : 1,
              }}
            />
            <div
              style={{
                position: 'absolute',
                right: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#555',
                display: 'flex',
              }}
            >
              <Mail size={18} />
            </div>
          </div>
        </div>

        {/* Password field */}
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: 'block',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 1.5,
              color: '#666',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            Senha de Acesso
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setLocalError('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="••••••••••••"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '14px 48px 14px 16px',
                background: '#222',
                border: `1.5px solid ${displayError ? '#cc0000' : '#333'}`,
                borderRadius: 10,
                color: '#fff',
                fontSize: 16,
                fontFamily: "'Inter', sans-serif",
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
                opacity: isLoading ? 0.6 : 1,
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#555',
                padding: 0,
                display: 'flex',
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {displayError && (
            <p style={{ fontSize: 12, color: '#cc0000', marginTop: 6 }}>
              {displayError}
            </p>
          )}
        </div>

        {/* Submit button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading || (!email && !password)}
          style={{
            width: '100%',
            padding: '14px',
            background:
              isLoading || (!email && !password) ? '#1a1a1a' : '#00843D',
            color: isLoading || (!email && !password) ? '#444' : '#fff',
            border: 'none',
            borderRadius: 10,
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 18,
            letterSpacing: 2,
            cursor:
              isLoading || (!email && !password) ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {isLoading && (
            <Loader2
              size={18}
              style={{ animation: 'spin 0.8s linear infinite' }}
            />
          )}
          {isLoading ? 'AUTENTICANDO...' : 'ENTRAR NO PAINEL'}
        </button>

        {onBack && (
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              color: '#444',
              fontSize: 12,
              cursor: 'pointer',
              marginTop: 12,
              textDecoration: 'underline',
              fontFamily: "'Inter', sans-serif",
              width: '100%',
              textAlign: 'center',
            }}
          >
            &larr; Voltar sem entrar
          </button>
        )}

        <p
          style={{
            textAlign: 'center',
            fontSize: 11,
            color: '#333',
            marginTop: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <Lock size={10} /> Autenticado via Supabase Auth
        </p>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
