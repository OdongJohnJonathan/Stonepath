import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ── VERIFICATION EMAIL ─────────────────────────────
export const sendVerificationEmail = async (email, firstName, token) => {
  const link = `${FRONTEND_URL}/verify-email?token=${token}`;
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Verify your Stonepath account',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0a0a0b; color: #fff;">
        <h1 style="font-size: 22px; color: #c9a84c; margin-bottom: 24px;">Stonepath™</h1>
        <h2 style="font-size: 20px; font-weight: 400; margin-bottom: 12px;">Hi ${firstName},</h2>
        <p style="color: #8892a4; line-height: 1.6; margin-bottom: 32px;">
          Thanks for creating a Stonepath account. Please verify your email address to get started.
        </p>
        <a href="${link}" style="background: #c9a84c; color: #000; padding: 14px 32px; text-decoration: none; font-weight: 600; font-size: 13px; letter-spacing: 0.1em; text-transform: uppercase; display: inline-block;">
          Verify Email
        </a>
        <p style="color: #555; font-size: 12px; margin-top: 32px;">
          This link expires in 24 hours. If you didn't create this account, ignore this email.
        </p>
      </div>
    `,
  });
};

// ── PASSWORD RESET EMAIL ───────────────────────────
export const sendPasswordResetEmail = async (email, firstName, token) => {
  const link = `${FRONTEND_URL}/reset-password?token=${token}`;
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Reset your Stonepath password',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0a0a0b; color: #fff;">
        <h1 style="font-size: 22px; color: #c9a84c; margin-bottom: 24px;">Stonepath™</h1>
        <h2 style="font-size: 20px; font-weight: 400; margin-bottom: 12px;">Hi ${firstName},</h2>
        <p style="color: #8892a4; line-height: 1.6; margin-bottom: 32px;">
          We received a request to reset your password. Click below to choose a new one.
        </p>
        <a href="${link}" style="background: #c9a84c; color: #000; padding: 14px 32px; text-decoration: none; font-weight: 600; font-size: 13px; letter-spacing: 0.1em; text-transform: uppercase; display: inline-block;">
          Reset Password
        </a>
        <p style="color: #555; font-size: 12px; margin-top: 32px;">
          This link expires in 1 hour. If you didn't request this, ignore this email.
        </p>
      </div>
    `,
  });
};

