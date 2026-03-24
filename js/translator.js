/**
 * Tradudtor - Motor de traducción multilenguaje
 */
var Translator = (function() {
    /**
     * Traduce texto usando Google Translate con fallback a MyMemory
     * @param {string} text
     * @param {string} sourceLang - código ISO (es, en, pt, etc.)
     * @param {string} targetLang - código ISO
     * @returns {Promise<{translatedText: string}>}
     */
    function translate(text, sourceLang, targetLang) {
        if (!text || !text.trim()) {
            return Promise.resolve({ translatedText: '' });
        }

        if (text.length > 1500) {
            return translateLongText(text, sourceLang, targetLang);
        }

        var encoded = encodeURIComponent(text);

        return translateGoogle(encoded, sourceLang, targetLang)
            .then(function(result) {
                if (result) return result;
                return translateMyMemory(encoded, sourceLang, targetLang);
            })
            .then(function(result) {
                if (result) return result;
                throw new Error('No se pudo traducir');
            });
    }

    function translateGoogle(encoded, sl, tl) {
        var url = 'https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&sl=' + sl + '&tl=' + tl + '&q=' + encoded;
        return fetch(url)
            .then(function(res) {
                if (!res.ok) return null;
                return res.json();
            })
            .then(function(data) {
                if (!data || !data[0]) return null;
                var translatedText = '';
                for (var i = 0; i < data[0].length; i++) {
                    if (data[0][i][0]) translatedText += data[0][i][0];
                }
                return { translatedText: translatedText };
            })
            .catch(function() { return null; });
    }

    function translateMyMemory(encoded, sl, tl) {
        var url = 'https://api.mymemory.translated.net/get?q=' + encoded + '&langpair=' + sl + '|' + tl;
        return fetch(url)
            .then(function(res) {
                if (!res.ok) return null;
                return res.json();
            })
            .then(function(data) {
                if (!data || data.responseStatus !== 200) return null;
                return { translatedText: data.responseData.translatedText };
            })
            .catch(function() { return null; });
    }

    function translateLongText(text, sourceLang, targetLang) {
        var sentences = text.match(/[^.!?\n]+[.!?\n]*/g) || [text];
        var chunks = [];
        var current = '';

        for (var i = 0; i < sentences.length; i++) {
            if ((current + sentences[i]).length > 1500) {
                if (current) chunks.push(current);
                current = sentences[i];
            } else {
                current += sentences[i];
            }
        }
        if (current) chunks.push(current);

        var fullTranslation = '';
        var promise = Promise.resolve();

        for (var j = 0; j < chunks.length; j++) {
            (function(chunk) {
                promise = promise.then(function() {
                    return translate(chunk, sourceLang, targetLang);
                }).then(function(result) {
                    fullTranslation += result.translatedText;
                });
            })(chunks[j]);
        }

        return promise.then(function() {
            return { translatedText: fullTranslation };
        });
    }

    return { translate: translate };
})();
