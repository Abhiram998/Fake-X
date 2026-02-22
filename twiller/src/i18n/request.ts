import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

const messageLoaders: Record<string, () => Promise<any>> = {
    en: () => import('../messages/en.json'),
    es: () => import('../messages/es.json'),
    hi: () => import('../messages/hi.json'),
    pt: () => import('../messages/pt.json'),
    zh: () => import('../messages/zh.json'),
    fr: () => import('../messages/fr.json'),
};

export default getRequestConfig(async () => {
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';
    const currentLocale = ['en', 'es', 'hi', 'pt', 'zh', 'fr'].includes(locale) ? locale : 'en';

    const loadMessages = messageLoaders[currentLocale] || messageLoaders.en;

    return {
        locale: currentLocale,
        messages: (await loadMessages()).default
    };
});
