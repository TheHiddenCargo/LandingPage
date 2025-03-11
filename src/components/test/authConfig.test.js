// src/components/test/authConfig.test.js
import { msalConfig, loginRequest } from "../../authConfig";

describe("authConfig", () => {
  test("msalConfig debe tener las propiedades de auth", () => {
    expect(msalConfig).toHaveProperty("auth");
    expect(msalConfig.auth).toHaveProperty("clientId");
    expect(msalConfig.auth).toHaveProperty("authority");
    expect(msalConfig.auth).toHaveProperty("redirectUri");
  });

  test("loginRequest debe incluir el scope 'User.Read'", () => {
    expect(loginRequest).toHaveProperty("scopes");
    expect(loginRequest.scopes).toContain("User.Read");
  });
});
