import brevo from '@getbrevo/brevo';

const sendInvoice = async (email, invoiceData) => {
    try {
        let apiInstance = new brevo.TransactionalEmailsApi();

        let apiKey = apiInstance.authentications['apiKey'];
        apiKey.apiKey = process.env.BREVO_API_KEY;

        let sendSmtpEmail = new brevo.SendSmtpEmail();

        sendSmtpEmail.subject = `Your Twiller Invoice - ${invoiceData.invoiceNumber}`;
        sendSmtpEmail.htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e8ed; border-radius: 12px; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #1DA1F2; margin: 0; font-size: 28px;">Payment Successful</h1>
                    <p style="color: #5b7083;">Thank you for your subscription!</p>
                </div>
                <div style="padding: 20px; border: 1px solid #f0f3f5; border-radius: 8px; background-color: #f8f9fa;">
                    <h3 style="margin-top: 0; color: #000000;">Invoice Details</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; color: #5b7083;">Plan:</td>
                            <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #000000;">${invoiceData.planName}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #5b7083;">Amount Paid:</td>
                            <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #000000;">₹${invoiceData.amount}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #5b7083;">Invoice Number:</td>
                            <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #000000;">${invoiceData.invoiceNumber}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #5b7083;">Payment Date:</td>
                            <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #000000;">${invoiceData.paymentDate}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #5b7083;">Valid Until:</td>
                            <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #000000;">${invoiceData.expiryDate}</td>
                        </tr>
                    </table>
                </div>
                <div style="margin-top: 20px; padding: 15px; background-color: #e8f5fd; border-radius: 8px; text-align: center;">
                    <p style="margin: 0; color: #1DA1F2; font-size: 14px;">Your tweet limit has been updated to <strong>${invoiceData.tweetLimit}</strong>.</p>
                </div>
                <div style="border-top: 1px solid #e1e8ed; margin-top: 25px; padding-top: 15px; text-align: center; font-size: 12px; color: #8899a6;">
                    <p>&copy; 2026 Twiller Team &bull; Digital Goods</p>
                </div>
            </div>
        `;
        sendSmtpEmail.sender = { "name": "Twiller Billing", "email": "abhiramptb@gmail.com" };
        sendSmtpEmail.to = [{ "email": email }];

        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log('✅ Invoice Email sent successfully:', data.messageId);
        return { success: true, data };
    } catch (error) {
        console.error('❌ Invoice Email Error:', error);
        return { success: false, error };
    }
};

export default sendInvoice;
