import React, { useState, useEffect } from "react";
import "./Partida.css";

const Partida = ({ onExit, socketConnection, lobbyData, userName }) => {
  const [players, setPlayers] = useState([]);
  const [currentBid, setCurrentBid] = useState(100); // Apuesta inicial por defecto
  const [activeContainer, setActiveContainer] = useState(null);
  const [gameState, setGameState] = useState("waiting"); // waiting, bidding, revealing
  const [bidAmount, setBidAmount] = useState(200); // Valor inicial para apostar (mayor que la apuesta inicial)
  const [playerBalance, setPlayerBalance] = useState(1000); // Saldo inicial
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(lobbyData?.rounds || 3);
  const [countdown, setCountdown] = useState(0);
  const [gameResult, setGameResult] = useState(null);

  useEffect(() => {
    if (!socketConnection) {
      console.error("No hay conexión socket en el componente Partida");
      return;
    }

    // Configurar listeners para eventos del juego
    socketConnection.on('gameStarted', (gameData) => {
      console.log('Partida iniciada:', gameData);
      setGameState("bidding");
      
      if (gameData.players) {
        setPlayers(gameData.players);
      }
      
      if (gameData.container) {
        setActiveContainer(gameData.container);
      }
      
      if (gameData.initialBid) {
        setCurrentBid(gameData.initialBid);
        setBidAmount(gameData.initialBid + 50); // Sugerencia de apuesta inicial
      }
      
      setCurrentRound(gameData.round || 1);
      setTotalRounds(gameData.totalRounds || 3);
    });

    socketConnection.on('newRound', (roundData) => {
      console.log('Nueva ronda:', roundData);
      setGameState("bidding");
      setActiveContainer(roundData.container);
      setCurrentBid(roundData.initialBid);
      setBidAmount(roundData.initialBid + 50);
      setCurrentRound(roundData.round);
      setTotalRounds(roundData.totalRounds);
    });

    socketConnection.on('newBid', (bidData) => {
      console.log('Nueva apuesta recibida:', bidData);
      setCurrentBid(bidData.amount);
      setBidAmount(bidData.amount + 50); // Sugerencia para la próxima apuesta
    });

    socketConnection.on('bidResult', (resultData) => {
      console.log('Resultado de apuesta:', resultData);
      setGameState("revealing");
      
      // Mostrar un mensaje dependiendo de si el jugador ganó o no
      if (resultData.winner === userName) {
        alert(`¡Has ganado la subasta! Contenedor: ${resultData.containerType}. Valor: $${resultData.containerValue}. Beneficio: $${resultData.profit}`);
      } else {
        alert(`${resultData.winner} ganó la subasta con $${resultData.bidAmount}. El contenedor valía $${resultData.containerValue}.`);
      }
    });

    socketConnection.on('containerRevealed', (containerData) => {
      console.log('Contenedor revelado:', containerData);
      // Este evento puede usarse para mostrar animaciones especiales al revelar el contenedor
      setTimeout(() => {
        setGameState("waiting");
      }, 3000);
    });

    socketConnection.on('playerUpdate', (playerData) => {
      console.log('Actualización de jugador:', playerData);
      if (playerData.nickname === userName) {
        setPlayerBalance(playerData.balance);
      }
      
      // Actualizar la lista de jugadores con sus nuevos saldos
      setPlayers(prevPlayers => {
        return prevPlayers.map(playerName => {
          const player = { name: playerName };
          if (playerName === playerData.nickname) {
            player.balance = playerData.balance;
            player.score = playerData.score;
          }
          return player;
        });
      });
    });

    socketConnection.on('auctionTimer', (seconds) => {
      console.log('Tiempo restante para la subasta:', seconds);
      setCountdown(seconds);
      
      // Iniciar un contador descendente
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(interval);
    });

    socketConnection.on('playerLeftGame', (data) => {
      console.log('Jugador abandonó el juego:', data);
      // Actualizar la lista de jugadores
      setPlayers(prevPlayers => prevPlayers.filter(playerName => playerName !== data.nickname));
    });

    socketConnection.on('gameEnd', (endData) => {
      console.log('Juego finalizado:', endData);
      setGameState("finished");
      setGameResult(endData);
      
      // Mostrar resultado final
      setTimeout(() => {
        alert(`¡El juego ha terminado! Ganador: ${endData.winner}`);
      }, 500);
    });

    // Limpiar listeners cuando se desmonta el componente
    return () => {
      socketConnection.off('gameStarted');
      socketConnection.off('newRound');
      socketConnection.off('newBid');
      socketConnection.off('bidResult');
      socketConnection.off('containerRevealed');
      socketConnection.off('playerUpdate');
      socketConnection.off('auctionTimer');
      socketConnection.off('playerLeftGame');
      socketConnection.off('gameEnd');
    };
  }, [socketConnection, userName]);

  const handleExit = () => {
    // Enviar evento de salida al servidor
    if (socketConnection) {
      socketConnection.emit('leaveGame', {
        nickname: userName,
        lobbyName: lobbyData ? lobbyData.name : ""
      });
    }
    
    // Llamar al callback de salida
    if (onExit) {
      onExit();
    }
  };

  const handleBid = () => {
    if (!socketConnection || !activeContainer) {
      console.error("No se puede realizar la apuesta: falta conexión o contenedor activo");
      return;
    }

    // Validar que el jugador tenga suficiente saldo
    if (bidAmount > playerBalance) {
      alert("No tienes suficiente saldo para esta apuesta");
      return;
    }

    // Validar que la apuesta sea mayor que la apuesta actual
    if (bidAmount <= currentBid) {
      alert("Tu apuesta debe ser mayor que la apuesta actual ($" + currentBid + ")");
      return;
    }

    // Enviar evento de apuesta al servidor
    socketConnection.emit('placeBid', {
      nickname: userName,
      lobbyName: lobbyData ? lobbyData.name : "",
      containerId: activeContainer.id,
      amount: bidAmount
    });
    
    console.log("Apuesta enviada:", bidAmount);
  };

  // Renderizado condicional según el estado del juego
  if (gameState === "finished" && gameResult) {
    return (
      <div className="partida-container">
        <div className="partida-header">
          <h1 className="partida-titulo">¡Juego Finalizado!</h1>
        </div>
        
        <div className="game-results">
          <h2>Ganador: {gameResult.winner}</h2>
          
          <div className="final-scores">
            <h3>Puntuaciones finales:</h3>
            <table className="scores-table">
              <thead>
                <tr>
                  <th>Jugador</th>
                  <th>Puntuación</th>
                  <th>Saldo final</th>
                </tr>
              </thead>
              <tbody>
                {gameResult.finalScores && gameResult.finalScores.map((player, index) => (
                  <tr key={index} className={player.nickname === gameResult.winner ? 'winner-row' : ''}>
                    <td>{player.nickname}</td>
                    <td>{player.score}</td>
                    <td>${player.balance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <button className="boton-salir" onClick={handleExit}>
          Volver al Lobby
        </button>
      </div>
    );
  }

  return (
    <div className="partida-container">
      <div className="partida-header">
        <h1 className="partida-titulo">Partida en Curso</h1>
        <div className="player-info">
          <span className="player-name">{userName}</span>
          <span className="player-balance">Saldo: ${playerBalance}</span>
        </div>
        <div className="round-info">
          <span>Ronda {currentRound}/{totalRounds}</span>
          {countdown > 0 && <span className="countdown">Tiempo: {countdown}s</span>}
        </div>
      </div>

      <div className="game-area">
        {gameState === "waiting" && (
          <div className="waiting-message">
            <h3>Preparando próxima ronda...</h3>
            <div className="loading-spinner"></div>
          </div>
        )}

        {gameState === "bidding" && activeContainer && (
          <div className="bidding-area">
            <div className="container-display">
              <h3>Contenedor Misterioso</h3>
              <div className="container-info">
                <span className="container-id">ID: {activeContainer.id}</span>
                <span className="container-type">Tipo: {activeContainer.type || "Normal"}</span>
              </div>
              <div className="container-image">
                <div className={`mystery-box ${activeContainer.type && activeContainer.type.toLowerCase()}`}>
                  ?
                </div>
              </div>
              <p className="current-bid">Apuesta actual: ${currentBid}</p>
            </div>

            <div className="bid-controls">
              <input
                type="number"
                min={currentBid + 10}
                step={10}
                max={playerBalance}
                value={bidAmount}
                onChange={(e) => setBidAmount(Number(e.target.value))}
                className="bid-input"
              />
              <button 
                className="boton-apostar" 
                onClick={handleBid}
                disabled={gameState !== "bidding"}
              >
                Apostar ${bidAmount}
              </button>
            </div>
          </div>
        )}

        {gameState === "revealing" && (
          <div className="reveal-animation">
            <h3>¡Revelando contenido!</h3>
            <div className="container-opening">
              <div className="mystery-box opening">
                !
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="players-list">
        <h3>Jugadores</h3>
        <div className="players-grid">
          {players.map((player, index) => {
            const playerName = typeof player === 'string' ? player : player.name;
            const playerBal = typeof player === 'object' && player.balance ? player.balance : null;
            const playerScore = typeof player === 'object' && player.score ? player.score : null;
            
            return (
              <div key={index} className="player-card">
                <div className="player-avatar">
                  {playerName.charAt(0).toUpperCase()}
                </div>
                <div className="player-details">
                  <span className="player-name">{playerName}</span>
                  {playerBal !== null && (
                    <span className="player-balance-small">${playerBal}</span>
                  )}
                  {playerScore !== null && (
                    <span className="player-score">Puntos: {playerScore}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button className="boton-salir" onClick={handleExit}>
        Salir
      </button>
    </div>
  );
};

export default Partida;