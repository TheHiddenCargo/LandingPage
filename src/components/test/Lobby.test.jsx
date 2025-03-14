import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Lobby from "../Lobby/Lobby";
import { useMsal } from "@azure/msal-react";

jest.mock("@azure/msal-react", () => ({
  useMsal: jest.fn(),
}));

describe("Lobby Component", () => {
  beforeEach(() => {
    useMsal.mockReturnValue({
      instance: {
        acquireTokenSilent: jest.fn().mockResolvedValue({
          accessToken: "fake-token",
        }),
      },
      accounts: [{ username: "testuser" }],
    });
  });

  test("renders the lobby header", () => {
    render(<Lobby />);
    expect(screen.getByText(/Bienvenido a The Hidden Cargo/i)).toBeInTheDocument();
  });

  test("displays containers on load", () => {
    render(<Lobby />);
    expect(screen.getByText(/Contenedores:/i)).toBeInTheDocument();
  });

  test("opens create lobby modal", () => {
    render(<Lobby />);
    fireEvent.click(screen.getByRole("button", { name: /crear/i }));
    expect(screen.getByText(/Crea una nueva sala/i)).toBeInTheDocument();
  });

  test("creates a lobby when valid data is entered", async () => {
    render(<Lobby />);
    fireEvent.click(screen.getByRole("button", { name: /crear/i }));

    fireEvent.change(screen.getByLabelText(/Nombre de la sala/i), {
      target: { value: "Mi Sala" },
    });
    fireEvent.change(screen.getByLabelText(/Contraseña/i), {
      target: { value: "1234" },
    });
    fireEvent.click(screen.getByText(/Crear Sala/i));

    await waitFor(() => {
      expect(screen.getByText(/Lobby: Mi Sala/i)).toBeInTheDocument();
    });
  });

  test("closes create lobby modal", () => {
    render(<Lobby />);
    fireEvent.click(screen.getByRole("button", { name: /crear/i }));
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(screen.queryByText(/Crea una nueva sala/i)).not.toBeInTheDocument();
  });

  test("cancels the lobby", async () => {
    render(<Lobby />);
    fireEvent.click(screen.getByRole("button", { name: /crear/i }));
    fireEvent.change(screen.getByLabelText(/Nombre de la sala/i), {
      target: { value: "Mi Sala" },
    });
    fireEvent.change(screen.getByLabelText(/Contraseña/i), {
      target: { value: "1234" },
    });
    fireEvent.click(screen.getByText(/Crear Sala/i));
    
    await waitFor(() => {
      expect(screen.getByText(/Lobby: Mi Sala/i)).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText(/Cancelar Salir/i));
    expect(screen.queryByText(/Lobby: Mi Sala/i)).not.toBeInTheDocument();
  });
});
