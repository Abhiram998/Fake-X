const sendPasswordReset = async (email, newPassword) => {
    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': process.env.BREVO_API_KEY,
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                sender: {
                    name: "Twiller Support",
                    email: "abhiramptb@gmail.com"
                },
                to: [
                    {
                        email: email
                    }
                ],
                subject: "Your New Twiller Password",
                htmlContent: `
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
                `
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ Brevo API Error:', data);
            return { success: false, error: data.message };
        }

        console.log('✅ Password Reset Email sent successfully:', data.messageId);
        return { success: true, data };
    } catch (error) {
        console.error('❌ Password Reset Email Fetch Error:', error);
        return { success: false, error: error.message };
    }
};

export default sendPasswordReset;
