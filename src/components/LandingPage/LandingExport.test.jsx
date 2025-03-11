// src/components/test/LandingExport.test.jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import '@testing-library/jest-dom';
import LandingExport from "./Landing.jsx"; // Ajusta la ruta según tu estructura
import { MemoryRouter } from "react-router-dom";

// Mock simple de MSAL para evitar pruebas de su funcionalidad
jest.mock("@azure/msal-react", () => ({
  MsalProvider: ({ children }) => children,
  useMsal: () => ({ instance: { loginPopup: jest.fn() } })
}));

test("Landing export renders correctly", () => {
  render(
    <MemoryRouter>
      <LandingExport />
    </MemoryRouter>
  );
  // Se asume que en el componente Landing se muestra el texto "The Hidden Cargo"
  expect(screen.getByText(/The Hidden Cargo/i)).toBeInTheDocument();
});
