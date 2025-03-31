import React, {useEffect, useState} from "react";
import "../../styles/UserBar.css"
import io from 'socket.io-client';
import PropTypes from "prop-types";


function UserBar ({email}) {
    const [balance, setBalance] = useState(0);
    const [nickname, setNickname] = useState(' ');
    const [icon, setIcon] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const[socket, setSocket] = useState(null);


    useEffect(() => {
        const socketInstance = io("http://localhost:8085", {
            transports: ["websocket"],
            query: { email: email }
        });
        setSocket(socketInstance);


        socketInstance.on('connect', () => {
            setIsConnected(true);
            console.log(`Conectado a ${email}`);
        });

        socketInstance.on('conexion_confirmada', () => {
            setIsConnected(true);
            console.log(`Conectado a ${email}`);
        });

        socketInstance.on('get_info',(data) => {
            setNickname(data['nickname']);
            setIcon(data['photo']);
        });

        socketInstance.on('accept_balance', (data) => {
            setBalance(data['userBalance']);
        });

        socketInstance.on('disconnect',() =>
        {
            console.log(`Disconnected ${email}`);
            setIsConnected(false);
        });

    }, []);



    useEffect(() => {
        console.log(socket);
        console.log(isConnected);
        if(socket && socket.connected){
            socket.emit('sent_info',{},(response)=>{
                console.log(`Respuesta del servidor: ${response}`);
            });

            socket.emit('sent_balance',{},(response)=>{
                console.log(`Respuesta del servidor: ${response}`);
            });
        }
    }, [socket,isConnected]);

    return (
        <>
        {nickname ?
            <div className="user-info">
                <div className="icon">
                    <img className="icon" src={icon} alt="user icon"/>
                </div>
                <div id="Bienvenida">
                    <h1>Hola, {nickname}</h1>
                    <p className="lobby-subtitle">Bienvenido a The Hidden Cargo</p>
                </div>
                <div id="balance">
                    <p>${balance}</p>
                </div>
            </div>

            : <div className="user-info"><h2>Usuario No encontrado</h2></div>
        }
        </>
    );

};

UserBar.propTypes = {
    email: PropTypes.string.isRequired
};


export  default  UserBar;
