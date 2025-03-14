// src/components/LandingPage/Landing.jsx
import React, { useState } from "react";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../../authConfig.js"; 
import { useNavigate } from "react-router-dom";
import Modal, { ModalBody } from "../Modal.jsx";
import logoImage from "../../assets/logo.png";
import "./Landing.css";


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
                    bodegas de almacenamiento con contenido desconocido. Sin poder inspeccionarlas a fondo, deberán arriesgarse y aplicar estrategias para hacer ofertas inteligentes y descubrir si han conseguido artículos valiosos o simples desperdicios. A medida que ganan dinero virtual, pueden seguir participando en nuevas subastas, mejorar sus tácticas y subir de nivel, creando y vendiendo sus propias bodegas para desafiar a otros jugadores en esta dinámica experiencia de comercio y apuesta.
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
