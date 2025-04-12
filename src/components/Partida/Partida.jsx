import React, { useState, useEffect } from "react";
import "./Partida.css";
import ReactConfetti from "react-confetti";

const Partida = ({ onExit, socketConnection, lobbyData, userName }) => {
  const [players, setPlayers] = useState([]);
  const [currentBid, setCurrentBid] = useState(100); // Apuesta inicial por defecto
  const [activeContainer, setActiveContainer] = useState(null);
  const [gameState, setGameState] = useState("waiting"); // waiting, bidding, revealing, ready, finished
  const [bidAmount, setBidAmount] = useState(200); // Valor inicial para apostar (mayor que la apuesta inicial)
  const [playerBalance, setPlayerBalance] = useState(1000); // Saldo inicial
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(lobbyData?.rounds || 3);
  const [countdown, setCountdown] = useState(0);
  const [gameResult, setGameResult] = useState(null);
  const [notification, setNotification] = useState(null); // Para mostrar notificaciones dentro del componente
  const [isReady, setIsReady] = useState(false); // Estado de "listo" para avanzar a la siguiente ronda
  const [readyPlayers, setReadyPlayers] = useState([]); // Lista de jugadores listos para la siguiente ronda
  const [revealedContainer, setRevealedContainer] = useState(null); // Contenedor revelado con su información
  
  // Estado para el confeti cuando se gana una ronda
  const [showWinConfetti, setShowWinConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  // Actualizar dimensiones de la ventana para el confeti
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Verificar al inicio si hay un juego finalizado en sessionStorage (recuperación)
  useEffect(() => {
    try {
      const gameFinished = sessionStorage.getItem('gameFinished');
      const savedResult = sessionStorage.getItem('gameResult');
      
      if (gameFinished === 'true' && savedResult) {
        const result = JSON.parse(savedResult);
        console.log('Recuperando resultado del juego desde sessionStorage:', result);
        setGameState("finished");
        setGameResult(result);
      }
    } catch (e) {
      console.error('Error al recuperar datos de sessionStorage:', e);
    }
  }, []);

  useEffect(() => {
    if (!socketConnection) {
      console.error("No hay conexión socket en el componente Partida");
      return;
    }

    socketConnection.on('gameStarted', (gameData) => {
      console.log('Partida iniciada:', gameData);
      
      // Establecer el estado del juego a bidding solo si hay un contenedor válido
      if (gameData.container && gameData.container.id) {
        setGameState("bidding");
        console.log('Contenedor inicial válido detectado:', gameData.container);
      } else {
        console.warn('Sin contenedor válido, manteniendo estado waiting');
        setGameState("waiting");
      }
      
      // Asegurarnos de actualizar correctamente los jugadores
      if (gameData.players) {
        const playersList = Array.isArray(gameData.players) ? gameData.players : [];
        console.log('Jugadores iniciales:', playersList);
        setPlayers(playersList);
      }
      
      // Importante: Asegurarnos que el contenedor se establece correctamente
      if (gameData.container) {
        console.log('Estableciendo contenedor inicial:', gameData.container);
        setActiveContainer(gameData.container);
        
        // Asegurarnos de que haya una transición visual para indicar el cambio
        // Esta técnica a veces ayuda a "forzar" una actualización visual
        setTimeout(() => {
          const containerCopy = {...gameData.container};
          setActiveContainer(containerCopy);
        }, 100);
        
        // Guardar información en sessionStorage para recuperación
        try {
          sessionStorage.setItem('currentRound', gameData.round || 1);
          sessionStorage.setItem('currentContainer', JSON.stringify(gameData.container));
          sessionStorage.setItem('currentBid', gameData.initialBid || 100);
        } catch (e) {
          console.error('Error al guardar datos en sessionStorage:', e);
        }
      } else {
        console.error('Falta información del contenedor en el evento gameStarted');
      }
      
      // Establecer la apuesta inicial
      if (gameData.initialBid) {
        setCurrentBid(gameData.initialBid);
        setBidAmount(gameData.initialBid + 50); // Sugerencia de apuesta inicial
      }
      
      setCurrentRound(gameData.round || 1);
      setTotalRounds(gameData.totalRounds || 3);
      
      // Reiniciar la lista de jugadores listos
      setReadyPlayers([]);
      setIsReady(false);
    });

    socketConnection.on('newRound', (roundData) => {
      console.log('Nueva ronda recibida:', roundData);
      
      // Verificar que tenemos un contenedor válido
      if (roundData.container && roundData.container.id) {
        setGameState("bidding");
        setActiveContainer(roundData.container);
        setCurrentBid(roundData.initialBid);
        setBidAmount(roundData.initialBid + 50);
        setCurrentRound(roundData.round);
        setTotalRounds(roundData.totalRounds);
        
        // Reiniciar la lista de jugadores listos
        setReadyPlayers([]);
        setIsReady(false);
        
        // Limpiar notificaciones y contenedor revelado
        setNotification(null);
        setRevealedContainer(null);
        
        // Guardar información de ronda actual en sessionStorage para recuperación
        try {
          sessionStorage.setItem('currentRound', roundData.round);
          sessionStorage.setItem('currentContainer', JSON.stringify(roundData.container));
          sessionStorage.setItem('currentBid', roundData.initialBid);
        } catch (e) {
          console.error('Error al guardar datos de ronda en sessionStorage:', e);
        }
        
        console.log('Estado actualizado a bidding con contenedor:', roundData.container.id);
      } else {
        console.error('Evento newRound recibido sin contenedor válido');
      }
    });

    socketConnection.on('newBid', (bidData) => {
      console.log('Nueva apuesta recibida:', bidData);
      setCurrentBid(bidData.amount);
      setBidAmount(bidData.amount + 50); // Sugerencia para la próxima apuesta
    });

    socketConnection.on('bidResult', (resultData) => {
      console.log('Resultado de apuesta:', resultData);
      setGameState("revealing");
      
      // Extraer información adicional del ID del contenedor
      let color = "desconocido";
      let objetos = [];
      
      if (resultData.containerId && resultData.containerId.includes("-color:")) {
        try {
          // Extraer color
          const colorMatch = resultData.containerId.match(/-color:([^-]+)/);
          if (colorMatch && colorMatch[1]) {
            color = colorMatch[1];
          }
          
          // Extraer objetos
          const objectsMatch = resultData.containerId.match(/-objects:([^-]+)/);
          if (objectsMatch && objectsMatch[1]) {
            const objetosString = objectsMatch[1];
            const objetosList = objetosString.split(';');
            
            objetos = objetosList.map(item => {
              const [nombre, precio] = item.split(',');
              return {
                nombre: nombre,
                precio: parseFloat(precio)
              };
            });
          }
        } catch (e) {
          console.error('Error al extraer información de objetos:', e);
        }
      }
      
      // Guardar la información del contenedor revelado
      setRevealedContainer({
        id: resultData.containerId,
        type: resultData.containerType,
        color: color,
        value: resultData.containerValue,
        objects: objetos,
        winner: resultData.winner,
        bidAmount: resultData.bidAmount,
        profit: resultData.profit
      });
      
      // Mostrar confeti si el usuario actual ganó la subasta
      if (resultData.winner === userName) {
        setShowWinConfetti(true);
        // Ocultar el confeti después de 4 segundos
        setTimeout(() => setShowWinConfetti(false), 4000);
      }
      
      // Construir mensaje de notificación
      let mensaje = "";
      if (resultData.winner === userName) {
        mensaje = `¡Has ganado la subasta!`;
      } else {
        mensaje = `${resultData.winner} ganó la subasta.`;
      }
      
      // Mostrar notificación en el componente
      setNotification({
        type: "success",
        message: mensaje
      });
    });

    socketConnection.on('containerRevealed', (containerData) => {
      console.log('Contenedor revelado:', containerData);
      // Cambiar a estado ready para esperar a que todos estén listos para la siguiente ronda
      setTimeout(() => {
        setGameState("ready");
      }, 3000);
    });

    socketConnection.on('playerUpdate', (playerData) => {
      console.log('Actualización de jugador:', playerData);
      if (playerData.nickname === userName) {
        setPlayerBalance(playerData.balance);
      }
      
      // Actualizar la lista de jugadores con sus nuevos saldos
      setPlayers(prevPlayers => {
        const updatedPlayers = prevPlayers.map(player => {
          const playerName = typeof player === 'string' ? player : player.name;
          const newPlayer = typeof player === 'string' ? { name: player } : { ...player };
          
          if (playerName === playerData.nickname) {
            newPlayer.balance = playerData.balance;
            newPlayer.score = playerData.score;
          }
          
          return newPlayer;
        });
        
        console.log('Lista de jugadores actualizada:', updatedPlayers);
        return updatedPlayers;
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
      setPlayers(prevPlayers => {
        return prevPlayers.filter(player => {
          const playerName = typeof player === 'string' ? player : player.name;
          return playerName !== data.nickname;
        });
      });
      
      // Eliminar de la lista de jugadores listos si estaba ahí
      setReadyPlayers(prevReadyPlayers => 
        prevReadyPlayers.filter(player => player !== data.nickname)
      );
    });

    socketConnection.on('gameEnd', (endData) => {
      console.log('Juego finalizado:', endData);
      
      // Forzar el cambio de estado a "finished" inmediatamente
      setGameState("finished");
      setGameResult(endData);
      
      // Almacenar en sessionStorage para persistencia incluso si hay problemas
      try {
        sessionStorage.setItem('gameResult', JSON.stringify(endData));
        sessionStorage.setItem('gameFinished', 'true');
      } catch (e) {
        console.error('Error al guardar el resultado en sessionStorage:', e);
      }
      
      // Mostrar notificación en el componente
      setNotification({
        type: "info",
        message: `¡El juego ha terminado! Ganador: ${endData.winner}`
      });
    });

    // Eventos para el sistema de "listos" en cada ronda
    socketConnection.on('playerReadyForNextRound', (data) => {
      console.log('Jugador listo para siguiente ronda:', data);
      setReadyPlayers(prevReadyPlayers => {
        // Evitar duplicados
        if (!prevReadyPlayers.includes(data.nickname)) {
          return [...prevReadyPlayers, data.nickname];
        }
        return prevReadyPlayers;
      });
    });

    socketConnection.on('allPlayersReadyForNextRound', () => {
      console.log('Todos los jugadores listos para la siguiente ronda');
      // El servidor enviará automáticamente el evento newRound
      setGameState("waiting");
      setNotification({
        type: "info",
        message: "Preparando próxima ronda..."
      });
    });

    // Verificador periódico para detectar si estamos atascados en estado "waiting"
    const syncCheckInterval = setInterval(() => {
      if (gameState === "waiting" && currentRound > 0 && socketConnection) {
        console.log('Verificando sincronización, estamos en estado "waiting"');
        
        // Intentamos recuperar la ronda actual desde sessionStorage
        try {
          const storedRound = sessionStorage.getItem('currentRound');
          const storedContainer = sessionStorage.getItem('currentContainer');
          const storedBid = sessionStorage.getItem('currentBid');
          
          if (storedRound && storedContainer && storedBid) {
            const roundNum = parseInt(storedRound);
            const containerObj = JSON.parse(storedContainer);
            const bidAmount = parseInt(storedBid);
            
            // Solo restauramos si es una ronda posterior o igual a la actual y tenemos contenedor válido
            if (roundNum >= currentRound && containerObj && containerObj.id) {
              console.log('Restaurando estado desde sessionStorage, posible desincronización detectada');
              setGameState("bidding");
              setActiveContainer(containerObj);
              setCurrentBid(bidAmount);
              setBidAmount(bidAmount + 50);
              setCurrentRound(roundNum);
            }
          }
        } catch (e) {
          console.error('Error al restaurar desde sessionStorage:', e);
        }
      }
    }, 3000); // Verificar cada 3 segundos

    // Verificación periódica para detectar fin de juego (último recurso)
    const checkGameEndInterval = setInterval(() => {
      if (currentRound > totalRounds && gameState !== "finished") {
        console.log('Detectada finalización de juego por rondas completadas');
        setGameState("finished");
      }
    }, 5000);

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
      socketConnection.off('playerReadyForNextRound');
      socketConnection.off('allPlayersReadyForNextRound');
      
      clearInterval(syncCheckInterval);
      clearInterval(checkGameEndInterval);
      
      // Limpiar sessionStorage solo si no estamos en estado "finished"
      if (gameState !== "finished") {
        try {
          sessionStorage.removeItem('gameFinished');
          sessionStorage.removeItem('gameResult');
          sessionStorage.removeItem('currentRound');
          sessionStorage.removeItem('currentContainer');
          sessionStorage.removeItem('currentBid');
        } catch (e) {
          console.error('Error al limpiar sessionStorage:', e);
        }
      }
    };
  }, [socketConnection, userName, currentRound, totalRounds, gameState]);

  const handleExit = () => {
    // Limpiar datos de sesión al salir
    try {
      sessionStorage.removeItem('gameFinished');
      sessionStorage.removeItem('gameResult');
      sessionStorage.removeItem('currentRound');
      sessionStorage.removeItem('currentContainer');
      sessionStorage.removeItem('currentBid');
    } catch (e) {
      console.error('Error al limpiar sessionStorage:', e);
    }
    
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
      setNotification({
        type: "error",
        message: "No tienes suficiente saldo para esta apuesta"
      });
      return;
    }

    // Validar que la apuesta sea mayor que la apuesta actual
    if (bidAmount <= currentBid) {
      setNotification({
        type: "error",
        message: `Tu apuesta debe ser mayor que la apuesta actual ($${currentBid})`
      });
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

  // Manejar el botón de "Listo para siguiente ronda"
  const handleReadyForNextRound = () => {
    setIsReady(true);
    
    // Enviar evento al servidor
    if (socketConnection) {
      socketConnection.emit('readyForNextRound', {
        nickname: userName,
        lobbyName: lobbyData ? lobbyData.name : ""
      });
      
      // Añadirse a sí mismo a la lista de jugadores listos
      setReadyPlayers(prevReadyPlayers => {
        if (!prevReadyPlayers.includes(userName)) {
          return [...prevReadyPlayers, userName];
        }
        return prevReadyPlayers;
      });
    }
  };

  // Componente de notificación
  const Notification = () => {
    if (!notification) return null;
    
    const bgColor = notification.type === 'error' ? 'bg-red-600' : 
                  notification.type === 'success' ? 'bg-green-600' : 'bg-blue-600';
    
    return (
      <div className={`notification ${bgColor} text-white p-4 rounded-md mb-4`}>
        {notification.message}
        <button 
          className="ml-2 text-white"
          onClick={() => setNotification(null)}
        >
          ✕
        </button>
      </div>
    );
  };

  // Renderizado condicional según el estado del juego
  if (gameState === "finished" && gameResult) {
    return (
      <div className="partida-container">
        <div className="partida-header">
          <h1 className="partida-titulo-final">¡Juego Finalizado!</h1>
        </div>
        
        <Notification />
        
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
      {/* Confeti para cuando el jugador gana una subasta */}
      {showWinConfetti && (
        <ReactConfetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={300}
          gravity={0.3}
          colors={['#f44336', '#e91e63', '#9c27b0', '#3f51b5', '#2196f3', '#4CAF50', '#FFEB3B', '#FFC107']}
        />
      )}
      
      <div className="partida-header">
        <h1 className="partida-titulo">Partida en Curso</h1>
        <div className="player-info">
          <div className="player-name-container">
            <span className="player-name">{userName}</span>
          </div>
          <span className="player-balance">Saldo: ${playerBalance}</span>
        </div>
        <div className="round-info">
          <span>Ronda {currentRound}/{totalRounds}</span>
          {countdown > 0 && <span className="countdown">Tiempo: {countdown}s</span>}
        </div>
      </div>

      {/* Mostrar notificaciones dentro del componente */}
      <Notification />

      <div className="game-area">
        {gameState === "waiting" && (
          <div className="waiting-message">
            <h3>Preparando próxima ronda...</h3>
            <div className="loading-spinner"></div>
            {currentRound > totalRounds && (
              <p>La partida está finalizando, por favor espere...</p>
            )}
          </div>
        )}

        {gameState === "bidding" && activeContainer && (
          <div className="bidding-area">
            <div className="container-display">
              <h3>Contenedor Misterioso</h3>
              <div className="container-info">
                <span className="container-id">ID: {activeContainer.id.split('-')[0]}</span>
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
        
        {gameState === "ready" && revealedContainer && (
          <div className="results-display">
            <h3>Resultado de la Subasta</h3>
            
            <div className="container-result">
              <div className={`container-image ${revealedContainer.type && revealedContainer.type.toLowerCase()}`}>
                <div className="container-content">
                  <p className="result-title">
                    {revealedContainer.winner === userName ? "¡Has ganado!" : `${revealedContainer.winner} ha ganado`}
                  </p>
                  <p>Tipo: {revealedContainer.type} {revealedContainer.color !== "desconocido" ? `(${revealedContainer.color})` : ""}</p>
                  <p>Valor: ${revealedContainer.value}</p>
                  <p>Apuesta: ${revealedContainer.bidAmount}</p>
                  <p>Beneficio: ${revealedContainer.profit}</p>
                  
                  {revealedContainer.objects && revealedContainer.objects.length > 0 && (
                    <div className="objects-list">
                      <h4>Objetos:</h4>
                      <ul>
                        {revealedContainer.objects.map((obj, index) => (
                          <li key={index}>{obj.nombre}: ${obj.precio}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="ready-controls">
              <p className="ready-status">
                {isReady 
                  ? "Esperando a que todos estén listos..." 
                  : "¿Listo para la siguiente ronda?"}
              </p>
              <p className="ready-count">
                Jugadores listos: {readyPlayers.length} / {players.length}
              </p>
              <div className="ready-players">
                {players.map((player, index) => {
                  const playerName = typeof player === 'string' ? player : player.name;
                  const isPlayerReady = readyPlayers.includes(playerName);
                  
                  return (
                    <div 
                      key={index} 
                      className={`ready-player ${isPlayerReady ? 'ready' : 'not-ready'}`}
                    >
                      {playerName} {isPlayerReady ? '✓' : '...'}
                    </div>
                  );
                })}
              </div>
              
              <button 
                className="boton-listo"
                onClick={handleReadyForNextRound}
                disabled={isReady}
              >
                {isReady ? "Listo ✓" : "Estoy Listo"}
              </button>
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
            const isPlayerReady = gameState === "ready" && readyPlayers.includes(playerName);
            
            return (
              <div key={index} className={`player-card ${isPlayerReady ? 'player-ready' : ''}`}>
                <div className="player-avatar">
                  {playerName.charAt(0).toUpperCase()}
                </div>
                <div className="player-details">
                  <span className="player-name">
                    {playerName} {isPlayerReady && <span className="ready-check">✓</span>}
                  </span>
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