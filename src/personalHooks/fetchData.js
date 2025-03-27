const getSuspender = (promise) => {
    let status = "pending";
    let response;

    const suspender = promise.then(
        (res) => {
            status = "success";
            response = res;
        },
        (err) => {
            status = "error";
            response = err;
        }
    );

    const read = () => {
        switch (status) {
            case "pending":
                throw suspender;
            case "error":
                throw response;
            default:
                return response;
        }}

        return { read };
    };

    export function fetchData(config) {
        const {
            url,
            method,
            headers = {}, // Headers por defecto vacíos
            body = null // Body opcional
        } = config;

        const promise = fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                "Ocp-Apim-Subscription-Key": "b553314cb92447a6bb13871a44b16726",
                ...headers // Permite sobreescribir o añadir headers
            },
            ...(body && method !== 'GET' && method !== 'HEAD'
                ? {body: JSON.stringify(body)}
                : {}),
        })
            .then((response) => {
                if (!response.ok) {
                    return response.text().then((text) => {
                        throw new Error(text || 'Something went wrong');
                    });
                }
                return response.json();
            });

        return getSuspender(promise);
    }