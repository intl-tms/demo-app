// The login for Editors: its own session, its own cookie, its own settings,
// separate from any login the website has for its customers. A customer
// session never authorizes editing.
//
// This is the shape of the recipe: sessions are kept in a store (so one
// Editor's sessions can be ended at once), last at most 10 hours from sign-in
// however active the Editor is, and the account and its roles are checked with
// the identity provider again at a fixed interval. A real setup keeps the store
// in its database; the demo keeps it in memory.

import type {IdentityProvider} from './identity-provider';

/** The Editors' session cookie. Never the name of a customer login's cookie. */
export const EDITOR_SESSION_COOKIE = 'tms-editor-session';

/** A session ends this long after sign-in, however active the Editor is: a working day with margin. */
export const SESSION_LIFETIME_MS = 10 * 60 * 60 * 1000;

/**
 * How often the account and its roles are checked with the identity provider.
 * The recipe uses one hour, which bounds how long a withdrawn Editor keeps
 * access. The demo checks every minute, so withdrawing the role on the access
 * page can be seen without waiting an hour.
 */
export const RECHECK_INTERVAL_MS = 60 * 1000;

export type EditorUser = {id: string; name: string; roles: string[]};

type SessionRecord = {
  user: EditorUser;
  signedInAt: number;
  checkedAt: number;
};

export type EditorSessions = ReturnType<typeof createEditorSessions>;

export function createEditorSessions(options: {
  provider: IdentityProvider;
  now?: () => number;
  lifetimeMs?: number;
  recheckEveryMs?: number;
}) {
  const {provider} = options;
  const now = options.now ?? Date.now;
  const lifetime = options.lifetimeMs ?? SESSION_LIFETIME_MS;
  const recheckEvery = options.recheckEveryMs ?? RECHECK_INTERVAL_MS;
  const store = new Map<string, SessionRecord>();

  const newSessionId = () => {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    return Buffer.from(bytes).toString('base64url');
  };

  return {
    /**
     * Signs an account in with the identity provider and starts a session.
     * The answer is the session's identifier, for the cookie, or nothing when
     * the provider refused.
     */
    signIn(accountId: string) {
      const user = provider.signIn(accountId);
      if (!user) return undefined;
      const id = newSessionId();
      const at = now();
      store.set(id, {user, signedInAt: at, checkedAt: at});
      return {id, expires: new Date(at + lifetime)};
    },

    /**
     * The Editor a session belongs to, or nothing. A session older than its
     * lifetime ends. Once the re-check interval has passed, the account is
     * checked with the provider again: a disabled account ends the session,
     * and the roles are replaced by the provider's current ones.
     */
    user(sessionId: string | undefined): EditorUser | undefined {
      if (sessionId === undefined) return undefined;
      const session = store.get(sessionId);
      if (!session) return undefined;
      const at = now();
      if (at - session.signedInAt >= lifetime) {
        store.delete(sessionId);
        return undefined;
      }
      if (at - session.checkedAt >= recheckEvery) {
        const current = provider.recheck(session.user.id);
        if (!current.active) {
          store.delete(sessionId);
          return undefined;
        }
        session.user = {...session.user, roles: current.roles};
        session.checkedAt = at;
      }
      return {...session.user, roles: [...session.user.roles]};
    },

    /** Ends one session: signing out. */
    end(sessionId: string | undefined) {
      if (sessionId !== undefined) store.delete(sessionId);
    },

    /** Ends every session of one account at once: the emergency stop for one Editor. */
    endAllOf(accountId: string) {
      for (const [id, session] of store) if (session.user.id === accountId) store.delete(id);
    },

    /** How many sessions an account has, for the access page. */
    countOf(accountId: string) {
      let count = 0;
      for (const session of store.values()) if (session.user.id === accountId) count++;
      return count;
    }
  };
}

/** The value of one cookie in a `Cookie` header. */
export function cookieFrom(header: string | null, name: string) {
  for (const pair of (header ?? '').split(';')) {
    const at = pair.indexOf('=');
    if (at !== -1 && pair.slice(0, at).trim() === name) return pair.slice(at + 1).trim();
  }
  return undefined;
}
