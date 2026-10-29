// The recipe for a login for Editors, run against the stand-in identity
// provider: what a real provider would do, without an account with one.

import {
  createHandler,
  createMemoryAdapter,
  EDITING_TOKEN_HEADER,
  isEditingRequest,
  resolveConfig,
  type StorageAdapter,
  type StorageContext
} from '@intl-tms/core';
import {describe, expect, it} from 'vitest';
import {createEditorCheck} from './check';
import {createIdentityProvider, EDITOR_ROLE} from './identity-provider';
import {createEditorPairing} from './pairing';
import {createEditorSessions, EDITOR_SESSION_COOKIE, RECHECK_INTERVAL_MS, SESSION_LIFETIME_MS} from './sessions';

const SITE = 'http://localhost:3000';
const config = resolveConfig({locales: ['en', 'da'], basePath: `${SITE}/api/tms`, sourceLocale: 'en'});
const STORYBOOK = 'http://localhost:6006';

function demo() {
  let time = Date.parse('2026-10-29T08:00:00Z');
  const provider = createIdentityProvider();
  const sessions = createEditorSessions({provider, now: () => time});
  const pairing = createEditorPairing({provider, sessions, now: () => time});
  const editing = {on: true};
  const authorize = createEditorCheck({sessions, pairing, editingOn: () => editing.on});
  const saved: StorageContext[] = [];
  const memory = createMemoryAdapter();
  const adapter: StorageAdapter = {
    ...memory,
    saveValue: (key, write, context) => (saved.push(context ?? {}), memory.saveValue(key, write))
  };
  const handler = createHandler({config, adapter, authorize, pairing, cors: {origins: [STORYBOOK]}});
  const signIn = (accountId: string) => `${EDITOR_SESSION_COOKIE}=${sessions.start(provider.signIn(accountId)!).id}`;
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
  /** The workbench signing in: the pop-up with the browser's session for the website, then the exchange. */
  const pairFrom = async (cookie?: string) => {
    const proof = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64url');
    const challenge = Buffer.from(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(proof))).toString('base64url');
    const popUp = await handler(
      new Request(`${SITE}/api/tms/pair?origin=${encodeURIComponent(STORYBOOK)}&challenge=${challenge}`, {headers: cookie ? {cookie} : {}})
    );
    const code = /"code":"([\w-]+)"/.exec(await popUp.text())?.[1];
    if (code === undefined) return {popUp};
    const exchanged = await handler(
      new Request(`${SITE}/api/tms/pair/token`, {
        method: 'POST',
        headers: {origin: STORYBOOK, 'content-type': 'application/json'},
        body: JSON.stringify({code, proof})
      })
    );
    return {popUp, token: (await exchanged.json()).token as string};
  };
  /** A save from the workbench, with its token and from its origin. */
  const saveFromWorkbench = (token: string) =>
    handler(
      new Request(`${SITE}/api/tms/keys/home.title`, {
        method: 'PUT',
        headers: {[EDITING_TOKEN_HEADER]: token, 'content-type': 'application/json', origin: STORYBOOK},
        body: JSON.stringify({locale: 'da', value: 'Hej'})
      })
    );
  return {
    provider,
    sessions,
    pairing,
    editing,
    saved,
    signIn,
    read,
    save,
    page,
    pairFrom,
    saveFromWorkbench,
    advance: (ms: number) => (time += ms)
  };
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
    const {provider} = demo();
    provider.setDisabled('ada', true);
    expect(provider.signIn('ada')).toBeUndefined();
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

describe('the workbench signs in with the pop-up', () => {
  it('the pop-up sends someone not signed in to the sign-in page, with the pop-up as the way back', async () => {
    const {popUp} = await demo().pairFrom();
    expect(popUp.status).toBe(303);
    const location = new URL(popUp.headers.get('location')!);
    expect(location.pathname).toBe('/editors/sign-in');
    expect(location.searchParams.get('return')).toMatch(/^\/api\/tms\/pair\?origin=/);
  });

  it('an Editor signed in to the website saves from the workbench, as themselves', async () => {
    const {signIn, pairFrom, saveFromWorkbench, saved} = demo();
    const {token} = await pairFrom(signIn('ada'));
    expect((await saveFromWorkbench(token!)).status).toBe(200);
    expect(saved).toEqual([{identity: {id: 'ada', name: 'Ada Jensen'}}]);
  });

  it('an employee without the role is told so in the pop-up and gets no token', async () => {
    const {signIn, pairFrom} = demo();
    const {popUp, token} = await pairFrom(signIn('sam'));
    expect([popUp.status, token]).toEqual([403, undefined]);
  });

  it('a withdrawn role is refused at the next re-check', async () => {
    const {provider, signIn, pairFrom, saveFromWorkbench, advance} = demo();
    const {token} = await pairFrom(signIn('ada'));
    provider.setRole('ada', EDITOR_ROLE, false);
    expect((await saveFromWorkbench(token!)).status).toBe(200);
    advance(RECHECK_INTERVAL_MS);
    expect((await saveFromWorkbench(token!)).status).toBe(403);
  });

  it('a disabled account ends the token at the next re-check', async () => {
    const {provider, signIn, pairFrom, saveFromWorkbench, advance} = demo();
    const {token} = await pairFrom(signIn('ada'));
    provider.setDisabled('ada', true);
    advance(RECHECK_INTERVAL_MS);
    expect((await saveFromWorkbench(token!)).status).toBe(401);
  });

  it('a token ends 10 hours after the sign-in it came from', async () => {
    const {signIn, pairFrom, saveFromWorkbench, advance} = demo();
    const cookie = signIn('ada');
    advance(SESSION_LIFETIME_MS - 60 * 1000);
    const {token} = await pairFrom(cookie);
    expect((await saveFromWorkbench(token!)).status).toBe(200);
    advance(60 * 1000);
    expect((await saveFromWorkbench(token!)).status).toBe(401);
  });

  it("ending an account's sign-ins refuses its workbench too", async () => {
    const {signIn, pairing, pairFrom, saveFromWorkbench} = demo();
    const {token} = await pairFrom(signIn('ada'));
    await pairing.endAllOf('ada');
    expect((await saveFromWorkbench(token!)).status).toBe(401);
  });

  it('switching editing off refuses the workbench', async () => {
    const {editing, signIn, pairFrom, saveFromWorkbench} = demo();
    const {token} = await pairFrom(signIn('ada'));
    editing.on = false;
    expect((await saveFromWorkbench(token!)).status).toBe(403);
  });
});
