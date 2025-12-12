import React, { useState } from 'react';

function Lobby({ onCreateRoom, onJoinRoom }) {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [customWords, setCustomWords] = useState('');

  const handleCreate = () => {
    if (!name) return alert('Please enter your name');
    let wordsArray;
    // If input has newlines or commas, use those as delimiters (allows phrases with spaces)
    if (customWords.match(/[\n,]/)) {
      wordsArray = customWords.split(/[\n,]+/).map(w => w.trim()).filter(w => w.length > 0);
    } else {
      // Otherwise split by spaces
      wordsArray = customWords.split(/\s+/).map(w => w.trim()).filter(w => w.length > 0);
    }
    onCreateRoom(name, wordsArray);
  };

  const handleJoin = () => {
    if (!name) return alert('Please enter your name');
    if (!roomCode) return alert('Please enter a room code');
    onJoinRoom(name, roomCode.toUpperCase());
  };

  return (
    <div className="lobby">
      <h1>Imposter Game</h1>
      
      <div className="input-group">
        <input 
          type="text" 
          placeholder="Enter your name" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
        />
      </div>

      <div className="lobby-container">
        <div className="card">
          <h2>Create Room</h2>
          <textarea 
            placeholder="Custom words (comma, line, or space separated) e.g. Apple, Banana, Car"
            value={customWords}
            onChange={(e) => setCustomWords(e.target.value)}
            rows={4}
            style={{width: '100%', marginBottom: '10px'}}
          />
          <br />
          <button onClick={handleCreate}>Create New Room</button>
        </div>

        <div className="card">
          <h2>Join Room</h2>
          <input 
            type="text" 
            placeholder="Room Code" 
            value={roomCode} 
            onChange={(e) => setRoomCode(e.target.value)} 
          />
          <button onClick={handleJoin}>Join Room</button>
        </div>
      </div>
    </div>
  );
}

export default Lobby;
