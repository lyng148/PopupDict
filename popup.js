document.addEventListener('DOMContentLoaded', () => {
    const langSelect = document.getElementById('lang');

    chrome.storage.local.get(['targetLang'], (result) => {
        if (result.targetLang) {
            langSelect.value = result.targetLang;
        }
    });

    langSelect.addEventListener('change', () => {
        const selectedLang = langSelect.value;
        chrome.storage.local.set({ targetLang: selectedLang }, () => {
            console.log('Language saved:', selectedLang);
        });
    });
});
