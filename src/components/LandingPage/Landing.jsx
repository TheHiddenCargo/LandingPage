// src/components/LandingPage/Landing.jsx
import React, { useState } from "react";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../../authConfig.js"; // Ajusta la ruta según tu estructura
import { useNavigate } from "react-router-dom";
import "./Landing.css";
import Modal, { ModalBody } from "../Modal.tsx";
import logoImage from "../../assets/logo.png";

const Landing = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { instance } = useMsal();
    const navigate = useNavigate();

    const handleOpenModal = () => setIsModalOpen(true);
    const handleCloseModal = () => setIsModalOpen(false);

    const handleLogin = async () => {
        console.log("Botón 'INICIAR' presionado");
        if (!instance) {
            console.error("MSAL instance no está disponible.");
            return;
        }
        try {
            console.log("Iniciando autenticación...");
            const response = await instance.loginPopup(loginRequest);
            if (response?.account) {
                console.log("Usuario autenticado:", response.account);
                navigate("/lobby");
            } else {
                console.log("No se recibió una cuenta después del login.");
            }
        } catch (error) {
            console.error("Error en la autenticación:", error);
        }
    };

    return (
        <div className="landing-container">
            <div className="left-section">
                <img src={logoImage} alt="Logo de la Empresa" className="logo" />
                <p className="description">
                    The Hidden Cargo es un emocionante juego multijugador inspirado en el concepto de
                    ¿Quién da más? (Storage Wars), donde los jugadores compiten en subastas para adquirir
                    bodegas de almacenamiento con contenido desconocido...
                </p>
            </div>
            <div className="right-section">
                <div className="menu">
                    <button className="game" onClick={handleOpenModal}>¿CÓMO JUGAR?</button>
                    <button className="game" onClick={handleLogin}>INICIAR</button>
                </div>
            </div>
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="¿Cómo Jugar?">
                <ModalBody bodyTitle="Cómo Jugar" videoUrl="https://www.youtube.com/shorts/upeHfLQTMYU" />
            </Modal>
        </div>
    );
};

export default Landing;
