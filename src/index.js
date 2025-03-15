// src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { MsalProvider } from "@azure/msal-react";
import { PublicClientApplication, EventType } from "@azure/msal-browser";
import { msalConfig } from "./authConfig";
import App from "./App";

// Si estamos en test, usa un objeto dummy
export const msalInstance =
  process.env.NODE_ENV === "test"
    ? { loginPopup: () => Promise.resolve({ account: {} }) }
    : new PublicClientApplication(msalConfig);

// Función para inicializar MSAL y renderizar la aplicación
export function renderApp() {
  // Si estamos en test, renderiza directamente
  if (process.env.NODE_ENV === "test") {
    const root = ReactDOM.createRoot(document.getElementById("root"));
    root.render(
      <React.StrictMode>
        <MsalProvider instance={msalInstance}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </MsalProvider>
      </React.StrictMode>
    );
    return;
  }

  // Para entorno de producción/desarrollo, inicializa MSAL primero
  msalInstance.initialize().then(() => {
    // Default to using the first account if available
    if (!msalInstance.getActiveAccount() && msalInstance.getAllAccounts().length > 0) {
      msalInstance.setActiveAccount(msalInstance.getAllAccounts()[0]);
    }

    // Handle redirect promise to catch any redirect related errors
    msalInstance.handleRedirectPromise().catch(error => {
      console.error("Redirect error:", error);
    });
    
    // Register event callbacks
    msalInstance.addEventCallback((event) => {
      if (event.eventType === EventType.LOGIN_SUCCESS || 
          event.eventType === EventType.ACQUIRE_TOKEN_SUCCESS) {
        if (event.payload.account) {
          msalInstance.setActiveAccount(event.payload.account);
        }
      }
    });

    // Render the app once MSAL is properly initialized
    const root = ReactDOM.createRoot(document.getElementById("root"));
    root.render(
      <React.StrictMode>
        <MsalProvider instance={msalInstance}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </MsalProvider>
      </React.StrictMode>
    );
  }).catch(error => {
    console.error("MSAL initialization failed:", error);
  });
}

// Iniciar la app si no estamos en test
if (process.env.NODE_ENV !== "test") {
  renderApp();
}