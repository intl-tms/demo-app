// Signing in from Storybook. Storybook runs on another origin and usually on
// another site, where the Editors' session cookie does not travel, so it signs
// in through a pop-up on this website's login and gets a short-lived editing
// token instead. The Core issues and checks the tokens; this file gives it the
// three things only the website knows: where its sign-in page is, who is
// signed in on a request, and how to check that account again.

import {createMemoryPairingStore, createPairing} from '@intl-tms/core';
import {SIGN_IN_PATH} from './check';
import type {StandInProvider} from './identity-provider';
import {cookieFrom, EDITOR_SESSION_COOKIE, RECHECK_INTERVAL_MS, type EditorSessions, type EditorUser} from './sessions';

export function createEditorPairing(options: {provider: StandInProvider; sessions: EditorSessions; now?: () => number}) {
  const {provider, sessions} = options;
  // A real website keeps the records in its database, so they survive a
  // restart and are shared between servers.
  const store = createMemoryPairingStore<EditorUser>();
  const pairing = createPairing<EditorUser>({
    store,
    // The sign-in page sends the Editor back to the pop-up afterwards.
    signIn: (returnTo) => `${SIGN_IN_PATH}?return=${encodeURIComponent(returnTo)}`,
    // Only the Editors' session is read, never a customer login's.
    session: (request) => sessions.forPairing(cookieFrom(request.headers.get('cookie'), EDITOR_SESSION_COOKIE)),
    // The same re-check the sessions use.
    recheck: async (user, grant) => {
      const current = await provider.recheck(grant);
      return current.active ? {active: true, user: {...user, roles: current.roles}, grant: current.grant} : {active: false};
    },
    // The same interval as the sessions: one minute in the demo, one hour in the recipe.
    recheckEveryMs: RECHECK_INTERVAL_MS,
    ...(options.now === undefined ? {} : {now: options.now})
  });
  return Object.assign(pairing, {
    /** How many Storybook sign-ins an account has, for the access page. */
    countOf: (accountId: string) => store.records().filter((record) => record.kind === 'token' && record.user.id === accountId).length
  });
}

export type EditorPairing = ReturnType<typeof createEditorPairing>;
