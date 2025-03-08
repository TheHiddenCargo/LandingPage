import { ReactNode, useEffect } from "react";
import "../styles/Modal.css"

interface ModalProps {
    children: ReactNode;
    title: string;
    isOpen: boolean;
    onClose: () => void;
}

function Modal(props: Readonly<ModalProps>) {
    useEffect(() => {
        if (props.isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }

        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [props.isOpen]);

    if (!props.isOpen) return null;

    return (
        <div className="modal">
            <div>
                <div className="titulo">
                    <h1>{props.title}</h1>
                    <button className="game" onClick={props.onClose}>X</button>
                </div>
                <div className="modal-body">
                    {props.children}
                </div>
            </div>


        </div>
    );
}

interface ModalBodyProps {
    bodyTitle: string;
    videoUrl: string;
}

export function ModalBody(props: Readonly<ModalBodyProps>) {
    return (
        <iframe
            title={props.bodyTitle}
            src={props.videoUrl}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
        ></iframe>
    );
}

export default Modal;