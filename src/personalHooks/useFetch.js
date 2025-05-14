import {useState, useEffect, useRef} from "react";

export function useFetch(config, dependencies = [], condition = true) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [controller, setController] = useState(null);
    const [status, setStatus] = useState(null);
    
    // Use refs to store the previous values for comparison
    const prevConfigRef = useRef();
    const prevDependenciesRef = useRef();
    const prevConditionRef = useRef();
    
    // Stringify dependencies for comparison (removes the need for spread in deps array)
    const dependenciesString = JSON.stringify(dependencies);
    
    useEffect(() => {
        // Check if we need to fetch based on condition or changes
        const shouldFetch = condition && (
            // First run or condition changed from false to true
            prevConditionRef.current !== condition ||
            // Config changed
            JSON.stringify(prevConfigRef.current) !== JSON.stringify(config) ||
            // Dependencies changed
            JSON.stringify(prevDependenciesRef.current) !== dependenciesString
        );
        
        // Update refs with current values for next comparison
        prevConfigRef.current = config;
        prevDependenciesRef.current = dependencies;
        prevConditionRef.current = condition;
        
        // Skip fetch if not needed
        if (!shouldFetch) {
            return;
        }
        
        const {
            url,
            method,
            headers = {}, // Default empty headers
            body = null   // Optional body
        } = config;
        
        // Only proceed if we have a URL
        if (!url) {
            return;
        }
        
        // Create abort controller
        const abortController = new AbortController();
        setController(abortController);
        setLoading(true);
        
        fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                "Ocp-Apim-Subscription-Key": process.env.REACT_APP_API_KEY,
                ...headers // Allow overriding or adding headers
            },
            ...(body && method !== 'GET' && method !== 'HEAD'
                ? { body: JSON.stringify(body) }
                : {}),
            signal: abortController.signal
        })
        .then((response) => {
            console.log(url);
            setStatus(response.status);
            return response.json();
        })
        .then((data) => setData(data))
        .catch((error) => {
            if (error.name === "AbortError") {
                console.log("Request Cancelled");
            } else {
                setError(error);
            }
        })
        .finally(() => setLoading(false));
        
        return () => abortController.abort();
    }, [config, condition, dependenciesString,dependencies]); // Clean dependency array with serialized dependencies

    const handleCancelRequest = () => {
        if (controller) {
            controller.abort();
            setError("Request Cancel");
        }
    };
    
    return {data, loading, error, status, handleCancelRequest};
}