import { getRequestConfig } from 'next-intl/server';
import { i18n } from '@/i18n.config';

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  const validLocale: string = (locale && i18n.locales.includes(locale as any)) ? locale : i18n.defaultLocale;

  return {
    locale: validLocale,
    messages: (await import(`@/messages/${validLocale}.json`)).default
  };
});
