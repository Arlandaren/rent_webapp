Telegram.WebApp.ready();

const originalFetch = window.fetch;
let interceptedRequest = null;

window.fetch = async (...args) => {
    const url = typeof args[0] === 'string' ? args[0] : args[0].url;
    
    // Обработка /confirm
    if (url.includes('/confirm')) {
        console.log('Intercepted /confirm request');
        
        const requestPayload = args[1]?.body;
        let payloadData = null;
        
        if (requestPayload) {
            try {
                payloadData = typeof requestPayload === 'string' ? requestPayload : JSON.stringify(requestPayload);
            } catch (error) {
                console.error('Error reading request payload:', error);
            }
        }

        const priceElement = document.querySelector('#hr-modal > div.hr-modal > div > div.basket-page__container > div.basket-page__content > div.form-container > div.form > div.form__price-block.price-block > div:nth-child(2) > div.price-block__right');
        const priceInfo = priceElement ? priceElement.innerText : 'Price not found';

        interceptedRequest = {
            url,
            method: args[1]?.method || 'GET',
            headers: args[1]?.headers,
            payload: payloadData,
            priceInfo: priceInfo,
        };

        console.log('Saved /confirm data:', interceptedRequest);
    }
    
    // Обработка /booking/.../info
    if (url.includes('/booking/') && url.endsWith('/info')) {
        console.log('Intercepted booking info request');
        
        const response = await originalFetch(...args);
        
        if (response.ok) {
            try {
                const responseData = await response.clone().json();
                console.log('Booking info response:', responseData);
                if (!interceptedRequest) {
                    console.warn('[Interceptor] No confirm data available');
                    return response;
                }
                console.log('Confirm data:', interceptedRequest);
                console.log(responseData?.status === "booked");
                if (responseData?.status === "booked" && interceptedRequest) {
                    console.log('Status is booked, sending data to Telegram');
                    try {
                        Telegram.WebApp.sendData(JSON.stringify(interceptedRequest));
                    } catch (error) {
                        console.error('Telegram send error:', error);
                    }
                }
            } catch (error) {
                console.error('JSON parse error:', error);
            }
        }
        
        return response;
    }
    
    // Для всех остальных запросов
    return originalFetch(...args);
};