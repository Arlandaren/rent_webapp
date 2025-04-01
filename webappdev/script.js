Telegram.WebApp.ready();

let interceptedRequest = null; // Глобальная переменная для хранения перехваченного запроса

// Создаем прокси для оригинальной функции fetch
const originalFetch = window.fetch;
const fetchProxy = new Proxy(originalFetch, {
    apply: function(target, thisArg, argumentsList) {
        const url = argumentsList[0];
        const init = argumentsList[1] || {};

        // Логирование URL, который запрашивается
        console.log('Fetching URL via Proxy:', url);

        // Перехват запросов к '/confirm'
        if (url.includes('/confirm')) {
            console.log('Перехвачен запрос к /confirm через прокси');

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
            return target.apply(thisArg, argumentsList).then(response => {
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
                    console.warn('Ответ не OK:', response.status);
                }
                return response;
            });
        }

        // Перехват запросов к '/booking/.../info'
        if (url.includes('/booking/') && url.endsWith('/info')) {
            console.log('Перехвачен запрос к /booking/.../info через прокси');

            return target.apply(thisArg, argumentsList).then(async response => {
                if (response.ok) {
                    let responseData = null;
                    try {
                        responseData = await response.clone().json();
                        console.log('Response data:', responseData);
                    } catch (error) {
                        console.error('Ошибка при разборе JSON ответа:', error);
                    }

                    if (responseData && responseData.status === "booked") {
                        console.log('Статус ответа "booked"');

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
                    console.warn('Ответ не OK:', response.status);
                    try {
                        Telegram.WebApp.sendData(JSON.stringify({ status: "error", statusCode: response.status }));
                    } catch (error) {
                        console.error('Ошибка при отправке статуса ошибки в Telegram:', error);
                    }
                    return response;
                }
            });
        }

        // Для всех остальных запросов используем оригинальный fetch
        return target.apply(thisArg, argumentsList);
    }
});

// Переопределяем глобальные ссылки на fetch
window.fetch = fetchProxy;
// Переопределяем fetch в глобальном пространстве имен (если используется другой вариант доступа)
if (typeof globalThis !== 'undefined') {
    globalThis.fetch = fetchProxy;
}

// Переопределяем ссылки на fetch внутри window и document (для надежности)
if (window.document) {
    document.fetch = fetchProxy;
}
