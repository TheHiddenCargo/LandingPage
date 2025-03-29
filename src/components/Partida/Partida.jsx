import React from "react";
import "./Partida.css"; 

const Partida = () => {
  const handleExit = () => {
    console.log("Saliendo de la partida...");
    // Aquí puedes agregar la lógica para salir, como redirigir a otra página
  };

  return (
    <div className="partida-container">
      <h1 className="partida-titulo">Partida en Curso</h1>
      <button className="boton-apostar">Apostar</button>
      <button className="boton-salir" onClick={handleExit}>Salir</button>
    </div>
  );
};

export default Partida;
