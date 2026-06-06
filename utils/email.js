import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

export const sendVerificationEmail = async (email, firstName, token) => {
  const link = `${FRONTEND_URL}/verify-email?token=${token}`;

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Verify your Stonepath account',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 24px; color: #c9a84c; margin: 0;">Stonepath™</h1>
        </div>
        <h2 style="font-size: 20px; font-weight: 400; color: #111;">Hi ${firstName},</h2>
        <p style="color: #555; line-height: 1.6;">
          Thanks for creating a Stonepath account. Please verify your email address to get started.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${link}"
            style="background: #c9a84c; color: #000; padding: 14px 32px; text-decoration: none; font-weight: 600; font-size: 14px; letter-spacing: 0.1em; text-transform: uppercase;">
            Verify Email
          </a>
        </div>
        <p style="color: #999; font-size: 12px;">
          This link expires in 24 hours. If you didn't create this account, ignore this email.
        </p>
      </div>
    `,
  });
};

export const sendPasswordResetEmail = async (email, firstName, token) => {
  const link = `${FRONTEND_URL}/reset-password?token=${token}`;

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Reset your Stonepath password',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 24px; color: #c9a84c; margin: 0;">Stonepath™</h1>
        </div>
        <h2 style="font-size: 20px; font-weight: 400; color: #111;">Hi ${firstName},</h2>
        <p style="color: #555; line-height: 1.6;">
          We received a request to reset your password. Click the button below to choose a new one.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${link}"
            style="background: #c9a84c; color: #000; padding: 14px 32px; text-decoration: none; font-weight: 600; font-size: 14px; letter-spacing: 0.1em; text-transform: uppercase;">
            Reset Password
          </a>
        </div>
        <p style="color: #999; font-size: 12px;">
          This link expires in 1 hour. If you didn't request this, ignore this email.
        </p>
      </div>
    `,
  });
};