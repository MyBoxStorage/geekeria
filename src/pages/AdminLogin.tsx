import { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

interface AdminLoginProps {
  onLogin: (password: string) => boolean;
  error: string | null;
  onBack?: () => void;
}

export function AdminLogin({ onLogin, error, onBack }: AdminLoginProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const handleSubmit = () => {
    if (!password.trim()) return;
    const success = onLogin(password);
    if (!success) {
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
            'radial-gradient(circle at 50% 0%, #7C3AED15 0%, transparent 60%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          background: '#161616',
          border: '1px solid #2a2a2a',
          borderTop: '3px solid #F59E0B',
          borderRadius: 16,
          padding: '48px 40px',
          width: '100%',
          maxWidth: 400,
          position: 'relative',
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
              color: '#fff',
              marginBottom: 4,
            }}
          >
            GEEKERIA
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
              background: '#7C3AED20',
              border: '2px solid #7C3AED40',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Lock size={22} color="#7C3AED" />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              background: '#cc000015',
              border: '1px solid #cc000040',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 13,
              color: '#ff6b6b',
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        {/* Token field */}
        <div style={{ marginBottom: 20 }}>
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
            Token de Acesso
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="••••••••••••"
              autoFocus
              style={{
                width: '100%',
                padding: '13px 48px 13px 14px',
                background: '#222',
                border: '1.5px solid #333',
                borderRadius: 10,
                color: '#fff',
                fontSize: 16,
                fontFamily: "'Inter', sans-serif",
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <button
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
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!password.trim()}
          style={{
            width: '100%',
            padding: '14px',
            background: password.trim() ? '#7C3AED' : '#1a1a1a',
            color: password.trim() ? '#fff' : '#444',
            border: 'none',
            borderRadius: 10,
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 18,
            letterSpacing: 2,
            cursor: password.trim() ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
          }}
        >
          ENTRAR NO PAINEL
        </button>

        {onBack && (
          <button
            onClick={onBack}
            style={{
              display: 'block',
              margin: '12px auto 0',
              background: 'none',
              border: 'none',
              color: '#444',
              fontSize: 12,
              cursor: 'pointer',
              textDecoration: 'underline',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            &larr; Voltar
          </button>
        )}

        <p
          style={{
            textAlign: 'center',
            fontSize: 11,
            color: '#333',
            marginTop: 24,
          }}
        >
          Acesso restrito &bull; GEEKERIA &copy; 2026
        </p>
      </div>

      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
