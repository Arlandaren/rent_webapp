Telegram.WebApp.ready();

const originalFetch = window.fetch;

window.fetch = async (...args) => {
    const url = args[0];

    if (url.includes('/info')) {
        // Extract the request body
        const requestPayload = args[1]?.body;
        let payloadData = null;
        if (requestPayload) {
            try {
                // If the request body is a string, use it directly
                payloadData = typeof requestPayload === 'string' ? requestPayload : JSON.stringify(requestPayload);
            } catch (error) {
                console.error('Error reading request payload:', error);
            }
        }

        // Extract information from an element
        const priceElement = document.querySelector('#hr-modal > div.hr-modal > div > div.basket-page__container > div.basket-page__content > div.form-container > div.form > div.form__price-block.price-block > div:nth-child(2) > div.price-block__right');
        const priceInfo = priceElement ? priceElement.innerText : 'Информация не найдена';

        // Send the request and handle the response
        const response = await originalFetch(...args);

        if (response.ok) {
            let responseData = null;
            try {
                // Clone the response to read its body without affecting the original response
                responseData = await response.clone().json();
            } catch (error) {
                console.error('Error parsing response JSON:', error);
            }

            // Check if the response contains status "booked"
            if (responseData && responseData.status === "booked") {
                // Send the response data to Telegram
                try {
                    Telegram.WebApp.sendData(JSON.stringify(responseData));
                } catch (error) {
                    console.error('Error sending data to Telegram:', error);
                }
                return response;
            }

            // Form the intercepted request object
            const interceptedRequest = {
                url,
                method: args[1]?.method || 'GET',
                headers: args[1]?.headers,
                payload: payloadData,
                priceInfo: priceInfo,
            };

            try {
                Telegram.WebApp.sendData(JSON.stringify(interceptedRequest));
            } catch (error) {
                console.error('Error sending data to Telegram:', error);
            }
        } else {
            // If status code is not 200, send an error message to the bot
            try {
                Telegram.WebApp.sendData(JSON.stringify({ status: "error" }));
            } catch (error) {
                console.error('Error sending error status to Telegram:', error);
            }
        }

        return response;
    }

    return originalFetch(...args);
};
