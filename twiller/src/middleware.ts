import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
    // A list of all locales that are supported
    locales: ['en', 'es', 'hi', 'pt', 'zh', 'fr'],

    // Used when no locale matches
    defaultLocale: 'en',
    localePrefix: 'never' // We don't want /[locale]/ prefixes in URLs
});

export const config = {
    // Match all pathnames except for
    // - API routes (/api)
    // - Static files (/_next, /favicon.ico, /manifest.json, /sw.js, etc.)
    // - Files with extensions (e.g. .svg, .png)
    matcher: ['/((?!api|_next|static|.*\\..*).*)']
};
