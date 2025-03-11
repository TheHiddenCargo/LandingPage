// src/components/test/index.test.js
import React from "react";
import { render, screen } from "@testing-library/react";
import '@testing-library/jest-dom';
import App from "./App";
import { BrowserRouter } from "react-router-dom";

// Mockea MSAL: se reemplaza tanto MsalProvider como useMsal para evitar dependencias reales
jest.mock("@azure/msal-react", () => ({
  MsalProvider: ({ children }) => <>{children}</>,
  useMsal: () => ({
    instance: {
      loginPopup: jest.fn(), // función mock para loginPopup
    },
  }),
}));

test("index.js renders App without crashing", () => {
  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
  // Se asume que en Landing se muestra "The Hidden Cargo". Ajusta según corresponda.
  expect(screen.getByText(/The Hidden Cargo/i)).toBeInTheDocument();
});
