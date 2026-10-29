import {headers} from 'next/headers';
import {connection} from 'next/server';
import {isEditingRequest, markCatalog, type Catalog} from '@intl-tms/core';
import {authorize, editingSwitch} from '@/editors';
import {getLocaleValues} from './adapter';
import {keyOf} from './bundled';

// A page is marked only when the Toggle is set and the Editors' session may
// read: a visitor who sets the Toggle gets the page as everyone else does.
export async function isEditingSession() {
  if (!editingSwitch.isOn()) return false;
  const request = new Request(process.env.SITE_URL ?? 'http://localhost:3000', {headers: await headers()});
  return isEditingRequest(request, authorize);
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
