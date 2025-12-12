import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Lobby from './components/Lobby';
import GameRoom from './components/GameRoom';
import './App.css';

// Connect to backend
// In production, we use the env variable. In dev, we rely on the proxy or localhost.
const SERVER_URL = import.meta.env.VITE_SERVER_URL || (import.meta.env.PROD ? 'YOUR_BACKEND_URL_HERE' : '/');

const socket = io(SERVER_URL, {
  path: '/socket.io',
});

function App() {
  const [room, setRoom] = useState(null);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    socket.on('connect', () => {
      setConnected(true);
      console.log('Connected to server');
    });

    socket.on('roomCreated', (newRoom) => {
      setRoom(newRoom);
      setError('');
    });

    socket.on('updateRoom', (updatedRoom) => {
      setRoom(updatedRoom);
    });

    socket.on('gameStarted', (updatedRoom) => {
      setRoom(updatedRoom);
    });

    socket.on('error', (msg) => {
      setError(msg);
      setTimeout(() => setError(''), 3000);
    });

    return () => {
      socket.off('connect');
      socket.off('roomCreated');
      socket.off('updateRoom');
      socket.off('gameStarted');
      socket.off('error');
    };
  }, []);

  const createRoom = (name, customWords) => {
    socket.emit('createRoom', { playerName: name, customWords });
  };

  const joinRoom = (name, roomId) => {
    socket.emit('joinRoom', { playerName: name, roomId });
  };

  const startGame = () => {
    if (room) {
      socket.emit('startGame', { roomId: room.id });
    }
  };

  const resetGame = () => {
    if (room) {
      socket.emit('resetGame', { roomId: room.id });
    }
  };

  const nextTurn = () => {
    if (room) socket.emit('nextTurn', { roomId: room.id });
  };

  const startVote = () => {
    if (room) socket.emit('startVote', { roomId: room.id });
  };

  const submitVote = (votedForId) => {
    if (room) socket.emit('submitVote', { roomId: room.id, votedForId });
  };

  const endGame = () => {
    if (room) socket.emit('endGame', { roomId: room.id });
  };

  const sendMessage = (message) => {
    if (room) socket.emit('sendMessage', { roomId: room.id, message });
  };

  const leaveRoom = () => {
    setRoom(null);
    // Socket disconnect/reconnect to ensure clean state or just refresh page
    window.location.reload(); 
  };

  return (
    <div className="App">
      {!connected && (
        <div style={{backgroundColor: '#ff9800', color: 'black', padding: '5px', fontSize: '0.8em'}}>
            Connecting to server at: {SERVER_URL}... <br/>
            (If this takes too long, check your VITE_SERVER_URL setting in Vercel)
        </div>
      )}
      {error && <div className="error-banner" style={{backgroundColor: 'red', color: 'white', padding: '10px'}}>{error}</div>}
      
      {!room ? (
        <Lobby onCreateRoom={createRoom} onJoinRoom={joinRoom} />
      ) : (
        <GameRoom 
          room={room} 
          playerId={socket.id} 
          onStartGame={startGame} 
          onResetGame={resetGame}
          onLeaveRoom={leaveRoom}
          onNextTurn={nextTurn}
          onStartVote={startVote}
          onSubmitVote={submitVote}
          onEndGame={endGame}
          onSendMessage={sendMessage}
        />
      )}
    </div>
  );
}

export default App;
