// src/App.js
import React from "react";
import { Routes, Route } from "react-router-dom";
import Landing from "./components/LandingPage/Landing";
import Lobby from "./components/Lobby/Lobby";
import ProtectedRoute from "./components/ProtectedRoute";


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
