import { render, screen, fireEvent } from "@testing-library/react";
import LobbyFullScreenView from "../Lobby/LobbyFullScreenView";
import "@testing-library/jest-dom";

const mockLobby = {
  name: "Sala de Prueba",
  host: "Juan",
  createdAt: new Date().toISOString(),
  gameMode: "Competitivo",
  rounds: 5,
  players: 4
};

test("renders lobby details correctly", () => {
  render(<LobbyFullScreenView lobby={mockLobby} onClose={jest.fn()} userName="Juan" />);
  
  expect(screen.getByText(/Sala de Prueba/i)).toBeTruthy();
  expect(screen.getByText(/Modo: Competitivo/i)).toBeTruthy();
  expect(screen.getByText(/Rondas: 5/i)).toBeTruthy();
  expect(screen.getByText(/Jugadores: 1\/4/i)).toBeTruthy(); // Solo el host está conectado
});

test("calls onClose when exit button is clicked", () => {
  const mockOnClose = jest.fn();
  render(<LobbyFullScreenView lobby={mockLobby} onClose={mockOnClose} userName="Juan" />);
  
  fireEvent.click(screen.getByText(/Salir/i));
  expect(mockOnClose).toHaveBeenCalled();
});

test("disables start button when there are less than 2 players", () => {
    render(<LobbyFullScreenView lobby={mockLobby} onClose={jest.fn()} userName="Juan" />);
  
    const startButton = screen.getByRole("button", { name: /Iniciar partida/i });
    expect(startButton).toHaveAttribute("disabled");
  });
  
