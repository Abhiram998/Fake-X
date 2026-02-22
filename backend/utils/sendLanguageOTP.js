const sendLanguageOTP = async (identity, otpCode, isEmail = true) => {
    if (isEmail) {
        try {
            const response = await fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'api-key': process.env.BREVO_API_KEY,
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    sender: { name: 'Twiller', email: 'abhiramptb@gmail.com' },
                    to: [{ email: identity }],
                    subject: 'Language Change Verification',
                    htmlContent: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e8ed; border-radius: 12px; background-color: #ffffff;">
                            <div style="text-align: center; margin-bottom: 20px;">
                                <h1 style="color: #1DA1F2; margin: 0; font-size: 28px;">Language Change</h1>
                            </div>
                            <div style="padding: 20px; text-align: center;">
                                <p style="font-size: 16px; color: #5b7083; margin-bottom: 25px;">Use the code below to verify your language change request.</p>
                                <div style="background-color: #f7f9f9; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
                                    <span style="font-size: 36px; font-weight: bold; color: #000000; letter-spacing: 6px;">${otpCode}</span>
                                </div>
                                <p style="font-size: 14px; color: #8899a6;">This code will expire in <strong style="color: #e0245e;">5 minutes</strong>.</p>
                            </div>
                        </div>
                    `
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(JSON.stringify(errData));
            }

            console.log('✅ Language OTP Email sent successfully');
            return { success: true };
        } catch (error) {
            console.error('❌ Language OTP Email Error:', error);
            return { success: false, error: error.message || error };
        }
    } else {
        // Simulate SMS
        console.log(`📱 [SIMULATED SMS] TO ${identity}: Your Twiller verification code is ${otpCode}`);
        return { success: true, simulated: true };
    }
};

export default sendLanguageOTP;
