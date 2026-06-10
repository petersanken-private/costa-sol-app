// ── localStorage-nyckelmigrering ──────────────────────────────────────────────
//
// Varumärket bytte namn från "Costa Sol" till "Costa del Sol". Nycklarna gick
// från prefix `costa-sol:` → `costa-del-sol:`. Den här engångsmigreringen kopierar
// befintliga värden till de nya nycklarna så att inloggade användare INTE tappar
// inställningar (valuta, prognos) eller — viktigast — seed-flaggan
// (`seeded-v1`). Utan migrering hade en saknad seed-flagga kunnat trigga
// återinsättning av seed-data i Supabase.
//
// Körs en gång vid app-start (main.tsx), före render. Idempotent.

const OLD_PREFIX = 'costa-sol:';
const NEW_PREFIX = 'costa-del-sol:';

export function migrateLegacyStorageKeys(): void {
  try {
    if (typeof localStorage === 'undefined') return;

    // Samla först (muterar inte localStorage under iteration).
    const oldKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(OLD_PREFIX)) oldKeys.push(key);
    }

    for (const oldKey of oldKeys) {
      const newKey = NEW_PREFIX + oldKey.slice(OLD_PREFIX.length);
      // Skriv bara över om den nya nyckeln saknas — annars vinner ny data.
      if (localStorage.getItem(newKey) === null) {
        const value = localStorage.getItem(oldKey);
        if (value !== null) localStorage.setItem(newKey, value);
      }
      localStorage.removeItem(oldKey);
    }
  } catch {
    // Private mode / blockerad storage — ignorera tyst.
  }
}
