import React, {useEffect, useRef, useState} from "react";
import "../../styles/UserBar.css"
import PropTypes from "prop-types";
import UserDialog from "./UserDialog";


function UserBar ({email}) {
    const [balance, setBalance] = useState(0);
    const [nickname, setNickname] = useState(' ');
    const [icon, setIcon] = useState(null);
    const[update,setUpdate] = useState(false);
    const [dialogKey, setDialogKey] = useState(0);

    // Referencias para almacenar los timestamps de la última actualización
    const infoTimestamp = useRef(null);
    const balanceTimestamp = useRef(null);

    // Referencias para controlar si los polling están activos
    const infoPollingActive = useRef(true);
    const balancePollingActive = useRef(true);

    // Base URL del servidor
    const API_BASE_URL = "https://thehiddencargo1.azure-api.net/creation";

    // API Key para Azure API Management
    const API_KEY = "b553314cb92447a6bb13871a44b16726";

    // Función para realizar el polling de información del usuario
    const pollUserInfo = async () => {
        try {
            if (!infoPollingActive.current) return;

            const endpoint = `${API_BASE_URL}/polling/users/${email}/info`;
            const timestamp = infoTimestamp.current;

            const url = timestamp
                ? `${endpoint}?timestamp=${timestamp}`
                : endpoint;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Ocp-Apim-Subscription-Key': API_KEY
                }
            });

            // Si hay nuevos datos (200 OK)
            if (response.ok && response.status !== 304) {
                const data = await response.json();
                setNickname(data["nickname"]);
                setIcon(data["photo"]);

                infoTimestamp.current = Date.now();
            }


            if (infoPollingActive.current) {
                setTimeout(pollUserInfo, 1000); // Pequeña pausa entre solicitudes
            }
        } catch (error) {
            console.error("Error polling user info:", error);
            // Reintentar después de un tiempo
            if (infoPollingActive.current) {
                setTimeout(pollUserInfo, 5000);
            }
        }
    };

    // Función para realizar el polling del balance
    const pollUserBalance = async () => {
        try {
            if (!balancePollingActive.current) return;

            const endpoint = `${API_BASE_URL}/polling/users/${email}/balance`;
            const timestamp = balanceTimestamp.current;

            const url = timestamp
                ? `${endpoint}?timestamp=${timestamp}`
                : endpoint;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Ocp-Apim-Subscription-Key': API_KEY
                }
            });

            // Si hay nuevos datos (200 OK)
            if (response.ok && response.status !== 304) {
                const data = await response.json();
                setBalance(data["userBalance"]);
                // Actualizar el timestamp
                balanceTimestamp.current = Date.now();
            }

            // Continuar con el polling
            if (balancePollingActive.current) {
                setTimeout(pollUserBalance, 1000); // Pequeña pausa entre solicitudes
            }
        } catch (error) {
            console.error("Error polling user balance:", error);
            // Reintentar después de un tiempo
            if (balancePollingActive.current) {
                setTimeout(pollUserBalance, 5000);
            }
        }
    };

    // Iniciar los pollings cuando el componente se monta
    useEffect(() => {
        console.log("Iniciando long polling para el usuario:", email);

        // Inicializar polling para info y balance
        infoPollingActive.current = true;
        balancePollingActive.current = true;

        // Iniciar pollings
        pollUserInfo();
        pollUserBalance();

        // Limpieza cuando el componente se desmonta
        return () => {
            console.log('Deteniendo long polling');
            infoPollingActive.current = false;
            balancePollingActive.current = false;
        };
    }, [email,pollUserInfo(),pollUserBalance()]);



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