// ── NEW ENQUIRY — notify agent ─────────────────────
export const sendEnquiryNotificationToAgent = async ({
  agentEmail,
  agentFirstName,
  buyerName,
  buyerEmail,
  buyerPhone,
  propertyTitle,
  message,
}) => {
  await resend.emails.send({
    from: FROM,
    to: agentEmail,
    subject: `New enquiry on "${propertyTitle}"`,
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #0a0a0b; color: #fff;">
        <h1 style="font-size: 22px; color: #c9a84c; margin-bottom: 24px;">Stonepath™</h1>
        <h2 style="font-size: 20px; font-weight: 400; margin-bottom: 4px;">New Enquiry Received</h2>
        <p style="color: #8892a4; font-size: 13px; margin-bottom: 28px;">Someone is interested in one of your listings.</p>

        <div style="background: #1a1a1a; border-left: 3px solid #c9a84c; padding: 16px; margin-bottom: 24px;">
          <div style="font-size: 11px; color: #c9a84c; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px;">Property</div>
          <div style="font-size: 16px; color: #fff;">${propertyTitle}</div>
        </div>

        <div style="background: #1a1a1a; padding: 16px; margin-bottom: 24px;">
          <div style="font-size: 11px; color: #8892a4; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px;">Buyer Details</div>
          <div style="margin-bottom: 6px;"><span style="color: #8892a4;">Name:</span> <span style="color: #fff;">${buyerName}</span></div>
          <div style="margin-bottom: 6px;"><span style="color: #8892a4;">Email:</span> <a href="mailto:${buyerEmail}" style="color: #c9a84c;">${buyerEmail}</a></div>
          ${buyerPhone ? `<div><span style="color: #8892a4;">Phone:</span> <span style="color: #fff;">${buyerPhone}</span></div>` : ''}
        </div>

        <div style="background: #1a1a1a; padding: 16px; margin-bottom: 32px;">
          <div style="font-size: 11px; color: #8892a4; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px;">Their Message</div>
          <p style="color: #fff; line-height: 1.6; margin: 0;">${message}</p>
        </div>

        <a href="${FRONTEND_URL}" style="background: #c9a84c; color: #000; padding: 14px 32px; text-decoration: none; font-weight: 600; font-size: 13px; letter-spacing: 0.1em; text-transform: uppercase; display: inline-block;">
          Reply on Stonepath
        </a>

        <p style="color: #555; font-size: 12px; margin-top: 32px;">
          Hi ${agentFirstName}, log in to your Stonepath dashboard to reply to this enquiry.
        </p>
      </div>
    `,
  });
};

// ── ENQUIRY REPLY — notify buyer ──────────────────
export const sendReplyNotificationToBuyer = async ({
  buyerEmail,
  buyerFirstName,
  agentName,
  agentEmail,
  agentPhone,
  propertyTitle,
  originalMessage,
  reply,
}) => {
  await resend.emails.send({
    from: FROM,
    to: buyerEmail,
    subject: `Reply to your enquiry on "${propertyTitle}"`,
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #0a0a0b; color: #fff;">
        <h1 style="font-size: 22px; color: #c9a84c; margin-bottom: 24px;">Stonepath™</h1>
        <h2 style="font-size: 20px; font-weight: 400; margin-bottom: 4px;">The Agent Has Replied</h2>
        <p style="color: #8892a4; font-size: 13px; margin-bottom: 28px;">You have a response to your property enquiry.</p>

        <div style="background: #1a1a1a; border-left: 3px solid #c9a84c; padding: 16px; margin-bottom: 24px;">
          <div style="font-size: 11px; color: #c9a84c; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px;">Property</div>
          <div style="font-size: 16px; color: #fff;">${propertyTitle}</div>
        </div>

        <div style="background: #1a1a1a; padding: 16px; margin-bottom: 16px;">
          <div style="font-size: 11px; color: #8892a4; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">Your Enquiry</div>
          <p style="color: #8892a4; line-height: 1.6; margin: 0;">${originalMessage}</p>
        </div>

        <div style="background: #1a1a1a; border-left: 3px solid #22c55e; padding: 16px; margin-bottom: 24px;">
          <div style="font-size: 11px; color: #22c55e; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">Agent Reply</div>
          <p style="color: #fff; line-height: 1.6; margin: 0;">${reply}</p>
        </div>

        <div style="background: #1a1a1a; padding: 16px; margin-bottom: 32px;">
          <div style="font-size: 11px; color: #8892a4; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px;">Agent Contact</div>
          <div style="margin-bottom: 6px;"><span style="color: #8892a4;">Name:</span> <span style="color: #fff;">${agentName}</span></div>
          <div style="margin-bottom: 6px;"><span style="color: #8892a4;">Email:</span> <a href="mailto:${agentEmail}" style="color: #c9a84c;">${agentEmail}</a></div>
          ${agentPhone ? `<div><span style="color: #8892a4;">Phone:</span> <span style="color: #fff;">${agentPhone}</span></div>` : ''}
        </div>

        <a href="${FRONTEND_URL}" style="background: #c9a84c; color: #000; padding: 14px 32px; text-decoration: none; font-weight: 600; font-size: 13px; letter-spacing: 0.1em; text-transform: uppercase; display: inline-block;">
          View on Stonepath
        </a>

        <p style="color: #555; font-size: 12px; margin-top: 32px;">
          Hi ${buyerFirstName}, you can contact the agent directly using the details above.
        </p>
      </div>
    `,
  });
};
export const sendInspectionNotificationToAgent = async ({
  agentEmail, agentFirstName, buyerName, buyerEmail,
  buyerPhone, propertyTitle, preferredDate, preferredTime, message,
}) => {
  await resend.emails.send({
    from: FROM,
    to: agentEmail,
    subject: `Inspection booked for "${propertyTitle}"`,
    html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#0a0a0b;color:#fff;"><h1 style="color:#c9a84c;margin-bottom:24px;">Stonepath™</h1><h2 style="font-weight:400;margin-bottom:4px;">Inspection Request</h2><p style="color:#8892a4;font-size:13px;margin-bottom:28px;">A buyer has booked a property inspection.</p><div style="background:#1a1a1a;border-left:3px solid #c9a84c;padding:16px;margin-bottom:16px;"><div style="font-size:11px;color:#c9a84c;text-transform:uppercase;margin-bottom:6px;">Property</div><div>${propertyTitle}</div></div><div style="background:#1a1a1a;border-left:3px solid #22c55e;padding:16px;margin-bottom:16px;"><div style="font-size:11px;color:#22c55e;text-transform:uppercase;margin-bottom:10px;">Inspection Details</div><div style="margin-bottom:6px;"><span style="color:#8892a4;">Date:</span> <strong>${preferredDate}</strong></div><div><span style="color:#8892a4;">Time:</span> <strong>${preferredTime}</strong></div></div><div style="background:#1a1a1a;padding:16px;margin-bottom:24px;"><div style="font-size:11px;color:#8892a4;text-transform:uppercase;margin-bottom:10px;">Buyer Details</div><div style="margin-bottom:6px;"><span style="color:#8892a4;">Name:</span> ${buyerName}</div><div style="margin-bottom:6px;"><span style="color:#8892a4;">Email:</span> <a href="mailto:${buyerEmail}" style="color:#c9a84c;">${buyerEmail}</a></div>${buyerPhone ? `<div><span style="color:#8892a4;">Phone:</span> ${buyerPhone}</div>` : ''}${message ? `<div style="margin-top:10px;"><span style="color:#8892a4;">Note:</span> ${message}</div>` : ''}</div><div style="background:#1a1a1a;padding:12px 16px;margin-bottom:28px;"><div style="font-size:12px;color:#22c55e;">✓ Payment of UGX 2,000 confirmed</div></div><a href="${FRONTEND_URL}" style="background:#c9a84c;color:#000;padding:14px 32px;text-decoration:none;font-weight:600;font-size:13px;text-transform:uppercase;display:inline-block;">View on Stonepath</a><p style="color:#555;font-size:12px;margin-top:32px;">Hi ${agentFirstName}, please confirm this inspection on your Stonepath dashboard.</p></div>`,
  });
};

