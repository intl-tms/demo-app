// The recipe for a login for Editors, run against the stand-in identity
// provider: what a real provider would do, without an account with one.

import {
  createHandler,
  createMemoryAdapter,
  isEditingRequest,
  resolveConfig,
  type StorageAdapter,
  type StorageContext
} from '@intl-tms/core';
import {describe, expect, it} from 'vitest';
import {createEditorCheck} from './check';
import {createIdentityProvider, EDITOR_ROLE} from './identity-provider';
import {createEditorSessions, EDITOR_SESSION_COOKIE, RECHECK_INTERVAL_MS, SESSION_LIFETIME_MS} from './sessions';

const SITE = 'http://localhost:3000';
const config = resolveConfig({locales: ['en', 'da'], basePath: `${SITE}/api/tms`, sourceLocale: 'en'});

function demo() {
  let time = Date.parse('2026-10-29T08:00:00Z');
  const provider = createIdentityProvider();
  const sessions = createEditorSessions({provider, now: () => time});
  const editing = {on: true};
  const authorize = createEditorCheck({sessions, editingOn: () => editing.on});
  const saved: StorageContext[] = [];
  const memory = createMemoryAdapter();
  const adapter: StorageAdapter = {
    ...memory,
    saveValue: (key, write, context) => (saved.push(context ?? {}), memory.saveValue(key, write))
  };
  const handler = createHandler({config, adapter, authorize});
  const signIn = (accountId: string) => `${EDITOR_SESSION_COOKIE}=${sessions.signIn(accountId)!.id}`;
  const read = (cookie?: string) =>
    handler(new Request(`${SITE}/api/tms/keys/home.title`, {headers: cookie ? {cookie} : {}}));
  const save = (cookie: string) =>
    handler(
      new Request(`${SITE}/api/tms/keys/home.title`, {
        method: 'PUT',
        headers: {cookie, 'content-type': 'application/json', origin: SITE},
        body: JSON.stringify({locale: 'da', value: 'Hej'})
      })
    );
  const page = (cookie: string) => isEditingRequest(new Request(`${SITE}/da`, {headers: {cookie: `tms-edit=1; ${cookie}`}}), authorize);
  return {provider, sessions, editing, saved, signIn, read, save, page, advance: (ms: number) => (time += ms)};
}

describe('the login for Editors', () => {
  it('nobody signed in is refused with 401 and told where to sign in', async () => {
    const response = await demo().read();
    expect(response.status).toBe(401);
    expect((await response.json()).auth.session.signIn).toBe(`${SITE}/editors/sign-in`);
  });

  it('a customer session does not authorize editing', async () => {
    expect((await demo().read('customer-session=abc')).status).toBe(401);
  });

  it('signed in with the Editor role, an Editor reads and saves', async () => {
    const {signIn, read, save} = demo();
    const cookie = signIn('ada');
    expect([(await read(cookie)).status, (await save(cookie)).status]).toEqual([200, 200]);
  });

  it('a guest user from a translation agency with the role reads and saves', async () => {
    const {signIn, save} = demo();
    expect((await save(signIn('lin'))).status).toBe(200);
  });

  it('a save is passed who made it', async () => {
    const {signIn, save, saved} = demo();
    await save(signIn('ada'));
    expect(saved).toEqual([{identity: {id: 'ada', name: 'Ada Jensen'}}]);
  });

  it('signed in without the role, an employee is refused with 403 and the help text', async () => {
    const {signIn, read} = demo();
    const response = await read(signIn('sam'));
    expect(response.status).toBe(403);
    expect((await response.json()).help).toContain('Editor role');
  });

  it('a disabled account cannot sign in', () => {
    const {provider, sessions} = demo();
    provider.setDisabled('ada', true);
    expect(sessions.signIn('ada')).toBeUndefined();
  });
});

describe('the re-check', () => {
  it('a withdrawn role still works until the next re-check', async () => {
    const {provider, signIn, read, advance} = demo();
    const cookie = signIn('ada');
    provider.setRole('ada', EDITOR_ROLE, false);
    advance(RECHECK_INTERVAL_MS - 1);
    expect((await read(cookie)).status).toBe(200);
  });

  it('a withdrawn role is refused at the next re-check', async () => {
    const {provider, signIn, read, advance} = demo();
    const cookie = signIn('ada');
    provider.setRole('ada', EDITOR_ROLE, false);
    advance(RECHECK_INTERVAL_MS);
    expect((await read(cookie)).status).toBe(403);
  });

  it('a role given back is accepted at the next re-check', async () => {
    const {provider, signIn, read, advance} = demo();
    const cookie = signIn('sam');
    provider.setRole('sam', EDITOR_ROLE, true);
    advance(RECHECK_INTERVAL_MS);
    expect((await read(cookie)).status).toBe(200);
  });

  it('a disabled account ends the session at the next re-check', async () => {
    const {provider, signIn, read, advance} = demo();
    const cookie = signIn('ada');
    provider.setDisabled('ada', true);
    advance(RECHECK_INTERVAL_MS);
    expect((await read(cookie)).status).toBe(401);
  });

  it('the recipe re-checks every hour; the demo every minute', () => {
    expect(RECHECK_INTERVAL_MS).toBeLessThanOrEqual(60 * 60 * 1000);
  });
});

describe('the session lifetime', () => {
  it('a session works until 10 hours after sign-in', async () => {
    const {signIn, read, advance} = demo();
    const cookie = signIn('ada');
    advance(SESSION_LIFETIME_MS - 1);
    expect((await read(cookie)).status).toBe(200);
  });

  it('a session older than 10 hours is refused, however active the Editor was', async () => {
    const {signIn, read, advance} = demo();
    const cookie = signIn('ada');
    for (let hour = 0; hour < 10; hour++) {
      advance(60 * 60 * 1000);
      await read(cookie);
    }
    expect((await read(cookie)).status).toBe(401);
  });

  it('is 10 hours', () => {
    expect(SESSION_LIFETIME_MS).toBe(10 * 60 * 60 * 1000);
  });
});

describe('the emergency stop', () => {
  it("ending an account's sessions refuses that Editor's next request", async () => {
    const {sessions, signIn, read} = demo();
    const first = signIn('ada');
    const second = signIn('ada');
    const other = signIn('lin');
    sessions.endAllOf('ada');
    expect([(await read(first)).status, (await read(second)).status, (await read(other)).status]).toEqual([401, 401, 200]);
  });

  it('switching editing off refuses every request', async () => {
    const {editing, signIn, read} = demo();
    const cookie = signIn('ada');
    editing.on = false;
    expect((await read(cookie)).status).toBe(403);
  });

  it('switching editing off marks no page', async () => {
    const {editing, signIn, page} = demo();
    const cookie = signIn('ada');
    editing.on = false;
    expect(await page(cookie)).toBe(false);
  });
});

describe('marking pages', () => {
  it('an Editor who sets the Toggle gets marked pages', async () => {
    const {signIn, page} = demo();
    expect(await page(signIn('ada'))).toBe(true);
  });

  it('a visitor who sets the Toggle gets unmarked pages', async () => {
    expect(await demo().page('customer-session=abc')).toBe(false);
  });

  it('an employee without the role who sets the Toggle gets unmarked pages', async () => {
    const {signIn, page} = demo();
    expect(await page(signIn('sam'))).toBe(false);
  });
});
