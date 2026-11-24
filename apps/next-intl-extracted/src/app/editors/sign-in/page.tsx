import {connection} from 'next/server';
import {Suspense} from 'react';
import {provider} from '@/editors';
import {signInAs} from '../actions';
import {CurrentEditor, FakeNotice, Nav, primaryButton} from '../parts';

type Search = Promise<{return?: string | string[]}>;

// The sign-in page of the login for Editors. On a real website this is the
// sign-in method the organisation has set up; the demo lists its stand-in
// accounts instead. Storybook's sign-in pop-up sends the Editor here with a
// way back to it, which signing in follows.
export default function SignInPage({searchParams}: {searchParams: Search}) {
  return (
    <>
        <Nav />
        <h1 className="text-2xl font-semibold">Sign in to edit translations</h1>
        <FakeNotice>
          Anyone can pick any account below, with no password. On a real website, Editors sign in with
          whatever sign-in method their organisation has set up.
        </FakeNotice>
        <Suspense fallback={<p className="text-sm">…</p>}>
          <CurrentEditor />
          <Accounts searchParams={searchParams} />
        </Suspense>
    </>
  );
}

async function Accounts({searchParams}: {searchParams: Search}) {
  // The accounts live in memory: read them on every request.
  await connection();
  const back = (await searchParams).return;
  const returnTo = typeof back === 'string' ? back : undefined;
  return (
    <>
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
            <form action={signInAs.bind(null, account.id, returnTo)}>
              <button type="submit" className={primaryButton} disabled={account.disabled}>
                Sign in
              </button>
            </form>
          </li>
        ))}
      </ul>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {returnTo === undefined
          ? 'After signing in, go back to the tab you were editing in. The extension notices by itself.'
          : 'After signing in, this window goes back to Storybook’s sign-in and closes by itself.'}
      </p>
    </>
  );
}
