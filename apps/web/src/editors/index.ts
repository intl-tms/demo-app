// The demo's one identity provider, session store and editing switch. Kept on
// the global object so the pages and the route handler, which Next.js bundles
// separately, and a development reload all share the same ones.

import {createEditorCheck} from './check';
import {createIdentityProvider, type IdentityProvider} from './identity-provider';
import {createEditorSessions, type EditorSessions} from './sessions';
import {editingEnabled} from '@/tms/config';

type Shared = {provider: IdentityProvider; sessions: EditorSessions; editing: {on: boolean}};

const global = globalThis as {tmsEditors?: Shared};

function shared(): Shared {
  if (!global.tmsEditors) {
    const provider = createIdentityProvider();
    global.tmsEditors = {provider, sessions: createEditorSessions({provider}), editing: {on: true}};
  }
  return global.tmsEditors;
}

export const provider = shared().provider;
export const sessions = shared().sessions;

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

export const authorize = createEditorCheck({sessions, editingOn: editingSwitch.isOn});
