// A stand-in for the organisation's identity provider, so the demo runs with
// no Microsoft account. It is the only fake part: replace this module (and the
// sign-in page's buttons) with a real provider and nothing else changes.
//
// It offers the two things a real provider gives the website: signing in,
// which says who the account is and which roles it holds, and re-checking,
// which says whether the account is still active and what its roles are now.
// The access page plays the IT department and changes accounts here; a
// signed-in Editor only sees a change at the next re-check, as with a real
// provider.
//
// State lives in memory: restarting the demo returns every account to how it
// starts.

/** The role IT gives to people who may edit translations. */
export const EDITOR_ROLE = 'Editor';

export type Account = {
  id: string;
  name: string;
  /** Who this is, for the sign-in and access pages. */
  description: string;
  roles: string[];
  disabled: boolean;
};

const STARTING_ACCOUNTS: readonly Account[] = [
  {
    id: 'ada',
    name: 'Ada Jensen',
    description: 'Employee, marketing. Holds the Editor role.',
    roles: [EDITOR_ROLE],
    disabled: false
  },
  {
    id: 'lin',
    name: 'Lin Okafor (Nordic Translations)',
    description: 'Translation agency, added by IT as a guest user. Holds the Editor role.',
    roles: [EDITOR_ROLE],
    disabled: false
  },
  {
    id: 'sam',
    name: 'Sam Berg',
    description: 'Employee, sales. Does not hold the Editor role.',
    roles: [],
    disabled: false
  }
];

export type IdentityProvider = ReturnType<typeof createIdentityProvider>;

export function createIdentityProvider(starting: readonly Account[] = STARTING_ACCOUNTS) {
  const accounts = new Map(starting.map((account) => [account.id, structuredClone(account)]));

  const find = (id: string) => {
    const account = accounts.get(id);
    if (!account) throw new Error(`no demo account "${id}"`);
    return account;
  };

  return {
    /** Signs an account in: who it is and its roles, or nothing when it is disabled or unknown. */
    signIn(id: string) {
      const account = accounts.get(id);
      if (!account || account.disabled) return undefined;
      return {id: account.id, name: account.name, roles: [...account.roles]};
    },

    /** Whether the account is still active, and its roles now. */
    recheck(id: string) {
      const account = accounts.get(id);
      if (!account || account.disabled) return {active: false, roles: []};
      return {active: true, roles: [...account.roles]};
    },

    // What the IT department does, on the access page.

    accounts(): Account[] {
      return [...accounts.values()].map((account) => structuredClone(account));
    },

    setRole(id: string, role: string, held: boolean) {
      const account = find(id);
      account.roles = held
        ? [...new Set([...account.roles, role])]
        : account.roles.filter((r) => r !== role);
    },

    setDisabled(id: string, disabled: boolean) {
      find(id).disabled = disabled;
    }
  };
}
