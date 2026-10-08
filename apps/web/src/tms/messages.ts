import {cookies} from 'next/headers';
import {
  markCatalog,
  TOGGLE_COOKIE_NAME,
  TOGGLE_ON_VALUE,
  type Catalog
} from '@intl-tms/core';
import {adapter} from './adapter';
import {editingEnabled} from './config';

export async function isEditingSession() {
  if (!editingEnabled) return false;
  return (await cookies()).get(TOGGLE_COOKIE_NAME)?.value === TOGGLE_ON_VALUE;
}

// Same key rule as `markCatalog`: segments joined by ".", escaped with "\".
function keyOf(prefix: string, name: string) {
  const segment = name.replaceAll('\\', '\\\\').replaceAll('.', '\\.');
  return prefix === '' ? segment : `${prefix}.${segment}`;
}

// Lays the values saved through the editing tools over the bundled messages.
async function withStoredValues(catalog: Catalog, locale: string, prefix = '') {
  const out: Catalog = {};
  for (const [name, value] of Object.entries(catalog)) {
    const key = keyOf(prefix, name);
    if (typeof value === 'string') {
      const stored: Partial<Record<string, {value: string}>> = await adapter.getValues(key);
      out[name] = stored[locale]?.value ?? value;
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      out[name] = await withStoredValues(value as Catalog, locale, key);
    } else {
      out[name] = value;
    }
  }
  return out;
}

export async function editingMessages<T extends Catalog>(catalog: T, locale: string) {
  return markCatalog((await withStoredValues(catalog, locale)) as T);
}
