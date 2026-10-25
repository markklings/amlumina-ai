import { env } from "../config/env";

const APP = env.MAIL_FROM_NAME;
const appUrl = () => env.FRONTEND_URL.replace(/\/+$/, "");

export interface Mail {
  subject: string;
  html: string;
  text: string;
}

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

interface Content {
  preheader: string;
  heading: string;
  paragraphs: string[];
  code?: string;
  button?: { label: string; url: string };
}

function render(subject: string, c: Content): Mail {
  const paragraphs = c.paragraphs
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#3f3f46;">${esc(p)}</p>`,
    )
    .join("");
  const code = c.code
    ? `<p style="margin:8px 0 24px;font-size:32px;line-height:40px;font-weight:600;letter-spacing:8px;color:#18181b;">${esc(c.code)}</p>`
    : "";
  const button = c.button
    ? `<p style="margin:8px 0 20px;"><a href="${esc(c.button.url)}" style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 20px;border-radius:8px;">${esc(c.button.label)}</a></p>` +
      `<p style="margin:0 0 16px;font-size:12px;line-height:18px;color:#71717a;word-break:break-all;">Or paste this link into your browser:<br>${esc(c.button.url)}</p>`
    : "";

  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#f4f4f5;">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(c.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;"><tr>
<td style="padding:32px;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<p style="margin:0 0 24px;font-size:16px;font-weight:600;color:#18181b;">${esc(APP)}</p>
<h1 style="margin:0 0 16px;font-size:22px;line-height:28px;font-weight:600;color:#18181b;">${esc(c.heading)}</h1>
${paragraphs}${code}${button}
<p style="margin:24px 0 0;padding-top:16px;border-top:1px solid #e4e4e7;font-size:12px;line-height:18px;color:#71717a;">You are receiving this email because of activity on your ${esc(APP)} account.</p>
</td></tr></table></td></tr></table></body></html>`;

  const text = [
    c.heading,
    ...c.paragraphs,
    c.code ?? "",
    c.button ? `${c.button.label}: ${c.button.url}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  return { subject, html, text };
}

const first = (name: string) => name.split(" ")[0] || "there";
const resetLink = () => ({
  label: "Reset password",
  url: `${appUrl()}/forgot-password`,
});

export const verifyEmailOtp = (
  name: string,
  code: string,
  minutes: number,
): Mail =>
  render(`${code} is your ${APP} verification code`, {
    preheader: `Your code expires in ${minutes} minutes.`,
    heading: "Verify your email",
    paragraphs: [
      `Hi ${first(name)}, enter this code to verify your email address. It expires in ${minutes} minutes.`,
      "If you did not create an account, you can ignore this email.",
    ],
    code,
  });

export const resetPassword = (
  name: string,
  url: string,
  minutes: number,
): Mail =>
  render(`Reset your ${APP} password`, {
    preheader: `This link expires in ${minutes} minutes.`,
    heading: "Reset your password",
    paragraphs: [
      `Hi ${first(name)}, we received a request to reset your password. The link works once and expires in ${minutes} minutes.`,
      "If you did not ask for this, you can ignore this email. Your password will not change.",
    ],
    button: { label: "Choose a new password", url },
  });

export const passwordChanged = (name: string): Mail =>
  render(`Your ${APP} password was changed`, {
    preheader: "You were signed out of all devices.",
    heading: "Your password was changed",
    paragraphs: [
      `Hi ${first(name)}, the password for your account was just changed, and you were signed out of all devices.`,
      "If this was not you, reset your password now.",
    ],
    button: resetLink(),
  });

export const newLogin = (
  name: string,
  d: { device: string; ip: string; when: string },
): Mail =>
  render(`New sign-in to your ${APP} account`, {
    preheader: `${d.device} · ${d.ip}`,
    heading: "New sign-in detected",
    paragraphs: [
      `Hi ${first(name)}, we noticed a sign-in from a device we have not seen before.`,
      `Device: ${d.device}`,
      `IP address: ${d.ip}`,
      `Time: ${d.when}`,
      "If this was you, no action is needed. If not, reset your password right away.",
    ],
    button: resetLink(),
  });

export const accountUpdated = (name: string, change: string): Mail =>
  render(`Your ${APP} account was updated`, {
    preheader: change,
    heading: "Your account was updated",
    paragraphs: [
      `Hi ${first(name)}, a change was made to your account: ${change}.`,
      "If you did not make this change, reset your password right away.",
    ],
    button: resetLink(),
  });

export const accountDeleted = (name: string): Mail =>
  render(`Your ${APP} account was deleted`, {
    preheader: "Your data has been removed.",
    heading: "Your account was deleted",
    paragraphs: [
      `Hi ${first(name)}, your ${APP} account and its data were deleted.`,
      "If you did not request this, reply to this email.",
    ],
  });
