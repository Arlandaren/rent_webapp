Telegram.WebApp.ready();

const originalFetch = window.fetch;

let interceptedRequest = null; // Глобальная переменная для хранения перехваченного запроса

window.fetch = async (...args) => {
    const url = args[0];

    // Логирование URL, который запрашивается
    console.log('Fetching URL:', url);

    // Убедимся, что args[1] — это объект
    const init = args[1] || {};

    // Перехват запросов к '/confirm'
    if (url.includes('/confirm')) {
        console.log('Перехвачен запрос к /confirm');

        // Извлекаем тело запроса
        const requestPayload = init.body;
        let payloadData = null;
        if (requestPayload) {
            try {
                payloadData = typeof requestPayload === 'string' ? requestPayload : JSON.stringify(requestPayload);
                console.log('Request payload:', payloadData);
            } catch (error) {
                console.error('Ошибка при чтении тела запроса:', error);
            }
        } else {
            console.warn('Тело запроса отсутствует в запросе к /confirm');
        }

        // Извлекаем информацию о цене из элемента
        const priceElement = document.querySelector('#hr-modal > div.hr-modal > div > div.basket-page__container > div.basket-page__content > div.form-container > div.form > div.form__price-block.price-block > div:nth-child(2) > div.price-block__right');
        const priceInfo = priceElement ? priceElement.innerText : 'Информация не найдена';
        console.log('Price info:', priceInfo);

        // Продолжаем выполнение оригинального запроса
        const response = await originalFetch(...args);

        if (response.ok) {
            // Сохраняем детали перехваченного запроса в глобальную переменную
            interceptedRequest = {
                url,
                method: init.method || 'GET',
                headers: init.headers,
                payload: payloadData,
                priceInfo: priceInfo,
            };

            console.log('Сохранен interceptedRequest:', interceptedRequest);
        } else {
            // Если ответ не OK, записываем предупреждение
            console.warn('Ответ не OK:', response.status);
        }

        return response;
    }

    // Перехват запросов к '/booking/.../info'
    if (url.includes('/booking/') && url.endsWith('/info')) {
        console.log('Перехвачен запрос к /booking/.../info');

        // Продолжаем выполнение оригинального запроса
        const response = await originalFetch(...args);

        if (response.ok) {
            let responseData = null;
            try {
                // Клонируем ответ, чтобы прочитать его тело без влияния на оригинальный ответ
                responseData = await response.clone().json();
                console.log('Response data:', responseData);
            } catch (error) {
                console.error('Ошибка при разборе JSON ответа:', error);
            }

            // Проверяем, содержит ли ответ статус "booked"
            if (responseData && responseData.status === "booked") {
                console.log('Статус ответа "booked"');

                // Отправляем сохраненный interceptedRequest в Telegram
                if (interceptedRequest) {
                    try {
                        console.log('Отправляем interceptedRequest в Telegram:', interceptedRequest);
                        Telegram.WebApp.sendData(JSON.stringify(interceptedRequest));
                    } catch (error) {
                        console.error('Ошибка при отправке данных в Telegram:', error);
                    }
                } else {
                    console.warn('Нет данных interceptedRequest для отправки.');
                }
            } else {
                console.log('Статус ответа не "booked"');
            }

            return response;
        } else {
            // Если ответ не OK, отправляем сообщение об ошибке в Telegram
            console.warn('Ответ не OK:', response.status);
            try {
                Telegram.WebApp.sendData(JSON.stringify({ status: "error", statusCode: response.status }));
            } catch (error) {
                console.error('Ошибка при отправке статуса ошибки в Telegram:', error);
            }
            return response;
        }
    }

    // Для всех остальных запросов используем оригинальный fetch
    return originalFetch(...args);
};
