// src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { MsalProvider } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from "./authConfig";
import App from "./App";

// Si estamos en test, usa un objeto dummy para msalInstance.
export const msalInstance =
  process.env.NODE_ENV === "test"
    ? { loginPopup: () => Promise.resolve({ account: {} }) }
    : new PublicClientApplication(msalConfig);

export function renderApp() {
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
}

// Solo renderiza la app si no estamos en entorno de test.
if (process.env.NODE_ENV !== "test") {
  renderApp();
}
