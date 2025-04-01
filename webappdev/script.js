Telegram.WebApp.ready();

const originalFetch = window.fetch;

let interceptedRequest = null;  // Переменная для сохранения данных запроса '/confirm'

window.fetch = async (...args) => {
    const url = args[0];

    // Перехват запросов к '/confirm'
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

        // Извлекаем информацию о цене из элемента
        const priceElement = document.querySelector('#hr-modal > div.hr-modal > div > div.basket-page__container > div.basket-page__content > div.form-container > div.form > div.form__price-block.price-block > div:nth-child(2) > div.price-block__right');
        const priceInfo = priceElement ? priceElement.innerText : 'Информация не найдена';

        // Сохраняем детали перехваченного запроса
        interceptedRequest = {
            url,
            method: args[1]?.method || 'GET',
            headers: args[1]?.headers,
            payload: payloadData,
            priceInfo: priceInfo,
        };

        // Продолжаем с исходным запросом fetch
        const response = await originalFetch(...args);
        return response;
    }

    // Перехват запросов к '/booking/.../info'
    if (url.includes('/booking/') && url.endsWith('/info')) {
        // Продолжаем с исходным запросом fetch
        const response = await originalFetch(...args);

        if (response.ok) {
            let responseData = null;
            try {
                // Клонируем ответ, чтобы прочитать его тело без влияния на оригинальный ответ
                responseData = await response.clone().json();
            } catch (error) {
                console.error('Error parsing response JSON:', error);
            }

            // Проверяем, содержит ли ответ статус "booked"
            if (responseData && responseData.status === "booked") {
                // Подготавливаем данные для отправки в Telegram, включая interceptedRequest
                const dataToSend = {
                    responseData,
                    interceptedRequest
                };

                try {
                    Telegram.WebApp.sendData(JSON.stringify(dataToSend));
                } catch (error) {
                    console.error('Error sending data to Telegram:', error);
                }
            }

            return response;
        } else {
            // Если статус-код не OK, отправляем сообщение об ошибке в Telegram
            try {
                Telegram.WebApp.sendData(JSON.stringify({ status: "error" }));
            } catch (error) {
                console.error('Error sending error status to Telegram:', error);
            }
            return response;
        }
    }

    // Для всех остальных запросов используем оригинальный fetch
    return originalFetch(...args);
};
