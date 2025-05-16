import React, {useEffect, useRef, useState, useCallback, useMemo} from "react";
import {useFetch} from "../../personalHooks/useFetch";
import blueGuy from "../../assets/gamerIcons/blueGuy.png";
import greenGuy from "../../assets/gamerIcons/greenGuy.png";
import redGuy from "../../assets/gamerIcons/redGuy.png";
import curlyGirl from "../../assets/gamerIcons/curlyGirl.png";
import purpleGirl from "../../assets/gamerIcons/purpleGirl.png";
import redGirl from "../../assets/gamerIcons/redGirl.png";
import wolf from "../../assets/gamerIcons/Wolf.png";
import dragon from "../../assets/gamerIcons/Dragon.png";
import bear from "../../assets/gamerIcons/bear.png";
import PropTypes from "prop-types";
import "../../styles/UserDialog.css"

const UserDialog = ({toCreate, email, onClose}) => {
    const [newNickname, setNewNickname] = useState('');
    const [icon, setIcon] = useState(null);
    const [title, setTitle] = useState(null);
    const [submitButton, setSubmitButton] = useState(null);
    const [createUser, setCreateUser] = useState(false);
    const [updateUser, setUpdateUser] = useState(false);
    const dialogRef = useRef(null);
    const [errorNickname, setErrorNickname] = useState(null);
    const [errorIcon, setErrorIcon] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Memoizar el array de iconos para evitar recrearlo en cada renderizado
    const icons = useMemo(() => [
        blueGuy,
        greenGuy,
        redGuy,
        curlyGirl,
        purpleGirl,
        redGirl,
        wolf,
        dragon,
        bear
    ], []); // Array de dependencias vacío, solo se crea una vez

    /*Fetch to register User*/
    const {loading:loadingCreate, status:statusCreate, error: errorCreate} = useFetch({
        url: 'https://thehiddencargo1.azure-api.net/creation/users/register',
        method: 'POST',
        body: {
            email: email,
            nickName: newNickname,
            balance: "5000",
            icon: icon
        }
    }, [createUser], createUser);

    /*Fetch GET Information*/
    const {data: dataUser, status: statusUser} = useFetch({
        url: `https://thehiddencargo1.azure-api.net/creation/users/${email}/info`,
        method: 'GET',
        headers: {
            'accept': '*/*',
            'Ocp-Apim-Subscription-Key': process.env.REACT_APP_API_KEY
        }
    }, [email], !toCreate && email);

    /*Fetch para actualizar NickName*/
    const {loading: loadingNickname, status:statusNickname} = useFetch({
        url: 'https://thehiddencargo1.azure-api.net/creation/polling/users/update/nickname',
        method: 'POST',
        headers: {
            'accept': '*/*',
            'Ocp-Apim-Subscription-Key': process.env.REACT_APP_API_KEY,
            'Content-Type': 'application/json'
        },
        body: {
            email: email,
            newNickname: newNickname
        }
    }, [updateUser], updateUser);

    /*Fetch para actualizar icono*/
    const {loading: loadingIcon, status:statusIcon} = useFetch({
        url: 'https://thehiddencargo1.azure-api.net/creation/polling/users/update/photo',
        method: 'POST',
        headers: {
            'accept': '*/*',
            'Ocp-Apim-Subscription-Key': process.env.REACT_APP_API_KEY,
            'Content-Type': 'application/json'
        },
        body: {
            email: email,
            photo: icon
        }
    }, [updateUser], updateUser);

    // Use useCallback to stabilize the handleClose function reference
    const handleClose = useCallback(() => {
        console.log("Cerrando diálogo de usuario");
        if (dialogRef.current) {
            dialogRef.current.close();
            if (onClose) onClose();
        }
    }, [onClose]);

    const handleSubmit = () => {
        console.log("Enviando formulario", toCreate, "con nickname:", newNickname, "e icon:", icon);
        setIsSubmitting(true);
        if(toCreate) {
            setCreateUser(true);
        } else {
            setUpdateUser(true);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === ' ') {
            e.preventDefault(); // Previene la acción de la tecla de espacio
        }
    };

    // Manejador de teclado para los iconos
    const handleIconKeyDown = (e, iconMap) => {
        // Seleccionar el icono si se presiona Enter o Space
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIcon(iconMap);
        }
    };

    // Inicialización del diálogo
    useEffect(() => {
        if (dialogRef.current) {
            // Store a reference to the current dialog element
            const dialog = dialogRef.current;

            if(toCreate){
                setTitle("Creación de Usuario");
                setSubmitButton("Crear");
                // Establecer un valor predeterminado para el icono al crear
                if (!icon && icons.length > 0) {
                    setIcon(icons[0]);
                }
            } else {
                setSubmitButton("Actualizar");
            }

            dialog.showModal();
            
            const handleCancel = (event) => {
                event.preventDefault();
            };
            
            dialog.addEventListener('cancel', handleCancel);

            return () => {
                // Use the stored reference in the cleanup
                dialog.removeEventListener('cancel', handleCancel);
            };
        }
    }, [toCreate, icon, icons]);

    /*Handle GET*/
    useEffect(() => {
        if(dataUser && statusUser === 200){
            setNewNickname(dataUser["nickname"]);
            setIcon(dataUser["photo"]);
            setTitle(`Actualizando a: ${dataUser["nickname"]}`);
        }
    }, [dataUser, statusUser]);

    /*Handle Create*/
    useEffect(() => {
        console.log("Estado de creación:", loadingCreate, statusCreate, createUser);
        if(!loadingCreate && createUser) {
            if(statusCreate === 201){
                console.log("Usuario creado exitosamente");
                setCreateUser(false);
                setIsSubmitting(false);
                // Importante: esperar un breve momento antes de cerrar para asegurar que los datos se hayan guardado
                setTimeout(() => {
                    handleClose();
                }, 500);
            } else if(statusCreate >= 400) {
                console.error("Error al crear usuario:", statusCreate, errorCreate);
                setNewNickname(newNickname); // Mantener el valor actual
                setCreateUser(false);
                setIsSubmitting(false);
                // No resetear el icono para permitir reintento sin empezar de cero
            }
        }
    }, [loadingCreate, statusCreate, createUser, handleClose, errorCreate, newNickname]);

    /*Handle Update*/
    useEffect(() => {
        console.log("Procesando actualización:", loadingNickname, loadingIcon, statusIcon, statusNickname);
        if(!loadingIcon && !loadingNickname && updateUser) {
            if(statusNickname === 200 && statusIcon === 200){
                console.log("Actualización exitosa");
                setUpdateUser(false);
                setIsSubmitting(false);
                handleClose();
            } else {
                setIsSubmitting(false);
                if (statusNickname !== 200 && statusNickname !== null) {
                    setErrorNickname(`Error nickname: ${statusNickname}`);
                }
                if (statusIcon !== 200 && statusIcon !== null) {
                    setErrorIcon(`Error Icon: ${statusIcon}`);
                }
            }
        }
    }, [loadingNickname, loadingIcon, statusIcon, statusNickname, handleClose, updateUser]);

    // Seleccionar icono por defecto si no hay ninguno seleccionado
    useEffect(() => {
        if (toCreate && !icon && icons.length > 0) {
            console.log("Seleccionando icono por defecto");
            setIcon(icons[0]);
        }
    }, [toCreate, icon, icons]);
    
    // Debug para verificar estado de componente
    useEffect(() => {
        console.log("Estado actual:", {
            newNickname,
            icon,
            createUser,
            updateUser,
            isSubmitting
        });
    }, [newNickname, icon, createUser, updateUser, isSubmitting]);

    return(
        <dialog className="user-creation" ref={dialogRef}>
            <h2>{title || (toCreate ? "Creación de Usuario" : "Actualizar Usuario")}</h2>
            <div className="user-form">
                <input
                    type="text"
                    placeholder="Ingresa tu nickname"
                    value={newNickname}
                    onChange={(e) => setNewNickname(e.target.value)}
                    onKeyDown={handleKeyDown}
                    maxLength="12"
                />

                <div className="select-icons">
                    {icons.map((iconMap, index) => (
                        <button 
                            className={`icon-container ${icon === iconMap ? 'selected' : ''}`}
                            key={index} 
                            onClick={() => setIcon(iconMap)}
                            onKeyDown={(e) => handleIconKeyDown(e, iconMap)}
                            aria-label={`Seleccionar icono ${index + 1}`}
                            type="button"
                        >
                            <img
                                src={iconMap}
                                alt={`Icono ${index + 1}`}
                            />
                        </button>
                    ))}
                </div>
                <div className="buttons">
                    <button 
                        disabled={(!icon || !newNickname || isSubmitting)} 
                        onClick={handleSubmit}
                    >
                        {isSubmitting ? "Procesando..." : submitButton || (toCreate ? "Crear" : "Actualizar")}
                    </button>

                    {!toCreate && <button onClick={handleClose} disabled={isSubmitting}>Cancelar</button>}
                    {!toCreate && statusIcon && errorIcon !==null && <h2>{errorIcon}</h2>}
                    {!toCreate && statusNickname && errorNickname !==null && <h2>{errorNickname}</h2>}
                </div>
            </div>
            {statusCreate !== 201 && statusCreate !== null && statusCreate !== 0 && errorCreate && (
                <div className="error-message">
                    <h2>Error al crear usuario: {statusCreate}</h2>
                    <p>{errorCreate}</p>
                </div>
            )}
        </dialog>
    );
};

UserDialog.propTypes = {
    toCreate: PropTypes.bool.isRequired,
    email: PropTypes.string.isRequired,
    onClose: PropTypes.func
};

export default UserDialog;