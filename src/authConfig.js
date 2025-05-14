import { LogLevel } from "@azure/msal-browser";

export const msalConfig = {
    auth: {
        clientId: "7b46db34-0ef4-495b-923e-27cd0ff22482",
        authority: "https://login.microsoftonline.com/common",
        redirectUri: "https://white-field-008a0cb10.6.azurestaticapps.net/"
    },
    cache: {
        cacheLocation: "localStorage", // Changed from sessionStorage to localStorage for persistence
        storeAuthStateInCookie: true,  // Enable cookies for better persistence across browser sessions
    },
    system: {
        loggerOptions: {
            loggerCallback: (level, message, containsPii) => {
                if (containsPii) return;
                switch (level) {
                    case LogLevel.Error:
                        console.error(message);
                        break;
                    case LogLevel.Info:
                        console.info(message);
                        break;
                    case LogLevel.Verbose:
                        console.debug(message);
                        break;
                    case LogLevel.Warning:
                        console.warn(message);
                        break;
                    default:
                        break;
                }
            },
        },
    },
};

// Adding token refresh settings
export const tokenRefreshSettings = {
    refreshInterval: 30 * 60 * 1000, // Refresh token every 30 minutes (in milliseconds)
    refreshBeforeExpiration: 5 * 60 * 1000 // Refresh 5 minutes before token expiration
};

export const loginRequest = {
    scopes: ["User.Read"], 
};