export const sendInspectionConfirmationToBuyer = async ({
  buyerEmail, buyerFirstName, propertyTitle,
  preferredDate, preferredTime, agentName, agentEmail, agentPhone,
}) => {
  await resend.emails.send({
    from: FROM,
    to: buyerEmail,
    subject: `Inspection booked for "${propertyTitle}"`,
    html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#0a0a0b;color:#fff;"><h1 style="color:#c9a84c;margin-bottom:24px;">Stonepath™</h1><h2 style="font-weight:400;margin-bottom:4px;">Inspection Booked!</h2><p style="color:#8892a4;font-size:13px;margin-bottom:28px;">Your inspection has been booked successfully.</p><div style="background:#1a1a1a;border-left:3px solid #c9a84c;padding:16px;margin-bottom:16px;"><div style="font-size:11px;color:#c9a84c;text-transform:uppercase;margin-bottom:6px;">Property</div><div>${propertyTitle}</div></div><div style="background:#1a1a1a;border-left:3px solid #22c55e;padding:16px;margin-bottom:16px;"><div style="font-size:11px;color:#22c55e;text-transform:uppercase;margin-bottom:10px;">Your Inspection</div><div style="margin-bottom:6px;"><span style="color:#8892a4;">Date:</span> <strong>${preferredDate}</strong></div><div><span style="color:#8892a4;">Time:</span> <strong>${preferredTime}</strong></div></div><div style="background:#1a1a1a;padding:16px;margin-bottom:24px;"><div style="font-size:11px;color:#8892a4;text-transform:uppercase;margin-bottom:10px;">Agent Contact</div><div style="margin-bottom:6px;"><span style="color:#8892a4;">Name:</span> ${agentName}</div><div style="margin-bottom:6px;"><span style="color:#8892a4;">Email:</span> <a href="mailto:${agentEmail}" style="color:#c9a84c;">${agentEmail}</a></div>${agentPhone ? `<div><span style="color:#8892a4;">Phone:</span> ${agentPhone}</div>` : ''}</div><div style="background:#1a1a1a;padding:12px 16px;margin-bottom:28px;"><div style="font-size:12px;color:#22c55e;">✓ Payment of UGX 2,000 received</div></div><a href="${FRONTEND_URL}" style="background:#c9a84c;color:#000;padding:14px 32px;text-decoration:none;font-weight:600;font-size:13px;text-transform:uppercase;display:inline-block;">View on Stonepath</a><p style="color:#555;font-size:12px;margin-top:32px;">Hi ${buyerFirstName}, the agent will be in touch to confirm. Contact them directly above.</p></div>`,
  });
};
