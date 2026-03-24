/**
 * Tradudtor - Motor de traducción con detección de idioma
 */

const Translator = (() => {
    // Patrones para detección heurística de idioma
    const PT_PATTERNS = [
        /ão\b/i, /ões\b/i, /ção\b/i, /ções\b/i,
        /\blh[aeo]/i, /\bnh[aeo]/i,
        /\bvocê/i, /\bnão\b/i, /\btambém\b/i, /\bmuito\b/i,
        /\bobrigad[oa]\b/i, /\btudo\b/i, /\bainda\b/i,
        /\bfazer\b/i, /\bporque\b/i, /\bprecis[oa]\b/i,
        /\bbom\b/i, /\bdia\b/i, /\bnoite\b/i,
        /\bcom\b/i, /\bmais\b/i, /\bou\b/i,
        /\best[áàâã]/i, /\bé\b/i,
        /\bsim\b/i, /\baqui\b/i, /\bonde\b/i,
        /\btrabalh/i, /\bpesso[as]/i
    ];

    const ES_PATTERNS = [
        /ñ/i, /\bll[aeo]/i,
        /\busted\b/i, /\btambién\b/i, /\bpero\b/i,
        /\bhacer\b/i, /\bhay\b/i, /\bmucho\b/i,
        /\bgracias\b/i, /\btodavía\b/i,
        /\bbueno\b/i, /\bsiempre\b/i,
        /ción\b/i, /ciones\b/i,
        /\bestá[ns]?\b/i, /\bhola\b/i,
        /\bdónde\b/i, /\bcuándo\b/i,
        /\bqué\b/i, /\bcómo\b/i,
        /\bnosotros\b/i, /\bellos\b/i,
        /\btrabaj/i, /\bperson[as]/i
    ];

    /**
     * Detecta si el texto es portugués o español usando heurística local
     * @param {string} text
     * @returns {'pt'|'es'|null}
     */
    function detectLanguage(text) {
        if (!text || text.trim().length < 3) return null;

        let ptScore = 0;
        let esScore = 0;

        for (const pattern of PT_PATTERNS) {
            if (pattern.test(text)) ptScore++;
        }
        for (const pattern of ES_PATTERNS) {
            if (pattern.test(text)) esScore++;
        }

        if (ptScore === 0 && esScore === 0) return null;
        if (ptScore === esScore) return null;
        return ptScore > esScore ? 'pt' : 'es';
    }

    /**
     * Traduce texto usando endpoints gratuitos de Google Translate con fallback
     * @param {string} text
     * @param {string} sourceLang - 'pt', 'es', o 'auto'
     * @param {string} targetLang - 'pt' o 'es'
     * @returns {Promise<{translatedText: string, detectedLang: string|null}>}
     */
    async function translate(text, sourceLang, targetLang) {
        if (!text || !text.trim()) {
            return { translatedText: '', detectedLang: null };
        }

        // Si el texto es muy largo, dividir en chunks
        if (text.length > 1500) {
            return translateLongText(text, sourceLang, targetLang);
        }

        const encoded = encodeURIComponent(text);

        // Intento 1: translate.googleapis.com
        try {
            const result = await translateGoogleGtx(encoded, sourceLang, targetLang);
            if (result) return result;
        } catch (e) { /* fallback */ }

        // Intento 2: MyMemory API
        try {
            const result = await translateMyMemory(encoded, sourceLang, targetLang);
            if (result) return result;
        } catch (e) { /* fallback */ }

        throw new Error('No se pudo conectar con el servicio de traducción');
    }

    async function translateGoogleGtx(encoded, sl, tl) {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&sl=${sl}&tl=${tl}&q=${encoded}`;
        const res = await fetch(url);
        if (!res.ok) return null;

        const data = await res.json();
        let translatedText = '';
        if (data[0]) {
            for (const segment of data[0]) {
                if (segment[0]) translatedText += segment[0];
            }
        }
        const detectedLang = data[2] || null;
        return { translatedText, detectedLang };
    }

    async function translateMyMemory(encoded, sl, tl) {
        const actualSl = sl === 'auto' ? 'pt' : sl;
        const url = `https://api.mymemory.translated.net/get?q=${encoded}&langpair=${actualSl}|${tl}`;
        const res = await fetch(url);
        if (!res.ok) return null;

        const data = await res.json();
        if (data.responseStatus !== 200) return null;

        return {
            translatedText: data.responseData.translatedText,
            detectedLang: null
        };
    }

    async function translateLongText(text, sourceLang, targetLang) {
        // Dividir por oraciones
        const sentences = text.match(/[^.!?\n]+[.!?\n]*/g) || [text];
        const chunks = [];
        let current = '';

        for (const sentence of sentences) {
            if ((current + sentence).length > 1500) {
                if (current) chunks.push(current);
                current = sentence;
            } else {
                current += sentence;
            }
        }
        if (current) chunks.push(current);

        let fullTranslation = '';
        let detectedLang = null;

        for (const chunk of chunks) {
            const result = await translate(chunk, sourceLang, targetLang);
            fullTranslation += result.translatedText;
            if (!detectedLang && result.detectedLang) {
                detectedLang = result.detectedLang;
            }
        }

        return { translatedText: fullTranslation, detectedLang };
    }

    return { translate, detectLanguage };
})();
