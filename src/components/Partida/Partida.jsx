  import React, { useState, useEffect, useRef, useCallback } from "react";
  import "./Partida.css";
  import ReactConfetti from "react-confetti";
  import azul1 from '../../assets/objects/azul/azul1.png';
  import azul2 from '../../assets/objects/azul/azul2.png';
  import azul3 from '../../assets/objects/azul/azul3.png';
  import azul4 from '../../assets/objects/azul/azul4.png';
  import blanco1 from '../../assets/objects/blanco/blanco1.png';
  import blanco2 from '../../assets/objects/blanco/blanco2.png';
  import blanco3 from '../../assets/objects/blanco/blanco3.png';
  import blanco4 from '../../assets/objects/blanco/blanco4.png';
  import gris1 from '../../assets/objects/gris/gris1.png';
  import gris2 from '../../assets/objects/gris/gris2.png';
  import gris3 from '../../assets/objects/gris/gris3.png';
  import gris4 from '../../assets/objects/gris/gris4.png';
  import dorado1 from '../../assets/objects/dorado/dorado1.png';
  import dorado2 from '../../assets/objects/dorado/dorado2.png';
  import dorado3 from '../../assets/objects/dorado/dorado3.png';
  import dorado4 from '../../assets/objects/dorado/dorado4.png';

  // Audio imports
  import winRoundSound from '../../assets/sounds/win-round.mp3';      // For winning a round
  import gameEndSound from '../../assets/sounds/game-end.mp3';        // For end of game
  import bidPlacedSound from '../../assets/sounds/bid-placed.mp3';     // When player places a bid
  import countdownSound from '../../assets/sounds/countdown.mp3';      // For the last 5 seconds of timer
  import containerRevealSound from '../../assets/sounds/reveal.mp3';   // When container is revealed
  import readySound from '../../assets/sounds/ready.mp3';              // When player clicks "ready"
  import newRoundSound from '../../assets/sounds/new-round.mp3';       // Start of a new round
  import backgroundMusic from '../../assets/sounds/background-music.mp3'; // Background music during rounds

  // Función para mapear tipos de contenedor a colores
  function mapContainerTypeToColor(type) {
    const typeToColorMap = {
      'común': 'blanco',
      'raro': 'gris',
      'épico': 'azul',
      'legendario': 'dorado'
    };
    
    return typeToColorMap[type?.toLowerCase()] || 'gris'; // Valor por defecto
  }

  const Partida = ({ onExit, socketConnection, lobbyData, userName }) => {
    const [players, setPlayers] = useState([]); 
    const [currentBid, setCurrentBid] = useState(100); // Apuesta inicial por defecto
    const [activeContainer, setActiveContainer] = useState(null);
    const [gameState, setGameState] = useState("waiting"); // waiting, bidding, revealing, ready, finished
    const [bidAmount, setBidAmount] = useState(200); // Valor inicial para apostar (mayor que la apuesta inicial)
    const [playerBalance, setPlayerBalance] = useState(0); // Inicializado en 0, se actualizará desde la API
    const [currentRound, setCurrentRound] = useState(1);
    const [totalRounds, setTotalRounds] = useState(lobbyData?.rounds || 3);
    const [countdown, setCountdown] = useState(0);
    const [gameResult, setGameResult] = useState(null);
    const [notification, setNotification] = useState(null); // Para mostrar notificaciones dentro del componente
    const [isReady, setIsReady] = useState(false); // Estado de "listo" para avanzar a la siguiente ronda
    const [readyPlayers, setReadyPlayers] = useState([]); // Lista de jugadores listos para la siguiente ronda
    const [revealedContainer, setRevealedContainer] = useState(null); // Contenedor revelado con su información
    const [isLoading, setIsLoading] = useState(true); // Estado para controlar la carga inicial
    const [lastBidder, setLastBidder] = useState(null); // Último jugador que realizó una apuesta
    const fallbackImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 50 50'%3E%3Crect width='50' height='50' fill='%23666'/%3E%3C/svg%3E";

    // Estado para el confeti cuando se gana una ronda
    const [showWinConfetti, setShowWinConfetti] = useState(false);
    const [windowSize, setWindowSize] = useState({
      width: window.innerWidth,
      height: window.innerHeight
    });
    
    // Audio refs
    const winRoundAudioRef = useRef(null);
    const gameEndAudioRef = useRef(null);
    const bidPlacedAudioRef = useRef(null);
    const countdownAudioRef = useRef(null);
    const containerRevealAudioRef = useRef(null);
    const readyAudioRef = useRef(null);
    const newRoundAudioRef = useRef(null);
    const backgroundMusicRef = useRef(null);

    // Referencia para controlar el intervalo del timer
    const timerIntervalRef = useRef(null);

    // Función para obtener el balance del usuario desde la API
    // Solo lo usamos al final de cada ronda para sincronizar con el servidor
    const fetchUserBalance = useCallback(async () => {
      try {
        console.log('Obteniendo balance actualizado para:', userName);
        const response = await fetch(`https://thehiddencargo1.azure-api.net/creation/polling/users/nickname/${userName}/balance`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Ocp-Apim-Subscription-Key': process.env.REACT_APP_API_KEY
          }
        });

        if (!response.ok) {
          throw new Error(`Error al obtener el balance: ${response.status}`);
        }

        const data = await response.json();

        // Obtener el balance desde la respuesta
        if (data && data.userBalance !== undefined) {
          console.log('Balance actualizado recibido:', data.userBalance);
          setPlayerBalance(parseInt(data.userBalance));
        } else {
          console.warn('La respuesta de la API no contiene el campo userBalance:', data);
        }
      } catch (error) {
        console.error('Error al obtener el saldo actualizado:', error);
      }
    }, [userName]);

    // Initialize audio elements on component mount
    useEffect(() => {
      const BACKGROUND_VOLUME = 0.05; // Lower volume for background music (20% of fixed volume)
      const EFFECTS_VOLUME = 0.15; // Effects volume (70% of fixed volume)
      
      // Initialize audio refs
      winRoundAudioRef.current = new Audio(winRoundSound);
      gameEndAudioRef.current = new Audio(gameEndSound);
      bidPlacedAudioRef.current = new Audio(bidPlacedSound);
      countdownAudioRef.current = new Audio(countdownSound);
      containerRevealAudioRef.current = new Audio(containerRevealSound);
      readyAudioRef.current = new Audio(readySound);
      newRoundAudioRef.current = new Audio(newRoundSound);
      backgroundMusicRef.current = new Audio(backgroundMusic);
      
      // Configurar la música de fondo para reproducirse en bucle
      backgroundMusicRef.current.loop = true;
      
      // Set volume for sound effects (no tan altos)
      [
        winRoundAudioRef, 
        gameEndAudioRef, 
        bidPlacedAudioRef, 
        countdownAudioRef, 
        containerRevealAudioRef,
        readyAudioRef,
        newRoundAudioRef
      ].forEach(ref => {
        if (ref.current) {
          ref.current.volume = EFFECTS_VOLUME;
        }
      });
      
      // Set lower volume for background music (tenue)
      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.volume = BACKGROUND_VOLUME;
      }
      
      // Clean up on unmount
      return () => {
        [
          winRoundAudioRef, 
          gameEndAudioRef, 
          bidPlacedAudioRef, 
          countdownAudioRef, 
          containerRevealAudioRef,
          readyAudioRef,
          newRoundAudioRef,
          backgroundMusicRef
        ].forEach(ref => {
          if (ref.current) {
            ref.current.pause();
            ref.current = null;
          }
        });
      };
    }, []);

    // Functions to play sounds - usando Promise.resolve para evitar bloqueos
    const playWinRoundSound = useCallback(() => {
      if (winRoundAudioRef.current) {
        Promise.resolve().then(() => {
          winRoundAudioRef.current.currentTime = 0;
          return winRoundAudioRef.current.play();
        }).catch(e => console.error("Error playing win sound:", e));
      }
    }, []);
    
    const playGameEndSound = useCallback(() => {
      if (gameEndAudioRef.current) {
        Promise.resolve().then(() => {
          gameEndAudioRef.current.currentTime = 0;
          return gameEndAudioRef.current.play();
        }).catch(e => console.error("Error playing game end sound:", e));
      }
    }, []);

    const playBidPlacedSound = useCallback(() => {
      if (bidPlacedAudioRef.current) {
        Promise.resolve().then(() => {
          bidPlacedAudioRef.current.currentTime = 0;
          return bidPlacedAudioRef.current.play();
        }).catch(e => console.error("Error playing bid sound:", e));
      }
    }, []);

    const playCountdownSound = useCallback(() => {
      if (countdownAudioRef.current) {
        Promise.resolve().then(() => {
          countdownAudioRef.current.currentTime = 0;
          return countdownAudioRef.current.play();
        }).catch(e => console.error("Error playing countdown sound:", e));
      }
    }, []);

    const playContainerRevealSound = useCallback(() => {
      if (containerRevealAudioRef.current) {
        Promise.resolve().then(() => {
          containerRevealAudioRef.current.currentTime = 0;
          return containerRevealAudioRef.current.play();
        }).catch(e => console.error("Error playing reveal sound:", e));
      }
    }, []);

    const playReadySound = useCallback(() => {
      if (readyAudioRef.current) {
        Promise.resolve().then(() => {
          readyAudioRef.current.currentTime = 0;
          return readyAudioRef.current.play();
        }).catch(e => console.error("Error playing ready sound:", e));
      }
    }, []);

    const playNewRoundSound = useCallback(() => {
      if (newRoundAudioRef.current) {
        Promise.resolve().then(() => {
          newRoundAudioRef.current.currentTime = 0;
          return newRoundAudioRef.current.play();
        }).catch(e => console.error("Error playing new round sound:", e));
      }
    }, []);

    // Funciones para controlar la música de fondo
    const playBackgroundMusic = useCallback(() => {
      if (backgroundMusicRef.current) {
        Promise.resolve().then(() => {
          return backgroundMusicRef.current.play();
        }).catch(e => console.error("Error playing background music:", e));
      }
    }, []);

    const pauseBackgroundMusic = useCallback(() => {
      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.pause();
      }
    }, []);

    // Control de la música de fondo según el estado del juego
    useEffect(() => {
      // Iniciar música de fondo cuando comienza la fase de bidding
      if (gameState === "bidding") {
        playBackgroundMusic();
      } else {
        pauseBackgroundMusic();
      }
      
      return () => {
        // Detener música de fondo al desmontar o cambiar de estado
        pauseBackgroundMusic();
      };
    }, [gameState, playBackgroundMusic, pauseBackgroundMusic]);

    // useEffect para obtener el saldo inicial del usuario usando fetch
    useEffect(() => {
      const fetchInitialBalance = async () => {
        try {
          setIsLoading(true);
          // Realizar la petición para obtener el balance usando el nickname con fetch
          const response = await fetch(`https://thehiddencargo1.azure-api.net/creation/polling/users/nickname/${userName}/balance`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Ocp-Apim-Subscription-Key': process.env.REACT_APP_API_KEY
            }
          });

          if (!response.ok) {
            throw new Error(`Error al obtener el balance: ${response.status}`);
          }

          const data = await response.json();

          // Obtener el balance desde la respuesta (ajusta según la estructura de tu API)
          if (data && data.userBalance !== undefined) {
            setPlayerBalance(parseInt(data.userBalance));
            
            // Enviar el balance al servidor cuando lo recibimos
            if (socketConnection) {
              console.log('Enviando balance inicial al servidor:', parseInt(data.userBalance));
              socketConnection.emit('updatePlayerBalance', {
                nickname: userName,
                lobbyName: lobbyData ? lobbyData.name : "",
                initialBalance: parseInt(data.userBalance)
              });
            }
          } else {
            console.warn('La respuesta de la API no contiene el campo userBalance:', data);
            // Puedes establecer un valor por defecto o mostrar una notificación
            setNotification({
              type: "warning",
              message: "No se pudo obtener el saldo inicial. Usando valor por defecto."
            });
            setPlayerBalance(1000); // Valor por defecto
            
            // Enviar el balance por defecto
            if (socketConnection) {
              console.log('Enviando balance por defecto al servidor:', 1000);
              socketConnection.emit('updatePlayerBalance', {
                nickname: userName,
                lobbyName: lobbyData ? lobbyData.name : "",
                initialBalance: 1000
              });
            }
          }
        } catch (error) {
          console.error('Error al obtener el saldo inicial:', error);
          setNotification({
            type: "error",
            message: "Error al obtener el saldo inicial. Usando valor por defecto."
          });
          setPlayerBalance(1000); // Valor por defecto en caso de error
          
          // Enviar el balance por defecto en caso de error
          if (socketConnection) {
            console.log('Enviando balance por defecto al servidor tras error:', 1000);
            socketConnection.emit('updatePlayerBalance', {
              nickname: userName,
              lobbyName: lobbyData ? lobbyData.name : "",
              initialBalance: 1000
            });
          }
        } finally {
          setIsLoading(false);
        }
      };

      if (userName && socketConnection) {
        fetchInitialBalance();
      }
    }, [userName, socketConnection, lobbyData]);

    function getObjectImageByContainerType(containerColor, objectName) {
    try {
      const color = containerColor?.toLowerCase() || 'dorado';
      
      // Extraer el número del nombre del objeto
      let index = 0;
      if (objectName) {
        const match = objectName.match(/\d+/);
        if (match) {
          // Convertir a número y restar 1 para obtener el índice correcto (1→0, 2→1, 3→2, 4→3)
          index = parseInt(match[0]) - 1;
          // Asegurarse de que el índice esté dentro del rango válido (0-3)
          index = Math.min(Math.max(index, 0), 3);
        }
      }
      
      // Check if the color exists in our mapping
      if (!imageMap[color]) {
        console.warn(`Color not found in imageMap: ${color}, using fallback`);
        return fallbackImage;
      }
      
      // Return the image or fallback if not found
      return imageMap[color][index] || fallbackImage;
    } catch (error) {
      console.error('Error getting object image:', error);
      return fallbackImage;
    }
  }
    
    // Function to get custom name for objects based on color and object type
  function getCustomObjectName(containerColor, objectName) {
    try {
      const color = containerColor?.toLowerCase() || 'dorado';
      
      // Extract the object number from the name
      let objectNumber = 1;
      if (objectName) {
        const match = objectName.match(/\d+/);
        if (match) {
          objectNumber = parseInt(match[0]);
        }
      }
      
      // Custom object names mapping with proper structure
      const objectNamesMap = {
        azul: {
          1: "Cámara",
          2: "Consola Retro",
          3: "Audífonos",
          4: "SmartPhone"
        },
        blanco: {
          1: "TV Feo",
          2: "Lámpara Dañada",
          3: "Medias",
          4: "Esfero"
        },
        dorado: {
          1: "Reloj de Oro",
          2: "TV Nueva",
          3: "PC Gamer",
          4: "Carro Nuevo"
        },
        gris: {
          1: "Bici Vieja",
          2: "Lonchera de Niño",
          3: "Calculadora Vieja",
          4: "Linterna"
        }
      };
      
      // Return custom name if available, otherwise return original name
      if (objectNamesMap[color] && objectNamesMap[color][objectNumber]) {
        return objectNamesMap[color][objectNumber];
      }
      return objectName;
    } catch (error) {
      console.error('Error getting custom object name:', error);
      return objectName;
    }
  }

    const imageMap = {
      blanco: [blanco1, blanco2, blanco3, blanco4],
      gris: [gris1, gris2, gris3, gris4],
      azul: [azul1, azul2, azul3, azul4],
      dorado: [dorado1, dorado2, dorado3, dorado4],
    };

    
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

    // Play countdown sound when timer reaches 5 seconds or less - ahora usa Promise para no bloquear
    useEffect(() => {
      if (countdown <= 5 && countdown > 0 && gameState === "bidding") {
        // La reproducción de audio no debe bloquear la actualización del timer
        playCountdownSound();
      }
    }, [countdown, gameState, playCountdownSound]);

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
        setLastBidder(null);
      });

      socketConnection.on('newRound', (roundData) => {
        console.log('Nueva ronda recibida:', roundData);
        
        // Play new round sound
        playNewRoundSound();
        
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
          setLastBidder(null);
          
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
        setLastBidder(bidData.nickname);
        
        // Only play sound if it's not from the current user
        if (bidData.nickname !== userName) {
          playBidPlacedSound();
        }
      });

      socketConnection.on('bidResult', (resultData) => {
        console.log('Resultado de apuesta:', resultData);
        setGameState("revealing");
        
        // Play container reveal sound
        playContainerRevealSound();
        
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
        
        // Mostrar confeti y reproducir sonido si el usuario actual ganó la subasta
        if (resultData.winner === userName) {
          setShowWinConfetti(true);
          playWinRoundSound(); // Play win sound when user wins
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
          // Actualizamos el balance desde la API al final de la ronda
          fetchUserBalance();
        }, 3000);
      });

      socketConnection.on('playerUpdate', (playerData) => {
        console.log('Actualización de jugador:', playerData);
        // Mantener actualización visual en tiempo real del saldo durante la ronda
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
        
        // Actualizar el countdown inmediatamente
        setCountdown(seconds);
        
        // Limpiar cualquier intervalo existente antes de crear uno nuevo
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        
        // Crear una versión más confiable del temporizador con setTimeout anidados
        // en lugar de setInterval para evitar problemas de sincronización
        const startTime = Date.now();
        const totalSeconds = seconds;
        
        const updateTimer = () => {
          const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
          const remaining = totalSeconds - elapsedSeconds;
          
          if (remaining <= 0) {
            setCountdown(0);
            return;
          }
          
          setCountdown(remaining);
          
          // Programar la próxima actualización
          timerIntervalRef.current = setTimeout(updateTimer, 1000);
        };
        
        // Iniciar el temporizador
        timerIntervalRef.current = setTimeout(updateTimer, 1000);
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
        
        // Play game end sound
        playGameEndSound();
        
        // Obtener balance final desde la API
        fetchUserBalance();
        
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
        
        // Limpiar el intervalo del timer
        if (timerIntervalRef.current) {
          clearTimeout(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        
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
    }, [socketConnection, userName, currentRound, totalRounds, gameState, fetchUserBalance, 
        playWinRoundSound, playGameEndSound, playBidPlacedSound, playContainerRevealSound, 
        playNewRoundSound, playCountdownSound, playBackgroundMusic, pauseBackgroundMusic]);

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
          message: `Tu apuesta debe ser mayor que la apuesta actual (${currentBid})`
        });
        return;
      }

      // Play bid sound
      playBidPlacedSound();

      // Enviar evento de apuesta al servidor
      socketConnection.emit('placeBid', {
        nickname: userName,
        lobbyName: lobbyData ? lobbyData.name : "",
        containerId: activeContainer.id,
        amount: bidAmount
      });
      
      console.log("Apuesta enviada:", bidAmount);
      // Al hacer una apuesta, actualizamos el último apostador
      setLastBidder(userName);
    };

    // Manejar el botón de "Listo para siguiente ronda"
    const handleReadyForNextRound = () => {
      setIsReady(true);
      
      // Play ready sound
      playReadySound();
      
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

    // Mostrar pantalla de carga mientras se obtiene el saldo inicial
    if (isLoading) {
      return (
        <div className="partida-container">
          <div className="loading-screen">
            <h2>Cargando datos de usuario...</h2>
            <div className="loading-spinner"></div>
          </div>
        </div>
      );
    }

    // Renderizado condicional según el estado del juego
    if (gameState === "finished" && gameResult) {
      return (
        <div className="partida-container">
          <div className="partida-header">
            <h1 className="partida-titulo-final">¡Juego Finalizado!</h1>
          </div>
          
          <Notification />
          
          <div className="game-results">
            <div className="winner-announcement">
              <h2 className="winner-title">Ganador: <span className="winner-name">{gameResult.winner}</span></h2>
              
              {/* Añadir confeti para el ganador */}
              {gameResult.winner === userName && (
                <ReactConfetti
                  width={windowSize.width}
                  height={windowSize.height}
                  recycle={false}
                  numberOfPieces={300}
                  gravity={0.3}
                  colors={['#f44336', '#e91e63', '#9c27b0', '#3f51b5', '#2196f3', '#4CAF50', '#FFEB3B', '#FFC107']}
                />
              )}
            </div>
            
            <div className="final-scores">
              <h3>Puntuaciones finales:</h3>
              <table className="scores-table">
                <thead>
                  <tr>
                    <th>Jugador</th>
                    <th>Puntuación</th>
                    <th>Saldo final</th>
                    <th>Beneficio total</th>
                  </tr>
                </thead>
                <tbody>
                  {gameResult.finalScores && gameResult.finalScores.map((player, index) => {
                    // Calcular beneficio total (puntuación es el beneficio acumulado)
                    const totalProfit = player.score;
                    
                    return (
                      <tr 
                        key={index} 
                        className={`player-row ${player.nickname === gameResult.winner ? 'winner-row' : ''}`}
                      >
                        <td className="player-name-cell">
                          <div className="player-avatar-small">
                            {player.nickname.charAt(0).toUpperCase()}
                          </div>
                          {player.nickname}
                          {player.nickname === gameResult.winner && 
                            <span className="winner-crown">👑</span>
                          }
                        </td>
                        <td>{player.score}</td>
                        <td>${player.balance}</td>
                        <td className={totalProfit >= 0 ? 'profit-positive' : 'profit-negative'}>
                          {totalProfit >= 0 ? '+' : ''}{totalProfit}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="players-final-list">
            <h3>Jugadores</h3>
            <div className="players-grid">
              {gameResult.finalScores && gameResult.finalScores.map((player, index) => (
                <div 
                  key={index} 
                  className={`player-card ${player.nickname === gameResult.winner ? 'winner-card' : ''}`}
                >
                  <div className="player-avatar">
                    {player.nickname.charAt(0).toUpperCase()}
                  </div>
                  <div className="player-details">
                    <span className="player-name">
                      {player.nickname} 
                      {player.nickname === gameResult.winner && <span className="winner-badge">👑</span>}
                    </span>
                    <span className="player-balance-small">${player.balance}</span>
                    <span className="player-score">Puntos: {player.score}</span>
                  </div>
                </div>
              ))}
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
            {countdown > 0 && (
              <span className={`countdown ${countdown <= 5 ? 'urgent' : ''}`}>
                Tiempo: {countdown}s
              </span>
            )}
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
                  <div className={`mystery-box ${mapContainerTypeToColor(activeContainer.type)}`}>
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
            <h3 className="subasta-title">Resultado de la Subasta</h3>
            
            <div className="container-result">
              {/* Container with information */}
              <div className={`container-image ${revealedContainer.color ? revealedContainer.color.toLowerCase() : mapContainerTypeToColor(revealedContainer.type)}`}>
                <div className="container-content">
                  <p className="result-title">
                    {revealedContainer.winner === userName ? "¡Has ganado!" : `${revealedContainer.winner} ha ganado`}
                  </p>
                  <p>Tipo: {revealedContainer.type} {revealedContainer.color !== "desconocido" ? `(${revealedContainer.color})` : ""}</p>
                  <p>Valor: ${revealedContainer.value}</p>
                  <p>Apuesta: ${revealedContainer.bidAmount}</p>
                  <p>Beneficio: ${revealedContainer.profit}</p>
                  
                  {revealedContainer.objects && revealedContainer.objects.length > 0 && (
                    <div className="objects-info">
                    </div>
                  )}
                </div>
              </div>
              
              {/* Objects with improved visibility and animations */}
              {revealedContainer.objects && revealedContainer.objects.length > 0 && (
                <div className="objects-display">
                  {revealedContainer.objects.map((obj, index) => (
                    <div 
                      key={`object-${index}`} 
                      className="object-item"
                      style={{"--animation-order": index}}
                    >
                      <div className="object-image-wrapper">
                        <img 
                          src={getObjectImageByContainerType(revealedContainer.color, obj.nombre)}
                          alt={obj.nombre}
                          className="object-image"
                          onError={(e) => {
                            console.log(`Error loading image for ${obj.nombre}`);
                            e.target.src = fallbackImage;
                            console.log("Fallback image used:", fallbackImage);
                          }}
                        />
                      </div>
                      <div className="object-info">
                        <span className="object-name">{getCustomObjectName(revealedContainer.color, obj.nombre)}</span>
                        <span className="object-price">${obj.precio}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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

        {/* SECCIÓN DE JUGADORES VISIBLE DURANTE TODA LA PARTIDA */}
        <div className="players-bids-section players-section">
          <h3>Jugadores</h3>
          <div className="players-bids-container players-grid">
            {players && players.length > 0 ? (
              players.map((player, index) => {
                const playerName = typeof player === 'string' ? player : player.name;
                const playerBal = typeof player === 'object' && player.balance !== undefined ? player.balance : null;
                const playerScore = typeof player === 'object' && player.score !== undefined ? player.score : 0;
                const isCurrentBidder = playerName === lastBidder;
                const isReady = gameState === "ready" && readyPlayers.includes(playerName);
                const isRoundWinner = (gameState === "revealing" || gameState === "ready") && 
                                    revealedContainer && playerName === revealedContainer.winner;
                
                return (
                  <div 
                    key={index} 
                    className={`player-bid-card player-card ${isCurrentBidder ? 'current-bidder' : ''} 
                            ${isReady ? 'player-ready' : ''} 
                            ${isRoundWinner ? 'round-winner' : ''}`}
                    style={{
                      display: 'flex',
                      margin: '5px',
                      padding: '10px',
                      borderRadius: '8px',
                      backgroundColor: isRoundWinner ? 'rgba(60, 50, 20, 0.6)' : 'rgba(43, 45, 66, 0.8)',
                      border: isRoundWinner ? '1px solid #e9a13d' : '1px solid #3d4263'
                    }}
                  >
                    <div className="player-avatar" style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: isRoundWinner ? '#e9a13d' : '#3d4263',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      fontWeight: 'bold',
                      marginRight: '10px'
                    }}>
                      {playerName.charAt(0).toUpperCase()}
                    </div>
                    
                    <div className="player-details" style={{
                      display: 'flex',
                      flexDirection: 'column'
                    }}>
                      <span className="player-name" style={{
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        color: '#ffffff',
                        marginBottom: '4px'
                      }}>
                        {playerName}
                        {isCurrentBidder && <span className="bidder-badge" style={{marginLeft: '5px'}}>🏆</span>}
                        {isRoundWinner && <span className="winner-badge" style={{marginLeft: '5px'}}>👑</span>}
                        {isReady && <span className="ready-badge" style={{marginLeft: '5px', color: '#4ad86e'}}>✓</span>}
                      </span>
                      
                      {playerBal !== null && (
                        <span className="player-balance-small" style={{
                          fontSize: '0.9rem',
                          color: '#b1b1cb'
                        }}>
                          ${playerBal}
                        </span>
                      )}
                      
                      {playerScore !== null && playerScore !== 0 && (
                        <span className="player-score-small" style={{
                          fontSize: '0.9rem',
                          color: '#fdd35c'
                        }}>
                          Puntos: {playerScore}
                        </span>
                      )}
                    </div>
                    
                    {/* Información adicional sobre apuestas y ganancias */}
                    {isCurrentBidder && gameState === "bidding" && (
                      <div className="bid-info" style={{
                        marginLeft: 'auto',
                        padding: '3px 6px',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        backgroundColor: 'rgba(74, 146, 216, 0.2)',
                        color: '#4a92d8'
                      }}>
                        ${currentBid}
                      </div>
                    )}
                    
                    {isRoundWinner && revealedContainer && (
                      <div className="winner-info" style={{
                        marginLeft: 'auto',
                        padding: '3px 6px',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        backgroundColor: 'rgba(233, 161, 61, 0.2)',
                        color: '#e9a13d'
                      }}>
                        <div className="profit-info" style={{
                          fontWeight: 'bold',
                          color: revealedContainer.profit >= 0 ? '#4ad86e' : '#ff5c5c'
                        }}>
                          {revealedContainer.profit >= 0 ? '+' : ''}{revealedContainer.profit}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div style={{color: 'white', padding: '10px'}}>No hay jugadores disponibles</div>
            )}
          </div>
        </div>

        <button className="boton-salir" onClick={handleExit}>
          Salir
        </button>
      </div>
    );
  };

  export default Partida;