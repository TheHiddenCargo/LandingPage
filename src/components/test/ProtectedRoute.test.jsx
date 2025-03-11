// src/components/test/ProtectedRoute.test.jsx
import React from "react";
import { render } from "@testing-library/react";
import '@testing-library/jest-dom';
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "../ProtectedRoute"; // Asegúrate de que la ruta es correcta
import { useIsAuthenticated } from "@azure/msal-react";

jest.mock("@azure/msal-react", () => ({
  useIsAuthenticated: jest.fn(),
}));

const DummyComponent = () => <div>Contenido Protegido</div>;

describe("ProtectedRoute", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("Renderiza los children cuando el usuario está autenticado", () => {
    require("@azure/msal-react").useIsAuthenticated.mockReturnValue(true);

    const { getByText } = render(
      <MemoryRouter initialEntries={["/protected"]}>
        <ProtectedRoute>
          <DummyComponent />
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(getByText("Contenido Protegido")).toBeInTheDocument();
  });
});
