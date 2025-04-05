import {useState,useEffect} from "react";

export function useFetch(config,states,condition){
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [controller, setController] =useState(null);
    const [status,setStatus] = useState(null);
    const {
        url,
        method,
        headers = {}, // Headers por defecto vacíos
        body = null // Body opcional
    } = config;
    useEffect(() => {
        if(condition){
                const abortController = new AbortController();
                setController(abortController);
                setLoading(true);
                fetch(url,
                    {
                        method,
                        headers: {
                            'Content-Type': 'application/json',
                            "Ocp-Apim-Subscription-Key": "b553314cb92447a6bb13871a44b16726",
                            ...headers // Permite sobreescribir o añadir headers
                        },
                        ...(body && method !== 'GET' && method !== 'HEAD'
                            ? { body: JSON.stringify(body) }
                            : {}),
                        signal: abortController.signal
                    })
                    .then((response) =>{
                        console.log(url);
                         setStatus(response.status);
                        return response.json()
                    })
                    .then((data) => setData(data))
                    .catch((error) => {
                        if(error.name === "AbortError") console.log("Request Cancelled");
                        else setError(error);
                    })
                    .finally(()=>setLoading(false));
                return () => abortController.abort();
        }
    }, states);


    const handleCancelRequest = () =>{
        if(controller){
            controller.abort();
            setError("Request Cancel");
        }
    };
    return {data,loading,error,status, handleCancelRequest};
}