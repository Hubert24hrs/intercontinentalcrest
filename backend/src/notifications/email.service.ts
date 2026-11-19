import { Injectable, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

/** Escape user-controlled values before they are placed in email HTML. */
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function frontendUrl(): string {
  return (process.env.FRONTEND_URL || 'http://localhost:3000').trim().replace(/\/$/, '');
}

export interface EmailRow {
  label: string;
  value: string;
}

@Injectable()
export class EmailService implements OnModuleInit {
  private logFilePath: string;

  onModuleInit() {
    const basePath = process.env.VERCEL ? '/tmp' : process.cwd();
    this.logFilePath = path.join(basePath, 'mails', 'sent_mails.log');

    const mailsDir = path.dirname(this.logFilePath);
    if (!fs.existsSync(mailsDir)) {
      fs.mkdirSync(mailsDir, { recursive: true });
    }

    if (process.env.RESEND_API_KEY) {
      console.log('EmailService: Resend API initialized.');
    } else {
      console.log(`EmailService: RESEND_API_KEY not set, so emails are written to ${this.logFilePath}`);
    }
  }

  async sendEmail(options: { to: string; subject: string; text: string; html?: string }) {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    const from = process.env.RESEND_FROM_EMAIL?.trim() || '"Intercontinental Crest" <onboarding@resend.dev>';

    if (apiKey) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from, to: options.to, subject: options.subject, text: options.text, html: options.html }),
        });
        if (response.ok) return;
        console.error('Resend API returned an error:', await response.json().catch(() => ({})));
      } catch (err) {
        console.error('Resend email send failed. Logging email locally instead.', err);
      }
    }

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

    try {
      fs.appendFileSync(this.logFilePath, logEntry, 'utf8');
    } catch (err) {
      console.error('Could not write email log:', err);
    }
  }

  /**
   * Shared branded layout. `bodyHtml` must already be escaped / trusted markup;
   * every interpolated user value in the helpers below goes through escapeHtml().
   */
  renderLayout(opts: { heading: string; bodyHtml: string; cta?: { label: string; href: string }; accent?: string }): string {
    const accent = opts.accent || '#0E7C86';
    const cta = opts.cta
      ? `<div style="text-align:center;margin:28px 0 8px"><a href="${escapeHtml(opts.cta.href)}" style="background:${accent};color:#ffffff;padding:12px 26px;border-radius:999px;text-decoration:none;font-weight:600;display:inline-block">${escapeHtml(opts.cta.label)}</a></div>`
      : '';
    return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f4f6f8;font-family:Inter,Segoe UI,Arial,sans-serif;color:#0f172a">
  <div style="max-width:600px;margin:28px auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
    <div style="background:#0B1F33;padding:24px 28px;border-bottom:3px solid ${accent}">
      <div style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:0.4px">Intercontinental Crest</div>
      <div style="color:#94a3b8;font-size:12px;margin-top:2px">Digital banking demo platform</div>
    </div>
    <div style="padding:32px 28px;line-height:1.65;font-size:14px">
      <h2 style="margin:0 0 14px;font-size:19px;color:#0B1F33">${escapeHtml(opts.heading)}</h2>
      ${opts.bodyHtml}
      ${cta}
    </div>
    <div style="background:#f8fafc;padding:16px 28px;text-align:center;font-size:11px;color:#64748b;border-top:1px solid #e2e8f0">
      Intercontinental Crest is a demonstration platform. Balances and transactions are simulated and are not FDIC insured.<br/>
      This is an automated message. Please do not reply.
    </div>
  </div>
</body></html>`;
  }

  renderRows(rows: EmailRow[]): string {
    const cells = rows
      .map(
        (r) =>
          `<tr><td style="padding:8px 0;color:#64748b;border-bottom:1px solid #f1f5f9">${escapeHtml(r.label)}</td><td style="padding:8px 0;text-align:right;font-weight:600;border-bottom:1px solid #f1f5f9">${escapeHtml(r.value)}</td></tr>`,
      )
      .join('');
    return `<table style="width:100%;border-collapse:collapse;margin:18px 0;font-size:13px">${cells}</table>`;
  }

  getWelcomeEmailTemplate(fullName: string): { text: string; html: string } {
    const text = `Hello ${fullName},

Welcome to Intercontinental Crest. Your demo account is ready: a checking account, a savings account and simulated crypto wallets have been created for you.

Sign in: ${frontendUrl()}/login

Intercontinental Crest is a demonstration platform. Balances and transactions are simulated.`;

    const html = this.renderLayout({
      heading: `Welcome, ${fullName}`,
      bodyHtml: `<p>Your demo account is ready. We've set up:</p>
        <ul style="padding-left:18px;color:#334155">
          <li>A checking account (USD)</li>
          <li>A savings account (USD)</li>
          <li>Simulated crypto wallets</li>
        </ul>
        <p>Everything on the platform is simulated, so you can explore transfers, payments, investing and lending without real money.</p>`,
      cta: { label: 'Sign in to your dashboard', href: `${frontendUrl()}/login` },
    });

    return { text, html };
  }

  getTransactionEmailTemplate(fullName: string, title: string, message: string): { text: string; html: string } {
    const text = `Hello ${fullName},

${title}

${message}

If you don't recognise this activity, contact support from your dashboard.`;

    const html = this.renderLayout({
      heading: title,
      bodyHtml: `<p>Hello ${escapeHtml(fullName)},</p>
        <div style="background:#f0fdfa;border-left:3px solid #0E7C86;padding:14px 16px;border-radius:8px;color:#334155">${escapeHtml(message)}</div>
        <p style="color:#64748b;font-size:13px;margin-top:18px">If you don't recognise this activity, contact support from your dashboard.</p>`,
      cta: { label: 'Review activity', href: `${frontendUrl()}/dashboard/transactions` },
    });

    return { text, html };
  }

  getPasswordResetEmailTemplate(fullName: string, resetLink: string): string {
    return this.renderLayout({
      heading: 'Reset your password',
      bodyHtml: `<p>Hello ${escapeHtml(fullName)},</p>
        <p>We received a request to reset the password for your account. Use the button below to choose a new one. The link expires in <strong>1 hour</strong>.</p>
        <p style="color:#64748b;font-size:13px">If you didn't ask for this, you can ignore this email. Your password won't change.</p>`,
      cta: { label: 'Choose a new password', href: resetLink },
    });
  }
}
