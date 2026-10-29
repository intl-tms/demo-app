import {cookies} from 'next/headers';
import Link from 'next/link';
import type {ReactNode} from 'react';
import {sessions} from '@/editors';
import {EDITOR_ROLE} from '@/editors/identity-provider';
import {EDITOR_SESSION_COOKIE} from '@/editors/sessions';
import {signOut} from './actions';

export const button =
  'rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800';
export const primaryButton =
  'rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300';

export function FakeNotice({children}: {children: ReactNode}) {
  return (
    <p role="note" className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
      <strong>Not a real login.</strong> {children} Run this demo on your own computer only.
    </p>
  );
}

export function Nav() {
  return (
    <nav className="flex gap-4 text-sm text-zinc-600 dark:text-zinc-400">
      <Link className="underline" href="/editors/sign-in">Sign in</Link>
      <Link className="underline" href="/editors/access">Access (IT department)</Link>
      <Link className="underline" href="/">The website</Link>
    </nav>
  );
}

/** Who is signed in to the login for Editors in this browser. */
export async function CurrentEditor() {
  const user = sessions.user((await cookies()).get(EDITOR_SESSION_COOKIE)?.value);
  if (!user) return <p className="text-sm">Not signed in.</p>;
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <span>
        Signed in as <strong>{user.name}</strong>
        {user.roles.includes(EDITOR_ROLE) ? ', with the Editor role.' : ', without the Editor role.'}
      </span>
      <form action={signOut}>
        <button type="submit" className={button}>Sign out</button>
      </form>
    </div>
  );
}
