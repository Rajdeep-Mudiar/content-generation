# AI Content SaaS Platform

A production-grade AI-powered content generation platform that automatically generates daily content for Quora, LinkedIn, and Medium.

## Features

- **Automated Generation**: Daily cron jobs generate content for 3 platforms based on AI/ML topics.
- **AI Key Rotation**: Production-ready system to manage multiple Groq and Gemini keys with automatic rotation and health monitoring.
- **Multi-Provider**: Primary usage of Groq with automatic fallback to Gemini.
- **Notion Sync**: Direct integration with Notion databases for content organization.
- **Modern Dashboard**: Built with React and Plain CSS (no frameworks like Tailwind as per requirements).
- **Analytics & Logs**: Comprehensive monitoring of provider usage, token counts, and system events.

## Tech Stack

- **Frontend**: React, Vite, Plain CSS, Zustand, TanStack Query, Framer Motion.
- **Backend**: Node.js, Express, MongoDB, Node-cron, Winston.
- **AI Providers**: Groq API, Google Gemini API.
- **Integrations**: Notion API.

## Project Structure

```
.
├── backend/            # Express.js Server
│   ├── src/
│   │   ├── providers/  # AI Provider Manager & Rotation
│   │   ├── services/   # Business Logic (Content, Notion)
│   │   ├── schedulers/ # Cron Jobs
│   │   └── ...
├── frontend/           # React Dashboard
│   ├── src/
│   │   ├── components/ # Modular UI Components
│   │   ├── pages/      # Dashboard Views
│   │   └── ...
```

## Setup Instructions

### Backend
1. `cd backend`
2. `npm install`
3. Create `.env` from `.env.example`
4. `npm start` (or `node src/server.js`)

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev`

## Deployment

- **Frontend**: Deploy `frontend/` to Vercel.
- **Backend**: Deploy `backend/` to Render or Railway. Ensure `MONGODB_URI` and other env vars are set.

## API Key Management
The system supports multiple keys for both Groq and Gemini. Add them via the Dashboard -> API Keys page. The system will automatically:
- Use Groq keys in round-robin fashion.
- Fallback to Gemini if all Groq keys fail.
- Put failed keys on a 5-minute cooldown.
- Disable keys permanently after 3 consecutive failures.
