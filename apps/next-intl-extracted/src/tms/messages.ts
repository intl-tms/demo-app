import {cookies} from 'next/headers';
import {connection} from 'next/server';
import {
  markCatalog,
  TOGGLE_COOKIE_NAME,
  TOGGLE_ON_VALUE,
  type Catalog
} from '@intl-tms/core';
import {getLocaleValues} from './adapter';
import {keyOf} from './bundled';
import {editingEnabled} from './config';

export async function isEditingSession() {
  if (!editingEnabled) return false;
  return (await cookies()).get(TOGGLE_COOKIE_NAME)?.value === TOGGLE_ON_VALUE;
}

// Lays the values saved through the editing tools over the bundled messages.
function withStoredValues(catalog: Catalog, stored: Map<string, string>, prefix = '') {
  const out: Catalog = {};
  for (const [name, value] of Object.entries(catalog)) {
    const key = keyOf(prefix, name);
    if (typeof value === 'string') {
      out[name] = stored.get(key) ?? value;
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      out[name] = withStoredValues(value as Catalog, stored, key);
    } else {
      out[name] = value;
    }
  }
  return out;
}

export async function editingMessages<T extends Catalog>(catalog: T, locale: string) {
  // The stored values are read per request: the Mongo driver reads the clock,
  // which Next.js refuses during a prerender.
  await connection();
  return markCatalog(withStoredValues(catalog, await getLocaleValues(locale)) as T);
}
