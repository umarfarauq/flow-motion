# FlowMotion AI

FlowMotion AI is a production-oriented SaaS foundation for building AI-assisted motion workflows with a node canvas, execution engine, queue hooks, and render pipeline.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- React Flow
- Zustand
- Prisma + PostgreSQL
- Redis + BullMQ
- Remotion
- Gemini API + Veo 3.1

## What is included

- Minimalist black-and-white canvas UI with draggable custom nodes
- Input, processing, and output node types for motion workflow authoring
- Workflow save/load API routes
- Graph validation, topological sorting, and node execution engine
- AI adapters for storyboard generation and animation instructions
- Render payload generation and Remotion composition
- Render job persistence and queue entrypoint
- Gemini API key input in the app UI
- Image-to-video generation from the `Media Upload` node through Gemini/Veo

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

3. Run Prisma setup:

```bash
npm run prisma:generate
npx prisma migrate dev --name init
```

4. Start the app:

```bash
npm run dev
```

## Required environment

- Firebase credentials (client + admin) via `.env.local`
- `REDIS_URL` for BullMQ workers
- `GEMINI_API_KEY` for storyboard generation and Veo video rendering

## Notes

- If Redis is unavailable, the current API still executes jobs inline so the MVP remains usable.
- You can either set `GEMINI_API_KEY` in `.env` or paste the key into the app sidebar before clicking `Generate`.
- The generation path now sends the prompt and uploaded image to Gemini API video generation and writes the result to `public/generated/<jobId>.mp4`.
