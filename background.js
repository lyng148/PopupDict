chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'FETCH_DICT') {
        const { url, data } = request;
        fetch(url, {
            method: 'POST',
            headers: {
                "accept": "application/json, text/plain, */*",
                "content-type": "application/x-www-form-urlencoded",
            },
            body: data
        })
        .then(response => response.text())
        .then(text => sendResponse({ success: true, data: text }))
        .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }

    if (request.type === 'FETCH_TRANS') {
        fetch(request.url)
        .then(response => response.json())
        .then(data => sendResponse({ success: true, data: data }))
        .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }
});
