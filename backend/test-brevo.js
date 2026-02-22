import BrevoPackage from '@getbrevo/brevo';
const Brevo = BrevoPackage.default || BrevoPackage;

const api = new Brevo.TransactionalEmailsApi();
const email = new Brevo.SendSmtpEmail();
console.log(api, email);
