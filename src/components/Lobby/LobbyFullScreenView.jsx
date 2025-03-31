import React, { useState, useEffect } from "react";
import { X, Users, ChevronLeft, Clock, Award, Shield } from "lucide-react";
import Partida from "../Partida/Partida.jsx"; 
import "./LobbyFullScreenView.css";


const LobbyFullScreenView = ({ lobby, onClose, userName }) => {
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [partidaIniciada, setPartidaIniciada] = useState(false);

  useEffect(() => {
    setConnectedUsers([
      {
        id: 1,
        name: lobby.host,
        isHost: true,
        isReady: true,
        avatar: null
      }
    ]);
  }, [lobby]);

  if (partidaIniciada) {
    return <Partida onExit={() => setPartidaIniciada(false)} />;
  }

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
        <button className="start-game-btn" 
                onClick={() => setPartidaIniciada(true)}>
          Iniciar partida
        </button>
        <button className="ready-btn">
          Listo
        </button>
      </div>
    </div>
  );
};

export default LobbyFullScreenView;
