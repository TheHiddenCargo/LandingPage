// src/components/test/App.test.jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import '@testing-library/jest-dom';
import { MemoryRouter } from "react-router-dom";
import App from "../../App";

// Mocks para simplificar el test de enrutamiento
jest.mock("../../components/LandingPage/Landing", () => () => <div>Landing Page</div>);
jest.mock("../../components/Lobby/Lobby", () => () => <div>Lobby Page</div>);
jest.mock("../../components/ProtectedRoute", () => ({ children }) => children);

describe("App Routing", () => {
  test("Renderiza Landing cuando la ruta es '/'", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText("Landing Page")).toBeInTheDocument();
  });

  test("Renderiza Lobby cuando la ruta es '/lobby'", () => {
    render(
      <MemoryRouter initialEntries={["/lobby"]}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText("Lobby Page")).toBeInTheDocument();
  });
});

