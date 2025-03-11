// src/components/test/authConfigLogger.test.js
import { msalConfig } from "../../authConfig";
import { LogLevel } from "@azure/msal-browser";

describe("MSAL Logger Callback", () => {
  let loggerCallback;
  let consoleErrorSpy;
  let consoleInfoSpy;
  let consoleDebugSpy;
  let consoleWarnSpy;

  beforeEach(() => {
    // Obtener la función loggerCallback de la configuración
    loggerCallback = msalConfig.system.loggerOptions.loggerCallback;
    
    // Espiar los métodos de console
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restaurar los mocks después de cada prueba
    jest.restoreAllMocks();
  });

  test("loggerCallback debe ser una función", () => {
    expect(typeof loggerCallback).toBe("function");
  });

  test("No debe registrar nada cuando containsPii es true", () => {
    // Llamar a la función con containsPii = true
    loggerCallback(LogLevel.Error, "mensaje con pii", true);
    
    // Verificar que ningún método console fue llamado
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(consoleInfoSpy).not.toHaveBeenCalled();
    expect(consoleDebugSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  test("Debe llamar a console.error para LogLevel.Error", () => {
    const testMessage = "mensaje de error de prueba";
    loggerCallback(LogLevel.Error, testMessage, false);
    
    expect(consoleErrorSpy).toHaveBeenCalledWith(testMessage);
    expect(consoleInfoSpy).not.toHaveBeenCalled();
    expect(consoleDebugSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  test("Debe llamar a console.info para LogLevel.Info", () => {
    const testMessage = "mensaje de info de prueba";
    loggerCallback(LogLevel.Info, testMessage, false);
    
    expect(consoleInfoSpy).toHaveBeenCalledWith(testMessage);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(consoleDebugSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  test("Debe llamar a console.debug para LogLevel.Verbose", () => {
    const testMessage = "mensaje verbose de prueba";
    loggerCallback(LogLevel.Verbose, testMessage, false);
    
    expect(consoleDebugSpy).toHaveBeenCalledWith(testMessage);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(consoleInfoSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  test("Debe llamar a console.warn para LogLevel.Warning", () => {
    const testMessage = "mensaje de advertencia de prueba";
    loggerCallback(LogLevel.Warning, testMessage, false);
    
    expect(consoleWarnSpy).toHaveBeenCalledWith(testMessage);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(consoleInfoSpy).not.toHaveBeenCalled();
    expect(consoleDebugSpy).not.toHaveBeenCalled();
  });

  test("No debe llamar a ninguna función console para otros LogLevels", () => {
    // Usar un nivel de log que no está en los casos del switch
    const unknownLogLevel = 999;
    loggerCallback(unknownLogLevel, "mensaje desconocido", false);
    
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(consoleInfoSpy).not.toHaveBeenCalled();
    expect(consoleDebugSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });
});