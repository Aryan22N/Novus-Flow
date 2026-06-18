# Novus Flow

## The Problem
Modern professionals face a constant battle with information overload and fragmented workflows. Managing daily communication requires constantly switching between email clients, calendar applications, task managers, and AI tools. This context switching breaks focus, leads to missed action items, and consumes valuable time that could be spent on actual work. 

## What is the Product?
**Novus Flow** is a unified, intelligent workspace designed to seamlessly integrate your communication, scheduling, and AI assistance into a single, fluid interface. It serves as a comprehensive clone and enhancement of modern productivity tools, built with cutting-edge web technologies (Next.js 15, React 19, Tailwind CSS v4) to deliver a premium, glassmorphic, and highly responsive user experience.

## How Novus Flow Solves the Problem
Novus Flow tackles workflow fragmentation by centralizing your essential tools:

- **Unified Workspace:** Brings Gmail (email reading, drafting, sending, and thread management) and Google Calendar into a side-by-side orchestrated view. No more tabbing between your inbox and your schedule.
- **Nexus Assistant (AI Integration):** Our built-in AI deeply understands your context. 
  - *Thread Analysis:* Automatically summarizes long email threads and extracts key action items and meeting details.
  - *Smart Replies:* Generates context-aware drafts and 1-click suggested quick replies.
  - *Inbox Summarization:* Digests your recent unread emails so you can catch up in seconds.
  - *Adaptive Learning:* Learns from your corrections to improve future responses.
- **Real-Time Sync:** Leverages Gmail Pub/Sub push notifications for instant updates, categorizing emails into a Priority Inbox.

## 🍒 The Cherry on Top: Nova Voice
To truly elevate the user experience, Novus Flow includes **Nova Voice**—a built-in voice interface. Nova Voice allows you to interact with the Nexus AI assistant completely hands-free. Whether you need to dictate an email, query your schedule, or ask the AI to summarize a thread, Nova Voice brings a futuristic, frictionless interaction layer to your daily workflow.

---

## Folder Structure

Here is an overview of the project's architecture and folder structure:

```text
superman_clone/
├── .next/                  # Next.js build output (generated)
├── drizzle/                # Database migrations, schemas, and configurations
├── node_modules/           # Project dependencies
├── public/                 # Static assets (images, fonts, etc.)
├── scripts/                # Utility scripts (e.g., db backfill, inspection)
├── src/                    # Main source code directory
│   ├── app/                # Next.js App Router (pages and layouts)
│   │   ├── api/            # Backend API routes
│   │   ├── Calendar/       # Calendar interface and logic
│   │   ├── drafts/         # Email drafts view
│   │   ├── hooks/          # App-level custom React hooks
│   │   ├── inbox/          # Main inbox interface
│   │   ├── Novus_assistent/# AI assistant interfaces and logic
│   │   ├── onboarding/     # User onboarding flow
│   │   ├── sent/           # Sent emails view
│   │   ├── settings/       # User settings and configuration
│   │   ├── starred/        # Starred emails view
│   │   └── voice/          # Nova Voice interface (hands-free interaction)
│   ├── components/         # Reusable React components (UI, layout, forms)
│   ├── googleCalendar/     # Google Calendar integration modules
│   ├── hooks/              # Global custom React hooks
│   ├── lib/                # Utility functions, helpers, and shared logic
│   ├── server/             # Backend logic, tRPC routers, and services
│   ├── styles/             # Global CSS and Tailwind styling
│   └── trpc/               # tRPC client and server setup
├── .env / .env.example     # Environment variables
├── ARCHITECTURE.md         # Detailed architectural documentation
├── drizzle.config.ts       # Drizzle ORM configuration
├── landing_page_design.md  # Landing page aesthetic guidelines
├── next.config.js          # Next.js configuration
├── package.json            # Project dependencies and npm scripts
└── vercel.json             # Vercel deployment configuration
```

## Getting Started
*(Add installation and running instructions here)*
- `pnpm install`
- `pnpm dev`
