# AutoSocial — AI Content Automation Portal & MCP Engine

[![Node Version](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ed.svg)](https://www.docker.com/)
[![MCP](https://img.shields.io/badge/Model_Context_Protocol-Streamable_HTTP-8A2BE2.svg)](https://modelcontextprotocol.io)

AutoSocial is a production-grade, full-stack content automation platform and Model Context Protocol (MCP) server. It drives personal **Google Gemini** and **OpenAI ChatGPT** web sessions directly via stealth Puppeteer automation with **zero API token costs**. 

It features an interactive **Chrome DevTools Protocol (CDP) screencast streaming engine** that lets you complete Google login, 2FA, and security prompts right from your browser inside the portal UI, keeping sessions permanently alive in persistent profiles.

---

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Monorepo Structure](#monorepo-structure)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [How Interactive Login Streaming Works](#how-interactive-login-streaming-works)
- [Headless VPS Profile Fallback](#headless-vps-profile-fallback)
- [Model Context Protocol (MCP) Integration](#model-context-protocol-mcp-integration)
- [Selector Maintenance & Recovery Guide](#selector-maintenance--recovery-guide)
- [Docker & Production Deployment](#docker--production-deployment)
- [Testing & Quality Verification](#testing--quality-verification)

---

## Architecture Overview

```
                      ┌───────────────────────────────────────┐
                      │            Client Portal              │
                      │  (React 19 + Tailwind + Zustand + TS) │
                      └───────┬───────────────────────┬───────┘
                              │ REST / SSE            │ WebSocket (CDP Screencast)
                              ▼                       ▼
                      ┌───────────────────────────────────────┐
                      │           AutoSocial Server           │
                      │    (Express + TypeScript + Node 22)   │
                      └───┬───────────────────────────────┬───┘
                          │                               │
            ┌─────────────┴─────────────┐                 │
            ▼                           ▼                 ▼
   ┌─────────────────┐       ┌────────────────────┐   ┌──────────────────────┐
   │ MongoDB Mongoose│       │ Browser Manager    │   │ Official MCP Server  │
   │  - Users        │       │ (Puppeteer Stealth)│   │  Mounted at /mcp     │
   │  - Posts (X/LI) │       │  - GeminiAdapter   │   │  Bearer Auth Keys    │
   │  - ResearchNotes│       │  - ChatGPTAdapter  │   └──────────┬───────────┘
   │  - Images/Jobs  │       │  - Persistent Dirs │              │
   └─────────────────┘       └─────────┬──────────┘              │
                                       │                         ▼
                                       ▼               ┌───────────────────┐
                                [Gemini / ChatGPT]     │ External Agents   │
                                                       │ (Grok Bot, Claude)│
                                                       └───────────────────┘
```

1. **Persistent Browser Session Automation**: Puppeteer-core + `puppeteer-extra-plugin-stealth` operating against persistent `userDataDir` profiles. Google / Cloudflare bot flags like `--enable-automation` are stripped, and realistic User-Agents and viewports are configured.
2. **Interactive Remote Screencast**: Uses Chrome DevTools Protocol (`Page.startScreencast`) to stream live JPEG frames over WebSockets to an HTML5 canvas. The client captures mouse clicks, keyboard keystrokes, and paste events, dispatching them via `Input.dispatchMouseEvent` and `Input.dispatchKeyEvent`.
3. **Official Model Context Protocol (MCP) Server**: Mounted directly at `/mcp` via Streamable HTTP/SSE transport, authenticated with hashed Bearer API keys (`as_live_...`). External autonomous agents (like Grok research bots or Cursor/Claude) can generate text, create formatted drafts, search posts, and save research notes.
4. **Social Studio & Pixel-Faithful Previews**:
   - **Twitter Studio**: Live 280-character ring counter, reorderable tweet cards, smart sentence thread splitter, dark/light X feed preview.
   - **LinkedIn Studio**: 3000-character counter, hook formatting, expandable `...see more` preview, desktop vs mobile feed simulation.
   - **Research Notes**: Ingestion hub for external bot research notes with 1-click conversion into social drafts.

---

## Project Structure

```
AutoSocial/
├── client/                     # Frontend SPA — Deploy directly to Vercel
│   ├── src/
│   │   ├── api/                # Typed fetch client with automatic JWT refresh & VITE_API_BASE_URL
│   │   ├── components/         # Layout, auth guards, CDP screencast canvas modal
│   │   ├── pages/              # Dashboard, Studio, Twitter, LinkedIn, Research, Connections...
│   │   ├── store/              # Zustand stores (Auth, Theme, Toasts)
│   │   └── types/              # Domain interfaces
│   ├── vercel.json             # Vercel SPA routing configuration
│   └── package.json            # Independent React 19 dependencies & scripts
├── server/                     # Backend API & Browser Engine — Deploy to VPS/Docker
│   ├── src/
│   │   ├── config/             # Zod environment validation
│   │   ├── db/                 # Mongoose database connection
│   │   ├── models/             # Mongoose schemas (User, Post, Job, Image, ResearchNote...)
│   │   ├── modules/
│   │   │   ├── auth/           # Single-admin registration, JWT rotation, cookies
│   │   │   ├── automation/     # BrowserManager, GeminiAdapter, ChatGPTAdapter, selectors
│   │   │   │   └── sessionStream/ # WebSocket server for CDP screencast streaming
│   │   │   ├── generation/     # PromptBuilder, JobQueue, SSE live generation stream
│   │   │   ├── posts/          # Social posts CRUD and status workflow
│   │   │   ├── research/       # Research notes REST endpoints
│   │   │   ├── analytics/      # Aggregation pipelines and KPIs
│   │   │   └── mcp/            # @modelcontextprotocol/sdk streamable server & tools
│   │   └── services/           # StorageService (local storage with S3 abstraction)
│   ├── Dockerfile              # Self-contained Node 22 + Chromium + Xvfb + system fonts
│   ├── docker-compose.yml      # Self-contained MongoDB + Server orchestration
│   └── package.json            # Independent server dependencies & scripts
└── README.md
```

---

## Prerequisites

- **Node.js**: `v22.0.0` or higher
- **MongoDB**: `v6.0` or higher (local or MongoDB Atlas connection string)
- **Google Chrome**: Installed locally (Chrome / Chromium) or Docker container

---

## Environment Variables

### Server (`server/.env`)

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `PORT` | Express server port | `5001` |
| `NODE_ENV` | Runtime environment | `development` / `production` |
| `CLIENT_URL` | Allowed CORS origin (e.g. Vercel URL) | `https://your-autosocial.vercel.app` |
| `MONGODB_URI` | MongoDB connection URI | `mongodb://localhost:27017/autosocial` |
| `JWT_ACCESS_SECRET` | Secret key for access token signing | Minimum 32-character string |
| `JWT_REFRESH_SECRET` | Secret key for refresh token signing | Minimum 32-character string |
| `JWT_ACCESS_EXPIRES_IN` | Access token lifespan | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifespan | `7d` |
| `STORAGE_DIR` | Directory for image & screenshot storage | `./storage` |
| `CHROME_EXECUTABLE_PATH` | Path to Google Chrome binary | `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` |
| `CHROME_REMOTE_DEBUGGING_PORT` | Optional existing Chrome debug port | (leave empty for automatic management) |
| `DEFAULT_ADMIN_EMAIL` | Default admin email for seed script | `admin@autosocial.io` |
| `DEFAULT_ADMIN_PASSWORD` | Default admin password for seed script | `AdminSecurePassword123!` |

### Client (`client/.env`)

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Deployed Server API origin | `https://api.yourdomain.com` (leave empty for local dev with Vite proxy) |

---

## Getting Started

Both `client/` and `server/` are fully decoupled with their own `package.json` and dependencies.

### 1. Server Setup
```bash
cd server
cp .env.example .env
npm install --legacy-peer-deps
npm run seed          # Seeds initial admin: admin@autosocial.io / AdminSecurePassword123!
npm run dev           # Starts API server on http://localhost:5001
```

### 2. Client Setup (Local Dev)
```bash
cd client
cp .env.example .env
npm install --legacy-peer-deps
npm run dev           # Starts Vite dev server on http://localhost:5173
```

---

## Deploying the Client to Vercel

The `client/` directory is pre-configured for instant zero-configuration deployment to **Vercel**:
1. Connect your GitHub repository to Vercel.
2. In Project Settings, set **Root Directory** to `client`.
3. Add Environment Variable:
   - `VITE_API_BASE_URL`: `https://your-server-domain.com` (the public HTTPS URL of your deployed AutoSocial server).
4. Deploy! The included [`client/vercel.json`](file:///Users/ronakpaul/Developer/projects/automation/AutoSocial/client/vercel.json) handles single-page app (SPA) routing rewrites automatically.

---

## How Interactive Login Streaming Works

Google blocks headless or standard automated browsers (displaying *"Couldn't sign you in - This browser or app may not be secure"*). 

AutoSocial bypasses this entirely:
1. When you click **"Connect"** on the **Connections** page in the portal, the server requests a one-time short-lived screencast ticket via REST (`POST /api/connections/ticket`).
2. The server launches a real Chrome instance with:
   - Persistent `userDataDir` (`server/storage/profiles/{provider}`)
   - Anti-detection flags (`--disable-blink-features=AutomationControlled`, realistic desktop User-Agent, realistic 1280x800 viewport)
   - Stealth evasion plugins installed.
3. The server opens a CDP session and attaches to `Page.startScreencast`.
4. As Google renders each frame, the server receives raw JPEG buffers and forwards them over WebSocket (`/ws/screencast?ticket=...`).
5. The portal's `ScreencastModal` renders the stream onto an HTML5 canvas and captures mouse clicks, wheel scrolls, and keyboard inputs, dispatching them back via:
   - `Input.dispatchMouseEvent`
   - `Input.dispatchKeyEvent`
6. You complete Google 2FA or passkeys directly inside the portal window.
7. Once logged in, the server detects the presence of the Gemini/ChatGPT prompt bar, fires an automatic success event, saves session status as `connected`, and gracefully closes the screencast.

---

## Headless VPS Profile Fallback

If you deploy to a minimal remote VPS with no display server or restricted network during interactive Google verification, use the **Headless Profile Transfer** fallback:

1. **Log in locally once on your laptop**:
   Run AutoSocial locally, click **Connect** on the Connections page, and log into Google / ChatGPT.
2. **Archive the profile directory**:
   ```bash
   cd server/storage/profiles
   tar -czvf gemini_profile.tar.gz gemini/
   tar -czvf chatgpt_profile.tar.gz chatgpt/
   ```
3. **Copy to your remote server**:
   ```bash
   scp gemini_profile.tar.gz user@your-server-ip:/app/server/storage/profiles/
   ```
4. **Extract inside the remote directory**:
   ```bash
   cd /app/server/storage/profiles/
   tar -xzvf gemini_profile.tar.gz
   ```
5. Restart your server container. AutoSocial will immediately recognize the session as `connected` without needing interactive login!

---

## Model Context Protocol (MCP) Integration

AutoSocial mounts an official Model Context Protocol server directly at `/mcp` using Streamable HTTP/SSE transport.

### Creating an API Key
1. In the AutoSocial portal, navigate to **Settings** -> **MCP API Keys**.
2. Click **"Create API Key"** and give it a name (e.g. `grok-research-bot`).
3. Copy the revealed key (starts with `as_live_...`). Keys are stored as SHA-256 hashes and cannot be viewed again.

### Available MCP Tools

| Tool Name | Parameters | Description |
| :--- | :--- | :--- |
| `gemini_generate_text` | `prompt`, `provider?`, `systemHint?` | Directly generates text using your authenticated browser session. |
| `generate_image` | `prompt`, `aspectRatio?`, `provider?` | Generates a full-resolution image (Imagen 3 / DALL-E) and saves it to media storage. Returns image URL and ID. |
| `create_twitter_thread` | `topic`, `context?`, `tone?`, `tweetCount?`, `withImage?` | Generates a 280-char compliant viral thread, saves it as a draft Post in the database, and returns post preview. |
| `create_linkedin_post` | `topic`, `context?`, `tone?`, `length?`, `withImage?` | Generates an insight-driven LinkedIn post with hook and hashtags, saved as a draft Post. |
| `list_posts` | `platform?`, `status?`, `limit?` | Queries saved social posts by status (`draft`, `ready`, `posted`). |
| `get_post` | `id` | Retrieves full post content and image attachments. |
| `update_post_status` | `id`, `status` | Updates post workflow state (`draft` -> `ready` -> `posted`). |
| `save_research_note` | `title`, `content`, `sources[]` | Allows external research bots (like Grok) to push daily intelligence notes into the portal database for 1-click post conversion. |
| `get_job` | `id` | Polls status of async generation jobs (`queued`, `running`, `succeeded`, `failed`). |

### Client Configuration

#### Claude Desktop (`claude_desktop_config.json`)
```json
{
  "mcpServers": {
    "autosocial": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "http://localhost:5001/mcp",
        "--header",
        "Authorization: Bearer as_live_YOUR_ACTUAL_API_KEY"
      ]
    }
  }
}
```

#### Cursor (`.cursor/mcp.json`)
```json
{
  "mcpServers": {
    "autosocial": {
      "url": "http://localhost:5001/mcp",
      "headers": {
        "Authorization": "Bearer as_live_YOUR_ACTUAL_API_KEY"
      }
    }
  }
}
```

#### Grok Research Bot / Python SDK
```python
import requests

MCP_ENDPOINT = "http://localhost:5001/mcp"
API_KEY = "as_live_YOUR_ACTUAL_API_KEY"

# Call save_research_note to push daily discoveries into AutoSocial
response = requests.post(
    MCP_ENDPOINT,
    headers={"Authorization": f"Bearer {API_KEY}"},
    json={
        "method": "tools/call",
        "params": {
            "name": "save_research_note",
            "arguments": {
                "title": "Quantum Computing Breakthroughs September 2026",
                "content": "Researchers at Google Quantum AI demonstrated fault-tolerant logical qubits...",
                "sources": ["https://arxiv.org/abs/2609.12345"]
            }
        }
    }
)
print("Pushed research note:", response.json())
```

---

## Selector Maintenance & Recovery Guide

Web interfaces change over time. AutoSocial isolates **all DOM selectors and generation detection logic** into a single file:
[`server/src/modules/automation/selectors.ts`](file:///Users/ronakpaul/Developer/projects/automation/AutoSocial/server/src/modules/automation/selectors.ts).

### How to Diagnose Selector Breakage
When an AI provider updates their web layout:
1. The generation job will fail and take a screenshot of the page at the exact moment of failure.
2. In the portal, navigate to **Studio** or **Jobs** to view the failure screenshot stored in `server/storage/screenshots/`.
3. Open `selectors.ts` to update the fallback selector.

### Updating Selectors in `selectors.ts`
All selectors use an array of fallback options prioritizing semantic attributes over brittle CSS hashes:
```typescript
export const GEMINI_SELECTORS = {
  promptInput: [
    'div[contenteditable="true"][role="textbox"]',
    'rich-textarea [contenteditable="true"]',
    'textarea[aria-label*="prompt"]'
  ],
  sendButton: [
    'button[aria-label*="Send message"]',
    'button[aria-label*="Submit"]',
    'button.send-button'
  ],
  stopGenerationSignal: [
    'button[aria-label*="Stop"]',
    'mat-progress-bar',
    '.loading-indicator'
  ]
};
```
Whenever Google or OpenAI modifies an element:
1. Inspect the element in Chrome DevTools.
2. Find an accessible `aria-label`, `role`, or `data-testid`.
3. Prepend it to the corresponding array in `selectors.ts`.
4. Rebuild the server (`npm run build --workspace=server`). No adapter logic needs to be rewritten!

---

## Docker & Server Production Deployment

### 1. Docker Compose (Server & MongoDB)
A self-contained [`server/docker-compose.yml`](file:///Users/ronakpaul/Developer/projects/automation/AutoSocial/server/docker-compose.yml) is provided for deploying the server engine:
- **MongoDB 7.0** with persistent storage.
- **AutoSocial Server** with pre-installed Chromium, Xvfb virtual frame buffer, and system fonts.
- **Named Volumes** to persist your logged-in Google / ChatGPT browser profiles across reboots.

```bash
cd server
docker compose up -d --build
```

### 2. Verify Persistent Profile Volume
Ensure `autosocial_profiles_data` is mounted to `/app/storage/profiles`. This guarantees that once you complete authentication, container rebuilds or server restarts will retain your session without requiring you to log in again.

---

## Testing & Quality Verification

Run typecheck, linting, and unit tests across the entire monorepo:

```bash
# Run unit & contract test suite (Vitest)
npm run test

# Run strict TypeScript typecheck across client and server
npm run typecheck

# Build both applications for production
npm run build
```

---

## License
MIT License. Built for seamless AI-assisted content automation.
