Telegram.WebApp.ready();

// Store original fetch and XMLHttpRequest
const originalFetch = window.fetch;
const originalXHR = window.XMLHttpRequest;

let interceptedRequest = null; // Global variable to store intercepted request

// Override fetch
window.fetch = async (...args) => {
    const url = args[0];

    // Log the URL being fetched
    console.log('Fetching URL:', url);

    // Ensure args[1] is an object
    const init = args[1] || {};

    // Intercept requests to '/confirm'
    if (url.includes('/confirm')) {
        console.log('Intercepted fetch request to /confirm');

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
        const priceElement = document.querySelector('#hr-modal > div.hr-modal > div > div.basket-page__container > div.basket-page__content > div.form-container > div.form > div.form__price-block.price-block > div:nth-child(2) > div.price-block__right');
        const priceInfo = priceElement ? priceElement.innerText : 'Information not found';
        console.log('Price info:', priceInfo);

        // Proceed with the original fetch request
        const response = await originalFetch(...args);

        if (response.ok) {
            // Save details of the intercepted request
            interceptedRequest = {
                url,
                method: init.method || 'GET',
                headers: init.headers,
                payload: payloadData,
                priceInfo: priceInfo,
            };

            console.log('Saved interceptedRequest:', interceptedRequest);
        } else {
            // If response not OK, log a warning
            console.warn('Response not OK:', response.status);
        }

        return response;
    }

    // Intercept requests to '/booking/.../info'
    if (url.includes('/booking/') && url.endsWith('/info')) {
        console.log('Intercepted fetch request to /booking/.../info');

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

                // Send the saved interceptedRequest to Telegram
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
            // If response not OK, send an error message to Telegram
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

// Override XMLHttpRequest
(function() {
    const XHR = XMLHttpRequest.prototype;

    const open = XHR.open;
    const send = XHR.send;
    const setRequestHeader = XHR.setRequestHeader;

    XHR.open = function(method, url) {
        this._url = url;
        this._method = method;
        this._requestHeaders = {};
        this._body = null;

        return open.apply(this, arguments);
    };

    XHR.setRequestHeader = function(header, value) {
        this._requestHeaders[header] = value;
        return setRequestHeader.apply(this, arguments);
    };

    XHR.send = function(body) {
        this._body = body;

        // Intercept requests to '/confirm'
        if (this._url && this._url.includes('/confirm')) {
            console.log('Intercepted XMLHttpRequest to /confirm');

            let payloadData = null;
            if (body) {
                try {
                    payloadData = typeof body === 'string' ? body : JSON.stringify(body);
                    console.log('Request payload:', payloadData);
                } catch (error) {
                    console.error('Error reading request payload:', error);
                }
            } else {
                console.warn('No request payload found in /confirm request');
            }

            // Extract price information from element
            const priceElement = document.querySelector('#hr-modal > div.hr-modal > div > div.basket-page__container > div.basket-page__content > div.form-container > div.form > div.form__price-block.price-block > div:nth-child(2) > div.price-block__right');
            const priceInfo = priceElement ? priceElement.innerText : 'Information not found';
            console.log('Price info:', priceInfo);

            this.addEventListener('load', function() {
                if (this.status >= 200 && this.status < 300) {
                    // Save details of the intercepted request
                    interceptedRequest = {
                        url: this._url,
                        method: this._method,
                        headers: this._requestHeaders,
                        payload: payloadData,
                        priceInfo: priceInfo,
                    };

                    console.log('Saved interceptedRequest:', interceptedRequest);
                } else {
                    console.warn('Response not OK:', this.status);
                }
            });
        }

        // Intercept requests to '/booking/.../info'
        if (this._url && this._url.includes('/booking/') && this._url.endsWith('/info')) {
            console.log('Intercepted XMLHttpRequest to /booking/.../info');

            this.addEventListener('load', function() {
                if (this.status >= 200 && this.status < 300) {
                    let responseData = null;
                    try {
                        responseData = JSON.parse(this.responseText);
                        console.log('Response data:', responseData);
                    } catch (error) {
                        console.error('Error parsing response JSON:', error);
                    }

                    // Check if the response contains status "booked"
                    if (responseData && responseData.status === "booked") {
                        console.log('Response status is "booked"');

                        // Send the saved interceptedRequest to Telegram
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
                } else {
                    // If response not OK, send an error message to Telegram
                    console.warn('Response not OK:', this.status);
                    try {
                        Telegram.WebApp.sendData(JSON.stringify({ status: "error", statusCode: this.status }));
                    } catch (error) {
                        console.error('Error sending error status to Telegram:', error);
                    }
                }
            });
        }

        return send.apply(this, arguments);
    };
})();
