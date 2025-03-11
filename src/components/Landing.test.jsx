// src/components/test/Landing.test.jsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import '@testing-library/jest-dom';
import { MemoryRouter } from "react-router-dom";
import Landing from "./LandingPage/Landing"; // Ajusta la ruta según tu estructura

// Mock de MSAL
import { useMsal } from "@azure/msal-react";
jest.mock("@azure/msal-react", () => ({
  useMsal: jest.fn(),
}));

// Mock de useNavigate de react-router-dom
import { useNavigate } from "react-router-dom";
jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => jest.fn(),
  };
});

describe("Landing Component", () => {
  let loginPopupMock;
  let navigateMock;

  beforeEach(() => {
    loginPopupMock = jest.fn();
    navigateMock = jest.fn();

    // Configuramos el mock de useMsal para retornar una instancia con loginPopup
    useMsal.mockReturnValue({
      instance: { loginPopup: loginPopupMock }
    });

    // Sobrescribimos useNavigate para retornar nuestra función mock
    jest.spyOn(require("react-router-dom"), "useNavigate").mockReturnValue(navigateMock);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("Renderiza correctamente el contenido de Landing", () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    );
    expect(screen.getByText(/The Hidden Cargo es un emocionante juego/)).toBeInTheDocument();
    expect(screen.getByText("¿CÓMO JUGAR?")).toBeInTheDocument();
    expect(screen.getByText("INICIAR")).toBeInTheDocument();
  });

  test("Abre el modal al hacer clic en '¿CÓMO JUGAR?'", () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    );
    // Inicialmente el modal no se muestra
    expect(screen.queryByText("¿Cómo Jugar?")).not.toBeInTheDocument();
    // Simula clic en el botón para abrir el modal
    fireEvent.click(screen.getByText("¿CÓMO JUGAR?"));
    expect(screen.getByText("¿Cómo Jugar?")).toBeInTheDocument();
  });

  test("Llama a loginPopup y navega al lobby tras autenticarse correctamente", async () => {
    const fakeResponse = { account: { username: "test@example.com" } };
    loginPopupMock.mockResolvedValue(fakeResponse);

    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    );
    
    fireEvent.click(screen.getByText("INICIAR"));

    await waitFor(() => expect(loginPopupMock).toHaveBeenCalled());
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith("/lobby"));
  });

  test("No navega si loginPopup retorna sin cuenta", async () => {
    loginPopupMock.mockResolvedValue({ account: null });

    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    );
    
    fireEvent.click(screen.getByText("INICIAR"));

    await waitFor(() => expect(loginPopupMock).toHaveBeenCalled());
    expect(navigateMock).not.toHaveBeenCalled();
  });

  test("Maneja errores en la autenticación", async () => {
    const error = new Error("Login failed");
    loginPopupMock.mockRejectedValue(error);
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    );
    
    fireEvent.click(screen.getByText("INICIAR"));

    await waitFor(() => expect(loginPopupMock).toHaveBeenCalled());
    expect(consoleErrorSpy).toHaveBeenCalledWith("Error en la autenticación:", error);
    consoleErrorSpy.mockRestore();
  });
});
