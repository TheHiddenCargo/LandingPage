import React, {useEffect, useState, useCallback} from "react";
import { Home, Settings, User, LogOut, Plus, X } from "lucide-react";
import UserBar, {UserDialog} from "./UserBar";
import { useMsal } from "@azure/msal-react";
import { InteractionRequiredAuthError } from "@azure/msal-browser";
import { loginRequest, tokenRefreshSettings } from "../../authConfig.js";
import LobbyFullScreenView from "./LobbyFullScreenView";
import "./Lobby.css";

import {useFetch} from "../../personalHooks/useFetch";
import {io} from "socket.io-client";




const Lobby = () => {
  const [hoveredContainer, setHoveredContainer] = useState(null);
  const [showCreateLobby, setShowCreateLobby] = useState(false);
  const [lobbyName, setLobbyName] = useState("");
  const [lobbyPassword, setLobbyPassword] = useState("");
  const [gameMode, setGameMode] = useState("Individual");
  const [rounds, setRounds] = useState(1);
  const [players, setPlayers] = useState(2);
  const [userName, setUserName] = useState(null);
  const [email,setEmail] = useState(null);
  const[searchUser,setSearchUser] = useState(false);
  const[createUser, setCreateUser] = useState(false);
  const [lobbies, setLobbies] = useState([]);
  const [lobbyCreated, setLobbyCreated] = useState(false);
  const [selectedLobby, setSelectedLobby] = useState(null); // Track the selected lobby for fullscreen view

  const {data,loading,status} = useFetch(
      {
        url : "https://thehiddencargo1.azure-api.net/creation/users/email/" + email + "/info",
        method: 'GET',
        headers: {
          'accept': '*/*'
        }
      },[searchUser],searchUser === true);


  useEffect(() => {
    console.log("Iniciando",data,loading,status)
    if(loading === false && status === 404){
      setCreateUser(true);
    }else if(loading === false && status === 200 ){
      setUserName(data.nickName);
    }
  }, [loading,status]);




  const { instance, accounts, inProgress } = useMsal();
  // Function to acquire token and fetch user data
  const fetchUserData = useCallback(async () => {
    if (!accounts || accounts.length === 0 || inProgress !== "none") return;

    try {
      const response = await instance.acquireTokenSilent({
        ...loginRequest,
        account: accounts[0],
      });

      const userDataResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: {
          Authorization: `Bearer ${response.accessToken}`,
        },
      });

      const userData = await userDataResponse.json();
      if (userData.mail) {
        setEmail(userData.mail);
        setSearchUser(true);
      }

    } catch (error) {
      if(error=== "User does not exist") setCreateUser(true);
      if (error instanceof InteractionRequiredAuthError) {
        console.log("Silent token acquisition failed, falling back to interactive method");
        try {
          await instance.acquireTokenPopup(loginRequest);
          fetchUserData();
        } catch (interactiveError) {
          console.error("Error during interactive authentication:", interactiveError);
        }
      } else {
        console.error("Error acquiring token or fetching user data:", error);
      }
    }
  }, [accounts, instance, inProgress]);

  // Setup token refresh mechanism
  useEffect(() => {
    if (inProgress !== "none") return;

    if (accounts && accounts.length > 0) {
      fetchUserData();

      const tokenRefreshTimer = setInterval(() => {
        fetchUserData();
      }, tokenRefreshSettings.refreshInterval);

      return () => clearInterval(tokenRefreshTimer);
    }
  }, [accounts, inProgress, fetchUserData]);

  // Handle sign out
  const handleSignOut = () => {

    instance.logoutRedirect({
      postLogoutRedirectUri: window.location.origin,
    });
  };

  const containerInfo = {
    Container1: {
      title: "Blanco",
      color: "#FFFFFF",
      description:
          "Un contenedor modesto con artículos de poco valor. Al abrirlo, puedes encontrar cajas polvorientas con ropa usada, muebles viejos, revistas antiguas y electrónicos obsoletos. A veces, puede haber una pequeña sorpresa, pero la mayoría de las veces, es un riesgo sin gran recompensa..",
    },
    Container2: {
      title: "Gris",
      color: "#808080",
      description:
          "Un contenedor con posibilidades mixtas. Entre los objetos olvidados, puedes hallar herramientas en buen estado, electrodomésticos funcionales, juguetes de colección o incluso algunas piezas de arte de dudoso origen. Aquí, la apuesta es equilibrada: puedes recuperar tu inversión o llevarte una decepción.",
    },
    Container3: {
      title: "Azul",
      color: "#0000FF",
      description:
          "Este contenedor promete tesoros ocultos. Dentro, podrías encontrar antigüedades valiosas, equipos electrónicos modernos, relojes de marca o incluso instrumentos musicales. La suerte y la estrategia juegan un papel clave, pero aquí las probabilidades están a tu favor.",
    },
    Container4: {
      title: "Dorado",
      color: "#FFD700",
      description:
          "La joya de la corona, el contenedor dorado está reservado para los más audaces. Solo los más experimentados pueden pujar por estas reliquias llenas de secretos. Aquí es donde se esconden artículos raros y exclusivos: lingotes de oro, joyería de diseñador, autos clásicos cubiertos de polvo, documentos históricos y artefactos de gran valor. ¿Serás capaz de llevarte el premio mayor?.",
    },
  };

  const handleCreateLobby = () => {
    if (lobbyName.trim() !== "" && lobbyPassword.trim() !== "") {
      // Crear nueva sala
      const newLobby = {
        id: Date.now(), // ID único temporal
        name: lobbyName,
        password: lobbyPassword, // Nota: en producción, esto debería estar encriptado
        gameMode,
        rounds,
        players,
        host: userName,
        createdAt: new Date().toISOString(),
      };

      // Guardar la sala en el estado local
      setLobbies([...lobbies, newLobby]);

      // Mostrar mensaje de éxito
      setLobbyCreated(true);

      // Cerrar el modal
      setShowCreateLobby(false);

      // Limpiar los campos del formulario
      setLobbyName("");
      setLobbyPassword("");
      setGameMode("Individual");
      setRounds(1);
      setPlayers(2);

      // Después de 3 segundos, ocultar el mensaje de éxito
      setTimeout(() => {
        setLobbyCreated(false);
      }, 3000);

      console.log("Nueva sala creada:", newLobby);

      // Seleccionar la sala recién creada para mostrar la vista de pantalla completa
      setSelectedLobby(newLobby);
    }
  };

  // Handle joining a lobby
  const handleJoinLobby = (lobby) => {
    setSelectedLobby(lobby);
  };

  // Handle closing the fullscreen view
  const handleCloseLobbyView = () => {
    setSelectedLobby(null);
  };

  // If a lobby is selected, show the fullscreen view
  if (selectedLobby) {
    return (
        <LobbyFullScreenView
            lobby={selectedLobby}
            onClose={handleCloseLobbyView}
            userName={userName}
        />
    );
  }

  return (
      <>
        {loading ? null :
              <div className="lobby-container">
                <Sidebar onSignOut={handleSignOut}/>
                <header className="lobby-header">
                  <UserBar userNickname={userName} email={email}/>
                  <button
                      className="create-lobby-btn"
                      onClick={() => setShowCreateLobby(true)}
                  >
                    <Plus size={18}/>
                  </button>
                </header>

                {/* Mensaje de éxito cuando se crea una sala */}
                {lobbyCreated && (
                    <div className="success-message">
                      ¡Sala creada con éxito! Ahora puedes unirte a la partida.
                    </div>
                )}

                {/* Mostrar las salas creadreadas si hay alguna */}
                {lobbies.length > 0 && (
                    <div className="lobbies-section">
                      <h2 className="title">Tus Salas:</h2>
                      <div className="lobbies-list">
                        {lobbies.map((lobby) => (
                            <div key={lobby.id} className="lobby-card">
                              <h3>{lobby.name}</h3>
                              <p>Modo: {lobby.gameMode}</p>
                              <p>Rondas: {lobby.rounds}</p>
                              <p>Jugadores: {lobby.players}</p>
                              <button className="join-btn" onClick={() => handleJoinLobby(lobby)}>Unirse</button>
                            </div>
                        ))}
                      </div>
                    </div>
                )}

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
                    <p>
                      En el interior de este contenedor yace un misterio esperando a ser
                      revelado. Cada caja, cada rincón oscuro, oculta una historia: algunas
                      de riqueza, otras de olvido. ¿Tendrás la astucia para descubrir el
                      tesoro entre la chatarra, o caerás en la trampa del riesgo? Elige con
                      sabiduría… y que la suerte esté de tu lado ✨.
                    </p>
                  </div>
                </div>

                <div className={`info-panel ${hoveredContainer ? "show" : ""}`}>
                  {hoveredContainer && (
                      <>
                        <h3 style={{color: containerInfo[hoveredContainer].color}}>
                          {containerInfo[hoveredContainer].title}
                        </h3>
                        <p>{containerInfo[hoveredContainer].description}</p>
                      </>
                  )}
                </div>

                {showCreateLobby && (
                    <div className="overlay">
                      <div className="create-lobby-modal">
                        <button
                            className="close-btn"
                            onClick={() => setShowCreateLobby(false)}
                        >
                          <X size={22}/>
                        </button>
                        <h2 className="modal-title">The Hidden Cargo</h2>
                        <p className="modal-description">
                          Crea una nueva sala y únete a la aventura.
                        </p>

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
                        <select
                            className="lobby-input"
                            value={gameMode}
                            onChange={(e) => setGameMode(e.target.value)}
                        >
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
                {createUser && <UserDialog email={email} currentNickname={userName} updateNickname={setUserName} toCreate={true}/>}
              </div>
        }
      </>

  );
};

const Sidebar = ({onSignOut}) => (
    <div className="sidebar">
      <div className="sidebar-icons-container">
        <SidebarIcon icon={<Home size={28}/>} text="Inicio"/>
        <SidebarIcon icon={<User size={28}/>} text="Perfil"/>
        <SidebarIcon icon={<Settings size={28}/>} text="Configuración"/>
        <SidebarIcon
            icon={<LogOut size={28}/>}
            text="Salir"
            onClick={onSignOut}
            className="logout-icon"
        />
      </div>
    </div>
);

const SidebarIcon = ({icon, text, onClick, className = ""}) => (
    <div
        className={`sidebar-icon group ${className}`}
        role="button"
        tabIndex="0"
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            onClick();
          }
        }}
    >
      {icon}
    </div>
);


export default Lobby;