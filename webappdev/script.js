Telegram.WebApp.ready();

const originalFetch = window.fetch;

// Используем sessionStorage для сохранения данных между перезагрузками
function getStoredConfirmData() {
    const data = sessionStorage.getItem('lastConfirmData');
    return data ? JSON.parse(data) : null;
}

function storeConfirmData(data) {
    sessionStorage.setItem('lastConfirmData', JSON.stringify(data));
}

window.fetch = async (...args) => {
    const url = typeof args[0] === 'string' ? args[0] : args[0].url;
    
    // Обработка /confirm
    if (url.includes('/confirm')) {
        console.log('Intercepted /confirm request');
        
        const requestPayload = args[1]?.body;
        let payloadData = null;
        
        if (requestPayload) {
            try {
                payloadData = typeof requestPayload === 'string' 
                    ? requestPayload 
                    : JSON.stringify(requestPayload);
            } catch (error) {
                console.error('Error reading request payload:', error);
            }
        }

        const priceElement = document.querySelector('#hr-modal > div.hr-modal > div > div.basket-page__container > div.basket-page__content > div.form-container > div.form > div.form__price-block.price-block > div:nth-child(2) > div.price-block__right');
        const priceInfo = priceElement ? priceElement.innerText : 'Price not found';

        const confirmData = {
            url,
            method: args[1]?.method || 'GET',
            headers: args[1]?.headers,
            payload: payloadData,
            priceInfo: priceInfo,
            timestamp: new Date().toISOString()
        };

        // Сохраняем в sessionStorage
        storeConfirmData(confirmData);
        console.log('Saved /confirm data:', confirmData);
    }
    
    // Обработка /booking/.../info
    if (url.includes('/booking/') && url.endsWith('/info')) {
        console.log('Intercepted booking info request');
        
        const response = await originalFetch(...args);
        
        if (response.ok) {
            try {
                const responseData = await response.clone().json();
                console.log('Booking info response:', responseData);
                
                // Получаем сохраненные данные
                const storedData = getStoredConfirmData();
                console.log('Stored confirm data:', storedData);
                
                if (responseData?.status === "booked" && storedData) {
                    console.log('Status is booked, sending data to Telegram');
                    
                    // Формируем полные данные для отправки
                    const fullData = {
                        bookingInfo: responseData,
                        confirmData: storedData,
                        bookingId: url.split('/booking/')[1]?.split('/')[0]
                    };
                    
                    try {
                        Telegram.WebApp.sendData(JSON.stringify(fullData));
                        console.log('Data sent to Telegram');
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
    
    return originalFetch(...args);
};

console.log('Fetch interceptor installed');