/**
 * Utility for sending SMS OTPs.
 * Abstracted to support various providers like Twilio.
 */
const sendSMS = async (mobile, otpCode) => {
    try {
        // Implementation for SMS provider (e.g., Twilio) would go here.
        // For now, we simulate the sending process but structure it for real use.

        console.log(`📡 [SMS API] Sending OTP ${otpCode} to ${mobile}`);

        // Example Twilio Implementation (commented out):
        /*
        const client = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
        await client.messages.create({
            body: `Your Twiller verification code is: ${otpCode}`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: `+${mobile}`
        });
        */

        // Returning success as if the SMS was sent.
        return { success: true, provider: 'Simulated/Abstracted' };
    } catch (error) {
        console.error('❌ SMS Sending Error:', error);
        return { success: false, error: error.message };
    }
};

export default sendSMS;
