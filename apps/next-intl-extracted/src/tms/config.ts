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
