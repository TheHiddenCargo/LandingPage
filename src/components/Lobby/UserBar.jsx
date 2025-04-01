import React, {useEffect, useState} from "react";
import "../../styles/UserBar.css"
import io from 'socket.io-client';
import PropTypes from "prop-types";
import UserDialog from "./UserDialog";


function UserBar ({email}) {
    const [balance, setBalance] = useState(0);
    const [nickname, setNickname] = useState(' ');
    const [icon, setIcon] = useState(null);
    const[update,setUpdate] = useState(false);
    const [dialogKey, setDialogKey] = useState(0);



    useEffect(() => {
        console.log("Iniciando conexión Socket.IO");
        const socketInstance = io("http://localhost:8085", {
            query: { email: email }
        });

        // Configurar listeners
        socketInstance.on('connect', () => {
            console.log(`Conectado a ${email}`);

            // Emitir eventos inmediatamente después de conectar
            socketInstance.emit('sent_info', {}, (response) => {
                console.log(`Respuesta del servidor para sent_info: ${response}`);
            });

            socketInstance.emit('sent_balance', {}, (response) => {
                console.log(`Respuesta del servidor para sent_balance: ${response}`);
            });
        });

        socketInstance.on('get_info', (data) => {
            setNickname(data["nickname"]);
            setIcon(data["photo"]);
        });

        socketInstance.on('accept_balance', (data) => {
            setBalance(data["userBalance"]);
        });

        socketInstance.on('disconnect', () => {
            console.log(`Disconnected ${email}`);
        });

        socketInstance.on('error', (error) => {
            console.error("Socket.IO error:", error);
        });

        socketInstance.on('connect_error', (error) => {
            console.error("Socket.IO connection error:", error);
        });


        // Limpieza
        return () => {
            console.log('Limpiando conexión de socket');
            socketInstance.disconnect();
            socketInstance.off('connect');
            socketInstance.off('get_info');
            socketInstance.off('accept_balance');
            socketInstance.off('disconnect');
            socketInstance.off('error');
            socketInstance.off('connect_error');
        };
    }, [email]);



    const handleUpdate = () => {
        console.log("Botón Oprimido");
        setDialogKey(prevKey => prevKey + 1);
        setUpdate(true);

    };

    const handleCloseDialog = () => {
        console.log("Cerrando diálogo");
        setUpdate(false);
    };

    return (
        <>
        {nickname ?
            <>
            <div className="user-info">
                <div className="icon">
                    <button onClick={handleUpdate}>
                        <img className="icon" src={icon} alt="user icon"/>
                    </button>

                </div>
                <div id="Bienvenida">
                    <h1>Hola, {nickname}</h1>
                    <p className="lobby-subtitle">Bienvenido a The Hidden Cargo</p>
                </div>
                <div id="balance">
                    <p>${balance}</p>
                </div>
            </div>
            {update && <UserDialog key={dialogKey} toCreate={false} email={email} setUpdate={handleCloseDialog} />}
            </>

            : <div className="user-info"><h2>Usuario No encontrado</h2></div>
        }
        </>
    );

};

UserBar.propTypes = {
    email: PropTypes.string.isRequired
};


export  default  UserBar;
