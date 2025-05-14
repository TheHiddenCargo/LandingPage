import React, { useState, useEffect } from "react";
import { X, Users, ChevronLeft, Clock, Award, Shield } from "lucide-react";
import Partida from "../Partida/Partida.jsx"; 
import "./LobbyFullScreenView.css";

const LobbyFullScreenView = ({ lobby, onClose, userName }) => {
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [partidaIniciada, setPartidaIniciada] = useState(false);
  
  // Handle closing the fullscreen view and properly leaving the lobby
  const handleCloseLobbyView = () => {
    if (lobby.socketConnection) {
      // Enviar explícitamente un evento de salida antes de desconectar
      console.log(`Enviando evento de salida para usuario: ${userName} del lobby: ${lobby.name}`);
      
      try {
        // Emitir evento leaveLobby para notificar al servidor que el jugador está saliendo voluntariamente
        lobby.socketConnection.emit('leaveLobby', {
          lobbyName: lobby.name,
          nickname: userName
        });
        
        // Dar tiempo para que se procese el evento antes de desconectar
        setTimeout(() => {
          lobby.socketConnection.disconnect();
          onClose();
        }, 300);
      } catch (error) {
        console.error("Error al salir del lobby:", error);
        // Aún así, desconectar y cerrar en caso de error
        lobby.socketConnection.disconnect();
        onClose();
      }
    } else {
      // Si no hay conexión socket, simplemente cerrar
      onClose();
    }
  };
  

  useEffect(() => {
    const initialUsers = [{
      id: 1,
      name: lobby.host || "Anfitrión",  // Valor por defecto por si lobby.host es undefined
      isHost: true,
      isReady: false,
      avatar: null
    }];
    

    if (lobby.playersList && Array.isArray(lobby.playersList)) {
      // Filtra para evitar duplicar al anfitrión y asegúrate de que los nombres no sean undefined
      const otherPlayers = lobby.playersList
        .filter(player => player && player !== lobby.host)  // Verifica que player no sea null o undefined
        .map((player, index) => ({
          id: index + 2, 
          name: player || `Jugador ${index + 2}`,  // Valor por defecto
          isHost: false,
          isReady: false,
          avatar: null
        }));
      
      setConnectedUsers([...initialUsers, ...otherPlayers]);
    } else {
      setConnectedUsers(initialUsers);
    }
    
  
    if (lobby.socketConnection) {
      const socket = lobby.socketConnection;
      
      // Escucha el evento de jugador unido
      socket.on('playerJoined', (playerData) => {
        console.log('Nuevo jugador unido:', playerData);
        
        setConnectedUsers(prevUsers => {
          // Verifica si hay un nombre válido (diferentes propiedades posibles)
          const playerName = playerData.nickname || playerData.name || `Jugador ${prevUsers.length + 1}`;
          
          // Verifica si el jugador ya está en la lista para evitar duplicados
          const playerExists = prevUsers.some(user => user.name === playerName);
          if (playerExists) return prevUsers;
          
          // Agrega el nuevo jugador a la lista
          return [...prevUsers, {
            id: prevUsers.length + 1,
            name: playerName,
            isHost: playerData.isHost || false,
            isReady: playerData.isReady || false,
            avatar: null
          }];
        });
      });
      
      // Escucha el evento de jugador listo
      socket.on('playerReady', (playerData) => {
        console.log('Jugador listo recibido del servidor:', playerData);
        
        // Verifica si PlayerData puede tener diferentes estructuras
        if (!playerData) {
          console.error('Datos de jugador inválidos:', playerData);
          return;
        }
        
        // El servidor puede enviar nickname o name
        const playerName = playerData.nickname || playerData.name;
        
        if (!playerName) {
          console.error('Nombre de jugador no encontrado en datos:', playerData);
          return;
        }
        
        console.log(`Actualizando estado: Marcando a ${playerName} como listo`);
        
        setConnectedUsers(prevUsers => {
          const updatedUsers = prevUsers.map(user => {
            if (user.name === playerName) {
              console.log(`Usuario ${user.name} encontrado y marcado como listo`);
              return { ...user, isReady: true };
            }
            return user;
          });
          
          console.log("Lista actualizada de usuarios:", updatedUsers);
          return updatedUsers;
        });
      });

      // Escucha el evento de jugador desconectado
      socket.on('playerLeft', (playerData) => {
        console.log('Jugador desconectado:', playerData);
        
        if (!playerData) {
          console.error('Datos de jugador inválidos:', playerData);
          return;
        }
        
        // El servidor puede enviar nickname o name
        const playerName = playerData.nickname || playerData.name;
        
        if (!playerName) {
          console.error('Nombre de jugador no encontrado en datos:', playerData);
          return;
        }
        
        setConnectedUsers(prevUsers => 
          prevUsers.filter(user => user.name !== playerName)
        );
      });
      
      // Notificar cuando todos los jugadores estén listos
      socket.on('allPlayersReady', (lobbyName) => {
        console.log(`Todos los jugadores están listos en el lobby: ${lobbyName}`);
      });
      
      // Solicita la lista completa de jugadores al conectarse
      socket.emit('requestPlayersList', { lobbyName: lobby.name });
      
      // Escucha la respuesta con la lista completa de jugadores
      socket.on('playersList', (playersData) => {
        console.log('Lista completa de jugadores recibida:', playersData);
        
        if (Array.isArray(playersData)) {
          const formattedUsers = playersData.map((player, index) => ({
            id: index + 1,
            name: player.nickname || player.name || `Jugador ${index + 1}`,
            isHost: player.isHost || (player.nickname === lobby.host) || (player.name === lobby.host),
            isReady: player.isReady || false,
            avatar: null
          }));
          
          setConnectedUsers(formattedUsers);
        }
      });
      
      // Escucha actualizaciones generales del lobby
      socket.on('lobbyUpdated', (updatedLobby) => {
        console.log('Lobby actualizado:', updatedLobby);
        // Aquí podrías actualizar más información si es necesario
      });
      
      // Escuchar el evento gameStarted para cambiar a la pantalla de partida
      socket.on('gameStarted', (gameData) => {
        console.log('Juego comenzado, cambiando a pantalla de partida:', gameData);
        setPartidaIniciada(true);
      });
      
      // Limpia los listeners cuando se desmonte el componente
      return () => {
        socket.off('playerJoined');
        socket.off('playerReady');
        socket.off('playerLeft');
        socket.off('playersList');
        socket.off('allPlayersReady');
        socket.off('lobbyUpdated');
        socket.off('gameStarted');
      };
    }
  }, [lobby]);

  // Función para marcar al usuario como listo
  // Actualización del método handlePlayerReady en LobbyFullScreenView.jsx

const handlePlayerReady = () => {
  if (lobby.socketConnection && userName) {
    console.log("Enviando evento playerReady al servidor con:", {
      nickname: userName,
      lobbyName: lobby.name
    });
    
    // Emitir evento al servidor para notificar que el jugador está listo
    lobby.socketConnection.emit('playerReady', { 
      nickname: userName,
      lobbyName: lobby.name 
    }, (response) => {
      // Callback para procesar la respuesta (acknowledgment)
      console.log("Respuesta del servidor al marcar como listo:", response);
      
      if (response && response.startsWith("Error")) {
        // Mostrar error si ocurrió algún problema
        console.error("Error al marcar como listo:", response);
        alert("No se pudo marcar como listo: " + response);
      } else {
        // Actualizar UI localmente solo si el servidor confirma
        setConnectedUsers(prevUsers => 
          prevUsers.map(user => {
            if (user.name === userName) {
              return { ...user, isReady: true };
            }
            return user;
          })
        );
      }
    });
  } else {
    console.error("No se puede marcar como listo: ", {
      socketConnection: !!lobby.socketConnection,
      userName
    });
    
    // Mostrar mensaje de error al usuario
    alert("No se puede marcar como listo. Comprueba tu conexión.");
  }
};

  // Función para iniciar la partida y notificar a todos los jugadores
  const handleStartGame = () => {
    if (lobby.socketConnection) {
      console.log("Enviando evento startGame al servidor para iniciar la partida en lobby:", lobby.name);
      
      // Emitir evento al servidor para iniciar la partida
      lobby.socketConnection.emit('startGame', { 
        lobbyName: lobby.name 
      });
      
      // La transición a la pantalla de partida se hará al recibir el evento gameStarted
    } else {
      console.error("No hay conexión socket para iniciar la partida");
    }
  };

  // Si la partida ya está iniciada, mostrar el componente Partida
  if (partidaIniciada) {
    return (
      <Partida 
        onExit={() => setPartidaIniciada(false)} 
        socketConnection={lobby.socketConnection}
        lobbyData={lobby}
        userName={userName}
      />
    );
  }

  // Verifica si el usuario actual está listo
  const isUserReady = connectedUsers.find(user => user.name === userName)?.isReady || false;
  
  // Verifica si el usuario actual es el anfitrión
  const isUserHost = lobby.host === userName;

  // Verifica si todos los usuarios están listos
  const allUsersReady = connectedUsers.length > 0 && 
                         connectedUsers.every(user => user.isReady);
  
  // Verifica si hay suficientes jugadores para iniciar
  const enoughPlayers = connectedUsers.length >= 2;

  return (
    <div className="lobby-fullscreen">
      <div className="lobby-fullscreen-header">
        <button className="back-button" onClick={handleCloseLobbyView}>
          <ChevronLeft size={24} />
          <span>Volver</span>
        </button>
        <h1>{lobby.name || "Sala de juego"}</h1>
        <button className="exit-button" onClick={handleCloseLobbyView}>
          <X size={24} />
          <span>Salir</span>
        </button>
      </div>

      <div className="lobby-fullscreen-content">
        <div className="lobby-details-panel">
          <div className="lobby-info-card">
            <h2>Información de la sala</h2>
            <div className="lobby-info-item">
              <Clock size={20} />
              <span>Creado: {new Date(lobby.createdAt || Date.now()).toLocaleString()}</span>
            </div>
            <div className="lobby-info-item">
              <Award size={20} />
              <span>Modo: {lobby.gameMode || "Estándar"}</span>
            </div>
            <div className="lobby-info-item">
              <Shield size={20} />
              <span>Rondas: {lobby.rounds || 1}</span>
            </div>
            <div className="lobby-info-item">
              <Users size={20} />
              <span>Jugadores: {connectedUsers.length}/{lobby.players || 4}</span>
            </div>
          </div>

          <div className="game-rules">
            <h2>Reglas del juego</h2>
            <p>- Cada jugador puja por contenedores misteriosos</p>
            <p>- El valor del contenido es desconocido hasta que se abra</p>
            <p>- El jugador con más ganancias al final de las rondas gana</p>
            <p>- Cada contenedor tiene diferentes probabilidades de contener objetos valiosos</p>
          </div>
        </div>

        <div className="connected-users-panel">
          <h2>Jugadores conectados ({connectedUsers.length}/{lobby.players || 4})</h2>
          <div className="users-list">
            {connectedUsers.map(user => (
              <div key={user.id} className="user-card">
                <div className="user-avatar">
                  {!user.avatar ? (
                    <div className="default-avatar">
                      {/* Verificar que user.name existe antes de usar charAt */}
                      {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                    </div>
                  ) : (
                    <img src={user.avatar} alt={user.name || "Usuario"} />
                  )}
                </div>
                <div className="user-info">
                  <div className="user-name">
                    {user.name || "Usuario"} {user.isHost && <span className="host-badge">Anfitrión</span>}
                  </div>
                  <div className="user-status">
                    {user.isReady ? (
                      <span className="status-ready">Listo</span>
                    ) : (
                      <span className="status-waiting">Esperando</span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Placeholder spots for remaining players */}
            {Array.from({ length: Math.max(0, (lobby.players || 4) - connectedUsers.length) }).map((_, index) => (
              <div key={`empty-${index}`} className="user-card empty">
                <div className="default-avatar empty">?</div>
                <div className="user-info">
                  <div className="user-name">Esperando jugador...</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="lobby-actions">
        {isUserHost ? (
          <button 
            className="start-game-btn" 
            onClick={handleStartGame}
            disabled={!allUsersReady || !enoughPlayers}
            title={!allUsersReady ? "Todos los jugadores deben estar listos" : 
                  !enoughPlayers ? "Se necesitan al menos 2 jugadores" : ""}
          >
            Iniciar partida
          </button>
        ) : (
          <div className="waiting-host-message">
            Esperando a que el anfitrión inicie la partida
          </div>
        )}
        <button 
          className="ready-btn" 
          onClick={handlePlayerReady}
          disabled={isUserReady}
        >
          {isUserReady ? "Listo" : "Marcar como listo"}
        </button>
      </div>
    </div>
  );
};

export default LobbyFullScreenView;