import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Lobby from './components/Lobby';
import GameRoom from './components/GameRoom';
import './App.css';

// Connect to backend
const socket = io('/', {
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
