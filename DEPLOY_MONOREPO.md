# Deployment Guide (Single Service)

You can host the **entire application** (Frontend + Backend) as a single service on platforms like **Render** or **Railway**.

**Note:** Vercel is NOT recommended for this specific app because it does not support the persistent WebSocket connections required for the game logic.

## How to Deploy on Render (Recommended)

1. Push your code to GitHub.
2. Go to [dashboard.render.com](https://dashboard.render.com/).
3. Click **New +** -> **Web Service**.
4. Connect your GitHub repository.
5. Configure the service:
   - **Name**: `imposter-game`
   - **Root Directory**: `.` (Leave empty or dot)
   - **Environment**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
6. **Environment Variables**:
   - Add `NODE_ENV` with value `production`.
7. Click **Create Web Service**.

That's it! Render will:
1. Build your React frontend.
2. Start your Node.js server.
3. The server will serve the frontend AND handle the game logic.
