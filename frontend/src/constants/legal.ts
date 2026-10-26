import type { LegalDoc } from "../types/legal";
import { APP_NAME, SUPPORT_EMAIL } from "./app";

export const LEGAL_IS_DRAFT = false; // shows the "needs legal review" notice; set false after review
export const LEGAL_LAST_UPDATED = "October 20, 2026";
export const LEGAL_CONTACT_EMAIL: string | null = SUPPORT_EMAIL; // add your support email

const contact = LEGAL_CONTACT_EMAIL
  ? `Questions or requests: ${LEGAL_CONTACT_EMAIL}.`
  : "Contact details will be added before launch.";

export const termsDoc: LegalDoc = {
  title: "Terms of Use",
  summary: `These terms explain the rules for using ${APP_NAME}. Please read them before you create an account.`,
  sections: [
    {
      id: "agreement",
      title: "Agreement",
      body: [
        `By creating an account or using ${APP_NAME}, you agree to these Terms of Use and to the Privacy & Data policy. If you do not agree, do not use ${APP_NAME}.`,
      ],
    },
    {
      id: "accounts",
      title: "Your account",
      body: [
        [
          "Give accurate information when you sign up.",
          "Keep your password secure. You are responsible for activity on your account.",
          "Tell us if you think someone else has accessed your account.",
        ],
      ],
    },
    {
      id: "gemini-key",
      title: "Your Gemini API key",
      body: [
        `${APP_NAME} works with your own Gemini API key. You are responsible for the key, for any usage or charges on it, and for following Google's terms for the Gemini API.`,
        `We store the key encrypted and use it only to send your requests to Gemini. If the key is invalid, revoked or out of quota, ${APP_NAME} cannot answer. ${APP_NAME} also applies its own daily usage limit, which can change.`,
      ],
    },
    {
      id: "connected-apps",
      title: "Connected Google apps",
      body: [
        `You choose which Google apps to connect, and you can disconnect an account at any time from Settings. ${APP_NAME} uses a connected app only to carry out what you ask for in a chat.`,
        [
          "It can read data such as courses, events and files, and can create or update items such as tasks, events, documents, spreadsheets and folders.",
          "It has no tool to delete your files or other items.",
          "A school administrator may restrict school accounts. You are responsible for following your school's rules when you connect a school account.",
        ],
      ],
    },
    {
      id: "ai-answers",
      title: "AI answers",
      body: [
        `${APP_NAME} uses AI, and AI can be wrong or out of date. Check important information, such as deadlines and facts, before you rely on it. ${APP_NAME} is a study aid and does not give professional, legal, medical or financial advice.`,
      ],
    },
    {
      id: "academic-integrity",
      title: "Academic integrity",
      body: [
        `${APP_NAME} is built to help you understand material. You are responsible for how you use its answers in your coursework and for following your school's academic integrity rules.`,
      ],
    },
    {
      id: "acceptable-use",
      title: "Acceptable use",
      body: [
        "Do not:",
        [
          "break the law or use the service to harm others",
          "try to access another person's account or data",
          "probe, overload or interfere with the service, or try to get around its limits",
          "use the service to build or train a competing product",
        ],
      ],
    },
    {
      id: "your-content",
      title: "Your content",
      body: [
        `You keep ownership of the messages you write. You give ${APP_NAME} permission to process them, and the results of the tools you ask it to run, only to provide the service to you.`,
      ],
    },
    {
      id: "third-party",
      title: "Other services",
      body: [
        `${APP_NAME} relies on services from other companies, including Google (sign-in, Classroom, Drive, Docs, Sheets, Calendar, Tasks and Gemini) and a web search provider. Their own terms apply to your use of them, and we are not responsible for their availability or content.`,
      ],
    },
    {
      id: "availability",
      title: "Availability and changes",
      body: [
        `${APP_NAME} is an early product. Features can change, and the service can be interrupted or stopped.`,
      ],
    },
    {
      id: "liability",
      title: "Disclaimers and liability",
      body: [
        `${APP_NAME} is provided "as is" and "as available", without warranties of any kind, to the extent permitted by law. To the extent permitted by law, we are not liable for indirect or consequential losses, or for loss of data or grades arising from your use of ${APP_NAME}.`,
      ],
    },
    {
      id: "ending",
      title: "Ending your use",
      body: [
        "You can stop using the service and delete your account at any time from Profile. We may suspend or close accounts that break these terms.",
      ],
    },
    {
      id: "changes",
      title: "Changes to these terms",
      body: [
        "We may update these terms. The date at the top shows the latest version.",
      ],
    },
    { id: "contact", title: "Contact", body: [contact] },
  ],
};

