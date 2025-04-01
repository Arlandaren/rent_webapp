Telegram.WebApp.ready();

const originalFetch = window.fetch;

let interceptedRequest = null;  // Variable to store data from the '/confirm' request

window.fetch = async (...args) => {
    const url = args[0];

    // Log the URL being fetched
    console.log('Fetching URL:', url);

    // Ensure args[1] is an object
    const init = args[1] || {};

    // Intercept requests to '/confirm'
    if (url.includes('/confirm')) {
        console.log('Intercepted /confirm request');

        // Extract the request body
        const requestPayload = init.body;
        let payloadData = null;
        if (requestPayload) {
            try {
                payloadData = typeof requestPayload === 'string' ? requestPayload : JSON.stringify(requestPayload);
                console.log('Request payload:', payloadData);
            } catch (error) {
                console.error('Error reading request payload:', error);
            }
        } else {
            console.warn('No request payload found in /confirm request');
        }

        // Extract price information from element
        const priceElement = document.querySelector('#hr-modal .price-block__right');
        const priceInfo = priceElement ? priceElement.innerText : 'Информация не найдена';
        console.log('Price info:', priceInfo);

        // Save details of the intercepted request
        interceptedRequest = {
            url,
            method: init.method || 'GET',
            headers: init.headers,
            payload: payloadData,
            priceInfo: priceInfo,
        };

        console.log('Saved interceptedRequest:', interceptedRequest);

        // Proceed with the original fetch request
        const response = await originalFetch(...args);
        return response;
    }

    // Intercept requests to '/booking/.../info'
    if (url.includes('/booking/') && url.endsWith('/info')) {
        console.log('Intercepted /booking/.../info request');

        // Proceed with the original fetch request
        const response = await originalFetch(...args);

        if (response.ok) {
            let responseData = null;
            try {
                // Clone the response to read its body without affecting the original response
                responseData = await response.clone().json();
                console.log('Response data:', responseData);
            } catch (error) {
                console.error('Error parsing response JSON:', error);
            }

            // Check if the response contains status "booked"
            if (responseData && responseData.status === "booked") {
                console.log('Response status is "booked"');

                // Send only the saved interceptedRequest to Telegram
                if (interceptedRequest) {
                    try {
                        console.log('Sending interceptedRequest to Telegram:', interceptedRequest);
                        Telegram.WebApp.sendData(JSON.stringify(interceptedRequest));
                    } catch (error) {
                        console.error('Error sending data to Telegram:', error);
                    }
                } else {
                    console.warn('No interceptedRequest data available to send.');
                }
            } else {
                console.log('Response status is not "booked"');
            }

            return response;
        } else {
            // If status code is not OK, send an error message to Telegram
            console.warn('Response not OK:', response.status);
            try {
                Telegram.WebApp.sendData(JSON.stringify({ status: "error", statusCode: response.status }));
            } catch (error) {
                console.error('Error sending error status to Telegram:', error);
            }
            return response;
        }
    }

    // For all other requests, use the original fetch
    return originalFetch(...args);
};
