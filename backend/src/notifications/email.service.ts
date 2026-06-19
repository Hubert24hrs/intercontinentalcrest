import { Injectable, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EmailService implements OnModuleInit {
  private transporter: nodemailer.Transporter | null = null;
  private logFilePath: string;

  onModuleInit() {
    this.logFilePath = path.join(process.cwd(), 'mails', 'sent_mails.log');
    
    // Ensure mails directory exists
    const mailsDir = path.dirname(this.logFilePath);
    if (!fs.existsSync(mailsDir)) {
      fs.mkdirSync(mailsDir, { recursive: true });
    }

    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && port && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: parseInt(port),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user, pass },
      });
      console.log('EmailService: SMTP Transporter initialized successfully.');
    } else {
      console.log(
        `EmailService: SMTP config not fully specified. Falling back to local file logging: ${this.logFilePath}`,
      );
    }
  }

  async sendEmail(options: {
    to: string;
    subject: string;
    text: string;
    html?: string;
  }) {
    const from =
      process.env.SMTP_FROM ||
      '"Intercontinental Crest" <noreply@intercontinentalcrest.com>';

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from,
          to: options.to,
          subject: options.subject,
          text: options.text,
          html: options.html,
        });
        console.log(`Email sent successfully via SMTP to ${options.to}`);
        return;
      } catch (err) {
        console.error('SMTP email send failed. Logging email locally instead.', err);
      }
    }

    // Fallback: Write email to local file
    const logEntry = `
========================================================================
TIMESTAMP: ${new Date().toISOString()}
FROM: ${from}
TO: ${options.to}
SUBJECT: ${options.subject}
------------------------------------------------------------------------
TEXT CONTENT:
${options.text}
------------------------------------------------------------------------
HTML CONTENT:
${options.html || 'N/A'}
========================================================================
\n`;

    fs.appendFileSync(this.logFilePath, logEntry, 'utf8');
    console.log(`[SIMULATED EMAIL SENT TO ${options.to}] Subject: ${options.subject}`);
  }

  getWelcomeEmailTemplate(fullName: string): { text: string; html: string } {
    const text = `Hello ${fullName},

Welcome to Intercontinental Crest. We are delighted to inform you that your digital banking account has been successfully opened!

Your default checking and savings accounts are now provisioned and active, alongside your multi-currency crypto wallets.

Thank you for choosing Intercontinental Crest.

Best regards,
The Intercontinental Crest Team`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Outfit', 'Inter', sans-serif; background-color: #f9fafb; margin: 0; padding: 0; color: #1f2937; }
    .container { max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e5e7eb; }
    .header { background-color: #0A2342; padding: 30px; text-align: center; border-bottom: 4px solid #00B7F1; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 1px; }
    .header p { color: #00B7F1; margin: 5px 0 0 0; font-size: 12px; font-weight: bold; letter-spacing: 3px; }
    .content { padding: 40px 30px; line-height: 1.6; }
    .content h2 { color: #0A2342; font-size: 20px; margin-top: 0; }
    .highlight { background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .button-container { text-align: center; margin: 30px 0; }
    .button { background-color: #00B7F1; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 30px; font-weight: bold; display: inline-block; box-shadow: 0 4px 10px rgba(0, 183, 241, 0.2); }
    .footer { background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 11px; color: #6b7280; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>INTERCONTINENTAL</h1>
      <p>CREST</p>
    </div>
    <div class="content">
      <h2>Welcome to Global Banking, ${fullName}!</h2>
      <p>We are delighted to inform you that your secure digital banking account has been successfully opened and verified.</p>
      
      <div class="highlight">
        <strong>Default accounts provisioned:</strong><br/>
        • Checking Account (USD) - Active<br/>
        • Savings Account (USD) - Active<br/>
        • Multi-Asset Crypto Wallets - Activated
      </div>
      
      <p>You can now manage your assets, initiate international transfers, and invest seamlessly from your premium customer dashboard.</p>
      
      <div class="button-container">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button" style="color: #ffffff;">Access Your Dashboard</a>
      </div>
    </div>
    <div class="footer">
      <p>© 2026 Intercontinental Crest. FDIC Insured Simulation. All rights reserved.</p>
      <p>This is a secure automated notification. Please do not reply directly to this email.</p>
    </div>
  </div>
</body>
</html>`;

    return { text, html };
  }

  getTransactionEmailTemplate(
    fullName: string,
    title: string,
    message: string,
  ): { text: string; html: string } {
    const text = `Hello ${fullName},

Notification: ${title}

${message}

Thank you for choosing Intercontinental Crest.

Best regards,
The Intercontinental Crest Team`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Outfit', 'Inter', sans-serif; background-color: #f9fafb; margin: 0; padding: 0; color: #1f2937; }
    .container { max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e5e7eb; }
    .header { background-color: #0A2342; padding: 30px; text-align: center; border-bottom: 4px solid #00B7F1; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 1px; }
    .header p { color: #00B7F1; margin: 5px 0 0 0; font-size: 12px; font-weight: bold; letter-spacing: 3px; }
    .content { padding: 40px 30px; line-height: 1.6; }
    .content h2 { color: #0A2342; font-size: 18px; margin-top: 0; border-bottom: 1px solid #f3f4f6; padding-bottom: 10px; }
    .alert-box { background-color: #f0f9ff; border-left: 4px solid #00B7F1; padding: 15px; border-radius: 8px; margin: 20px 0; font-size: 14px; }
    .button-container { text-align: center; margin: 30px 0; }
    .button { background-color: #0A2342; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 30px; font-weight: bold; display: inline-block; }
    .footer { background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 11px; color: #6b7280; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>INTERCONTINENTAL</h1>
      <p>CREST</p>
    </div>
    <div class="content">
      <h2>Account Security & Ledger Update</h2>
      <p>Hello ${fullName},</p>
      <p>We are writing to notify you of a new activity on your digital banking ledger:</p>
      
      <div class="alert-box">
        <strong>${title}</strong><br/>
        <p style="margin: 5px 0 0 0; color: #4b5563;">${message}</p>
      </div>
      
      <p>If you did not authorize or recognize this operation, please contact our support team immediately to freeze your account.</p>
      
      <div class="button-container">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button" style="color: #ffffff;">Review Ledger Operations</a>
      </div>
    </div>
    <div class="footer">
      <p>© 2026 Intercontinental Crest. FDIC Insured Simulation. All rights reserved.</p>
      <p>This is a secure automated notification. Please do not reply directly to this email.</p>
    </div>
  </div>
</body>
</html>`;

    return { text, html };
  }
}
