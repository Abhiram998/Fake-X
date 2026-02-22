import brevo from '@getbrevo/brevo';

const sendOTP = async (email, otpCode) => {
    try {
        let apiInstance = new brevo.TransactionalEmailsApi();

        let apiKey = apiInstance.authentications['apiKey'];
        apiKey.apiKey = process.env.BREVO_API_KEY;

        let sendSmtpEmail = new brevo.SendSmtpEmail();

        sendSmtpEmail.subject = "Your Twiller Audio Verification Code";
        sendSmtpEmail.htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e8ed; border-radius: 12px; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #1DA1F2; margin: 0; font-size: 28px;">Audio Tweet Verification</h1>
                </div>
                <div style="padding: 20px; text-align: center;">
                    <p style="font-size: 16px; color: #5b7083; margin-bottom: 25px;">Verify your identity to enable high-quality audio features on Twiller.</p>
                    <div style="background-color: #f7f9f9; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
                        <span style="font-size: 36px; font-weight: bold; color: #000000; letter-spacing: 6px;">${otpCode}</span>
                    </div>
                    <p style="font-size: 14px; color: #8899a6;">This code will expire in <strong style="color: #e0245e;">5 minutes</strong> and is for single-use only.</p>
                </div>
                <div style="border-top: 1px solid #e1e8ed; padding-top: 15px; text-align: center; font-size: 12px; color: #8899a6;">
                    <p>If you didn't request this code, please ignore this email.</p>
                    <p>&copy; 2026 Twiller Audio Feature Team</p>
                </div>
            </div>
        `;
        sendSmtpEmail.sender = { "name": "Twiller", "email": "abhiramptb@gmail.com" }; // Must be the email you used to sign up for Brevo
        sendSmtpEmail.to = [{ "email": email }];

        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log('✅ Brevo Email sent successfully:', data.messageId);
        return { success: true, data };
    } catch (error) {
        console.error('❌ Brevo Email Error:', error);
        return { success: false, error };
    }
};

export default sendOTP;
