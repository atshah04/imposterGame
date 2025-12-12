const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
app.use(cors());

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
}

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for simplicity in dev
    methods: ["GET", "POST"]
  }
});

// State
// rooms = {
//   [roomId]: {
//     id: string,
//     players: [{ id: string, name: string, isHost: boolean, role: 'imposter' | 'civilian' | null }],
//     gameState: 'lobby' | 'playing' | 'voting' | 'ended',
//     words: string[], // Custom words for this room
//     currentWord: string | null,
//     imposterId: string | null
//   }
// }
const rooms = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('createRoom', ({ playerName, customWords }) => {
    const roomId = uuidv4().substring(0, 6).toUpperCase(); // Short code
    rooms[roomId] = {
      id: roomId,
      players: [{ id: socket.id, name: playerName, isHost: true, role: null }],
      gameState: 'lobby',
      words: customWords && customWords.length > 0 ? customWords : ['Apple', 'Banana', 'Car', 'Dog', 'Elephant'], // Default words
      currentWord: null,
      imposterId: null,
      messages: []
    };
    
    socket.join(roomId);
    socket.emit('roomCreated', rooms[roomId]);
    console.log(`Room ${roomId} created by ${playerName}`);
  });

  socket.on('joinRoom', ({ roomId, playerName }) => {
    const room = rooms[roomId.toUpperCase()];
    if (!room) {
      socket.emit('error', 'Room not found');
      return;
    }
    if (room.gameState !== 'lobby') {
      socket.emit('error', 'Game already in progress');
      return;
    }
    
    const existingPlayer = room.players.find(p => p.name === playerName);
    if (existingPlayer) {
        // Reconnect logic could go here, but for now just reject duplicate names
        socket.emit('error', 'Name already taken in this room');
        return;
    }

    room.players.push({ id: socket.id, name: playerName, isHost: false, role: null });
    socket.join(roomId);
    
    io.to(roomId).emit('updateRoom', room);
    console.log(`${playerName} joined room ${roomId}`);
  });

  socket.on('startGame', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return;
    
    // Reset roles
    room.players.forEach(p => p.role = null);
    
    // Pick Imposter
    const imposterIndex = Math.floor(Math.random() * room.players.length);
    const imposter = room.players[imposterIndex];
    room.imposterId = imposter.id;
    imposter.role = 'imposter';
    
    // Assign roles to others
    room.players.forEach((p, index) => {
        if (index !== imposterIndex) {
            p.role = 'civilian';
        }
    });

    // Pick Word
    const wordIndex = Math.floor(Math.random() * room.words.length);
    room.currentWord = room.words[wordIndex];
    
    // Setup Turns
    // Shuffle player IDs for turn order
    room.turnOrder = room.players.map(p => p.id).sort(() => Math.random() - 0.5);
    room.currentTurnIndex = 0;
    room.votes = {}; // Reset votes
    room.messages = []; // Reset chat for new game

    room.gameState = 'playing';
    
    io.to(roomId).emit('gameStarted', room);
    console.log(`Game started in room ${roomId}. Word: ${room.currentWord}, Imposter: ${imposter.name}`);
  });

  socket.on('nextTurn', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return;
    room.currentTurnIndex = (room.currentTurnIndex + 1) % room.turnOrder.length;
    io.to(roomId).emit('updateRoom', room);
  });

  socket.on('startVote', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return;
    room.gameState = 'voting';
    room.votes = {};
    io.to(roomId).emit('updateRoom', room);
  });

  socket.on('submitVote', ({ roomId, votedForId }) => {
    const room = rooms[roomId];
    if (!room) return;
    
    // Record vote: voterId -> targetId
    room.votes[socket.id] = votedForId;
    
    io.to(roomId).emit('updateRoom', room);
  });

  socket.on('sendMessage', ({ roomId, message }) => {
    const room = rooms[roomId];
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    // Validation: Can user send message?
    let canSend = false;
    if (room.gameState === 'lobby' || room.gameState === 'voting' || room.gameState === 'ended') {
        canSend = true;
    } else if (room.gameState === 'playing') {
        const currentTurnPlayerId = room.turnOrder[room.currentTurnIndex];
        if (socket.id === currentTurnPlayerId) {
            canSend = true;
        }
    }

    if (canSend) {
        room.messages.push({
            id: uuidv4(),
            senderId: socket.id,
            senderName: player.name,
            text: message,
            timestamp: Date.now()
        });
        io.to(roomId).emit('updateRoom', room);
    }
  });

  socket.on('endGame', ({ roomId }) => {
      const room = rooms[roomId];
      if (!room) return;
      room.gameState = 'ended';
      io.to(roomId).emit('updateRoom', room);
  });
  
  socket.on('resetGame', ({ roomId }) => {
      const room = rooms[roomId];
      if (!room) return;
      room.gameState = 'lobby';
      room.currentWord = null;
      room.imposterId = null;
      room.turnOrder = [];
      room.currentTurnIndex = 0;
      room.votes = {};
      room.messages = [];
      room.players.forEach(p => p.role = null);
      io.to(roomId).emit('updateRoom', room);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Find room user was in and remove them
    for (const roomId in rooms) {
      const room = rooms[roomId];
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        const player = room.players[playerIndex];
        room.players.splice(playerIndex, 1);
        
        // If host left, assign new host or delete room
        if (player.isHost && room.players.length > 0) {
            room.players[0].isHost = true;
        }
        
        if (room.players.length === 0) {
            delete rooms[roomId];
        } else {
            io.to(roomId).emit('updateRoom', room);
        }
        break;
      }
    }
  });
});

// Handle React routing, return all requests to React app
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
  });
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
