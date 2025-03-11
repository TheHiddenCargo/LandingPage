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

const ModalBody = ({ bodyTitle, videoUrl }) => (
  <iframe
    title={bodyTitle}
    src={videoUrl}
    frameBorder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowFullScreen
  />
);

ModalBody.propTypes = {
  bodyTitle: PropTypes.string.isRequired,
  videoUrl: PropTypes.string.isRequired,
};

export { ModalBody };
export default Modal;
