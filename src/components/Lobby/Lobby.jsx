//src/components/lobby/lobby.jsx
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
import io from "socket.io-client";

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
      // Cambiado de nickName a nickname para coincidir con la estructura real de datos
      setUserName(data.nickname);
    }
  }, [loading, status, data]);

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
        
        // Además de buscar el email, hacemos una solicitud directa para obtener el nickname
        try {
          const userInfoResponse = await fetch(`https://thehiddencargo1.azure-api.net/creation/users/${userData.mail}/info`, {
            method: 'GET',
            headers: {
              'accept': '*/*',
              'Ocp-Apim-Subscription-Key': process.env.REACT_APP_API_KEY
            }
          });
          
          if (userInfoResponse.ok) {
            const userInfo = await userInfoResponse.json();
            console.log("Información de usuario obtenida:", userInfo);
            setUserName(userInfo.nickname); // Cambiado de nickName a nickname
          }
        } catch (infoError) {
          console.error("Error al obtener información del usuario:", infoError);
        }
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

  // Fetch lobbies from the API - VERSIÓN CORREGIDA
   // Fetch and synchronize lobbies from API
  const fetchLobbies = useCallback(async () => {
    setIsLoadingLobbies(true);
    setLoadingError(null);

    try {
      const response = await fetch(
        'https://thehiddencargo1.azure-api.net/lobbies/lobbies/listar',
        {
          method: 'GET',
          headers: {
            'Ocp-Apim-Subscription-Key': process.env.REACT_APP_API_KEY,
            accept: '*/*',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error al cargar lobbies: ${response.status}`);
      }

      const data = await response.json();
      console.log('Lobbies cargados desde API:', data);

      // Map API data to local structure
      const formattedLobbies = data.map((lobby, index) => ({
        id: `api-${index}-${Date.now()}`,
        name: lobby.nombre,
        password: lobby.contraseña,
        gameMode: lobby.modoDeJuego,
        rounds: lobby.numeroDeRondas,
        players: lobby.maxJugadoresConectados,
        connectedPlayers: lobby.jugadoresConectados,
        host: lobby.jugadores[0] || 'Desconocido',
        createdAt: new Date().toISOString(),
        isFromApi: true,
        readyPlayers: lobby.jugadoresListos,
        playersList: lobby.jugadores,
      }));

      // Nombres existentes en el API
      const existingLobbyNames = data.map((lobby) => lobby.nombre);

      // Filtrar lobbies locales existentes
      setLobbies((prev) =>
        prev.filter((local) => existingLobbyNames.includes(local.name))
      );
      setApiLobbies(formattedLobbies);
      console.log('Lobbies locales sincronizados:', formattedLobbies);
    } catch (error) {
      console.error('Error fetching lobbies:', error);
      setLoadingError(error.message);
    } finally {
      setIsLoadingLobbies(false);
    }
  }, []);

  // Cargar lobbies al montar el componente
  useEffect(() => {
    fetchLobbies();
  }, [fetchLobbies]);

  // Actualización periódica cada 10s (solo si no hay lobby seleccionado)
  useEffect(() => {
    if (!selectedLobby) {
      const intervalId = setInterval(fetchLobbies, 10000);
      return () => clearInterval(intervalId);
    }
  }, [selectedLobby, fetchLobbies]);
  
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

  const handleCreateLobby = async () => {
    if (lobbyName.trim() !== "" && lobbyPassword.trim() !== "") {
      try {
        // Primero, crear el lobby en el servidor
        console.log("Creando lobby en el servidor...");
        
        const lobbyData = {
          nombre: lobbyName,
          contraseña: lobbyPassword,
          jugadores: [userName], // El anfitrión es el primer jugador
          numeroDeRondas: rounds,
          maxJugadoresConectados: players,
          modoDeJuego: gameMode
        };
        
        // Realizar la petición POST al endpoint
        const response = await fetch("https://thehiddencargo1.azure-api.net/lobbies/lobbies", {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': process.env.REACT_APP_API_KEY,
            'Content-Type': 'application/json',
            'accept': '*/*'
          },
          body: JSON.stringify(lobbyData)
        });
        
        if (!response.ok) {
          throw new Error(`Error al crear lobby: ${response.status}`);
        }
        
        // Si se creó con éxito, obtener la respuesta
        const createdLobby = await response.json();
        console.log("Lobby creado exitosamente:", createdLobby);
        
        // Crear estructura local para el lobby
        const newLobby = {
          id: Date.now(), // ID único temporal
          name: lobbyName,
          password: lobbyPassword,
          gameMode,
          rounds,
          players,
          connectedPlayers: 1,
          host: userName,
          createdAt: new Date().toISOString(),
          isFromApi: true, // Ahora es un lobby de la API
          playersList: [userName],
          readyPlayers: 0
        };
    
        // Guardar la sala en el estado local
        setLobbies([...lobbies, newLobby]);
    
        // Establecer conexión de Socket.io
        const newSocket = io("https://20.98.163.141:30000", {
          path: "/socket.io",
          transports: ['websocket', 'polling'],
          query: {
            lobbyName: lobbyName,
            playerName: userName,
            isHost: true
          },
          forceNew: true,
          reconnectionAttempts: 3,
          timeout: 10000
        });
        
        // Configurar eventos del socket
        newSocket.on('connect', () => {
          console.log('Conectado al servidor de sockets como anfitrión');
          
          // Al conectarse, unirse al lobby (por si acaso)
          newSocket.emit('joinLobby', {
            lobbyName: lobbyName,
            nickname: userName
          });
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
      } catch (error) {
        console.error("Error al crear el lobby:", error);
        alert(`Error al crear el lobby: ${error.message}`);
      }
    } else {
      alert("Por favor, ingresa un nombre y contraseña para la sala.");
    }
  };

  // Handle joining a lobby - Now directly verifies and connects
  const handleJoinLobby = async (lobby) => {
    // Verificar si tenemos el nombre de usuario
    if (!userName) {
      console.log("No hay nombre de usuario definido, intentando obtenerlo...");
      
      try {
        // Intenta obtener el nickname directamente si tenemos el email
        if (email) {
          const userInfoResponse = await fetch(`https://thehiddencargo1.azure-api.net/creation/users/${email}/info`, {
            method: 'GET',
            headers: {
              'accept': '*/*',
              'Ocp-Apim-Subscription-Key': process.env.REACT_APP_API_KEY
            }
          });
          
          if (userInfoResponse.ok) {
            const userInfo = await userInfoResponse.json();
            console.log("Información de usuario obtenida:", userInfo);
            // Actualizar el estado con el nickname (cambiado de nickName a nickname)
            setUserName(userInfo.nickname);
            
            // Ahora que tenemos el nombre, continuar con el proceso de unirse
            processJoinLobby(lobby, userInfo.nickname);
            return;
          } else {
            console.error("No se pudo obtener el nickname del usuario");
            alert("No se pudo obtener tu información de usuario. Por favor, inténtalo de nuevo.");
            return;
          }
        } else {
          console.error("No hay email definido");
          alert("No se ha podido identificar tu cuenta. Por favor, inicia sesión nuevamente.");
          return;
        }
      } catch (error) {
        console.error("Error al obtener información del usuario:", error);
        alert("Error al obtener tu información. Por favor, inténtalo de nuevo.");
        return;
      }
    }
    
    // Si ya tenemos el nombre de usuario, proceder normalmente
    processJoinLobby(lobby, userName);
  };
  
  // Función auxiliar para procesar la unión al lobby una vez que tenemos el nombre de usuario
  const processJoinLobby = async (lobby, playerName) => {
    setVerifyingPassword(true);
    setPasswordError(null);
    
    try {
      console.log(`Verificando lobby: ${lobby.name} con usuario: ${playerName}`);
      
      // Realizar verificación directamente sin pedir contraseña
      const verifyResponse = await fetch(
        `https://thehiddencargo1.azure-api.net/lobbies/lobbies/${lobby.name}/verificar`, 
        {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': process.env.REACT_APP_API_KEY,
            'Content-Type': 'application/json',
            'accept': '*/*'
          },
          body: JSON.stringify({ contraseña: lobby.password || "" }) // Usar contraseña almacenada o vacía
        }
      );
      
      console.log(`Respuesta de verificación: ${verifyResponse.status}`);
      
      // Verificar la respuesta
      if (verifyResponse.status === 200) {
        try {
          const responseData = await verifyResponse.json();
          console.log("Verificación exitosa", responseData);
        } catch (e) {
          console.log("Verificación exitosa (sin datos en respuesta)");
        }
        
        // Establecer conexión de Socket.io
        console.log("Estableciendo conexión de socket...");
        
        const newSocket = io("https://20.98.163.141:30000", {
          path: "/socket.io",
          transports: ['websocket', 'polling'],
          query: {
            lobbyName: lobby.name,
            playerName: playerName,
            isHost: false
          },
          extraHeaders: {
            "Ocp-Apim-Subscription-Key": process.env.REACT_APP_API_KEY
          }
        });
        
        // Configurar evento de conexión
        newSocket.on('connect', () => {
          console.log('Conectado al servidor de sockets como jugador');
          
          // Emitir evento para unirse al lobby
          newSocket.emit('joinLobby', {
            lobbyName: lobby.name,
            nickname: playerName,
          });
          
          // Crear objeto de lobby con conexión de socket
          const updatedLobby = {
            ...lobby,
            socketConnection: newSocket
          };
          
          // Actualizar estados
          setSocket(newSocket);
          setSelectedLobby(updatedLobby);
          setVerifyingPassword(false);
        });
  
        // Manejar errores de conexión
        newSocket.on('connect_error', (error) => {
          console.error('Error de conexión:', error);
          alert(`Error de conexión: ${error.message}`);
          setVerifyingPassword(false);
        });
  
        // Manejar errores específicos de unión al lobby
        newSocket.on('joinError', (errorData) => {
          alert(errorData.message || 'Error al unirse al lobby');
          setVerifyingPassword(false);
          
          // Desconectar socket en caso de error
          newSocket.disconnect();
        });
        
        // Eventos adicionales para manejar lobbies eliminados
        newSocket.on('lobbyDeleted', (data) => {
          console.log('Lobby eliminado:', data);
          alert(`El lobby "${lobby.name}" ha sido eliminado.`);
          setVerifyingPassword(false);
          newSocket.disconnect();
          
          // Eliminar el lobby del estado local
          setLobbies(prevLobbies => 
            prevLobbies.filter(l => l.name !== lobby.name)
          );
          
          // Actualizar lista de lobbies
          fetchLobbies();
        });
        
        newSocket.on('lobbyNotFound', (data) => {
          console.log('Lobby no encontrado:', data);
          alert(`El lobby "${lobby.name}" no existe o ha sido eliminado.`);
          setVerifyingPassword(false);
          newSocket.disconnect();
          
          // Eliminar el lobby del estado local
          setLobbies(prevLobbies => 
            prevLobbies.filter(l => l.name !== lobby.name)
          );
          
          // Actualizar lista de lobbies
          fetchLobbies();
        });
        
        // Si no hay evento de conexión después de 5 segundos, mostrar error
        setTimeout(() => {
          if (newSocket.connected === false && !selectedLobby) {
            alert("Tiempo de conexión agotado. Inténtalo de nuevo.");
            setVerifyingPassword(false);
          }
        }, 5000);
        
      } else if (verifyResponse.status === 401) {
        // Contraseña incorrecta o problema con acceso - Mostrar diálogo para pedir contraseña
        console.log("Se requiere contraseña - Mostrando diálogo");
        setSelectedLobbyForJoin(lobby);
        setPasswordInput("");
        setPasswordError("Se requiere contraseña para este lobby");
        setShowPasswordDialog(true);
        setVerifyingPassword(false);
      } else {
        // Otro error
        console.error(`Error en verificación: ${verifyResponse.status}`);
        let errorMessage = `Error al unirse: ${verifyResponse.status}`;
        
        try {
          const errorData = await verifyResponse.json();
          console.error("Datos de error:", errorData);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          console.error("No se pudo leer respuesta de error", e);
        }
        
        alert(errorMessage);
        setVerifyingPassword(false);
      }
    } catch (error) {
      console.error("Error al unirse al lobby:", error);
      alert(`Error de conexión: ${error.message}`);
      setVerifyingPassword(false);
    }
  };

  // Handle password verification and joining the lobby
  const handleVerifyPassword = async () => {
    if (!selectedLobbyForJoin) return;
    
    setVerifyingPassword(true);
    setPasswordError(null);
    
    try {
      // Verificar si tenemos el nombre de usuario
      let playerName = userName;
      
      // Si no tenemos nombre de usuario, intentar obtenerlo
      if (!playerName && email) {
        try {
          const userInfoResponse = await fetch(`https://thehiddencargo1.azure-api.net/creation/users/${email}/info`, {
            method: 'GET',
            headers: {
              'accept': '*/*',
              'Ocp-Apim-Subscription-Key': process.env.REACT_APP_API_KEY
            }
          });
          
          if (userInfoResponse.ok) {
            const userInfo = await userInfoResponse.json();
            console.log("Información de usuario obtenida:", userInfo);
            // Actualizar el estado con el nickname (cambiado de nickName a nickname)
            setUserName(userInfo.nickname);
            playerName = userInfo.nickname;
          } else {
            console.error("No se pudo obtener el nickname del usuario");
            setPasswordError("No se pudo obtener tu información de usuario");
            setVerifyingPassword(false);
            return;
          }
        } catch (error) {
          console.error("Error al obtener información del usuario:", error);
          setPasswordError("Error al obtener tu información de usuario");
          setVerifyingPassword(false);
          return;
        }
      }
      
      // Si todavía no tenemos nombre de usuario, mostrar error
      if (!playerName) {
        console.error("No se pudo obtener el nombre de usuario");
        setPasswordError("No se pudo identificar tu cuenta. Por favor, inicia sesión nuevamente.");
        setVerifyingPassword(false);
        return;
      }
      
      console.log(`Verificando contraseña para lobby: ${selectedLobbyForJoin.name} con usuario: ${playerName}`);
      
      // Primero, verificar la contraseña
      const verifyResponse = await fetch(
        `https://thehiddencargo1.azure-api.net/lobbies/lobbies/${selectedLobbyForJoin.name}/verificar`, 
        {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': process.env.REACT_APP_API_KEY,
            'Content-Type': 'application/json',
            'accept': '*/*'
          },
          body: JSON.stringify({ contraseña: passwordInput })
        }
      );
      
      console.log(`Respuesta de verificación: ${verifyResponse.status}`);
      
      // Verificar la respuesta de la contraseña
      if (verifyResponse.status === 200) {
        try {
          // Intentar leer el cuerpo de la respuesta
          const responseData = await verifyResponse.json();
          console.log("Contraseña verificada correctamente", responseData);
        } catch (e) {
          console.log("Contraseña verificada correctamente (sin datos en respuesta)");
        }
        
        // Solo después de verificar la contraseña, establecer conexión de Socket.io
        console.log("Estableciendo conexión de socket...");
        
        // Establecer conexión de Socket.io con la URL correcta y configuración apropiada
        const newSocket = io("https://20.98.163.141:30000", {
          path: "/socket.io",
          transports: ['websocket', 'polling'],
          query: {
            lobbyName: selectedLobbyForJoin.name,
            playerName: playerName,
            isHost: false
          },
          extraHeaders: {
            "Ocp-Apim-Subscription-Key": process.env.REACT_APP_API_KEY
          }
        });
        
        // Configurar evento de conexión
        newSocket.on('connect', () => {
          console.log('Conectado al servidor de sockets como jugador');
          
          // Emitir evento para unirse al lobby
          newSocket.emit('joinLobby', {
            lobbyName: selectedLobbyForJoin.name,
            nickname: playerName,
          });
          
          // Crear nuevo objeto de lobby con conexión de socket
          const updatedLobby = {
            ...selectedLobbyForJoin,
            socketConnection: newSocket
          };
          
          // Actualizar estados
          setSocket(newSocket);
          setShowPasswordDialog(false);
          setSelectedLobby(updatedLobby);
          setVerifyingPassword(false);
        });
  
        // Manejar errores de conexión
        newSocket.on('connect_error', (error) => {
          console.error('Error de conexión:', error);
          setPasswordError(`Error de conexión: ${error.message}`);
          setVerifyingPassword(false);
        });
  
        // Manejar errores específicos de unión al lobby
        newSocket.on('joinError', (errorData) => {
          setPasswordError(errorData.message || 'Error al unirse al lobby');
          setVerifyingPassword(false);
          
          // Desconectar socket en caso de error
          newSocket.disconnect();
        });

        // Eventos adicionales para manejar lobbies eliminados
        newSocket.on('lobbyDeleted', (data) => {
          console.log('Lobby eliminado:', data);
          setPasswordError(`El lobby "${selectedLobbyForJoin.name}" ha sido eliminado.`);
          setVerifyingPassword(false);
          newSocket.disconnect();
          
          // Eliminar el lobby del estado local
          setLobbies(prevLobbies => 
            prevLobbies.filter(l => l.name !== selectedLobbyForJoin.name)
          );
        });
        
        newSocket.on('lobbyNotFound', (data) => {
          console.log('Lobby no encontrado:', data);
          setPasswordError(`El lobby "${selectedLobbyForJoin.name}" no existe o ha sido eliminado.`);
          setVerifyingPassword(false);
          newSocket.disconnect();
          
          // Eliminar el lobby del estado local
          setLobbies(prevLobbies => 
            prevLobbies.filter(l => l.name !== selectedLobbyForJoin.name)
          );
        });
        
        // Si no hay evento de conexión después de 5 segundos, mostrar error
        setTimeout(() => {
          if (newSocket.connected === false && !selectedLobby) {
            setPasswordError("Tiempo de conexión agotado. Inténtalo de nuevo.");
            setVerifyingPassword(false);
          }
        }, 5000);
        
      } else if (verifyResponse.status === 401) {
        // Contraseña incorrecta
        console.error("Contraseña incorrecta");
        setPasswordError("Contraseña incorrecta");
        setVerifyingPassword(false);
      } else {
        // Otro error
        console.error(`Error en verificación: ${verifyResponse.status}`);
        let errorMessage = `Error: ${verifyResponse.status}`;
        
        try {
          const errorData = await verifyResponse.json();
          console.error("Datos de error:", errorData);
          errorMessage = `Error: ${errorData.message || verifyResponse.status}`;
        } catch (e) {
          console.error("No se pudo leer respuesta de error", e);
        }
        
        setPasswordError(errorMessage);
        setVerifyingPassword(false);
      }
    } catch (error) {
      console.error("Error joining lobby:", error);
      setPasswordError(`Error de conexión: ${error.message}`);
      setVerifyingPassword(false);
    }
  };

  // Handle closing the fullscreen view - VERSIÓN CORREGIDA
  const handleCloseLobbyView = () => {
    // No es necesario manejar la desconexión aquí ya que ahora se maneja dentro del componente LobbyFullScreenView
    setSelectedLobby(null);
    
    // Asegurarse de que el socket esté desconectado al salir
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    
    // Refresh lobbies when returning from a lobby view
    fetchLobbies();
    
    // Ejecutar otra verificación después de un breve retraso
    // para asegurarse de que la lista se actualice correctamente
    setTimeout(() => {
      fetchLobbies();
    }, 1000);
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