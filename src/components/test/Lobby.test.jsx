import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Lobby from '../Lobby/Lobby';

// Mock simple para useMsal
jest.mock('@azure/msal-react', () => ({
  useMsal: () => ({
    instance: { acquireTokenSilent: jest.fn().mockResolvedValue({}) },
    accounts: []
  })
}));

// Mock para fetch (simplificado)
global.fetch = jest.fn().mockImplementation(() => 
  Promise.resolve({
    json: () => Promise.resolve({})
  })
);

// Función de ayuda para renderizar el componente
const renderLobby = () => {
  return render(<Lobby />);
};

describe('Tests básicos para Lobby', () => {
  test('renderiza el componente sin errores', () => {
    renderLobby();
    // Verificar que algo básico está en el documento
    expect(screen.getByText(/Bienvenido a The Hidden Cargo/i)).toBeInTheDocument();
  });

  test('muestra botón para crear lobby', () => {
    renderLobby();
    // Buscar el botón por su clase
    const createButton = document.querySelector('.create-lobby-btn');
    expect(createButton).toBeInTheDocument();
  });

  test('muestra modal al hacer clic en el botón', () => {
    renderLobby();
    // Obtener el botón y hacer clic
    const createButton = document.querySelector('.create-lobby-btn');
    fireEvent.click(createButton);
    
    // Verificar que el modal aparece
    expect(screen.getByText(/Crea una nueva sala/i)).toBeInTheDocument();
  });

  test('puede cerrar el modal', () => {
    renderLobby();
    // Abrir el modal
    const createButton = document.querySelector('.create-lobby-btn');
    fireEvent.click(createButton);
    
    // Cerrar el modal
    const closeButton = document.querySelector('.close-btn');
    fireEvent.click(closeButton);
    
    // Verificar que el modal ya no está visible
    expect(screen.queryByText(/Crea una nueva sala/i)).not.toBeInTheDocument();
  });

  test('muestra los contenedores', () => {
    renderLobby();
    // Verificar que el título de los contenedores está presente
    expect(screen.getByText(/Contenedores:/i)).toBeInTheDocument();
    
    // Verificar que existen elementos con la clase container-box
    const containers = document.querySelectorAll('.container-box');
    expect(containers.length).toBeGreaterThan(0);
  });
});