import { getRequestConfig } from 'next-intl/server';
import { headers } from 'next/headers';

export default getRequestConfig(async () => {
    // You can get the locale from a cookie or header if not using the [locale] segment
    const headersList = await headers();
    const locale = headersList.get('X-NEXT-INTL-LOCALE') || 'en';

    return {
        locale,
        messages: (await import(`../../messages/${locale}.json`)).default
    };
});
