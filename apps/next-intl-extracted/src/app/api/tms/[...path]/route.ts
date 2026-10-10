import {createHandler} from '@intl-tms/core';
import {adapter} from '@/tms/adapter';
import {config, editingEnabled} from '@/tms/config';

const handler = createHandler({
  config,
  adapter,
  // Demo only: anyone may read and write while editing is enabled. Replace
  // with a real check (a session, a role) before this serves real content.
  authorize: () => editingEnabled,
  // Storybook runs on its own origin and edits through these endpoints.
  cors: {origins: [process.env.STORYBOOK_URL ?? 'http://localhost:6006']}
});

export const GET = handler;
export const PUT = handler;
export const POST = handler;
// A cross-origin write is preceded by a preflight, which the handler answers.
export const OPTIONS = handler;
