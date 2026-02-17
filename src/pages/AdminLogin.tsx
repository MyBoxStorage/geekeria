import { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

interface AdminLoginProps {
  onLogin: (password: string) => boolean;
}

export function AdminLogin({ onLogin }: AdminLoginProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  const handleSubmit = () => {
    if (!password) return;
    const success = onLogin(password);
    if (!success) {
      setError('Senha incorreta. Tente novamente.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 600);
      setPassword('');
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
                setError('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="••••••••••••"
              autoFocus
              style={{
                width: '100%',
                padding: '14px 48px 14px 16px',
                background: '#222',
                border: `1.5px solid ${error ? '#cc0000' : '#333'}`,
                borderRadius: 10,
                color: '#fff',
                fontSize: 16,
                fontFamily: "'Inter', sans-serif",
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
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
          {error && (
            <p style={{ fontSize: 12, color: '#cc0000', marginTop: 6 }}>
              {error}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!password}
          style={{
            width: '100%',
            padding: '14px',
            background: password ? '#00843D' : '#1a1a1a',
            color: password ? '#fff' : '#444',
            border: 'none',
            borderRadius: 10,
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 18,
            letterSpacing: 2,
            cursor: password ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
          }}
        >
          ENTRAR NO PAINEL
        </button>

        <p
          style={{
            textAlign: 'center',
            fontSize: 11,
            color: '#333',
            marginTop: 24,
          }}
        >
          Acesso restrito &bull; Bravos Brasil &copy; 2026
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
      `}</style>
    </div>
  );
}
