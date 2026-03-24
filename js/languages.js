/**
 * Tradudtor - Language definitions
 */
var LANGUAGES = [
    { code: 'es', name: 'Español', flag: '🇪🇸', speech: 'es-ES' },
    { code: 'en', name: 'Inglés', flag: '🇺🇸', speech: 'en-US' },
    { code: 'pt', name: 'Portugués', flag: '🇧🇷', speech: 'pt-BR' },
    { code: 'fr', name: 'Francés', flag: '🇫🇷', speech: 'fr-FR' },
    { code: 'de', name: 'Alemán', flag: '🇩🇪', speech: 'de-DE' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹', speech: 'it-IT' },
    { code: 'zh', name: 'Chino', flag: '🇨🇳', speech: 'zh-CN' },
    { code: 'ja', name: 'Japonés', flag: '🇯🇵', speech: 'ja-JP' },
    { code: 'ko', name: 'Coreano', flag: '🇰🇷', speech: 'ko-KR' },
    { code: 'ar', name: 'Árabe', flag: '🇸🇦', speech: 'ar-SA' },
    { code: 'ru', name: 'Ruso', flag: '🇷🇺', speech: 'ru-RU' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳', speech: 'hi-IN' },
    { code: 'nl', name: 'Holandés', flag: '🇳🇱', speech: 'nl-NL' },
    { code: 'pl', name: 'Polaco', flag: '🇵🇱', speech: 'pl-PL' },
    { code: 'tr', name: 'Turco', flag: '🇹🇷', speech: 'tr-TR' },
    { code: 'sv', name: 'Sueco', flag: '🇸🇪', speech: 'sv-SE' },
    { code: 'da', name: 'Danés', flag: '🇩🇰', speech: 'da-DK' },
    { code: 'no', name: 'Noruego', flag: '🇳🇴', speech: 'no-NO' },
    { code: 'fi', name: 'Finlandés', flag: '🇫🇮', speech: 'fi-FI' },
    { code: 'el', name: 'Griego', flag: '🇬🇷', speech: 'el-GR' },
    { code: 'cs', name: 'Checo', flag: '🇨🇿', speech: 'cs-CZ' },
    { code: 'ro', name: 'Rumano', flag: '🇷🇴', speech: 'ro-RO' },
    { code: 'hu', name: 'Húngaro', flag: '🇭🇺', speech: 'hu-HU' },
    { code: 'uk', name: 'Ucraniano', flag: '🇺🇦', speech: 'uk-UA' },
    { code: 'th', name: 'Tailandés', flag: '🇹🇭', speech: 'th-TH' },
    { code: 'vi', name: 'Vietnamita', flag: '🇻🇳', speech: 'vi-VN' },
    { code: 'id', name: 'Indonesio', flag: '🇮🇩', speech: 'id-ID' },
    { code: 'ms', name: 'Malayo', flag: '🇲🇾', speech: 'ms-MY' },
    { code: 'he', name: 'Hebreo', flag: '🇮🇱', speech: 'he-IL' },
    { code: 'bg', name: 'Búlgaro', flag: '🇧🇬', speech: 'bg-BG' },
    { code: 'ca', name: 'Catalán', flag: '🏳️', speech: 'ca-ES' },
    { code: 'hr', name: 'Croata', flag: '🇭🇷', speech: 'hr-HR' },
    { code: 'sk', name: 'Eslovaco', flag: '🇸🇰', speech: 'sk-SK' },
    { code: 'sl', name: 'Esloveno', flag: '🇸🇮', speech: 'sl-SI' },
    { code: 'et', name: 'Estonio', flag: '🇪🇪', speech: 'et-EE' },
    { code: 'lv', name: 'Letón', flag: '🇱🇻', speech: 'lv-LV' },
    { code: 'lt', name: 'Lituano', flag: '🇱🇹', speech: 'lt-LT' },
    { code: 'sr', name: 'Serbio', flag: '🇷🇸', speech: 'sr-RS' },
    { code: 'sw', name: 'Suajili', flag: '🇰🇪', speech: 'sw-KE' },
    { code: 'tl', name: 'Filipino', flag: '🇵🇭', speech: 'tl-PH' }
];

function getLang(code) {
    for (var i = 0; i < LANGUAGES.length; i++) {
        if (LANGUAGES[i].code === code) return LANGUAGES[i];
    }
    return null;
}
