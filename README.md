# Imposter Game

A real-time multiplayer game where one person is the Imposter and everyone else knows the secret word.

## Structure

- `server/`: Node.js + Express + Socket.io backend
- `client/`: React + Vite frontend

## How to Run

### 1. Start the Server
Open a terminal, navigate to `server/` and run:
```bash
cd server
npm install
npm run dev
```
The server will run on http://localhost:3001

### 2. Start the Client
Open a new terminal, navigate to `client/` and run:
```bash
cd client
npm install
npm run dev
```
The client will run on http://localhost:3000 (or similar).

## Features
- Create custom rooms with custom word lists.
- Join existing rooms via code.
- Randomly assigns an Imposter.
- Shows the secret word to civilians.
# imposterGame
