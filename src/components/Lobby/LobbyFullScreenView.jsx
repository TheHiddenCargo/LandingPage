//src/components/lobby/lobbyFullScreenView
import React, { useState, useEffect } from "react";
import { X, Users, ChevronLeft, Clock, Award, Shield } from "lucide-react";
import Partida from "../Partida/Partida.jsx"; 
import "./LobbyFullScreenView.css";

const LobbyFullScreenView = ({ lobby, onClose, userName }) => {
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [partidaIniciada, setPartidaIniciada] = useState(false);
  

  useEffect(() => {
    const initialUsers = [{
      id: 1,
      name: lobby.host,
      isHost: true,
      isReady: true,
      avatar: null
    }];
    

    if (lobby.playersList && Array.isArray(lobby.playersList)) {
      // Filtra para evitar duplicar al anfitrión
      const otherPlayers = lobby.playersList
        .filter(player => player !== lobby.host)
        .map((player, index) => ({
          id: index + 2, 
          name: player,
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
          // Verifica si el jugador ya está en la lista para evitar duplicados
          const playerExists = prevUsers.some(user => user.name === playerData.name);
          if (playerExists) return prevUsers;
          
          // Agrega el nuevo jugador a la lista
          return [...prevUsers, {
            id: prevUsers.length + 1,
            name: playerData.name,
            isHost: playerData.isHost || false,
            isReady: playerData.isReady || false,
            avatar: null
          }];
        });
      });
      
      // Escucha el evento de jugador listo
      socket.on('playerReady', (playerData) => {
        console.log('Jugador listo:', playerData);
        
        setConnectedUsers(prevUsers => 
          prevUsers.map(user => {
            if (user.name === playerData.name) {
              return { ...user, isReady: true };
            }
            return user;
          })
        );
      });

      // Escucha el evento de jugador desconectado
      socket.on('playerLeft', (playerData) => {
        console.log('Jugador desconectado:', playerData);
        
        setConnectedUsers(prevUsers => 
          prevUsers.filter(user => user.name !== playerData.name)
        );
      });
      
      // Solicita la lista completa de jugadores al conectarse
      socket.emit('requestPlayersList', { lobbyName: lobby.name });
      
      // Escucha la respuesta con la lista completa de jugadores
      socket.on('playersList', (playersData) => {
        console.log('Lista completa de jugadores recibida:', playersData);
        
        if (Array.isArray(playersData)) {
          const formattedUsers = playersData.map((player, index) => ({
            id: index + 1,
            name: player.name,
            isHost: player.isHost || player.name === lobby.host,
            isReady: player.isReady || false,
            avatar: null
          }));
          
          setConnectedUsers(formattedUsers);
        }
      });
      
      // Limpia los listeners cuando se desmonte el componente
      return () => {
        socket.off('playerJoined');
        socket.off('playerReady');
        socket.off('playerLeft');
        socket.off('playersList');
      };
    }
  }, [lobby]);

  // Función para marcar al usuario como listo
  const handlePlayerReady = () => {
    if (lobby.socketConnection) {
      // Emitir evento al servidor para notificar que el jugador está listo
      lobby.socketConnection.emit('playerReady', { 
        name: userName, 
        lobbyName: lobby.name 
      });
      
      
      setConnectedUsers(prevUsers => 
        prevUsers.map(user => {
          if (user.name === userName) {
            return { ...user, isReady: true };
          }
          return user;
        })
      );
    }
  };

  // Función para iniciar la partida y notificar a todos los jugadores
  const handleStartGame = () => {
    if (lobby.socketConnection) {
      lobby.socketConnection.emit('startGame', { 
        lobbyName: lobby.name 
      });
      setPartidaIniciada(true);
    } else {
      setPartidaIniciada(true);
    }
  };

  if (partidaIniciada) {
    return <Partida onExit={() => setPartidaIniciada(false)} />;
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
        <button className="back-button" onClick={onClose}>
          <ChevronLeft size={24} />
          <span>Volver</span>
        </button>
        <h1>{lobby.name}</h1>
        <button className="exit-button" onClick={onClose}>
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
              <span>Creado: {new Date(lobby.createdAt).toLocaleString()}</span>
            </div>
            <div className="lobby-info-item">
              <Award size={20} />
              <span>Modo: {lobby.gameMode}</span>
            </div>
            <div className="lobby-info-item">
              <Shield size={20} />
              <span>Rondas: {lobby.rounds}</span>
            </div>
            <div className="lobby-info-item">
              <Users size={20} />
              <span>Jugadores: {connectedUsers.length}/{lobby.players}</span>
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
          <h2>Jugadores conectados ({connectedUsers.length}/{lobby.players})</h2>
          <div className="users-list">
            {connectedUsers.map(user => (
              <div key={user.id} className="user-card">
                <div className="user-avatar">
                  {!user.avatar ? (
                    <div className="default-avatar">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  ) : (
                    <img src={user.avatar} alt={user.name} />
                  )}
                </div>
                <div className="user-info">
                  <div className="user-name">
                    {user.name} {user.isHost && <span className="host-badge">Anfitrión</span>}
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
            {Array.from({ length: lobby.players - connectedUsers.length }).map((_, index) => (
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