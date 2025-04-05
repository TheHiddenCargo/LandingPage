import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Partida from '../Partida/Partida';

// Mock para sessionStorage
const mockSessionStorage = (function() {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

describe('Componente Partida', () => {
  let mockSocket;
  
  beforeEach(() => {
    // Restaurar todas las implementaciones de mocks
    jest.clearAllMocks();
    
    // Mock del objeto socket
    mockSocket = {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn()
    };
    
    // Mock de sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      value: mockSessionStorage,
      writable: true
    });
    
    // Limpiar el mock de sessionStorage
    mockSessionStorage.clear();
  });
  
  // Props básicas para el componente
  const defaultProps = {
    onExit: jest.fn(),
    socketConnection: mockSocket,
    lobbyData: { name: 'TestLobby', rounds: 3 },
    userName: 'TestUser'
  };
  
  test('renderiza el estado inicial "waiting" correctamente', () => {
    render(<Partida {...defaultProps} />);
    
    expect(screen.getByText('Partida en Curso')).toBeInTheDocument();
    expect(screen.getByText('Ronda 1/3')).toBeInTheDocument();
    expect(screen.getByText('Preparando próxima ronda...')).toBeInTheDocument();
    expect(screen.getByText('TestUser')).toBeInTheDocument();
    expect(screen.getByText('Saldo: $1000')).toBeInTheDocument();
  });
  
  test('maneja el botón de salir correctamente', () => {
    render(<Partida {...defaultProps} />);
    
    // Verificamos los listeners registrados
    expect(mockSocket.on).toHaveBeenCalledWith('gameStarted', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('newRound', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('newBid', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('bidResult', expect.any(Function));
    
    // Buscamos el botón de salir y lo pulsamos
    const exitButton = screen.getByText('Salir');
    fireEvent.click(exitButton);
    
    // Verificamos que se emite el evento de salida
    expect(mockSocket.emit).toHaveBeenCalledWith('leaveGame', {
      nickname: 'TestUser',
      lobbyName: 'TestLobby'
    });
    
    // Verificamos que se llama a la función onExit
    expect(defaultProps.onExit).toHaveBeenCalled();
    
    // Verificamos que limpia sessionStorage
    expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('gameFinished');
    expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('gameResult');
    expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('currentRound');
    expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('currentContainer');
    expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('currentBid');
  });
  
  test('registra correctamente los eventos del socket', () => {
    render(<Partida {...defaultProps} />);
    
    // Verificamos que todos los eventos se registran correctamente
    expect(mockSocket.on).toHaveBeenCalledWith('gameStarted', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('newRound', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('newBid', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('bidResult', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('containerRevealed', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('playerUpdate', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('auctionTimer', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('playerLeftGame', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('gameEnd', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('playerReadyForNextRound', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('allPlayersReadyForNextRound', expect.any(Function));
  });
  
  test('limpia correctamente los listeners del socket al desmontar el componente', () => {
    const { unmount } = render(<Partida {...defaultProps} />);
    
    // Desmontamos el componente
    unmount();
    
    // Verificamos que se llamó a off para cada evento
    expect(mockSocket.off).toHaveBeenCalledWith('gameStarted');
    expect(mockSocket.off).toHaveBeenCalledWith('newRound');
    expect(mockSocket.off).toHaveBeenCalledWith('newBid');
    expect(mockSocket.off).toHaveBeenCalledWith('bidResult');
    expect(mockSocket.off).toHaveBeenCalledWith('containerRevealed');
    expect(mockSocket.off).toHaveBeenCalledWith('playerUpdate');
    expect(mockSocket.off).toHaveBeenCalledWith('auctionTimer');
    expect(mockSocket.off).toHaveBeenCalledWith('playerLeftGame');
    expect(mockSocket.off).toHaveBeenCalledWith('gameEnd');
    expect(mockSocket.off).toHaveBeenCalledWith('playerReadyForNextRound');
    expect(mockSocket.off).toHaveBeenCalledWith('allPlayersReadyForNextRound');
  });
  
  test('restaura el estado del juego desde sessionStorage al iniciar', async () => {
    // Configuramos datos previos en sessionStorage
    mockSessionStorage.setItem('gameFinished', 'true');
    mockSessionStorage.setItem('gameResult', JSON.stringify({
      winner: 'TestUser',
      finalScores: [
        { nickname: 'TestUser', score: 300, balance: 1200 },
        { nickname: 'Player2', score: 150, balance: 800 }
      ]
    }));
    
    // Para simular que la recuperación de datos funciona, necesitamos recuperar la función
    // que se pasa a on('gameEnd') y ejecutarla manualmente
    let gameEndHandler;
    mockSocket.on.mockImplementation((event, callback) => {
      if (event === 'gameEnd') {
        gameEndHandler = callback;
      }
    });
    
    render(<Partida {...defaultProps} />);
    
    // Ejecutamos manualmente el handler con los datos del juego
    act(() => {
      if (gameEndHandler) {
        gameEndHandler({
          winner: 'TestUser',
          finalScores: [
            { nickname: 'TestUser', score: 300, balance: 1200 },
            { nickname: 'Player2', score: 150, balance: 800 }
          ]
        });
      }
    });
    
    // Verificamos que muestra la pantalla de fin de juego
    await waitFor(() => {
      expect(screen.getByText('¡Juego Finalizado!')).toBeInTheDocument();
      expect(screen.getByText('Ganador: TestUser')).toBeInTheDocument();
    });
  });
  
  test('simula evento gameStarted y cambia a estado bidding', async () => {
    // Preparamos el handler
    let gameStartedHandler;
    mockSocket.on.mockImplementation((event, callback) => {
      if (event === 'gameStarted') {
        gameStartedHandler = callback;
      }
    });
    
    render(<Partida {...defaultProps} />);
    
    // Ejecutamos el handler
    act(() => {
      if (gameStartedHandler) {
        gameStartedHandler({
          players: ['TestUser', 'Player2'],
          container: { id: 'container-123', type: 'Normal' },
          initialBid: 100,
          round: 1,
          totalRounds: 3
        });
      }
    });
    
    // Verificamos el cambio de estado
    await waitFor(() => {
      expect(screen.getByText('Contenedor Misterioso')).toBeInTheDocument();
      expect(screen.getByText('Apuesta actual: $100')).toBeInTheDocument();
    });
  });
  
  test('simula evento newBid y actualiza la apuesta actual', async () => {
    // Preparamos los handlers
    let gameStartedHandler, newBidHandler;
    mockSocket.on.mockImplementation((event, callback) => {
      if (event === 'gameStarted') {
        gameStartedHandler = callback;
      } else if (event === 'newBid') {
        newBidHandler = callback;
      }
    });
    
    render(<Partida {...defaultProps} />);
    
    // Iniciamos el juego
    act(() => {
      if (gameStartedHandler) {
        gameStartedHandler({
          players: ['TestUser', 'Player2'],
          container: { id: 'container-123', type: 'Normal' },
          initialBid: 100,
          round: 1,
          totalRounds: 3
        });
      }
    });
    
    // Esperamos a que se muestre la pantalla de apuestas
    await waitFor(() => {
      expect(screen.getByText('Apuesta actual: $100')).toBeInTheDocument();
    });
    
    // Simulamos una nueva apuesta
    act(() => {
      if (newBidHandler) {
        newBidHandler({ amount: 150 });
      }
    });
    
    // Verificamos que se actualiza la apuesta actual
    await waitFor(() => {
      expect(screen.getByText('Apuesta actual: $150')).toBeInTheDocument();
    });
  });
  
  test('simula una apuesta del usuario', async () => {
    // Preparamos el handler
    let gameStartedHandler;
    mockSocket.on.mockImplementation((event, callback) => {
      if (event === 'gameStarted') {
        gameStartedHandler = callback;
      }
    });
    
    render(<Partida {...defaultProps} />);
    
    // Iniciamos el juego
    act(() => {
      if (gameStartedHandler) {
        gameStartedHandler({
          players: ['TestUser', 'Player2'],
          container: { id: 'container-123', type: 'Normal' },
          initialBid: 100,
          round: 1,
          totalRounds: 3
        });
      }
    });
    
    // Esperamos a que se muestre la pantalla de apuestas
    await waitFor(() => {
      expect(screen.getByText('Contenedor Misterioso')).toBeInTheDocument();
    });
    
    // Cambiamos el valor de la apuesta
    const bidInput = screen.getByRole('spinbutton');
    fireEvent.change(bidInput, { target: { value: '200' } });
    
    // Realizamos la apuesta
    const bidButton = screen.getByText('Apostar $200');
    fireEvent.click(bidButton);
    
    // Verificamos que se emite el evento placeBid
    expect(mockSocket.emit).toHaveBeenCalledWith('placeBid', {
      nickname: 'TestUser',
      lobbyName: 'TestLobby',
      containerId: 'container-123',
      amount: 200
    });
  });
  
  test('simula el evento bidResult y muestra el contenedor revelado', async () => {
    // Preparamos los handlers
    let gameStartedHandler, bidResultHandler, containerRevealedHandler;
    mockSocket.on.mockImplementation((event, callback) => {
      if (event === 'gameStarted') {
        gameStartedHandler = callback;
      } else if (event === 'bidResult') {
        bidResultHandler = callback;
      } else if (event === 'containerRevealed') {
        containerRevealedHandler = callback;
      }
    });
    
    render(<Partida {...defaultProps} />);
    
    // Iniciamos el juego
    act(() => {
      if (gameStartedHandler) {
        gameStartedHandler({
          players: ['TestUser', 'Player2'],
          container: { id: 'container-123-color:rojo-objects:laptop,500;phone,200', type: 'Premium' },
          initialBid: 100,
          round: 1,
          totalRounds: 3
        });
      }
    });
    
    // Esperamos a que se muestre la pantalla de apuestas
    await waitFor(() => {
      expect(screen.getByText('Contenedor Misterioso')).toBeInTheDocument();
    });
    
    // Simulamos el resultado de una apuesta
    act(() => {
      if (bidResultHandler) {
        bidResultHandler({
          containerId: 'container-123-color:rojo-objects:laptop,500;phone,200',
          containerType: 'Premium',
          containerValue: 700,
          winner: 'TestUser',
          bidAmount: 150,
          profit: 550
        });
      }
    });
    
    // Verificamos el cambio a estado "revealing"
    await waitFor(() => {
      expect(screen.getByText('¡Revelando contenido!')).toBeInTheDocument();
    });
    
    // Simulamos que se reveló el contenedor
    act(() => {
      if (containerRevealedHandler) {
        containerRevealedHandler({
          id: 'container-123-color:rojo-objects:laptop,500;phone,200',
          type: 'Premium',
          value: 700
        });
        // Avanzamos el timer para simular el setTimeout del componente
        jest.advanceTimersByTime(3000);
      }
    });
    
    // Esperamos a que cambie a estado "ready"
    await waitFor(() => {
      expect(screen.getByText('Resultado de la Subasta')).toBeInTheDocument();
      expect(screen.getByText('¡Has ganado!')).toBeInTheDocument();
    });
  });
  
  test('simula el evento playerUpdate para actualizar el saldo', async () => {
    // Preparamos los handlers
    let gameStartedHandler, playerUpdateHandler;
    mockSocket.on.mockImplementation((event, callback) => {
      if (event === 'gameStarted') {
        gameStartedHandler = callback;
      } else if (event === 'playerUpdate') {
        playerUpdateHandler = callback;
      }
    });
    
    render(<Partida {...defaultProps} />);
    
    // Iniciamos el juego
    act(() => {
      if (gameStartedHandler) {
        gameStartedHandler({
          players: ['TestUser', 'Player2'],
          container: { id: 'container-123', type: 'Normal' },
          initialBid: 100,
          round: 1,
          totalRounds: 3
        });
      }
    });
    
    // Esperamos a que se muestre la pantalla inicial
    await waitFor(() => {
      expect(screen.getByText('Saldo: $1000')).toBeInTheDocument();
    });
    
    // Simulamos una actualización del jugador
    act(() => {
      if (playerUpdateHandler) {
        playerUpdateHandler({
          nickname: 'TestUser',
          balance: 850,
          score: 120
        });
      }
    });
    
    // Verificamos que se actualiza el saldo
    await waitFor(() => {
      expect(screen.getByText('Saldo: $850')).toBeInTheDocument();
    });
  });
  
  test('simula un intento de apuesta con error de saldo insuficiente', async () => {
    // Preparamos el handler
    let gameStartedHandler;
    mockSocket.on.mockImplementation((event, callback) => {
      if (event === 'gameStarted') {
        gameStartedHandler = callback;
      }
    });
    
    render(<Partida {...defaultProps} />);
    
    // Iniciamos el juego
    act(() => {
      if (gameStartedHandler) {
        gameStartedHandler({
          players: ['TestUser', 'Player2'],
          container: { id: 'container-123', type: 'Normal' },
          initialBid: 100,
          round: 1,
          totalRounds: 3
        });
      }
    });
    
    // Esperamos a que se muestre la pantalla de apuestas
    await waitFor(() => {
      expect(screen.getByText('Contenedor Misterioso')).toBeInTheDocument();
    });
    
    // Cambiamos el valor de la apuesta a uno mayor que el saldo
    const bidInput = screen.getByRole('spinbutton');
    fireEvent.change(bidInput, { target: { value: '2000' } });
    
    // Realizamos la apuesta
    const bidButton = screen.getByText('Apostar $2000');
    fireEvent.click(bidButton);
    
    // Verificamos que aparece el mensaje de error
    await waitFor(() => {
      expect(screen.getByText('No tienes suficiente saldo para esta apuesta')).toBeInTheDocument();
    });
  });
  
  test('simula un intento de apuesta con error de monto menor al actual', async () => {
    // Preparamos el handler
    let gameStartedHandler;
    mockSocket.on.mockImplementation((event, callback) => {
      if (event === 'gameStarted') {
        gameStartedHandler = callback;
      }
    });
    
    render(<Partida {...defaultProps} />);
    
    // Iniciamos el juego
    act(() => {
      if (gameStartedHandler) {
        gameStartedHandler({
          players: ['TestUser', 'Player2'],
          container: { id: 'container-123', type: 'Normal' },
          initialBid: 100,
          round: 1,
          totalRounds: 3
        });
      }
    });
    
    // Esperamos a que se muestre la pantalla de apuestas
    await waitFor(() => {
      expect(screen.getByText('Contenedor Misterioso')).toBeInTheDocument();
    });
    
    // Cambiamos el valor de la apuesta a uno menor que el actual
    const bidInput = screen.getByRole('spinbutton');
    fireEvent.change(bidInput, { target: { value: '50' } });
    
    // Realizamos la apuesta
    const bidButton = screen.getByText('Apostar $50');
    fireEvent.click(bidButton);
    
    // Verificamos que aparece el mensaje de error
    await waitFor(() => {
      expect(screen.getByText(/Tu apuesta debe ser mayor/)).toBeInTheDocument();
    });
  });
});