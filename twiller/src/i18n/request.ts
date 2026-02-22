import { getRequestConfig } from 'next-intl/server';

const messageLoaders: Record<string, () => Promise<any>> = {
    en: () => import('../messages/en.json'),
    es: () => import('../messages/es.json'),
    hi: () => import('../messages/hi.json'),
    pt: () => import('../messages/pt.json'),
    zh: () => import('../messages/zh.json'),
    fr: () => import('../messages/fr.json'),
};

export default getRequestConfig(async ({ locale }) => {
    const currentLocale = locale || 'en';
    const loadMessages = messageLoaders[currentLocale] || messageLoaders.en;

    return {
        locale: currentLocale,
        messages: (await loadMessages()).default
    };
});
