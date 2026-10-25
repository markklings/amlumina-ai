import nodemailer from "nodemailer";
import type { Request } from "express";
import { env } from "../config/env";
import { describeDevice } from "./device.service";
import { waitUntil } from "@vercel/functions";
import * as tpl from "./mail.templates";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: { user: env.SMTP_USER, pass: env.SMTP_APP_PASSWORD },
});

export async function verifyMailTransport() {
  try {
    await transporter.verify();
    console.log("Mail ready (Gmail SMTP)");
  } catch (e) {
    console.error(
      "Mail transport check failed:",
      e instanceof Error ? e.message : e,
    );
  }
}

interface MailUser {
  email: string;
  fullName: string;
}

async function deliver(to: string, m: tpl.Mail) {
  await transporter.sendMail({
    from: { name: env.MAIL_FROM_NAME, address: env.SMTP_USER },
    to,
    subject: m.subject,
    html: m.html,
    text: m.text,
  });
}

// function queue(label: string, to: string, m: tpl.Mail) {
//   void deliver(to, m).catch((e) =>
//     console.error(
//       `Email failed (${label}):`,
//       e instanceof Error ? e.message : e,
//     ),
//   );
// }
function queue(label: string, to: string, m: tpl.Mail) {
  const task = deliver(to, m).catch((e) =>
    console.error(
      `Email failed (${label}):`,
      e instanceof Error ? e.message : e,
    ),
  );
  try {
    waitUntil(task); // keeps the function alive until the email is sent
  } catch {
    /* not running on Vercel (local dev): the promise still runs */
  }
}

export const mail = {
  otpNow: (u: MailUser, code: string, minutes: number) =>
    deliver(u.email, tpl.verifyEmailOtp(u.fullName, code, minutes)),
  otp: (u: MailUser, code: string, minutes: number) =>
    queue(
      "verify-email OTP",
      u.email,
      tpl.verifyEmailOtp(u.fullName, code, minutes),
    ),
  passwordReset: (u: MailUser, url: string, minutes: number) =>
    queue(
      "password reset",
      u.email,
      tpl.resetPassword(u.fullName, url, minutes),
    ),
  passwordChanged: (u: MailUser) =>
    queue("password changed", u.email, tpl.passwordChanged(u.fullName)),
  newLogin: (u: MailUser, req: Request) =>
    queue(
      "new login",
      u.email,
      tpl.newLogin(u.fullName, {
        device: describeDevice(req.headers["user-agent"]),
        ip: req.ip ?? "unknown",
        when: `${new Date().toUTCString()} (UTC)`,
      }),
    ),
  accountUpdated: (u: MailUser, change: string) =>
    queue("account updated", u.email, tpl.accountUpdated(u.fullName, change)),
  accountDeleted: (u: MailUser) =>
    queue("account deleted", u.email, tpl.accountDeleted(u.fullName)),
};
