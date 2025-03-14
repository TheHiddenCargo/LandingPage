import React, { useState } from "react";
import { Home, Settings, User, LogOut, Plus, X} from "lucide-react";
import "./Lobby.css";

const Lobby = () => {
  const [hoveredContainer, setHoveredContainer] = useState(null);
  const [showCreateLobby, setShowCreateLobby] = useState(false);
  const [lobbyName, setLobbyName] = useState("");
  const [lobbyPassword, setLobbyPassword] = useState("");
  const [gameMode, setGameMode] = useState("Individual");
  const [rounds, setRounds] = useState(1);
  const [players, setPlayers] = useState(2);

  const containerInfo = {
    Container1: { title: "Blanco", color: "#FFFFFF", description: "Un contenedor modesto con artículos de poco valor. Al abrirlo, puedes encontrar cajas polvorientas con ropa usada, muebles viejos, revistas antiguas y electrónicos obsoletos. A veces, puede haber una pequeña sorpresa, pero la mayoría de las veces, es un riesgo sin gran recompensa.." },
    Container2: { title: "Gris", color: "#808080", description: "Un contenedor con posibilidades mixtas. Entre los objetos olvidados, puedes hallar herramientas en buen estado, electrodomésticos funcionales, juguetes de colección o incluso algunas piezas de arte de dudoso origen. Aquí, la apuesta es equilibrada: puedes recuperar tu inversión o llevarte una decepción." },
    Container3: { title: "Azul", color: "#0000FF", description: "Este contenedor promete tesoros ocultos. Dentro, podrías encontrar antigüedades valiosas, equipos electrónicos modernos, relojes de marca o incluso instrumentos musicales. La suerte y la estrategia juegan un papel clave, pero aquí las probabilidades están a tu favor." },
    Container4: { title: "Dorado", color: "#FFD700", description: "La joya de la corona, el contenedor dorado está reservado para los más audaces. Solo los más experimentados pueden pujar por estas reliquias llenas de secretos. Aquí es donde se esconden artículos raros y exclusivos: lingotes de oro, joyería de diseñador, autos clásicos cubiertos de polvo, documentos históricos y artefactos de gran valor. ¿Serás capaz de llevarte el premio mayor?." }
  };

  const handleCreateLobby = () => {
    if (lobbyName.trim() !== "" && lobbyPassword.trim() !== "") {
      console.log("Nueva lobby creada:", {
        lobbyName,
        lobbyPassword,
        gameMode,
        rounds,
        players,
      });
      setShowCreateLobby(false);
      setLobbyName("");
      setLobbyPassword("");
      setGameMode("Individual");
      setRounds(1);
      setPlayers(2);

      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  return (
    <div className="lobby-container">
      <Sidebar />
      <header className="lobby-header">
        <div className="user-info">
          <h1>Hola, Usuario123</h1>
          <p className="lobby-subtitle">Bienvenido a The Hidden Cargo</p>
        </div>
        <button className="create-lobby-btn" onClick={() => setShowCreateLobby(true)}>
          <Plus size={18} />
        </button>
      </header>

      <h2 className="title">Contenedores:</h2>

      <div className="slider">
        {Object.keys(containerInfo).map((container, index) => (
          <div
            key={index}
            className={`container-box ${container.toLowerCase()}`}
            onMouseEnter={() => setHoveredContainer(container)}
            onMouseLeave={() => setHoveredContainer(null)}
          ></div>
        ))}
      </div>

      <div className="info-container">
        <div className="info-image"></div>
        <div className="info-text">
          <h3>Lo Desconocido Espera... ¿Te Atreves?</h3>
          <p>En el interior de este contenedor yace un misterio esperando a ser revelado. Cada caja, cada rincón oscuro, oculta una historia: algunas de riqueza, otras de olvido. ¿Tendrás la astucia para descubrir el tesoro entre la chatarra, o caerás en la trampa del riesgo? Elige con sabiduría… y que la suerte esté de tu lado ✨.</p>
        </div>
      </div>

      <div className={`info-panel ${hoveredContainer ? "show" : ""}`}>
        {hoveredContainer && (
          <>
            <h3 style={{ color: containerInfo[hoveredContainer].color }}>{containerInfo[hoveredContainer].title}</h3>
            <p>{containerInfo[hoveredContainer].description}</p>
          </>
        )}
      </div>

      {showCreateLobby && (
        <div className="overlay">
          <div className="create-lobby-modal">
            <button className="close-btn" onClick={() => setShowCreateLobby(false)}>
              <X size={22} />
            </button>
            <h2 className="modal-title">The Hidden Cargo</h2>
            <p className="modal-description">Crea una nueva sala y únete a la aventura.</p>
            
            <label>Nombre de la sala</label>
            <input
              type="text"
              className="lobby-input"
              value={lobbyName}
              onChange={(e) => setLobbyName(e.target.value)}
            />
            
            <label>Contraseña</label>
            <input
              type="password"
              value={lobbyPassword}
              className="lobby-input"
              onChange={(e) => setLobbyPassword(e.target.value)}
            />
            
            <label>Modo de juego</label>
            <select className="lobby-input" value={gameMode} onChange={(e) => setGameMode(e.target.value)}>
              <option value="Individual">Individual</option>
              <option value="Equipos">Por equipos</option>
            </select>
            
            <label>Rondas</label>
            <input
              type="number"
              className="lobby-input"
              placeholder="Número de rondas"
              value={rounds}
              onChange={(e) => setRounds(Number(e.target.value))}
              min={1}
            />
            
            <label>Jugadores</label>
            <input
              type="number"
              className="lobby-input"
              placeholder="Número de jugadores"
              value={players}
              onChange={(e) => setPlayers(Number(e.target.value))}
              min={2}
            />
            
            <button className="confirm-btn" onClick={handleCreateLobby}>
              Crear Sala
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const Sidebar = () => (
  <div className="sidebar">
    <div className="sidebar-icons-container">
      <SidebarIcon icon={<Home size={28} />} text="Inicio" />
      <SidebarIcon icon={<User size={28} />} text="Perfil" />
      <SidebarIcon icon={<Settings size={28} />} text="Configuración" />
      <SidebarIcon icon={<LogOut size={28} />} text="Salir" />
    </div>
  </div>
);

const SidebarIcon = ({ icon, text }) => (
  <div className="sidebar-icon group">
    {icon}
    <span className="sidebar-tooltip">{text}</span>
  </div>
);

export default Lobby;
