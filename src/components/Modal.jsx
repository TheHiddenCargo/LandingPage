// src/components/Modal.jsx
import React, { useEffect } from "react";
import PropTypes from "prop-types";
import "../styles/Modal.css";

const Modal = ({ children, title, isOpen, onClose }) => {
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal">
      <div>
        <div className="titulo">
          <h1>{title}</h1>
          <button className="game" onClick={onClose}>X</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

Modal.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

const ModalBody = ({ bodyTitle, videoUrl, videoSrc }) => {
  // Renderiza un iframe para videos de YouTube o un elemento video para videos locales
  if (videoUrl) {
    return (
      <iframe
        title={bodyTitle}
        src={videoUrl}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="modal-video"
      />
    );
  } else if (videoSrc) {
    return (
      <video 
        className="modal-video" 
        controls 
        autoPlay={false}
      >
        <source src={videoSrc} type="video/mp4" />
        Tu navegador no soporta el elemento de video.
      </video>
    );
  }
  
  // Si no hay video, simplemente muestra el título del cuerpo
  return <h2>{bodyTitle}</h2>;
};

ModalBody.propTypes = {
  bodyTitle: PropTypes.string.isRequired,
  videoUrl: PropTypes.string,
  videoSrc: PropTypes.string,
};

// Valor por defecto para evitar error si no se proporciona ninguno de los props
ModalBody.defaultProps = {
  videoUrl: '',
  videoSrc: '',
};

export { ModalBody };
export default Modal;