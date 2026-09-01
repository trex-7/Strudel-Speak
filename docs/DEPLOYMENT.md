# StrudelSpeak Deployment Guide

This guide details the steps to deploy StrudelSpeak across different production environments: **Netlify**, **Render**, and with **Neon PostgreSQL**.

---

## 1. Deploying to Netlify (Frontend + Serverless Functions)

Netlify provides a zero-maintenance serverless setup where all Gemini calls are proxied through serverless functions without exposing your API key.

### Step 1: Connect Repository
1. Push your code to GitHub / GitLab / Bitbucket.
2. Log into [Netlify](https://app.netlify.com).
3. Click **Add new site** > **Import an existing project**.
4. Select your `strudelspeak` repository.

### Step 2: Build & Directory Settings
Netlify will auto-detect settings from `netlify.toml`, but confirm the following:
- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Functions directory:** `netlify/functions`

### Step 3: Add Environment Variables
1. Go to **Site configuration** > **Environment variables**.
2. Click **Add a variable** > **Add a single variable**.
3. Set:
   - `GEMINI_API_KEY`: Your Gemini API key from [Google AI Studio](https://aistudio.google.com).
   - *(Optional)* `DATABASE_URL`: Your Neon PostgreSQL connection string.
4. Click **Create variable**.

### Step 4: Deploy
- Click **Deploy Site**. Netlify will build the Vite SPA and compile the TypeScript serverless functions located in `netlify/functions/`.

---

## 2. Deploying to Render (Full-Stack Express Service)

If you prefer a persistent Node.js container with full WebSocket or stateful capabilities, deploy to Render.

### Step 1: Create a Web Service
1. Log into [Render Dashboard](https://dashboard.render.com).
2. Click **New +** > **Web Service**.
3. Connect your repository.

### Step 2: Configure Service Settings
- **Runtime:** `Node`
- **Build Command:** `npm run build`
- **Start Command:** `npm run start` (executes `node dist/server.cjs`)
- **Instance Type:** Free or Starter

### Step 3: Environment Variables
Under the **Environment** tab, add:
- `GEMINI_API_KEY`: Your Google AI Studio API key.
- `NODE_ENV`: `production`
- `DATABASE_URL`: *(Optional)* Neon PostgreSQL connection URL.

---

## 3. Configuring Neon PostgreSQL

Neon offers serverless Postgres with instant branching and scale-to-zero capabilities.

1. Sign up at [Neon](https://neon.tech) and create a new project (e.g., `strudelspeak-db`).
2. Copy the connection string from the Neon dashboard:
   ```
   postgresql://username:password@ep-cool-sample.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
3. Add `DATABASE_URL` to your environment variables in Netlify or Render.

---

## 4. Local Testing Before Production Push

Test both local modes before pushing:

### Express Server Mode
```bash
npm run dev
# Starts backend server on port 3000 with Vite middleware
```

### Netlify CLI Local Simulation
```bash
npx netlify dev
# Emulates Netlify routing and serverless functions locally
```