export const privacyDoc: LegalDoc = {
  title: "Privacy & Data",
  summary: `This policy explains what ${APP_NAME} collects, why, and who it is shared with.`,
  sections: [
    {
      id: "collect",
      title: "Information we collect",
      body: [
        [
          "Account: your full name, email, sign-in method, and your password stored only as a one-way hash.",
          "Gemini API key: stored encrypted. It is never shown again.",
          "Chats: the messages you send, the replies, chat titles, your learning method, and a record of which tools ran and whether they succeeded.",
          "Connected Google accounts: the Google account ID and email, whether it is personal or school, the apps you enabled, the permissions granted, and access and refresh tokens (stored encrypted).",
          "Usage: how many tokens you use each day.",
          "Sessions: a hash of each refresh token, your browser and device details (user agent), IP address, and when the session was created and expires.",
        ],
      ],
    },
    {
      id: "use",
      title: "How we use it",
      body: [
        [
          `to provide ${APP_NAME}, including your chats and the tools you ask it to run`,
          "to keep your account secure and keep you signed in",
          "to apply daily usage limits",
        ],
      ],
    },
    {
      id: "google-data",
      title: "Google user data",
      body: [
        `${APP_NAME} accesses data only for the Google apps you enable, and only when you ask for it in a chat. Content it reads from Google, such as course names or event titles, is sent to Gemini so it can write a reply.`,
        `${APP_NAME}'s use of information received from Google APIs adheres to the Google API Services User Data Policy, including the Limited Use requirements.`,
      ],
    },
    {
      id: "sharing",
      title: "Who we share data with",
      body: [
        "We share data only with the services needed to run the product:",
        [
          "Google Gemini: your messages, recent chat history and tool results are sent using your own API key to generate replies. Google's terms apply to that use.",
          "Google APIs: to carry out the actions you ask for in Classroom, Drive, Docs, Sheets, Calendar and Tasks.",
          "A web search provider: search queries the assistant makes when a question needs current information.",
          "Our hosting and database providers, who store the data described above.",
        ],
        "We do not sell your personal data.",
      ],
    },
    {
      id: "security",
      title: "Storage and security",
      body: [
        [
          "Passwords are stored as hashes, never in plain text.",
          "Your Gemini key and Google tokens are encrypted before they are stored.",
          "Refresh tokens are stored only as hashes.",
        ],
        "No system is perfectly secure, so we cannot guarantee absolute security.",
      ],
    },
    {
      id: "retention",
      title: "Retention and deletion",
      body: [
        "We keep your data while your account is active. You can:",
        [
          "delete any chat, which removes its messages",
          "disconnect a Google account, which removes its stored tokens and revokes access at Google",
          "delete your account from Profile, which removes your data",
        ],
      ],
    },
    {
      id: "choices",
      title: "Your choices",
      body: [
        "You can update your name, replace your Gemini key, choose which apps stay connected, and change your learning method at any time. For other requests, use the contact details below.",
      ],
    },
    {
      id: "changes",
      title: "Changes to this policy",
      body: [
        "We may update this policy. The date at the top shows the latest version.",
      ],
    },
    { id: "contact", title: "Contact", body: [contact] },
  ],
};
