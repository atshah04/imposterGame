import React, { useState, useEffect, useRef } from 'react';

function GameRoom({ room, playerId, onStartGame, onResetGame, onLeaveRoom, onNextTurn, onStartVote, onSubmitVote, onEndGame, onSendMessage }) {
  const isHost = room.players.find(p => p.id === playerId)?.isHost;
  const myPlayer = room.players.find(p => p.id === playerId);
  const [message, setMessage] = useState('');
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [room.messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (message.trim()) {
        onSendMessage(message);
        setMessage('');
    }
  };

  // Chat Permission Logic
  let canChat = false;
  let chatPlaceholder = "Wait for your turn...";
  
  if (room.gameState === 'lobby' || room.gameState === 'voting' || room.gameState === 'ended') {
      canChat = true;
      chatPlaceholder = "Type a message...";
  } else if (room.gameState === 'playing') {
      const currentTurnPlayerId = room.turnOrder ? room.turnOrder[room.currentTurnIndex] : null;
      if (currentTurnPlayerId === playerId) {
          canChat = true;
          chatPlaceholder = "Give your hint...";
      }
  }
  
  // Turn Logic
  const currentTurnPlayerId = room.turnOrder ? room.turnOrder[room.currentTurnIndex] : null;
  const isMyTurn = currentTurnPlayerId === playerId;
  const currentTurnPlayer = room.players.find(p => p.id === currentTurnPlayerId);

  // Voting Logic
  const myVote = room.votes ? room.votes[playerId] : null;
  const votesCount = room.votes ? Object.values(room.votes).reduce((acc, id) => {
    acc[id] = (acc[id] || 0) + 1;
    return acc;
  }, {}) : {};

  return (
    <div className="game-room">
      <h2>Room Code: <span className="room-code">{room.id}</span></h2>
      
      <div className="players-section card">
        <h3>Players ({room.players.length})</h3>
        <ul className="player-list">
          {room.players.map(p => (
            <li key={p.id} style={{
                borderColor: currentTurnPlayerId === p.id ? '#646cff' : 'transparent',
                borderWidth: currentTurnPlayerId === p.id ? '2px' : '1px'
            }}>
              <span className="player-name">{p.name}</span>
              {p.isHost && <span className="player-tag tag-host">HOST</span>}
              {p.id === playerId && <span className="player-tag tag-you">YOU</span>}
              {room.gameState === 'playing' && currentTurnPlayerId === p.id && <span className="player-tag" style={{backgroundColor: '#646cff'}}>TURN</span>}
              {room.gameState === 'ended' && p.role === 'imposter' && <span className="player-tag" style={{backgroundColor: '#ff4444'}}>IMPOSTER</span>}
              {room.gameState === 'ended' && votesCount[p.id] && <span className="player-tag" style={{backgroundColor: '#888'}}>{votesCount[p.id]} Votes</span>}
            </li>
          ))}
        </ul>
      </div>

      {room.gameState === 'lobby' && (
        <div className="controls">
          {isHost ? (
            <button onClick={onStartGame} disabled={room.players.length < 3}>
              Start Game {room.players.length < 3 ? '(Need 3+ players)' : ''}
            </button>
          ) : (
            <p>Waiting for host to start...</p>
          )}
        </div>
      )}

      {room.gameState === 'playing' && myPlayer && (
        <div className="game-area">
          <div className="role-card">
            {myPlayer.role === 'imposter' ? (
              <div className="imposter-view">
                <p className="imposter-alert">YOU ARE THE IMPOSTER</p>
                <p>Try to blend in and guess the word!</p>
              </div>
            ) : (
              <div className="civilian-view">
                <p>The secret word is:</p>
                <p className="secret-word">{room.currentWord}</p>
                <p>Find the imposter!</p>
              </div>
            )}
          </div>

          <div className="turn-controls card">
            <h3>Current Turn: {currentTurnPlayer?.name}</h3>
            {isMyTurn ? (
                <button onClick={onNextTurn}>Done with Hint</button>
            ) : (
                <p>Waiting for {currentTurnPlayer?.name} to give a hint...</p>
            )}
          </div>
          
          {isHost && (
            <div className="host-controls">
                <button onClick={onStartVote} style={{marginTop: '20px', backgroundColor: '#ff9800'}}>
                Start Vote
                </button>
                <button onClick={onResetGame} className="secondary" style={{marginTop: '10px'}}>
                Abort Game
                </button>
            </div>
          )}
        </div>
      )}

      {room.gameState === 'voting' && (
        <div className="voting-area card">
            <h2>Vote for the Imposter</h2>
            <div className="vote-grid" style={{display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))'}}>
                {room.players.map(p => (
                    <button 
                        key={p.id} 
                        onClick={() => onSubmitVote(p.id)}
                        disabled={myVote !== null} 
                        style={{
                            backgroundColor: myVote === p.id ? '#ff4444' : '#333',
                            opacity: (myVote && myVote !== p.id) ? 0.5 : 1
                        }}
                    >
                        {p.name}
                    </button>
                ))}
            </div>
            {myVote && <p>Vote Cast! Waiting for others...</p>}
            
            {isHost && (
                <button onClick={onEndGame} style={{marginTop: '20px'}}>
                    Reveal Results
                </button>
            )}
        </div>
      )}

      {room.gameState === 'ended' && (
          <div className="results-area card">
              <h2>Game Over</h2>
              <p>The Imposter was: <strong>{room.players.find(p => p.role === 'imposter')?.name}</strong></p>
              <p>The Word was: <strong>{room.currentWord}</strong></p>
              
              {isHost && (
                  <button onClick={onResetGame} style={{marginTop: '20px'}}>
                      Back to Lobby
                  </button>
              )}
          </div>
      )}

      {/* Chat Section - Always Visible */}
      <div className="chat-section card" style={{marginTop: '20px', textAlign: 'left'}}>
        <h3>Game Chat / Hints</h3>
        <div className="chat-messages" style={{
            height: '200px', 
            overflowY: 'auto', 
            backgroundColor: '#111', 
            padding: '10px', 
            borderRadius: '8px',
            marginBottom: '10px'
        }}>
            {room.messages && room.messages.map(msg => (
                <div key={msg.id} className="message" style={{marginBottom: '5px'}}>
                    <strong style={{color: msg.senderId === playerId ? '#4caf50' : '#646cff'}}>{msg.senderName}: </strong>
                    <span>{msg.text}</span>
                </div>
            ))}
            <div ref={chatEndRef} />
        </div>
        <form onSubmit={handleSend} style={{display: 'flex', gap: '10px'}}>
            <input 
                type="text" 
                value={message} 
                onChange={(e) => setMessage(e.target.value)}
                placeholder={chatPlaceholder}
                disabled={!canChat}
                style={{flex: 1}}
            />
            <button type="submit" disabled={!canChat || !message.trim()} style={{width: 'auto', marginTop: 0}}>
                Send
            </button>
        </form>
      </div>

      <button onClick={onLeaveRoom} className="danger" style={{marginTop: '40px'}}>
        Leave Room
      </button>
    </div>
  );
}

export default GameRoom;
