import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
    // A list of all locales that are supported
    locales: ['en', 'es', 'hi', 'pt', 'zh', 'fr'],

    // Used when no locale matches
    defaultLocale: 'en',
    localePrefix: 'never' // We don't want /[locale]/ prefixes in URLs
});

export const config = {
    // Skip all internal paths and static files, but allow everything else
    matcher: ['/((?!api|_next|.*\\..*).*)']
};
