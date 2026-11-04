# Study.AI v3.0

A responsive study website with a SchoolCheats-inspired information architecture and original Study.AI branding. It includes a landing page, an interactive practice quiz, flashcards, a browser-saved notes page, and a chat-style Study AI preview.

## Run locally

Requires Node.js 18 or newer.

```bash
npm start
```

Then open http://localhost:3000.

## Deploy on Render

- Runtime: Node
- Build command: `npm install`
- Start command: `npm start`
- Make sure `package.json` is in the repository root.

## Deploy on Railway

Connect the repository and use `npm start` as the start command.

## What's functional

- All homepage navigation and tool links route to their pages.
- Quiz Arena supports answers, explanations, scoring, and retry.
- Flashcards flip and navigate forward/backward.
- Study Notes autosave in the current browser using local storage.
- Study AI has a chat-style interface, new conversations, prompt suggestions, message history during the session, typing indicator, and sample educational replies.

## Important limitation

The Study AI chat is currently a front-end demo with built-in sample responses. It is not connected to a live AI model. To enable real AI responses, add a server-side API endpoint and keep the provider API key in an environment variable. Never expose an API key in browser JavaScript.

This project is an original study and practice product. It does not access or manipulate live classroom games, assignments, or third-party platforms.
