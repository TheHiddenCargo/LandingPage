// src/components/test/Lobby.test.jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import '@testing-library/jest-dom';
import Lobby from "../Lobby"; // Desde test, sube un nivel para llegar a src/components/Lobby.jsx

test("Lobby renders correctly", () => {
  render(<Lobby />);
  expect(screen.getByText(/Bienvenido al Lobby/i)).toBeInTheDocument();
});
