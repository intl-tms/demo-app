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
  sourceLocale: routing.defaultLocale
});
