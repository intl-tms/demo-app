'use server';

import {refresh} from 'next/cache';
import {cookies} from 'next/headers';
import {EDITOR_ROLE} from '@/editors/identity-provider';
import {EDITOR_SESSION_COOKIE} from '@/editors/sessions';
import {editingSwitch, provider, sessions} from '@/editors';

const secure = (process.env.SITE_URL ?? 'http://localhost:3000').startsWith('https:');

async function currentSessionId() {
  return (await cookies()).get(EDITOR_SESSION_COOKIE)?.value;
}

/** Signs in as a demo account. A real provider's sign-in replaces only this choice of account. */
export async function signInAs(accountId: string) {
  const signedIn = provider.signIn(accountId);
  if (!signedIn) return;
  const session = sessions.start(signedIn);
  const jar = await cookies();
  sessions.end(jar.get(EDITOR_SESSION_COOKIE)?.value);
  jar.set(EDITOR_SESSION_COOKIE, session.id, {
    // Not readable by script, sent only to this site, secure on https. The path
    // covers the pages as well as the endpoints, because marking reads it.
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    expires: session.expires
  });
}

export async function signOut() {
  const jar = await cookies();
  sessions.end(jar.get(EDITOR_SESSION_COOKIE)?.value);
  jar.delete(EDITOR_SESSION_COOKIE);
}

/** Ends the current session at the website but leaves the cookie, as when a session runs out. */
export async function endMySessionNow() {
  sessions.end(await currentSessionId());
  refresh();
}

// What the IT department does in the identity provider. These change no
// cookie, so each asks for the page to be drawn again.

export async function setEditorRole(accountId: string, held: boolean) {
  provider.setRole(accountId, EDITOR_ROLE, held);
  refresh();
}

export async function setAccountDisabled(accountId: string, disabled: boolean) {
  provider.setDisabled(accountId, disabled);
  refresh();
}

// The emergency stop.

export async function endSessionsOf(accountId: string) {
  sessions.endAllOf(accountId);
  refresh();
}

export async function setEditing(on: boolean) {
  editingSwitch.set(on);
  refresh();
}
