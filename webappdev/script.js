Telegram.WebApp.ready();

const originalFetch = window.fetch;

window.fetch = async (...args) => {
    const url = args[0];

    if (url.includes('/confirm')) {
        console.log('Перехвачен запрос к /confirm');
        // Извлекаем тело запроса
        const requestPayload = args[1]?.body;
        let payloadData = null;
        if (requestPayload) {
            try {
                // Если тело запроса — строка, используем его напрямую
                payloadData = typeof requestPayload === 'string' ? requestPayload : JSON.stringify(requestPayload);
            } catch (error) {
                console.error('Error reading request payload:', error);
            }
        }

        // Извлекаем информацию из элемента
        const priceElement = document.querySelector('#hr-modal > div.hr-modal > div > div.basket-page__container > div.basket-page__content > div.form-container > div.form > div.form__price-block.price-block > div:nth-child(2) > div.price-block__right');
        const priceInfo = priceElement ? priceElement.innerText : 'Информация не найдена';
        console.log(priceInfo);
        console.log(payloadData);
        // Добавляем информацию в отправку данных в Telegram
        const response = await originalFetch(...args);

        if (response.ok) { // Проверка на статус-код 200
            // Формируем объект перехваченного запроса
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
        }

        return response;
    }

    return originalFetch(...args);
};