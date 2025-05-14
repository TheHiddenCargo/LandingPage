import React, {useEffect, useRef, useState, useCallback} from "react";
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



const UserDialog = ({toCreate,email,onClose}) => {
    const [newNickname, setNewNickname] = useState('');
    const [icon, setIcon] = useState(null);
    const[title, setTitle] = useState(null);
    const[submitButton, setSubmitButton]= useState(null);
    const [createUser, setCreateUser] = useState(false);
    const [updateUser, setUpdateUser] = useState(false);
    const dialogRef = useRef(null);
    const [errorNickname, setErrorNickname] = useState(null);
    const [errorIcon, setErrorIcon] = useState(null);




    /*Fetch to register User*/
    const {loading:loadingCreate, status:statusCreate, error: errorCreate} = useFetch({
        url: 'https://thehiddencargo1.azure-api.net/creation/users/register',
        method: 'POST',
        body: {
            email: email,
            nickName: newNickname,
            balance : "5000",
            icon : icon
        }
    },[createUser],createUser);

    /*Fetch GET Information*/

    const {data : dataUser, status: statusUser} = useFetch({
       url:  `https://thehiddencargo1.azure-api.net/creation/users/${email}/info`,
        method: 'GET',
        headers: {
           'accept': '*/*'
        }
    },[email],!toCreate && email);

    /*Fetch para actualizar NickName*/

    const {loading: loadingNickname, status:statusNickname} = useFetch({
        url: 'https://thehiddencargo1.azure-api.net/creation/polling/users/update/nickname',
        method: 'POST',
        body: {
            email: email,
            newNickname : newNickname
        }
    },[updateUser],updateUser);

    /*Fetch para actualizar icono*/

    const {loading: loadingIcon, status:statusIcon} = useFetch({
        url: 'https://thehiddencargo1.azure-api.net/creation/polling/users/update/photo',
        method: 'POST',
        body: {
            email: email,
            photo : icon
        }
    },[updateUser],updateUser);



    /*Icons definition*/
    const icons = [
        blueGuy,
        greenGuy,
        redGuy,
        curlyGirl,
        purpleGirl,
        redGirl,
        wolf,
        dragon,
        bear
    ];

    // Use useCallback to stabilize the handleClose function reference
    const handleClose = useCallback(() => {
        if (dialogRef.current) {
            dialogRef.current.close();
            if (!toCreate && onClose) onClose();
        }
    }, [toCreate, onClose]);

    const handleSubmit = () => {
        if(toCreate) setCreateUser(true);
        else setUpdateUser(true);
    };

    const handleKeyDown = (e) => {
        if (e.key === ' ') {
            e.preventDefault(); // Previene la acción de la tecla de espacio
        }
    };

    // Nuevo manejador de teclado para los iconos
    const handleIconKeyDown = (e, iconMap) => {
        // Seleccionar el icono si se presiona Enter o Space
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIcon(iconMap);
        }
    };

    useEffect(() => {
        if (dialogRef.current) {
            // Store a reference to the current dialog element
            const dialog = dialogRef.current;

            if(toCreate){
                setTitle("Creación de Usuario");
                setSubmitButton("Crear");
            }else{
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
    }, [toCreate]); // Added toCreate as a dependency

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
        console.log("Creating");
        console.log(loadingCreate, statusCreate, createUser);
        if(loadingCreate === false && createUser && statusCreate === 201){
            setCreateUser(false);
            handleClose();
        }
        if(loadingCreate === false && createUser && statusCreate === 400) {
            setNewNickname(null);
            setCreateUser(false);
            setIcon(null);
        }
    }, [loadingCreate, statusCreate, createUser, handleClose]); // Added missing dependencies

    /*Handle Update*/
    useEffect(() => {
        console.log("Procesando actualizacion");
        console.log(newNickname, icon);
        console.log(loadingNickname, loadingIcon, statusIcon, statusNickname);
        if(!loadingIcon && !loadingNickname && statusNickname === 200 && statusIcon === 200){
            setUpdateUser(false);
            handleClose();
        }
        else if (statusNickname !== null || statusIcon !== null) {
            if (statusNickname !== 200 && statusNickname !== null) {
                setErrorNickname(`Error nickname: ${statusNickname}`);
            }
            if (statusIcon !== 200 && statusIcon !== null) {
                setErrorIcon(`Error Icon: ${statusIcon}`);
            }
        }
    }, [loadingNickname, loadingIcon, statusIcon, statusNickname, handleClose, newNickname, icon]); // Added missing dependencies

    return(
        <dialog className="user-creation" ref={dialogRef}>
            <h2>{title}</h2>
            <div className="user-form">
                <input
                    type="text"
                    placeholder={newNickname}
                    onChange={(e)=>{setNewNickname(e.target.value)}}
                    onKeyDown={handleKeyDown}
                    maxLength="12"
                />

                <div className="select-icons">
                    {icons.map((iconMap,index) => (
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
                    <button disabled={!icon || !newNickname} onClick={handleSubmit}>{submitButton}</button>

                    {!toCreate && <button onClick={handleClose}>Cancel</button>}
                    {!toCreate && statusIcon && errorIcon !==null && <h2>{errorIcon}</h2>}
                    {!toCreate && statusNickname && errorNickname !==null && <h2>{errorNickname}</h2>}
                </div>
            </div>
            {statusCreate !== 201 && <h2>{errorCreate}</h2>}
        </dialog>
    );
};

UserDialog.propTypes = {
    toCreate : PropTypes.bool.isRequired,
    email: PropTypes.string.isRequired,
    onClose : PropTypes.func
};

export default UserDialog;