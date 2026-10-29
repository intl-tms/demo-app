// Who may read and save translations: someone signed in to the login for
// Editors who holds the Editor role, while editing is switched on.

import {sessionCheck} from '@intl-tms/core';
import {EDITOR_ROLE} from './identity-provider';
import {cookieFrom, EDITOR_SESSION_COOKIE, type EditorSessions} from './sessions';

/** Where the Extension sends an Editor who is not signed in. */
export const SIGN_IN_PATH = '/editors/sign-in';

export function createEditorCheck(options: {
  sessions: EditorSessions;
  /** The editing switch, read on every request. Off, every request is refused and no page is marked. */
  editingOn: () => boolean;
}) {
  return sessionCheck({
    // Only the Editors' session is read, never a customer login's.
    user: (request) => options.sessions.user(cookieFrom(request.headers.get('cookie'), EDITOR_SESSION_COOKIE)),
    may: (user) => options.editingOn() && user.roles.includes(EDITOR_ROLE),
    signIn: SIGN_IN_PATH,
    help: {
      unauthenticated: 'Sign in with a demo account. Anyone can pick any account: this demo has no real login.',
      forbidden: 'On the demo access page, /editors/access, give your account the Editor role and check that editing is on.'
    }
  });
}
