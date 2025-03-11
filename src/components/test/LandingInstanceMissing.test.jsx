// src/components/test/LandingInstanceMissing.test.jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Landing from "../LandingPage/Landing";
import { MemoryRouter } from "react-router-dom";
import '@testing-library/jest-dom';

// Mockea useMsal para simular que instance es nulo
jest.mock("@azure/msal-react", () => ({
  useMsal: () => ({ instance: null }),
  MsalProvider: ({ children }) => <>{children}</>,
}));

describe("Landing component - missing MSAL instance", () => {
  test("should log error and not proceed when instance is not available", () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    );
    
    // Simula clic en el botón "INICIAR"
    fireEvent.click(screen.getByText("INICIAR"));
    
    expect(consoleErrorSpy).toHaveBeenCalledWith("MSAL instance no está disponible.");
    consoleErrorSpy.mockRestore();
  });
});
