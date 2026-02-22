import brevo from '@getbrevo/brevo';
console.log("brevo type:", typeof brevo);
console.log("brevo keys:", Object.keys(brevo));
console.log("Is TransactionalEmailsApi present?", !!brevo.TransactionalEmailsApi);
