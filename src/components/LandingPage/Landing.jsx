import React from "react";
import "./Landing.css";
import entrarImage from "../../assets/Entrar.png"; 
import logoImage from "../../assets/logo.png"; // Imagen del logo

const Landing = () => {
  return (
    <div className="landing-container">
      <div className="left-section">
        <img src={logoImage} alt="Logo de la Empresa" className="logo" />
        <p className="description">
          The Hidden Cargo es un emocionante juego multijugador inspirado en el concepto de ¿Quién da más? (Storage Wars), donde los jugadores compiten en subastas para adquirir bodegas de almacenamiento con contenido desconocido. Sin poder inspeccionarlas a fondo, deberán arriesgarse y aplicar estrategias para hacer ofertas inteligentes y descubrir si han conseguido artículos valiosos o simples desperdicios. A medida que ganan dinero virtual, pueden seguir participando en nuevas subastas, mejorar sus tácticas y subir de nivel, creando y vendiendo sus propias bodegas para desafiar a otros jugadores en esta dinámica experiencia de comercio y apuesta.
        </p>
      </div>
      <div className="right-section">
        <a href="https://entra.microsoft.com/" target="_blank" rel="noopener noreferrer">
          <img src={entrarImage} alt="Entrar" className="entrar-btn" />
        </a>
      </div>
    </div>
  );
};

export default Landing;
