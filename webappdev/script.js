Telegram.WebApp.ready();

let interceptedRequest = null;  // Переменная для хранения данных из запроса '/confirm'

// Переопределение window.fetch
const originalFetch = window.fetch;
window.fetch = async (...args) => {
    const url = args[0];

    // Логируем URL запроса
    console.log('Fetching URL:', url);

    // Убеждаемся, что args[1] является объектом
    const init = args[1] || {};

    // Перехватываем запросы к '/confirm'
    if (url.includes('/confirm')) {
        console.log('Перехвачен fetch-запрос к /confirm');

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
            console.warn('Тело запроса в /confirm не найдено (fetch)');
        }

        // Извлекаем информацию о цене из элемента
        const priceElement = document.querySelector('#hr-modal .price-block__right');
        const priceInfo = priceElement ? priceElement.innerText : 'Информация не найдена';
        console.log('Price info:', priceInfo);

        // Сохраняем детали перехваченного запроса
        interceptedRequest = {
            url,
            method: init.method || 'GET',
            headers: init.headers,
            payload: payloadData,
            priceInfo: priceInfo,
        };

        console.log('Сохранен interceptedRequest из fetch:', interceptedRequest);
    }

    // Перехватываем запросы к '/booking/.../info'
    if (url.includes('/booking/') && url.endsWith('/info')) {
        console.log('Перехвачен fetch-запрос к /booking/.../info');

        // Продолжаем выполнение оригинального запроса
        const response = await originalFetch(...args);

        if (response.ok) {
            let responseData = null;
            try {
                // Клонируем ответ, чтобы прочитать его без влияния на оригинальный ответ
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
            // Если статус ответа не OK, отправляем сообщение об ошибке в Telegram
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

// Переопределение XMLHttpRequest
(function() {
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;
    const originalXHRSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;

    XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
        this._method = method;
        this._url = url;
        this._headers = {};
        return originalXHROpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.setRequestHeader = function(header, value) {
        this._headers[header] = value;
        return originalXHRSetRequestHeader.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function(body) {
        if (this._url.includes('/confirm')) {
            console.log('Перехвачен XMLHttpRequest к /confirm');

            // Извлекаем тело запроса
            const requestPayload = body;
            let payloadData = null;
            if (requestPayload) {
                try {
                    payloadData = typeof requestPayload === 'string' ? requestPayload : JSON.stringify(requestPayload);
                    console.log('Request payload:', payloadData);
                } catch (error) {
                    console.error('Ошибка при чтении тела запроса:', error);
                }
            } else {
                console.warn('Тело запроса в /confirm не найдено (XMLHttpRequest)');
            }

            // Извлекаем информацию о цене из элемента
            const priceElement = document.querySelector('#hr-modal .price-block__right');
            const priceInfo = priceElement ? priceElement.innerText : 'Информация не найдена';
            console.log('Price info:', priceInfo);

            // Сохраняем детали перехваченного запроса
            interceptedRequest = {
                url: this._url,
                method: this._method,
                headers: this._headers,
                payload: payloadData,
                priceInfo: priceInfo,
            };

            console.log('Сохранен interceptedRequest из XMLHttpRequest:', interceptedRequest);
        }

        // Добавляем обработчик события, чтобы перехватить ответ
        this.addEventListener('readystatechange', function() {
            if (this.readyState === 4 && this.status === 200 && this._url.includes('/booking/') && this._url.endsWith('/info')) {
                console.log('Перехвачен ответ XMLHttpRequest к /booking/.../info');

                let responseData = null;
                try {
                    responseData = JSON.parse(this.responseText);
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
            } else if (this.readyState === 4 && this.status !== 200) {
                // Если статус ответа не OK, отправляем сообщение об ошибке в Telegram
                console.warn('Ответ не OK:', this.status);
                try {
                    Telegram.WebApp.sendData(JSON.stringify({ status: "error", statusCode: this.status }));
                } catch (error) {
                    console.error('Ошибка при отправке статуса ошибки в Telegram:', error);
                }
            }
        });

        return originalXHRSend.apply(this, arguments);
    };
})();
