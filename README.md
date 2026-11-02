# Amlumina AI

A study companion that teaches the way you learn, plans your time, and checks your Google Classroom.

## Core functions

| # | Function | Description |
|---|---|---|
| 1 | Accounts | Email and password or Google sign-in, with terms consent |
| 2 | Email verification | 6-digit OTP, 10-minute expiry, 5 attempts |
| 3 | Password recovery | Single-use reset link, 30-minute expiry |
| 4 | Security alerts | Emails for new sign-ins, account changes, password changes |
| 5 | Sessions | Short-lived access token and rotating refresh token |
| 6 | Bring your own key | Gemini API key stored encrypted |
| 7 | Learning methods | Step-by-Step, Fast Learning, Socratic, Practice-First, Analogies, Deep Dive |
| 8 | AI chat | Streaming replies, tool activity rows, Markdown, tables, math |
| 9 | Chat management | Rename, pin, delete, retry, copy, load earlier messages |
| 10 | Long-chat memory | Rolling summary keeps context and saves tokens |
| 11 | Model fallback | Automatic switch to the next Gemini model on quota or outage |
| 12 | File attachments | Attach text or text-based PDF files to a chat |
| 13 | Google Classroom | Read-only courses, coursework, announcements, materials |
| 14 | Documents | Real rich-text editor with autosave, formatting, tables, export |
| 15 | Calendar | Month view, color-coded events, edit and delete, `.ics` export |
| 16 | Tasks | Add, complete, delete, due dates, email reminders |
| 17 | Flashcards | AI-made decks, spaced-repetition review |
| 18 | Quizzes | AI-made multiple choice, server grading, explanations |
| 19 | Focus timer | Timed sessions, streak, weekly chart |
| 20 | Progress dashboard | Focus, cards, quizzes, tasks, chat activity |
| 21 | Sharing | Read-only links for documents and decks |
| 22 | Study profile | Level, subjects, goals tailor AI answers |
| 23 | Language | English and Filipino interface, AI replies in your language |
| 24 | Usage | Daily token meter and 7-day chart |
| 25 | Daily email | Optional digest of tasks and flashcards due |
| 26 | Admin page | Read-only stats for verified admin emails |
| 27 | Rate limiting | Shared Redis limiter on sensitive routes |
| 28 | Theme | Light, dark, system |

## What Lumi can do from chat

| Ask | Result |
|---|---|
| "Check my Google Classroom" | Lists courses and what is due |
| "Create a reviewer about photosynthesis" | Saves a document to the Library with a link |
| "Plan 3 study sessions this week at 7pm" | Adds colored events to the calendar |
| "Add a task to review chapter 3 due Friday" | Creates a task |
| "Make flashcards about the Krebs cycle" | Creates a deck to review |
| "Quiz me on this document" | Creates a graded quiz |
| "Search the web for the latest on Artemis" | Searches and cites sources |

## Tech stack

| Layer | Tools |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS, React Router, TipTap, react-markdown |
| Backend | Express, TypeScript, Zod, Drizzle ORM |
| Database | TiDB (MySQL compatible) |
| AI | LangChain, Google Gemini |
| Email | Nodemailer (Gmail SMTP) |
| Rate limit | Upstash Redis |
| Hosting | Vercel (frontend and backend as two projects) |

## Security notes

- Passwords are hashed. Gemini keys and Google tokens are AES-256-GCM encrypted.
- Refresh tokens are stored as hashes, with reuse detection.
- The web tool blocks private network addresses.
- All user documents are sanitized before saving and before public viewing.
- Shared links are secret URLs and can be turned off at any time.

## Environment variables

`TIDB_*`, `JWT_ACCESS_SECRET`, `JWT_STATE_SECRET`, `ENCRYPTION_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `SMTP_USER`, `SMTP_APP_PASSWORD`, `MAIL_FROM_NAME`, `FRONTEND_URL`, `GEMINI_MODELS`, `CRON_SECRET`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `ADMIN_EMAILS`. Frontend: `VITE_API_URL`.
