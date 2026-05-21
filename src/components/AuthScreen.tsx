import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Btn } from './ui';

/**
 * Helsides-login som visas när användaren inte är inloggad.
 * Stilen matchar app-shell:ens estetik (svart bakgrund + gold accent).
 */
export function AuthScreen() {
  const { signIn } = useAuth();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState<string | null>(null);
  const [busy,     setBusy]     = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error: err } = await signIn(email.trim(), password);
    setBusy(false);
    if (err) {
      setError(translateAuthError(err));
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'var(--bg)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '380px',
        textAlign: 'center',
      }}>
        <p style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: '36px',
          fontWeight: 500,
          color: 'var(--gold)',
          margin: 0,
        }}>Costa Sol</p>
        <p className="text-mute" style={{ fontSize: '13px', letterSpacing: '2px',
                                          textTransform: 'uppercase', marginTop: '4px' }}>
          Fastighetsportfölj
        </p>

        <form onSubmit={handleSubmit} style={{
          marginTop: '40px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          textAlign: 'left',
        }}>
          <div>
            <label className="form-label" style={{ display: 'block', marginBottom: '6px' }}>E-mail</label>
            <input
              type="email"
              autoComplete="email"
              className="form-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="form-label" style={{ display: 'block', marginBottom: '6px' }}>Lösenord</label>
            <input
              type="password"
              autoComplete="current-password"
              className="form-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p style={{
              padding: '10px 12px',
              background: 'var(--red)15',
              border: '1px solid var(--red)40',
              borderRadius: '6px',
              color: 'var(--red)',
              fontSize: '13px',
              margin: 0,
            }}>
              {error}
            </p>
          )}

          <Btn type="submit" variant="primary" disabled={busy || !email || !password}>
            {busy ? 'Loggar in…' : 'Logga in'}
          </Btn>
        </form>

        <p className="text-mute" style={{ fontSize: '12px', marginTop: '32px' }}>
          Glömt lösenordet? Återställ via Supabase Dashboard → Authentication.
        </p>
      </div>
    </div>
  );
}

/** Översätt vanliga Supabase-fel till svenska. */
function translateAuthError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Fel e-mail eller lösenord.';
  if (m.includes('email not confirmed'))       return 'E-mailen är inte bekräftad än. Kolla din inkorg.';
  if (m.includes('rate limit'))                return 'För många försök — vänta en stund och prova igen.';
  return msg;
}
