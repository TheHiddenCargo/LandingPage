// src/components/Modal.tsx
import React, { ReactNode, useEffect } from "react";
import "../styles/Modal.css";

interface ModalProps {
  children: ReactNode;
  title: string;
  isOpen: boolean;
  onClose: () => void;
}

const Modal = ({ children, title, isOpen, onClose }: ModalProps) => {
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
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

interface ModalBodyProps {
  bodyTitle: string;
  videoUrl: string;
}

export const ModalBody = ({ bodyTitle, videoUrl }: ModalBodyProps) => (
  <iframe
    title={bodyTitle}
    src={videoUrl}
    frameBorder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowFullScreen
  />
);

export default Modal;
