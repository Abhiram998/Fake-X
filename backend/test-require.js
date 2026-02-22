import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const brevo = require('@getbrevo/brevo');

console.log(brevo);
console.log(typeof brevo.TransactionalEmailsApi);
if (brevo.TransactionalEmailsApi) {
    console.log(new brevo.TransactionalEmailsApi());
}
