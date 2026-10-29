import {connection} from 'next/server';
import {Suspense} from 'react';
import {provider} from '@/editors';
import {signInAs} from '../actions';
import {CurrentEditor, FakeNotice, Nav, primaryButton} from '../parts';

// The sign-in page of the login for Editors. With a real identity provider
// this is one "Sign in with Microsoft" button; the demo lists its stand-in
// accounts instead.
export default function SignInPage() {
  return (
    <>
      <Nav />
      <h1 className="text-2xl font-semibold">Sign in to edit translations</h1>
      <FakeNotice>
        Anyone can pick any account below, with no password. A real website signs Editors in with the
        organisation&apos;s identity provider, such as Microsoft.
      </FakeNotice>
      <Suspense fallback={<p className="text-sm">…</p>}>
        <CurrentEditor />
        <Accounts />
      </Suspense>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        After signing in, go back to the tab you were editing in. The extension notices by itself.
      </p>
    </>
  );
}

async function Accounts() {
  // The accounts live in memory: read them on every request.
  await connection();
  return (
    <ul className="flex flex-col gap-3">
      {provider.accounts().map((account) => (
        <li key={account.id} className="flex items-center justify-between gap-4 rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
          <div>
            <div className="font-medium">{account.name}</div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              {account.description}
              {account.disabled ? ' The account is disabled.' : ''}
            </div>
          </div>
          <form action={signInAs.bind(null, account.id)}>
            <button type="submit" className={primaryButton} disabled={account.disabled}>
              Sign in
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}
