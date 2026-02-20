import * as Brevo from '@getbrevo/brevo';

const sendPasswordReset = async (email, newPassword) => {
    try {
        let apiInstance = new Brevo.TransactionalEmailsApi();

        let apiKey = apiInstance.authentications['apiKey'];
        apiKey.apiKey = process.env.BREVO_API_KEY;

        let sendSmtpEmail = new Brevo.SendSmtpEmail();

        sendSmtpEmail.subject = "Your New Twiller Password";
        sendSmtpEmail.htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e8ed; border-radius: 12px; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #1DA1F2; margin: 0; font-size: 28px;">Password Reset Successful</h1>
                </div>
                <div style="padding: 20px; text-align: center;">
                    <p style="font-size: 16px; color: #5b7083; margin-bottom: 25px;">Your Twiller password has been reset. Please use the temporary password below to log in.</p>
                    <div style="background-color: #f7f9f9; padding: 25px; border-radius: 8px; margin-bottom: 25px; border: 1px dashed #1DA1F2;">
                        <span style="font-size: 32px; font-weight: bold; color: #000000; letter-spacing: 2px;">${newPassword}</span>
                    </div>
                    <p style="font-size: 14px; color: #8899a6;">Note: This password contains alphabetical characters only (A-Z, a-z). We recommend changing it after your first login.</p>
                </div>
                <div style="border-top: 1px solid #e1e8ed; padding-top: 15px; text-align: center; font-size: 12px; color: #8899a6;">
                    <p>If you didn't request this change, please contact support immediately.</p>
                    <p>&copy; 2026 Twiller Team</p>
                </div>
            </div>
        `;
        sendSmtpEmail.sender = { "name": "Twiller Support", "email": "abhiramptb@gmail.com" };
        sendSmtpEmail.to = [{ "email": email }];

        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log('✅ Password Reset Email sent successfully:', data.messageId);
        return { success: true, data };
    } catch (error) {
        console.error('❌ Password Reset Email Error:', error);
        return { success: false, error };
    }
};

export default sendPasswordReset;
