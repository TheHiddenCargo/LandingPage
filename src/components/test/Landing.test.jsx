// src/components/test/Landing.test.jsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import '@testing-library/jest-dom';
import Landing from "../LandingPage/Landing"; // Ruta corregida
import { useMsal } from "@azure/msal-react";
import { MemoryRouter } from "react-router-dom";

jest.mock("@azure/msal-react", () => ({
  useMsal: jest.fn(),
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => jest.fn(),
}));

describe("Landing", () => {
  let loginPopupMock;
  let navigateMock;

  beforeEach(() => {
    loginPopupMock = jest.fn();
    navigateMock = jest.fn();

    require("@azure/msal-react").useMsal.mockReturnValue({
      instance: { loginPopup: loginPopupMock },
    });

    jest.spyOn(require("react-router-dom"), "useNavigate").mockReturnValue(navigateMock);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("Renderiza la Landing con su contenido y botones", () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    );
    expect(screen.getByText(/The Hidden Cargo es un emocionante juego/)).toBeInTheDocument();
    expect(screen.getByText("¿CÓMO JUGAR?")).toBeInTheDocument();
    expect(screen.getByText("INICIAR")).toBeInTheDocument();
  });
});
