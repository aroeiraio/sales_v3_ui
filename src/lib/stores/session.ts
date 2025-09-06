import { writable, derived } from 'svelte/store';
import type { Session } from '../services/session';

// Session store
export const session = writable<Session | null>(null);

// Derived stores
export const isAuthenticated = derived(session, ($session) => 
  $session !== null && $session.isActive
);

export const sessionId = derived(session, ($session) => 
  $session?.sessionId || null
);

export const sessionExpiresAt = derived(session, ($session) => 
  $session ? new Date($session.expiresAt) : null
);

export const timeUntilExpiry = derived(session, ($session) => {
  if (!$session) return 0;
  
  const now = Date.now();
  const expiresAt = new Date($session.expiresAt).getTime();
  return Math.max(0, expiresAt - now);
});

// Session actions
export const sessionActions = {
  setSession: (newSession: Session | null) => {
    session.set(newSession);
  },

  updateSession: (updates: Partial<Session>) => {
    session.update($session => {
      if (!$session) return null;
      return { ...$session, ...updates };
    });
  },

  clearSession: () => {
    session.set(null);
  },

  extendSession: (newExpiresAt: string) => {
    session.update($session => {
      if (!$session) return null;
      return { ...$session, expiresAt: newExpiresAt };
    });
  }
};