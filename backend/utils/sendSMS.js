import twilio from "twilio";

const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

/**
 * Sends an SMS message using Twilio.
 * @param {string} to - The recipient's mobile number.
 * @param {string} message - The message content.
 * @returns {Promise} - Resolves with the Twilio message object.
 */
export const sendSMS = async (to, message) => {
    // Ensure the number is in E.164 format for Twilio
    let recipient = to;
    if (recipient.length === 10 && !recipient.startsWith('0')) {
        recipient = '+91' + recipient; // Default to India if 10 digits
    } else if (!recipient.startsWith('+')) {
        recipient = '+' + recipient;
    }

    return await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: recipient,
    });
};
