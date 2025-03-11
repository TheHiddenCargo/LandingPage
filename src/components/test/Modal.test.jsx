// src/components/test/Modal.test.jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import '@testing-library/jest-dom';
import Modal, { ModalBody } from "../Modal.jsx"; // Asegúrate de incluir la extensión

describe("Modal", () => {
  test("No se renderiza cuando isOpen es false", () => {
    const { container } = render(
      <Modal isOpen={false} title="Modal de Prueba" onClose={() => {}}>
        <div>Contenido de prueba</div>
      </Modal>
    );
    expect(container.firstChild).toBeNull();
  });
});
