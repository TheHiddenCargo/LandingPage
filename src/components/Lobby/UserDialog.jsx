import React, {useEffect, useRef, useState} from "react";
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
import io from "socket.io-client";



const UserDialog = ({toCreate,email,onClose}) => {
    const [newNickname, setNewNickname] = useState('');
    const [icon, setIcon] = useState(null);
    const[title, setTitle] = useState(null);
    const[submitButton, setSubmitButton]= useState(null);
    const [createUser, setCreateUser] = useState(false);
    const dialogRef = useRef(null);
    const socket = useRef(null);


    /*Fetch to register User*/
    const {loading:loadingCreate, status:statusCreate, error: errorCreate} = useFetch({
        url: 'https://thehiddencargo1.azure-api.net/creation//users/register',
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

    const handleClose = () => {
        if (dialogRef.current) {
            dialogRef.current.close();
            if (!toCreate && onClose) onClose();

        }
    };

    const handleUpdate = () =>{
        socket.current.emit('update_nickname', {
            newNickname : newNickname
        }, (response) => {
            console.log(`Respuesta del servidor para update_nickname: ${response}`);
        });

        socket.current.emit('update_photo',{
            newPhoto: icon
        },(response) =>{
            console.log(`Respuesta del servidor para update_photo: ${response}`);
        });
        handleClose();
    };

    const handleSubmit = () => {
        if(toCreate) setCreateUser(true);
        else handleUpdate();
    };

    const handleKeyDown = (e) => {
        if (e.key === ' ') {
            e.preventDefault(); // Previene la acción de la tecla de espacio
        }
    };



    useEffect(() => {
        if (dialogRef) {
            socket.current =  io("http://localhost:8085", {
                query: { email: email }
            });
            socket.current.on('connect', () => {
                console.log(`userDialog connected ${email}`);

            });

            socket.current.on('disconnect', () => {
                console.log(`userDialog disconnected ${email}`);
            });

            socket.current.on('error', (error) => {
                console.error("Socket.IO error:", error);
            });

            socket.current.on('connect_error', (error) => {
                console.error("Socket.IO connection error:", error);
            });
            if(toCreate){
                setTitle("Creación de Usuario");
                setSubmitButton("Crear");
            }else{

                setSubmitButton("Actualizar");

            }
            dialogRef.current.showModal();
            const handleCancel = (event) => {
                event.preventDefault();
            };
            dialogRef.current.addEventListener('cancel', handleCancel);

            return () => {
                if (dialogRef.current) {
                    dialogRef.current.removeEventListener('cancel', handleCancel);
                }

                console.log('Limpiando conexión de socket');
                socket.current.disconnect();
                socket.current.off('connect');
                socket.current.off('disconnect');
                socket.current.off('error');
                socket.current.off('connect_error');

            };
        }

    }, []);

    useEffect(() => {
        if(dataUser && statusUser === 200){
            setNewNickname(dataUser["nickname"]);
            setIcon(dataUser["photo"]);
            setTitle(`Actualizando a: ${newNickname}`);
        }
    }, [dataUser,statusUser]);
    /*Handle Create*/
    useEffect(() => {
        console.log("Creating")
        console.log(loadingCreate,statusCreate,createUser);
        if(loadingCreate === false && createUser && statusCreate === 201){
            socket.current.emit('sent_info', {}, (response) => {
                console.log(`Respuesta del servidor para sent_info: ${response}`);
            });

            socket.current.emit('sent_balance', {}, (response) => {
                console.log(`Respuesta del servidor para sent_balance: ${response}`);
            });
            handleClose();
        }
        if(loadingCreate === false && createUser && statusCreate === 400) {
            setNewNickname(null);
            setCreateUser(false);
            setIcon(null);
        }
    }, [loadingCreate,statusCreate]);

    /*Handle GET*/




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
                        <div className={`icon-container ${icon === iconMap ? 'selected' : ''}`}
                             key={index} onClick={(() => setIcon(iconMap))}>
                            <img
                                src={iconMap}
                                alt={index}
                            />
                        </div>

                    ))}
                </div>
                <div className="buttons">
                    <button disabled={!icon || !newNickname} onClick={handleSubmit}>{submitButton}</button>

                    {!toCreate && <button onClick={handleClose}>Cancel</button>}
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