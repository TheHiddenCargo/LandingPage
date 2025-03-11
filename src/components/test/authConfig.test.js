// src/components/test/authConfig.test.js
import { msalConfig, loginRequest } from "../../authConfig";

describe("authConfig", () => {
  test("msalConfig debe tener todas las propiedades requeridas de configuración", () => {
    // Verificar auth y sus propiedades
    expect(msalConfig).toHaveProperty("auth");
    expect(msalConfig.auth).toHaveProperty("clientId");
    expect(msalConfig.auth.clientId).toBeTruthy();
    expect(msalConfig.auth).toHaveProperty("authority");
    expect(msalConfig.auth.authority).toBeTruthy();
    expect(msalConfig.auth).toHaveProperty("redirectUri");
    expect(msalConfig.auth.redirectUri).toBeTruthy();
    
    // Verificar cache
    expect(msalConfig).toHaveProperty("cache");
    expect(msalConfig.cache).toHaveProperty("cacheLocation");
    expect(msalConfig.cache).toHaveProperty("storeAuthStateInCookie");
    
    // Verificar system y loggerOptions
    expect(msalConfig).toHaveProperty("system");
    expect(msalConfig.system).toHaveProperty("loggerOptions");
    expect(msalConfig.system.loggerOptions).toHaveProperty("loggerCallback");
    expect(typeof msalConfig.system.loggerOptions.loggerCallback).toBe("function");
  });

  test("loginRequest debe incluir los scopes correctos", () => {
    expect(loginRequest).toHaveProperty("scopes");
    expect(Array.isArray(loginRequest.scopes)).toBe(true);
    expect(loginRequest.scopes).toContain("User.Read");
    expect(loginRequest.scopes.length).toBeGreaterThan(0);
  });
});