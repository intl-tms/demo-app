import {createHandler} from '@intl-tms/core';
import {authorize} from '@/editors';
import {adapter} from '@/tms/adapter';
import {config} from '@/tms/config';

const handler = createHandler({
  config,
  adapter,
  // Someone signed in to the login for Editors who holds the Editor role, while
  // editing is switched on. Nobody signed in gets 401 and the sign-in page;
  // someone without the role gets 403.
  authorize,
  // Storybook runs on its own origin and edits through these endpoints.
  cors: {origins: [process.env.STORYBOOK_URL ?? 'http://localhost:6006']}
});

export const GET = handler;
export const PUT = handler;
export const POST = handler;
// A cross-origin write is preceded by a preflight, which the handler answers.
export const OPTIONS = handler;
