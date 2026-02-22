/**
 * Utility for sending SMS OTPs using Brevo (formerly Sendinblue) Transactional SMS API.
 */
const sendSMS = async (mobile, otpCode) => {
    try {
        if (!process.env.BREVO_API_KEY) {
            console.warn('⚠️ BREVO_API_KEY is missing. SMS sending will fail.');
            return { success: false, error: 'SMS configuration missing' };
        }

        console.log(`📡 [SMS API] Attempting to send OTP ${otpCode} to ${mobile}`);

        // Ensure the mobile number has a country code. 
        // Most providers (including Brevo) require it.
        // If the number doesn't start with a '91' and is 10 digits, we assume it's Indian for this demo,
        // but ideally the user should provide the full international number.
        let recipient = mobile;
        if (recipient.length === 10 && !recipient.startsWith('0')) {
            recipient = '91' + recipient; // Default to India if 10 digits
        }

        const response = await fetch('https://api.brevo.com/v3/transactionalSMS/sms', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': process.env.BREVO_API_KEY,
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                type: 'transactional',
                sender: 'Twiller',
                recipient: recipient,
                content: `Your Twiller verification code is: ${otpCode}. It will expire in 5 minutes.`
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ Brevo SMS API Error:', data);
            return {
                success: false,
                error: data.message || 'Failed to send SMS via Brevo'
            };
        }

        console.log(`✅ SMS OTP sent successfully to ${recipient} via Brevo`);
        return { success: true, messageId: data.messageId };

    } catch (error) {
        console.error('❌ SMS Sending Exception:', error);
        return { success: false, error: error.message };
    }
};

export default sendSMS;
