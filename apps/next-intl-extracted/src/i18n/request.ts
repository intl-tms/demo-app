import * as rootParams from 'next/root-params';
import {notFound} from 'next/navigation';
import {getRequestConfig} from 'next-intl/server';
import {hasLocale} from 'next-intl';
import {routing} from './routing';
import {editingMessages, isEditingSession} from '@/tms/messages';

export default getRequestConfig(async ({locale}) => {
  // `locale` is only set when it's passed explicitly (e.g. to
  // `getExtracted`), otherwise read the matched `[locale]` segment
  if (!locale) {
    const paramValue = await rootParams.locale();
    if (hasLocale(routing.locales, paramValue)) {
      locale = paramValue;
    } else {
      notFound();
    }
  }

  const messages = (await import(`../../messages/${locale}.json`)).default;

  return {
    locale,
    messages: (await isEditingSession())
      ? await editingMessages(messages, locale)
      : messages
  };
});
