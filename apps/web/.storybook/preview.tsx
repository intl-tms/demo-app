import type {Preview} from '@storybook/nextjs-vite';
import {NextIntlClientProvider} from 'next-intl';
import {createStorybookAddon} from '@intl-tms/core/storybook';
import {routing} from '../src/i18n/routing';
import da from '../messages/da.json';
import en from '../messages/en.json';
import '../src/app/globals.css';

type Locale = (typeof routing.locales)[number];

const messages: Record<Locale, typeof en> = {en, da};

// Edits go to the endpoints of the running app (`pnpm dev`), which lists this
// Storybook's origin in its cross-origin policy.
const tms = createStorybookAddon({config: 'http://localhost:3000/api/tms/config'});

const preview: Preview = {
  parameters: {
    layout: 'fullscreen'
  },
  globalTypes: {
    locale: {
      description: 'The locale stories are rendered in',
      toolbar: {title: 'Locale', icon: 'globe', items: [...routing.locales], dynamicTitle: true}
    },
    ...tms.globalTypes
  },
  initialGlobals: {locale: routing.defaultLocale, ...tms.initialGlobals},
  decorators: [
    (Story, context) => {
      const locale = context.globals.locale as Locale;
      return (
        // Marked only while "Edit translations" is on in the toolbar
        <NextIntlClientProvider locale={locale} messages={tms.mark(messages[locale], context)}>
          <Story />
        </NextIntlClientProvider>
      );
    },
    tms.decorator
  ]
};

export default preview;
