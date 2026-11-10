# Eduora v6.5 — Vercel build

## Features
- Registration/login with bcrypt password hashing
- Six-digit Gmail verification, 10-minute expiry, one-minute resend cooldown
- Neon Postgres persistence (accounts and notes)
- Signed HttpOnly session cookies
- OpenAI AI Tutor, image question scanner, quiz generator, flashcards
- Study Notes
- Personal Study Planner with due dates, completion checkboxes, and per-account task storage
- Quiz scoring, explanations, retry, and progress feedback
- Flashcard shuffle and navigation
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
   - `EMAIL_FROM` = `Eduora <your-new-email@example.com>` (use the same address as EMAIL_USER)
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

## v6.3 Eduora rebrand
- Rebranded the site and admin panel to Eduora.
- Renamed the study assistant to Eduora AI.
- Updated verification email branding.
- Left the sender address configurable because the new email address has not been chosen yet.


## v6.5 improvements
- Fixed the email validation expression and strengthened verification-code comparison.
- Added Express static-file serving for the `public` directory and an `/admin` route.
- Updated Vercel rewrites so the Express app can serve the homepage, static assets, admin page, and API routes through the same function.
- Added a per-user Study Planner with optional due dates, completion tracking, and task deletion.
- Improved quiz answer feedback, score summary, and retry flow.
- Added flashcard shuffle and improved loading/error states.
- Improved image type/size validation in the browser before upload.

## Deploying v6.5 into the existing GitHub/Vercel project
1. Keep the existing Vercel project and its environment variables.
2. Extract the ZIP. Upload the files and folders *inside* the ZIP directly into the existing inner project folder (the folder that already contains `package.json`), replacing files when prompted. Do not upload the ZIP itself.
3. Keep Vercel Root Directory set to `Eduora-v6.3-Vercel/Eduora-v6.3-Vercel` if that is still the exact repository path containing `package.json`.
4. Keep Framework Preset set to Express, Build Command disabled, Output Directory disabled, and Install Command `npm install`.
5. Commit the new files and wait for Vercel to redeploy.
6. Check `/api/health`, the homepage `/`, and `/admin`.

The source was syntax-checked, but no code package can be guaranteed bug-free or fully production-ready without deploying it with your own database, email provider, and API credentials and testing those integrations. Test before inviting other users.


## Eduora 6.8 update
- New public landing page with feature overview, product preview, and Partners section.
- Existing authentication, email verification, study tools, planner, and admin endpoints retained.
- Branded HTML verification email sent through Resend from `Eduora <verify@eduora.net>`.
- AI uses Groq. Set `GROQ_API_KEY`; text uses `GROQ_MODEL` (default `openai/gpt-oss-20b`) and image scanning uses `qwen/qwen3.8-27b`.
- Keep `DATABASE_URL`, `SESSION_SECRET`, and `ADMIN_PASSWORD` configured in Render.


## Eduora 6.9 update
- Expanded the admin dashboard with last-login details, CSV user export, and refreshed account management.
- Added persistent website announcements and a maintenance notice control. The maintenance toggle displays a visitor notice; it does not block sign-in or disable the application.
- Added admin service checks for the database, AI provider-key presence, and email provider-key presence. These checks do not make external provider requests or expose secrets.
- Added a public Update Patch Notes button and version history on the landing page.
- Added responsive styling for the admin control center and patch-notes modal.

### v6.9 deployment notes
- Existing environment variables remain required: `DATABASE_URL`, `SESSION_SECRET`, `ADMIN_PASSWORD`, `GROQ_API_KEY`, and `RESEND_API_KEY`.
- The new `site_settings` table is created automatically by the existing database schema initializer.
- Upload the contents of this ZIP into the same GitHub project directory that contains `package.json`, replacing the previous files, then commit and deploy.
- After deployment, check `/api/health`, `/`, and `/admin`.


### Partner showcase update
The landing page includes the Mind Garden partner logo at `public/mind-garden-logo.jpeg`. The logo links to https://mind-garden.surge.sh and opens in a new tab. Eduora's star mark remains the primary Eduora logo.

\n\n## Eduora 6.9.1 update
- Added an About Eduora section describing Eduora as a website for students.
- Added a "Proudly made in Czechia" note.
- Added the footer copyright notice: © 2026 Eduora. All rights reserved.
- The Mind Garden partner card uses the exact logo image supplied for the project and opens the partner website in a new tab.

\n\n## Eduora 6.9.2 update
- Added a language selector with English, Arabic, Czech, German, Russian, Greek, French, and Spanish.
- The chosen language is saved in the browser and remains selectable after signing in.
- Arabic switches the page to right-to-left direction.
- Translations cover the main landing page, About section, authentication labels, and core study navigation; some generated content and deeper tool interactions may still appear in English.


