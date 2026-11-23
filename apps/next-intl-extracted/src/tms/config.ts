import {resolveConfig} from '@intl-tms/core';
import {routing} from '@/i18n/routing';

// Editing is a deployment-level switch: with it off no cookie is read, the
// Catalog is never marked and the endpoints deny every request.
export const editingEnabled =
  process.env.TMS_EDITING === '1' || process.env.NODE_ENV === 'development';

const siteUrl = process.env.SITE_URL ?? 'http://localhost:3000';

export const config = resolveConfig({
  locales: routing.locales,
  basePath: `${siteUrl}/api/tms`,
  sourceLocale: routing.defaultLocale,
  // The outline this website draws around an editable translation. A website
  // would put its own brand here; these are the Core's own defaults, written
  // out because the published Core still ships the older green and blue.
  colors: {highlight: '#8b5cf6', active: '#5b21b6'},
  // What this website asks of a translation beyond the string itself. None of
  // it is built into the editing panel: these names, labels and options are
  // this demo's, and another website would declare different ones or none.
  schema: {
    // Translations here are sentences, so the panel gives them two lines.
    valueField: {type: 'textarea'},
    fields: [
      {
        type: 'select',
        name: 'workflow',
        label: 'Workflow',
        // An empty required Field blocks Save, so every row this demo serves
        // starts with a value: see `adapter.ts`.
        required: true,
        options: [
          {label: 'Needs copy', value: 'needs-copy'},
          {label: 'With legal', value: 'legal'},
          {label: 'Signed off', value: 'signed'}
        ]
      },
      {type: 'text', name: 'glossary', label: 'Glossary'},
      // Produced by the website and never written: the panel shows it as text.
      {type: 'readonly', name: 'charLimit', label: 'Char limit'}
    ],
    toolbar: {search: true, filters: [{field: 'workflow'}]}
  }
});
