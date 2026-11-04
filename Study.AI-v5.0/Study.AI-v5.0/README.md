# Study.AI v5.0

A responsive AI study workspace with email/password accounts, email verification, an AI tutor, screenshot question scanning, quizzes, flashcards, and notes.

## Requirements
- Node.js 20+
- An OpenAI API key for AI chat and question scanning
- A Resend account and a sender domain verified with Resend for verification emails

## Run locally
1. Extract the ZIP and open the project folder.
2. Run `npm install`.
3. Copy `.env.example` to `.env`.
4. Fill in `SESSION_SECRET`, `OPENAI_API_KEY`, `RESEND_API_KEY`, and `EMAIL_FROM`.
5. Run `npm start`.
6. Open `http://localhost:3000`.

Never put API keys in `public/` files or share them in chat. Keep `.env` private.

## Email verification
Resend sends a six-digit code. Codes expire after 10 minutes and can be resent. The sender address must use a domain verified in Resend. Until configured, registration will show a clear email-provider setup error rather than pretending an email was sent.

## Deploy on Render
The included `render.yaml` creates a persistent disk at `/var/data` for account data. Add the secret environment variables in Render's dashboard. Configure a verified Resend sender in `EMAIL_FROM`.

## AI usage and costs
AI requests use the OpenAI API from the server. API usage may cost money and is separate from a ChatGPT subscription. Ask a parent/guardian to help with provider accounts and billing if needed. Never paste API keys into the browser or public Git repository.

## Included features
- Email/password registration and sign-in
- Six-digit email verification, 10-minute expiry, resend
- Password hashing, rate limits, file-backed login sessions, secure session cookie settings
- Server-side OpenAI API integration
- AI chat history in the browser, new chat, typing indicator
- Screenshot question scanner (upload an image and ask for help)
- Quiz Arena, interactive flashcards, Study Notes
- Responsive navigation and mobile layout

## Important
Study.AI is a study assistant. The scanner works on questions you provide for learning and practice; it is not designed to interfere with live quiz games, reveal hidden answers, or bypass platform protections.
