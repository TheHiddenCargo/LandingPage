import React, {useEffect, useState, useCallback} from "react";
import { Home, Settings, User, LogOut, Plus, X, RefreshCw } from "lucide-react";
import UserBar from "./UserBar";
import UserDialog  from "./UserDialog";
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
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(null);
  const [verifyingPassword, setVerifyingPassword] = useState(false);
  const [selectedLobbyForJoin, setSelectedLobbyForJoin] = useState(null);
  const [lobbyName, setLobbyName] = useState("");
  const [lobbyPassword, setLobbyPassword] = useState("");
  const [gameMode, setGameMode] = useState("Individual");
  const [rounds, setRounds] = useState(1);
  const [players, setPlayers] = useState(2);
  const [userName, setUserName] = useState(null);
  const [email, setEmail] = useState(null);
  const [searchUser, setSearchUser] = useState(false);
  const [createUser, setCreateUser] = useState(false);
  const [lobbies, setLobbies] = useState([]);
  const [apiLobbies, setApiLobbies] = useState([]);
  const [lobbyCreated, setLobbyCreated] = useState(false);
  const [selectedLobby, setSelectedLobby] = useState(null);
  const [isLoadingLobbies, setIsLoadingLobbies] = useState(false);
  const [loadingError, setLoadingError] = useState(null);
  const [socket, setSocket] = useState(null);
  

  const {data, loading, status} = useFetch(
      {
        url: "https://thehiddencargo1.azure-api.net/creation/users/" + email + "/info",
        method: 'GET',
        headers: {
          'accept': '*/*'
        }
      }, [searchUser], searchUser === true);

  useEffect(() => {
    console.log("Iniciando", data, loading, status)
    if (loading === false && status === 404) {
      setCreateUser(true);
    } else if (loading === false && status === 200) {
      setUserName(data.nickName);
    }
  }, [loading, status]);

  const {instance, accounts, inProgress} = useMsal();
  
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
      if (error === "User does not exist") setCreateUser(true);
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

  // Fetch lobbies from the API
  const fetchLobbies = async () => {
    setIsLoadingLobbies(true);
    setLoadingError(null);
    
    try {
      const response = await fetch("https://thehiddencargo1.azure-api.net/lobbies/lobbies/listar", {
        method: 'GET',
        headers: {
          'Ocp-Apim-Subscription-Key': 'b553314cb92447a6bb13871a44b16726',
          'accept': '*/*'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error al cargar lobbies: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Lobbies cargados:", data);
      
      // Transform API data to match local lobby structure
      const formattedLobbies = data.map((lobby, index) => ({
        id: `api-${index}-${Date.now()}`, // Generate unique ID
        name: lobby.nombre,
        password: lobby.contraseña,
        gameMode: lobby.modoDeJuego,
        rounds: lobby.numeroDeRondas,
        players: lobby.maxJugadoresConectados,
        connectedPlayers: lobby.jugadoresConectados,
        host: lobby.jugadores[0] || "Desconocido",
        createdAt: new Date().toISOString(),
        isFromApi: true,
        readyPlayers: lobby.jugadoresListos,
        playersList: lobby.jugadores
      }));
      
      setApiLobbies(formattedLobbies);
    } catch (error) {
      console.error("Error fetching lobbies:", error);
      setLoadingError(error.message);
    } finally {
      setIsLoadingLobbies(false);
    }
  };
  
  // Load lobbies on initial component mount
  useEffect(() => {
    fetchLobbies();
  }, []);
  
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
        connectedPlayers: 1,
        host: userName,
        createdAt: new Date().toISOString(),
        isFromApi: false,
        playersList: [userName],
        readyPlayers: 0
      };
  
      // Guardar la sala en el estado local
      setLobbies([...lobbies, newLobby]);
  
      // Establecer conexión de Socket.io
      const newSocket = io("https://thehiddencargo1.azure-api.net", {
        path: "/lobbies/socket.io",
        query: {
          lobbyName: lobbyName,
          playerName: userName,
          isHost: true
        },
        extraHeaders: {
          "Ocp-Apim-Subscription-Key": "b553314cb92447a6bb13871a44b16726"
        }
      });
      
      // Configurar eventos del socket
      newSocket.on('connect', () => {
        console.log('Conectado al servidor de sockets como anfitrión');
      });
      
      newSocket.on('connect_error', (error) => {
        console.error('Error de conexión con Socket.io:', error);
      });
      
      setSocket(newSocket);
  
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
      setSelectedLobby({...newLobby, socketConnection: newSocket});
    }
  };

  // Handle joining a lobby - Now shows password dialog
  const handleJoinLobby = (lobby) => {
    setSelectedLobbyForJoin(lobby);
    setPasswordInput("");
    setPasswordError(null);
    setShowPasswordDialog(true);
  };

  // Handle password verification and joining the lobby
  const handleVerifyPassword = async () => {
    if (!selectedLobbyForJoin || !userName) return;
    
    setVerifyingPassword(true);
    setPasswordError(null);
    
    try {
      // Step 1: Verify the password
      const verifyResponse = await fetch(
        `https://thehiddencargo1.azure-api.net/lobbies/lobbies/${selectedLobbyForJoin.name}/verificar`, 
        {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': 'b553314cb92447a6bb13871a44b16726',
            'Content-Type': 'application/json',
            'accept': '*/*'
          },
          body: JSON.stringify({ contraseña: passwordInput })
        }
      );
      
      if (verifyResponse.status === 200) {
        // Password is correct, now add the player to the lobby
        const addPlayerResponse = await fetch(
          `https://thehiddencargo1.azure-api.net/lobbies/lobbies/${selectedLobbyForJoin.name}/agregarJugador?nickname=${userName}`,
          {
            method: 'PUT',
            headers: {
              'Ocp-Apim-Subscription-Key': 'b553314cb92447a6bb13871a44b16726',
              'accept': '*/*'
            }
          }
        );
        
        if (addPlayerResponse.ok) {
          // Successfully joined the lobby
          
          // Establecer conexión de Socket.io
          const newSocket = io("https://thehiddencargo1.azure-api.net", {
            path: "/lobbies/socket.io",
            query: {
              lobbyName: selectedLobbyForJoin.name,
              playerName: userName,
              isHost: false
            },
            extraHeaders: {
              "Ocp-Apim-Subscription-Key": "b553314cb92447a6bb13871a44b16726"
            }
          });
          
          // Configurar eventos del socket
          newSocket.on('connect', () => {
            console.log('Conectado al servidor de sockets');
          });
          
          newSocket.on('connect_error', (error) => {
            console.error('Error de conexión con Socket.io:', error);
          });
          
          setSocket(newSocket);
          setShowPasswordDialog(false);
          setSelectedLobby({...selectedLobbyForJoin, socketConnection: newSocket});
        } else {
          // Failed to add player
          const errorData = await addPlayerResponse.json();
          setPasswordError(`Error al unirse a la sala: ${errorData.message || addPlayerResponse.status}`);
        }
      } else if (verifyResponse.status === 401) {
        // Incorrect password
        setPasswordError("Contraseña incorrecta");
      } else {
        // Other error
        const errorData = await verifyResponse.json();
        setPasswordError(`Error: ${errorData.message || verifyResponse.status}`);
      }
    } catch (error) {
      console.error("Error joining lobby:", error);
      setPasswordError(`Error de conexión: ${error.message}`);
    } finally {
      setVerifyingPassword(false);
    }
  };

  // Handle closing the fullscreen view
  const handleCloseLobbyView = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    setSelectedLobby(null);
    // Refresh lobbies when returning from a lobby view
    fetchLobbies();
  };

  // Añade un efecto para limpiar la conexión al desmontar el componente
  useEffect(() => {
    // Limpia la conexión del socket al desmontar el componente
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);

  // Combine local and API lobbies, removing duplicates
  const allLobbies = [...lobbies, ...apiLobbies];

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
                <div className="header-buttons">
                  <button
                      className="create-lobby-btn"
                      onClick={() => setShowCreateLobby(true)}
                  >
                    <Plus size={18}/>
                  </button>
                </div>
              </header>

              {/* Mensaje de éxito cuando se crea una sala */}
              {lobbyCreated && (
                  <div className="success-message">
                    ¡Sala creada con éxito! Ahora puedes unirte a la partida.
                  </div>
              )}

              {/* Mostrar mensaje de error si hay un problema al cargar las salas */}
              {loadingError && (
                  <div className="error-message">
                    Error al cargar las salas: {loadingError}
                  </div>
              )}

              {/* Mostrar las salas disponibles */}
              <div className="lobbies-section">
                {/* Contenedor del título y el botón */}
                <div className="lobbies-header">
                  <h2 className="title">Salas Disponibles:</h2>
                  <button
                    className="reload-lobbies-btn"
                    onClick={fetchLobbies}
                    disabled={isLoadingLobbies}
                  >
                    <RefreshCw size={18} className={isLoadingLobbies ? "spinning" : ""} />
                  </button>
                </div>

                {isLoadingLobbies && <div className="loading-lobbies">Cargando salas...</div>}
                {!isLoadingLobbies && allLobbies.length === 0 ? (
                  <div className="no-lobbies">
                    No hay salas disponibles. ¡Crea una nueva!
                  </div>
                ) : (
                  <div className="lobbies-list">
                    {allLobbies.map((lobby) => (
                      <div key={lobby.id} className="lobby-card">
                        <h3>{lobby.name}</h3>
                        <p>Modo: {lobby.gameMode}</p>
                        <p>Rondas: {lobby.rounds}</p>
                        <p>Jugadores: {lobby.connectedPlayers || 1}/{lobby.players}</p>
                        <p>Anfitrión: {lobby.host}</p>
                        <button className="join-btn" onClick={() => handleJoinLobby(lobby)}>
                          Unirse
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

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

              {/* Modal for lobby password verification */}
              {showPasswordDialog && (
                <div className="overlay">
                  <div className="password-dialog">
                    <button
                      className="close-btn"
                      onClick={() => setShowPasswordDialog(false)}
                    >
                      <X size={22}/>
                    </button>
                    <h2 className="modal-title">Unirse a {selectedLobbyForJoin?.name}</h2>
                    <p className="modal-description">
                      Ingresa la contraseña para unirte a esta sala.
                    </p>

                    <label>Contraseña</label>
                    <input
                      type="password"
                      className="lobby-input"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="Ingresa la contraseña"
                    />
                    
                    {passwordError && (
                      <div className="password-error">
                        {passwordError}
                      </div>
                    )}

                    <button 
                      className="confirm-btn" 
                      onClick={handleVerifyPassword}
                      disabled={verifyingPassword}
                    >
                      {verifyingPassword ? "Verificando..." : "Unirse"}
                    </button>
                  </div>
                </div>
              )}

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
              {createUser && <UserDialog email={email} toCreate={true}/>}
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