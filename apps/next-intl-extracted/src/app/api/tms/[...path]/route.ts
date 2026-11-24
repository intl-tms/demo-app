import {createHandler} from '@intl-tms/core';
import {authorize, pairing} from '@/editors';
import {adapter} from '@/tms/adapter';
import {bundledValues} from '@/tms/bundled';
import {config} from '@/tms/config';
import {routing} from '@/i18n/routing';

const handler = createHandler({
  config,
  adapter,
  // The keys here are hashes, so without this the panel heads every translation
  // with "9s3ioP". The message in the code is the authority on a key's wording,
  // which is exactly what `sourceMessage` is for.
  metadata: (key) => {
    const sourceMessage = bundledValues(key)[routing.defaultLocale];
    return sourceMessage === undefined ? undefined : {sourceMessage};
  },
  // Someone signed in to the login for Editors who holds the Editor role, while
  // editing is switched on. Nobody signed in gets 401 and the sign-in page;
  // someone without the role gets 403.
  authorize,
  // Storybook signs in through a pop-up on the Editors' login and edits with
  // an editing token. It runs on its own origin, which is listed here: the
  // pop-up hands a sign-in to no other origin.
  pairing,
  cors: {origins: [process.env.STORYBOOK_URL ?? 'http://localhost:6006']}
});

export const GET = handler;
export const PUT = handler;
export const POST = handler;
// A cross-origin write is preceded by a preflight, which the handler answers.
export const OPTIONS = handler;
