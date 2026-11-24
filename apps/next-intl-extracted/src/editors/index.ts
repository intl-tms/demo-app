// The demo's one identity provider, session store and editing switch. Kept on
// the global object so the pages and the route handler, which Next.js bundles
// separately, and a development reload all share the same ones.

import {createEditorCheck} from './check';
import {createIdentityProvider, type StandInProvider} from './identity-provider';
import {createEditorPairing, type EditorPairing} from './pairing';
import {createEditorSessions, type EditorSessions} from './sessions';
import {editingEnabled} from '@/tms/config';

type Shared = {provider: StandInProvider; sessions: EditorSessions; pairing: EditorPairing; editing: {on: boolean}};

const global = globalThis as {tmsEditors?: Shared};

function shared(): Shared {
  if (!global.tmsEditors) {
    const provider = createIdentityProvider();
    const sessions = createEditorSessions({provider});
    global.tmsEditors = {provider, sessions, pairing: createEditorPairing({provider, sessions}), editing: {on: true}};
  }
  return global.tmsEditors;
}

export const provider = shared().provider;
export const sessions = shared().sessions;
export const pairing = shared().pairing;

/** Ends every session and every Storybook sign-in of one account: the emergency stop for one Editor. */
export async function endAllOf(accountId: string) {
  sessions.endAllOf(accountId);
  await pairing.endAllOf(accountId);
}

/**
 * The editing switch: a stored setting that can be changed without a deploy,
 * to stop all editing at once. A real website keeps it in its database; the
 * demo keeps it in memory, and the deployment switch `editingEnabled` still
 * has to be on as well.
 */
export const editingSwitch = {
  isOn: () => editingEnabled && shared().editing.on,
  set: (on: boolean) => {
    shared().editing.on = on;
  }
};

export const authorize = createEditorCheck({sessions, pairing, editingOn: editingSwitch.isOn});
