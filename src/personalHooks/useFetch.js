import { useState, useEffect, useRef, useMemo } from "react";

export function useFetch(config, states = [], condition = true) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [controller, setController] = useState(null);
    const [status, setStatus] = useState(null);
    
    // Referencias para evitar dependencias cambiantes
    const configRef = useRef(config);
    const conditionRef = useRef(condition);
    
    // Actualizar las referencias cuando cambian los valores
    useEffect(() => {
        configRef.current = config;
        conditionRef.current = condition;
    }, [config, condition]);
    
    // Usar useMemo para memoizar depsArray
    const depsArray = useMemo(() => Array.isArray(states) ? states : [], [states]);
    
    // Referencia para controlar si está montado
    const mountedRef = useRef(true);
    
    useEffect(() => {
        // Referencia para tracking si el componente está montado
        mountedRef.current = true;
        
        // No hacer nada si la condición es falsa
        if (!conditionRef.current) {
            if (mountedRef.current) setLoading(false);
            return;
        }
        
        // Obtener los valores de config
        const { url, method, headers = {}, body = null } = configRef.current;
        
        // Crear un controlador de aborto
        const abortController = new AbortController();
        if (mountedRef.current) setController(abortController);
        if (mountedRef.current) setLoading(true);
        if (mountedRef.current) setError(null);
        
        fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                "Ocp-Apim-Subscription-Key": "b553314cb92447a6bb13871a44b16726",
                ...headers
            },
            ...(body && method !== 'GET' && method !== 'HEAD'
                ? { body: JSON.stringify(body) }
                : {}),
            signal: abortController.signal
        })
        .then((response) => {
            if (!mountedRef.current) return null;
            
            setStatus(response.status);
            
            // No intentar parsear JSON para respuestas vacías o no-JSON
            if (response.status === 204) return null;
            
            // Intentar parsear como JSON, pero manejar fallos
            return response.json().catch(e => {
                console.warn("Error parsing JSON:", e);
                return null;
            });
        })
        .then((responseData) => {
            if (!mountedRef.current) return;
            
            setData(responseData);
            setLoading(false);
        })
        .catch((error) => {
            if (!mountedRef.current) return;
            
            if (error.name === "AbortError") {
                console.log("Request Cancelled");
            } else {
                console.error("Fetch error:", error);
                setError(error);
            }
            setLoading(false);
        });
        
        // Cleanup function
        return () => {
            mountedRef.current = false;
            abortController.abort();
        };
    }, [depsArray]); // Solo depsArray como dependencia

    const handleCancelRequest = () => {
        if (controller) {
            controller.abort();
            setError("Request Cancel");
        }
    };
    
    return { data, loading, error, status, handleCancelRequest };
}