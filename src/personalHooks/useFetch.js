import {useState, useEffect} from "react";

export function useFetch(config, states = [], condition = true) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [controller, setController] = useState(null);
    const [status, setStatus] = useState(null);
    
    // Extraer propiedades del config
    const {
        url,
        method,
        headers = {}, // Headers por defecto vacíos
        body = null   // Body opcional
    } = config;

    useEffect(() => {
        // Solo realizar la petición si la condición es verdadera y hay una URL
        if (condition && url) {
            const abortController = new AbortController();
            setController(abortController);
            setLoading(true);
            
            fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    "Ocp-Apim-Subscription-Key": process.env.REACT_APP_API_KEY,
                    ...headers // Permite sobreescribir o añadir headers
                },
                ...(body && method !== 'GET' && method !== 'HEAD'
                    ? { body: JSON.stringify(body) }
                    : {}),
                signal: abortController.signal
            })
            .then((response) => {
                console.log(url);
                setStatus(response.status);
                
                // Verificar si la respuesta tiene contenido
                if (response.status === 204) {
                    return null; // No content
                }
                
                // Intenta parsear como JSON
                return response.json().catch(e => {
                    console.warn("Error parsing JSON:", e);
                    return null;
                });
            })
            .then((responseData) => setData(responseData))
            .catch((error) => {
                if (error.name === "AbortError") {
                    console.log("Request Cancelled");
                } else {
                    setError(error);
                }
            })
            .finally(() => setLoading(false));
            
            return () => abortController.abort();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, states); // Usa el array states como dependencias

    const handleCancelRequest = () => {
        if (controller) {
            controller.abort();
            setError("Request Cancel");
        }
    };
    
    return {data, loading, error, status, handleCancelRequest};
}