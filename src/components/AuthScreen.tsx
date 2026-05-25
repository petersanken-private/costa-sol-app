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
    <div className="min-h-screen flex items-center justify-center p-6 bg-bg">
      <div className="w-full max-w-[380px] text-center">
        <p className="font-display text-[36px] font-medium text-gold m-0">Costa Sol</p>
        <p className="text-text-mute text-[13px] tracking-[2px] uppercase mt-1">Fastighetsportfölj</p>

        <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-3.5 text-left">
          <div>
            <label className="form-label block mb-1.5">E-mail</label>
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
            <label className="form-label block mb-1.5">Lösenord</label>
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
            <p className="px-3 py-2.5 bg-red/10 border border-red/40 rounded-md text-red text-[13px] m-0">
              {error}
            </p>
          )}

          <Btn type="submit" variant="primary" disabled={busy || !email || !password}>
            {busy ? 'Loggar in…' : 'Logga in'}
          </Btn>
        </form>

        <p className="text-text-mute text-[12px] mt-8">
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
