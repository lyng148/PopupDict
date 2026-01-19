(function() {
    'use strict';

    const popup = document.createElement('div');
    popup.id = 'tm-dict-popup';
    popup.innerHTML = `
        <div class="tm-dict-header">
            <div class="tm-dict-speak" title="Phát âm">🔊</div>
            <ul class="tm-dict-tabs">
                <li class="tm-dict-tab active" data-type="word">Từ vựng</li>
                <li class="tm-dict-tab" data-type="kanji">Hán tự</li>
                <li class="tm-dict-tab" data-type="trans">Dịch câu</li>
            </ul>
            <div class="tm-dict-close" title="Đóng">✕</div>
        </div>
        <div class="tm-dict-body"></div>
    `;
    document.body.appendChild(popup);

    const popupBody = popup.querySelector('.tm-dict-body');
    const speakBtn = popup.querySelector('.tm-dict-speak');
    const tabs = popup.querySelectorAll('.tm-dict-tab');
    let currentText = '';

    const closePopup = () => { popup.style.display = 'none'; };
    popup.querySelector('.tm-dict-close').onclick = closePopup;
    popup.onmouseup = (e) => e.stopPropagation();

    tabs.forEach(tab => {
        tab.onclick = () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            if (currentText) {
                const type = tab.dataset.type;
                if (type === 'trans') {
                    translateAPI(currentText);
                } else {
                    searchDictionaryAPI(currentText, type);
                }
            }
        };
    });

    speakBtn.onclick = () => {
        if (!currentText) return;
        const u = new SpeechSynthesisUtterance(currentText);
        u.lang = 'ja-JP';
        window.speechSynthesis.speak(u);
    };

    function searchDictionaryAPI(text, type) {
        popupBody.innerHTML = '<div class="tm-loading">ĐANG TẢI TỪ ĐIỂN...</div>';
        const url = type === 'word' ? 'https://jpdictionary.com/f/w' : 'https://jpdictionary.com/f/k';
        const bodyData = "t=" + encodeURIComponent(text);

        chrome.runtime.sendMessage({
            type: 'FETCH_DICT',
            url: url,
            data: bodyData
        }, response => {
            if (response && response.success) {
                try {
                    const textData = response.data;
                    if (!textData.trim().startsWith("{")) throw new Error("Blocked");
                    renderDictUI(JSON.parse(textData), type, text);
                } catch (e) {
                    popupBody.innerHTML = `<div class="tm-loading">KHÔNG TÌM THẤY</div>`;
                }
            } else {
                popupBody.innerHTML = '<div class="tm-loading">LỖI MẠNG</div>';
            }
        });
    }

    function translateAPI(text) {
        popupBody.innerHTML = '<div class="tm-loading">ĐANG DỊCH...</div>';
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=vi&dt=t&q=${encodeURIComponent(text)}`;

        chrome.runtime.sendMessage({
            type: 'FETCH_TRANS',
            url: url
        }, response => {
            if (response && response.success) {
                try {
                    const data = response.data;
                    let translatedText = "";
                    if (data && data[0]) {
                        data[0].forEach(segment => {
                            if (segment[0]) translatedText += segment[0];
                        });
                    }
                    renderTransUI(translatedText, text);
                } catch (e) {
                    popupBody.innerHTML = `<div class="tm-loading">LỖI DỊCH THUẬT</div>`;
                }
            } else {
                popupBody.innerHTML = '<div class="tm-loading">LỖI KẾT NỐI GOOGLE</div>';
            }
        });
    }

    function renderDictUI(data, type, query) {
        let html = '';
        if (type === 'word') {
            if (!data || !data.matches || data.matches.length === 0) {
                popupBody.innerHTML = `<div class="tm-loading">KHÔNG CÓ KẾT QUẢ</div>`; return;
            }
            html += `<div class="tm-result-count">${data.matches.length} KẾT QUẢ</div>`;
            data.matches.forEach(item => {
                const doc = item.document;
                const k_ele = doc.k_ele ? doc.k_ele.map(k => k.keb).flat().join('; ') : '';
                const r_ele = doc.r_ele ? doc.r_ele.map(r => r.reb).flat().join('; ') : '';
                const mainText = k_ele || r_ele;
                const readingText = k_ele ? r_ele : '';
                let meaningHtml = '';
                if (doc.sense) {
                    doc.sense.forEach(sense => {
                        const viGloss = sense.gloss ? sense.gloss.map(g => g.vi).filter(v => v) : [];
                        if (viGloss.length > 0) meaningHtml += `<div class="tm-meaning-line"><span class="tm-meaning-pos">${sense.pos ? sense.pos[0] : '*'}</span> ${viGloss.join('; ')}</div>`;
                    });
                }
                html += `<div class="tm-result-item"><div class="tm-word-line"><span class="tm-word-kanji">${mainText}</span>${readingText ? `<span class="tm-word-reading">${readingText}</span>` : ''}</div><div class="tm-meanings">${meaningHtml || '<div class="tm-meaning-line">...</div>'}</div></div>`;
            });
        } else if (type === 'kanji') {
            if (!data || !data.data || data.data.length === 0) {
                popupBody.innerHTML = `<div class="tm-loading">KHÔNG CÓ KẾT QUẢ</div>`; return;
            }
            html += `<div class="tm-result-count">${data.data.length} KẾT QUẢ</div>`;
            data.data.forEach(k => {
                html += `<div class="tm-result-item"><div class="tm-word-line"><span class="tm-word-kanji" style="font-size: 30px;">${k.k}</span><span class="tm-word-reading" style="background: #000; color: #fff; border:none; border-radius: 4px;">${(k.ah || '').toUpperCase()}</span></div><div class="tm-meanings"><div class="tm-meaning-line"><b>NGHĨA:</b> ${k.m ? k.m.vi : ''}</div>${k.on ? `<div class="tm-meaning-line"><span class="tm-meaning-pos" style="background:#FFD028">ON</span> ${k.on.join(', ')}</div>` : ''}${k.kun ? `<div class="tm-meaning-line"><span class="tm-meaning-pos" style="background:#00E0E0">KUN</span> ${k.kun.join(', ')}</div>` : ''}</div></div>`;
            });
        }
        popupBody.innerHTML = html;
    }

    function renderTransUI(translated, original) {
        if (!translated) {
            popupBody.innerHTML = `<div class="tm-loading">KHÔNG THỂ DỊCH</div>`; return;
        }
        let html = `
            <div class="tm-trans-box">
                <div class="tm-trans-origin">${original}</div>
                <span class="tm-trans-label">TIẾNG VIỆT</span>
                <div class="tm-trans-text">${translated}</div>
            </div>
        `;
        popupBody.innerHTML = html;
    }

    const jpRegex = /[\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf]/;
    document.addEventListener('mouseup', function(e) {
        if (popup.contains(e.target)) return;
        setTimeout(() => {
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) return;
            let text = selection.toString().trim();
            if (!text || !jpRegex.test(text)) return;

            currentText = text;
            const rect = selection.getRangeAt(0).getBoundingClientRect();
            let left = rect.left + window.scrollX;
            if (left + 420 > document.body.clientWidth) left = document.body.clientWidth - 430;
            if (left < 0) left = 10;

            popup.style.top = `${rect.bottom + window.scrollY + 8}px`;
            popup.style.left = `${left}px`;
            popup.style.display = 'block';

            tabs.forEach(t => t.classList.remove('active'));
            tabs[0].classList.add('active');
            searchDictionaryAPI(text, 'word');
        }, 100);
    });

    document.addEventListener('mousedown', function(e) {
        if (popup.style.display === 'block' && !popup.contains(e.target)) popup.style.display = 'none';
    });

})();
