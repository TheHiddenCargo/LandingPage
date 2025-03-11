// src/App.js
import React from "react";
import { Routes, Route } from "react-router-dom";
import Landing from "./components/LandingPage/Landing";
import Lobby from "./components/Lobby"; // Asegúrate que el nombre y la ruta sean correctos
import ProtectedRoute from "./components/ProtectedRoute"; // Importación sin llaves

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route
        path="/lobby"
        element={
          <ProtectedRoute>
            <Lobby />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
