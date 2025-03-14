// src/services/authService.js
import { PublicClientApplication, InteractionRequiredAuthError } from "@azure/msal-browser";
import { msalConfig, loginRequest, silentRequest } from "../../authConfig";

const msalInstance = new PublicClientApplication(msalConfig);

export const initializeMsal = async () => {
    await msalInstance.initialize();
    // Intenta cargar cualquier cuenta ya autenticada
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
        msalInstance.setActiveAccount(accounts[0]);
    }
    return msalInstance;
};

export const getTokenSilently = async () => {
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length === 0) {
        return null;
    }

    try {
        const silentTokenResponse = await msalInstance.acquireTokenSilent({
            ...silentRequest,
            account: accounts[0]
        });
        return silentTokenResponse;
    } catch (error) {
        if (error instanceof InteractionRequiredAuthError) {
            // El token ha expirado y se requiere interacción del usuario
            try {
                const response = await msalInstance.acquireTokenPopup(loginRequest);
                return response;
            } catch (popupError) {
                console.error("Error adquiriendo token en popup:", popupError);
                return null;
            }
        }
        console.error("Error silencioso:", error);
        return null;
    }
};

export const checkAndRenewToken = async () => {
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
        try {
            await getTokenSilently();
            return true;
        } catch (error) {
            console.error("Error renovando token:", error);
            return false;
        }
    }
    return false;
};