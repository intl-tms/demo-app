import {connection} from 'next/server';
import {Suspense} from 'react';
import {editingSwitch, provider, sessions} from '@/editors';
import {EDITOR_ROLE} from '@/editors/identity-provider';
import {RECHECK_INTERVAL_MS} from '@/editors/sessions';
import {endMySessionNow, endSessionsOf, setAccountDisabled, setEditing, setEditorRole} from '../actions';
import {button, CurrentEditor, FakeNotice, Nav} from '../parts';

// The demo's IT department. A real organisation does this in its identity
// provider (giving and withdrawing the role, disabling accounts) and in the
// website's own administration (the emergency stop).
export default function AccessPage() {
  return (
    <>
      <Nav />
      <h1 className="text-2xl font-semibold">Access</h1>
      <FakeNotice>Anyone can change any account here. This page plays the IT department.</FakeNotice>
      <Suspense fallback={<p className="text-sm">…</p>}>
        <Access />
      </Suspense>
    </>
  );
}

async function Access() {
  // The accounts and the switch live in memory: read them on every request.
  await connection();
  const minutes = RECHECK_INTERVAL_MS / 60_000;
  return (
    <>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Accounts in the identity provider</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          A change here reaches a signed-in Editor at the next re-check, within {minutes} minute{minutes === 1 ? '' : 's'} in
          this demo (within the hour on a real website).
        </p>
        <ul className="flex flex-col gap-3">
          {provider.accounts().map((account) => {
            const editor = account.roles.includes(EDITOR_ROLE);
            const count = sessions.countOf(account.id);
            return (
              <li key={account.id} className="flex flex-col gap-2 rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
                <div>
                  <div className="font-medium">{account.name}</div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    {editor ? 'Holds the Editor role.' : 'Does not hold the Editor role.'}{' '}
                    {account.disabled ? 'Disabled.' : 'Active.'} {count} session{count === 1 ? '' : 's'}.
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <form action={setEditorRole.bind(null, account.id, !editor)}>
                    <button type="submit" className={button}>{editor ? 'Withdraw the Editor role' : 'Give the Editor role'}</button>
                  </form>
                  <form action={setAccountDisabled.bind(null, account.id, !account.disabled)}>
                    <button type="submit" className={button}>{account.disabled ? 'Enable the account' : 'Disable the account'}</button>
                  </form>
                  <form action={endSessionsOf.bind(null, account.id)}>
                    <button type="submit" className={button} disabled={count === 0}>End all sessions now</button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Emergency stop</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {editingSwitch.isOn()
            ? 'Editing is on.'
            : 'Editing is off: every request is refused and no page is marked.'}
        </p>
        <form action={setEditing.bind(null, !editingSwitch.isOn())}>
          <button type="submit" className={button}>{editingSwitch.isOn() ? 'Switch all editing off' : 'Switch editing on'}</button>
        </form>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">This browser</h2>
        <CurrentEditor />
        <form action={endMySessionNow}>
          <button type="submit" className={button}>End my session now</button>
        </form>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Ends the session at the website as if its 10 hours had run out, so you can see what an Editor sees mid-edit.
        </p>
      </section>
    </>
  );
}
