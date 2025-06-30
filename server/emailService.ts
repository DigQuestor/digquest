import { MailService } from '@sendgrid/mail';

let mailService: MailService | null = null;

function initializeMailService() {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn("SENDGRID_API_KEY not found. Email verification will be disabled.");
    return false;
  }
  
  if (!mailService) {
    mailService = new MailService();
    mailService.setApiKey(process.env.SENDGRID_API_KEY);
  }
  return true;
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  console.log(`Attempting to send email to ${params.to} with subject: "${params.subject}"`);
  
  if (!initializeMailService()) {
    console.log(`Email service not available - SENDGRID_API_KEY missing. Would have sent email to ${params.to}`);
    return false;
  }

  try {
    console.log(`SendGrid API key found, sending email to ${params.to}`);
    await mailService!.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    console.log(`✅ Email sent successfully to ${params.to}`);
    return true;
  } catch (error) {
    console.error(`❌ SendGrid email error for ${params.to}:`, error);
    if (error && typeof error === 'object' && 'response' in error) {
      console.error('SendGrid response body:', (error as any).response?.body);
    }
    return false;
  }
}

export function generateVerificationToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function createVerificationEmail(email: string, username: string, token: string, baseUrl: string) {
  const verificationUrl = `${baseUrl}/verify-email?token=${token}`;
  
  return {
    to: email,
    from: 'DigQuest Team <danishnest@gmail.com>', // Professional display name with verified sender
    replyTo: 'danishnest@gmail.com', // Replies go to your email
    subject: 'Welcome to DigQuest - Please Verify Your Email',
    text: `
Welcome to DigQuest, ${username}!

Thank you for joining our metal detecting community. To complete your registration and start exploring with fellow detectorists, please verify your email address by clicking the link below:

${verificationUrl}

This link will expire in 24 hours. If you didn't create an account with DigQuest, you can safely ignore this email.

Happy detecting!
The DigQuest Team
    `,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to DigQuest</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #8B4513, #DAA520); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #f8f9fa; color: #000000; padding: 16px 32px; text-decoration: none; border-radius: 8px; margin: 25px 0; font-weight: bold; font-size: 16px; border: 2px solid #333333; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .icon { font-size: 48px; margin-bottom: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="icon">🏺</div>
    <h1>Welcome to DigQuest!</h1>
    <p>Your metal detecting adventure begins here</p>
  </div>
  
  <div class="content">
    <h2>Hello ${username},</h2>
    
    <p>Welcome to the DigQuest community! We're thrilled to have you join thousands of passionate metal detectorists across the UK.</p>
    
    <p>To complete your registration and unlock all community features, please verify your email address:</p>
    
    <div style="text-align: center;">
      <a href="${verificationUrl}" class="button">Verify My Email Address</a>
    </div>
    
    <p>Once verified, you'll be able to:</p>
    <ul>
      <li>🗺️ Share and discover detecting locations</li>
      <li>🏆 Post your amazing finds</li>
      <li>💬 Connect with fellow detectorists in our forums</li>
      <li>📱 Use our AR route recommendations</li>
      <li>🎯 Earn achievements and badges</li>
    </ul>
    
    <p><strong>This verification link expires in 24 hours.</strong></p>
    
    <p>If you didn't create this account, you can safely ignore this email.</p>
    
    <p>Happy detecting!<br>
    The DigQuest Team</p>
  </div>
  
  <div class="footer">
    <p>This email was sent to ${email} because you signed up for DigQuest.</p>
    <p>If you have questions, contact us at support@digquest.org</p>
  </div>
</body>
</html>
    `
  };
}