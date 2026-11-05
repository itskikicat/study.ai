# Quizly v6.3 — Vercel build

## Features
- Registration/login with bcrypt password hashing
- Six-digit Gmail verification, 10-minute expiry, one-minute resend cooldown
- Neon Postgres persistence (accounts and notes)
- Signed HttpOnly session cookies
- OpenAI AI Tutor, image question scanner, quiz generator, flashcards
- Study Notes
- `/admin` password-protected admin dashboard
- Admin stats, user search, ban/unban, permanent account deletion, activity log

## Setup
1. Create a Neon Postgres database and copy its connection string.
2. In Vercel → Project → Settings → Environment Variables, add:
   - `DATABASE_URL` = Neon connection string
   - `SESSION_SECRET` = long random secret (32+ random characters)
   - `ADMIN_PASSWORD` = your private admin password
   - `OPENAI_API_KEY` = OpenAI API key
   - `OPENAI_MODEL` = `gpt-4.1-mini`
   - `EMAIL_USER` = your new sender email address (choose/create this address first)
   - `EMAIL_PASS` = Gmail 16-character App Password (without spaces)
   - `EMAIL_FROM` = `Quizly <your-new-email@example.com>` (use the same address as EMAIL_USER)
   - `SMTP_HOST` = `smtp.gmail.com`
   - `SMTP_PORT` = `465`
   - `NODE_ENV` = `production`
3. Extract this ZIP and replace the files in your existing GitHub repository. Keep the same repo and Vercel project.
4. Commit and push. Vercel should redeploy automatically.
5. Visit your site. Open `/admin` to access the admin login.

Keep your existing database, OpenAI, session, and admin environment-variable values in Vercel. When you choose the new sender email, update `EMAIL_USER`, `EMAIL_PASS`, and `EMAIL_FROM` to match that email provider, then redeploy.

## Security
Never commit `.env` or expose API keys, Gmail app passwords, or admin passwords in frontend code. If a secret is exposed, rotate it. Admin does not expose users' private AI chat contents. Permanent account deletion cannot be undone.

AI API usage may cost money separately from a ChatGPT subscription. If you're under 18, ask a parent/guardian to help with third-party developer accounts and billing. This is source code and should be tested on a staging deployment before inviting users.


## v6.1 fix
- Corrected session cookie creation and clearing for Express/Vercel using the `cookie` package.
- Refreshed the interface with a responsive dark study-dashboard design.


## v6.2 deployment adjustment
- Made the root Express entrypoint explicitly import Express so Vercel's Express framework detection can identify it.

## v6.3 Quizly rebrand
- Rebranded the site and admin panel to Quizly.
- Renamed the study assistant to Quizly AI.
- Updated verification email branding.
- Left the sender address configurable because the new email address has not been chosen yet.
