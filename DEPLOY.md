# Deployment Guide

Since this is a real-time game using Socket.IO and in-memory storage, we need to deploy the **Server** and **Client** separately.

Vercel is perfect for the Client (Frontend), but it doesn't support the persistent connections needed for the Game Server. We will use **Render** (free) for the server.

## Prerequisites
1. Push your code to GitHub.

## Part 1: Deploy Server (Render)
1. Go to [dashboard.render.com](https://dashboard.render.com/) and create a new **Web Service**.
2. Connect your GitHub repository.
3. Configure the service:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
4. Click **Create Web Service**.
5. Once deployed, copy the **onrender.com URL** (e.g., `https://imposter-game.onrender.com`).

## Part 2: Deploy Client (Vercel)
1. Go to [vercel.com](https://vercel.com) and add a **New Project**.
2. Import your GitHub repository.
3. Configure the project:
   - **Root Directory**: Click "Edit" and select `client`.
   - **Framework Preset**: Vite (should detect automatically).
4. **Environment Variables**:
   - Add a new variable named `VITE_SERVER_URL`.
   - Value: The Render URL from Part 1 (e.g., `https://imposter-game.onrender.com`).
5. Click **Deploy**.

## Part 3: Final Config
1. Go back to your **Render Dashboard** (Server).
2. Go to **Environment** settings.
3. Add an environment variable (optional, but good practice):
   - `CORS_ORIGIN`: Your new Vercel URL (e.g., `https://imposter-game.vercel.app`).
   - *Note: The current server code allows all origins (`*`), so this is optional unless you want to lock it down.*

## Troubleshooting
- If the game doesn't connect, check the Browser Console (F12) in your deployed app.
- Ensure the `VITE_SERVER_URL` in Vercel does **not** have a trailing slash (e.g., `...onrender.com` is good).
