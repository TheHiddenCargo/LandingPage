// src/components/test/Modal.test.jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import '@testing-library/jest-dom';
import Modal, { ModalBody } from "../Modal.jsx"; 

describe("Modal", () => {
  test("No se renderiza cuando isOpen es false", () => {
    const { container } = render(
      <Modal isOpen={false} title="Modal de Prueba" onClose={() => {}}>
        <div>Contenido de prueba</div>
      </Modal>
    );
    expect(container.firstChild).toBeNull();
  });
  
  test("Se renderiza correctamente cuando isOpen es true", () => {
    render(
      <Modal isOpen={true} title="Modal de Prueba" onClose={() => {}}>
        <div data-testid="modal-content">Contenido de prueba</div>
      </Modal>
    );
    
    // Verificar que el título y el contenido estén presentes
    expect(screen.getByText("Modal de Prueba")).toBeInTheDocument();
    expect(screen.getByTestId("modal-content")).toBeInTheDocument();
  });
  
  test("Llama a onClose cuando se hace clic en el botón de cierre", () => {
    const handleClose = jest.fn();
    render(
      <Modal isOpen={true} title="Modal de Prueba" onClose={handleClose}>
        <div>Contenido de prueba</div>
      </Modal>
    );
    
    // Hacer clic en el botón de cierre
    fireEvent.click(screen.getByText("X"));
    
    // Verificar que se llamó a la función onClose
    expect(handleClose).toHaveBeenCalled();
  });
});

describe("ModalBody", () => {
  test("Renderiza un iframe cuando se proporciona videoUrl", () => {
    render(
      <ModalBody 
        bodyTitle="Título de prueba" 
        videoUrl="https://www.youtube.com/embed/example" 
      />
    );
    
    // Verificar que existe un iframe con la URL correcta
    const iframe = screen.getByTitle("Título de prueba");
    expect(iframe).toBeInTheDocument();
    expect(iframe.tagName).toBe("IFRAME");
    expect(iframe).toHaveAttribute("src", "https://www.youtube.com/embed/example");
  });
  
  test("Renderiza un elemento video cuando se proporciona videoSrc", () => {
    render(
      <ModalBody 
        bodyTitle="Título de prueba" 
        videoSrc="/path/to/video.mp4" 
      />
    );
    
    // Verificar que existe un elemento video
    const video = screen.getByText("Tu navegador no soporta el elemento de video.").parentElement;
    expect(video).toBeInTheDocument();
    expect(video.tagName).toBe("DIV");
    
    // Verificar que contiene una fuente con la ruta correcta
    const source = video.querySelector("source");
    expect(source).toHaveAttribute("src", "/path/to/video.mp4");
    expect(source).toHaveAttribute("type", "video/mp4");
  });
  
  test("Solo muestra el título cuando no hay videoUrl ni videoSrc", () => {
    render(<ModalBody bodyTitle="Título de prueba" />);
    
    // Verificar que el título está presente y no hay video ni iframe
    expect(screen.getByText("Título de prueba")).toBeInTheDocument();
    expect(screen.queryByRole("iframe")).not.toBeInTheDocument();
    expect(screen.queryByRole("video")).not.toBeInTheDocument();
  });
});