## Version 6.9.3
- Added Hebrew language selection and right-to-left layout for the core interface.
- Added streamed Eduora AI chat responses.
- Added AI Image Studio (uses the Pollinations image endpoint; availability depends on that provider).
- Added Presentation Maker with editable slide cards, speaker notes, and browser print-to-PDF.
- Existing Render environment variables remain unchanged.


## v6.9.4 — Emergency shutdown controls
- Added an admin-only emergency maintenance shutdown that serves a maintenance page to public visitors while keeping the admin dashboard accessible.
- Added server-enforced feature switches for AI Chat, Image Generator, Presentation Maker, Image Scanner, and Quiz/Flashcard Generator.
- Added confirmation prompts and admin audit logging for shutdown settings.
- No new environment variables required.


## v6.9.5
- Removed the Image Generator from the student interface and API.
- Fixed admin settings by separating emergency controls and homepage announcement/maintenance settings into unique buttons and status messages.
- Added editable maintenance-page heading and message, stored in the database and rendered for visitors while maintenance mode is active.
- Expanded Hebrew interface translations and kept right-to-left layout behavior.


## v6.9.6 — Admin update history
- Added a release history section to the admin dashboard, showing the latest Eduora versions and their main changes.
- Updated the displayed application version to 6.9.6.
- Existing admin activity audit trail remains available separately.


## v6.9.7 — Full-site language system
- Language preference is persisted and changing language reloads the page.
- Added server-side Groq-powered translation for visible interface text, form labels, placeholders, accessibility labels, and dynamically added UI content; translations are cached per browser and language.
- Hebrew and Arabic set right-to-left document direction.
- AI chat, quizzes, flashcards, and presentations receive the selected output language.
- Uses the existing GROQ_API_KEY and GROQ_MODEL settings; no new environment variable.


## v6.9.8 — Social links
- Added an Eduora TikTok link in the public site footer.
- Added a clearly marked “More socials soon” placeholder for future X, Discord, or other links.


## v6.9.9 — Social links & clearer sign-in
- Added Eduora's X profile alongside TikTok in the public website footer.
- Renamed sign-in actions to "Log in" and account creation actions to "Create free account".
- Updated the authentication panel copy to explain the difference between logging in and registering.
- Made the signed-in email status clearer in the study space.


## v7.0.0 — Complete worksheet solver
The Question Scanner now prompts the vision model to complete all readable questions and blanks in an uploaded worksheet, preserve numbering, show calculation steps, and flag unreadable sections instead of guessing.


## v7.0.2 — Dashboard settings and chat composer fix
- Fixed the AI chat composer so the question field has usable width and readable placeholder/input text on desktop and mobile.
- Added a Settings page with a light/dark mode preference.
- Added a local preference to show or hide the signed-in email in the dashboard header.
- Preferences are stored in the browser on the current device; username/profile controls are reserved for a future update.


## v7.0.3 — Profile and expanded settings
- Added unique usernames and optional display names stored in Neon PostgreSQL.
- Added local preferences for text size, AI answer style, explanation level, theme, and email visibility.
- Existing accounts are upgraded automatically with nullable profile fields.


## v7.0.4
- Added username-based member discovery and private one-to-one messaging.
- Added conversation and message persistence in Neon PostgreSQL.
- Improved AI chat composer contrast, sizing, and responsive layout.


## v7.0.6 — Messaging media and account controls
- Improved desktop private-chat panel sizing and input visibility.
- Added image/video attachments to private messages (up to 8 MB per file; stored as data URLs in Neon).
- Added Hide chat / Show chat control.
- Added account deactivation and permanent deletion actions in Settings.
- Deactivation disables sign-in; reactivation currently requires administrator/database action.


## v7.0.6 community moderation
- Username is selected during registration and checked for uniqueness and banned terms.
- Admin can manage banned words in the admin panel, one per line.
- Matching words in direct messages are masked with # characters; the rest of the message remains visible.


## v7.0.7 — Member profiles, reports, and desktop chat
- Fixed desktop AI chat composer visibility and private-message layout sizing.
- Added profile descriptions and image avatars (PNG/JPG/WEBP, max 1 MB).
- Added public member profile modal with join date, description, avatar, message, and report actions.
- Added member report submission and admin report review/resolution controls.
- Database schema creates profile and report fields/tables automatically.


## v7.0.9 — More natural voice and Features shortcut
- Updated Eduora AI's system instructions to sound more conversational, less scripted, and more like a patient study helper.
- Rewrote key landing-page copy and the initial chat greeting in a more natural tone.
- Added a Features shortcut to the signed-in navigation, linking back to the public feature overview.


## v7.0.9
- Added a homepage Hide features / Show features toggle. The preference is remembered on the visitor’s device.
