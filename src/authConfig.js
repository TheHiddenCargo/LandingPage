import { LogLevel } from "@azure/msal-browser";

export const msalConfig = {
    auth: {
        clientId: "7b46db34-0ef4-495b-923e-27cd0ff22482",
        authority: "https://login.microsoftonline.com/common",
        redirectUri: "http://localhost:3000/"
    },
    cache: {
        cacheLocation: "sessionStorage", 
        storeAuthStateInCookie: false,
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

export const loginRequest = {
    scopes: ["User.Read"], 
};