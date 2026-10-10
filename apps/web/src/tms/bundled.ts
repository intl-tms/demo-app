import type {Catalog} from '@intl-tms/core';
import {routing} from '@/i18n/routing';
import da from '../../messages/da.json';
import en from '../../messages/en.json';

type Locale = (typeof routing.locales)[number];

// The messages that ship with the code, as written: ICU patterns, not the
// formatted text a page shows.
const catalogs: Record<Locale, Catalog> = {en, da};

// Same key rule as `markCatalog`: segments joined by ".", escaped with "\".
export function keyOf(prefix: string, name: string) {
  const segment = name.replaceAll('\\', '\\\\').replaceAll('.', '\\.');
  return prefix === '' ? segment : `${prefix}.${segment}`;
}

function flatten(catalog: Catalog, prefix = '', out = new Map<string, string>()) {
  for (const [name, value] of Object.entries(catalog)) {
    const key = keyOf(prefix, name);
    if (typeof value === 'string') out.set(key, value);
    else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      flatten(value as Catalog, key, out);
    }
  }
  return out;
}

const byLocale = new Map<Locale, Map<string, string>>();

/** One key's bundled message in every locale that has it. */
export function bundledValues(key: string) {
  const out: Partial<Record<Locale, string>> = {};
  for (const locale of routing.locales) {
    let values = byLocale.get(locale);
    if (!values) byLocale.set(locale, (values = flatten(catalogs[locale])));
    const value = values.get(key);
    if (value !== undefined) out[locale] = value;
  }
  return out;
}
