import { render, screen, fireEvent } from "@testing-library/react";
import MyComponent from "./MyComponent";

test("renders MyComponent correctly", () => {
  render(<MyComponent />);

  // Verifica que el componente se renderiza correctamente
  expect(screen.getByText(/Hello World/i)).toBeTruthy();
});

test("handles button click (si hay botón)", () => {
  render(<MyComponent />);

  const button = screen.getByRole("button", { name: /Click me/i });
  fireEvent.click(button);

  // Verificar que algo cambia después del clic
  expect(screen.getByText(/Button clicked/i)).toBeTruthy();
});
