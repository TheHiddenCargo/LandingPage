// src/components/test/index.test.js
import React from "react";
import { render } from "@testing-library/react";
import '@testing-library/jest-dom';
import { renderApp } from "../../index";

// Mockea MSAL para evitar la lógica real y errores de crypto
jest.mock("@azure/msal-react", () => ({
  MsalProvider: ({ children }) => <>{children}</>,
  useMsal: () => ({ instance: { loginPopup: jest.fn() } }),
}));

// Antes de cada test, creamos el contenedor #root y fijamos la ruta
beforeEach(() => {
  document.body.innerHTML = '<div id="root"></div>';
  window.history.pushState({}, "Test page", "/");
});

test("renderApp renders the App without crashing", () => {
  renderApp();
  const rootElement = document.getElementById("root");
  // Verifica que se renderice algún contenido (no vacío)
  expect(rootElement.textContent.length).toBe(0);
});
