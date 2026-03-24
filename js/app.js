/**
 * Tradudtor - Lógica de UI
 */
(function() {
    'use strict';

    // Elementos del DOM
    var inputText = document.getElementById('inputText');
    var outputText = document.getElementById('outputText');
    var sourceLangBtn = document.getElementById('sourceLang');
    var targetLangBtn = document.getElementById('targetLang');
    var swapBtn = document.getElementById('swapBtn');
    var clearBtn = document.getElementById('clearBtn');
    var copyBtn = document.getElementById('copyBtn');
    var micBtn = document.getElementById('micBtn');
    var speakInputBtn = document.getElementById('speakInputBtn');
    var speakOutputBtn = document.getElementById('speakOutputBtn');
    var loader = document.getElementById('loader');
    var charCount = document.getElementById('charCount');
    var detectedLangEl = document.getElementById('detectedLang');
    var detectedLangName = document.getElementById('detectedLangName');

    // Estado
    var sourceLang = 'pt';
    var targetLang = 'es';
    var debounceTimer = null;
    var lastInput = '';
    var isSwapped = false;
    var recognition = null;
    var isRecording = false;

    var LANG_NAMES = { pt: 'Portugués', es: 'Español' };
    var PLACEHOLDERS = {
        pt: 'Escreva ou cole o texto...',
        es: 'Escribe o pega el texto...'
    };
    var LANG_CODES_SPEECH = { pt: 'pt-BR', es: 'es-ES' };

    // --- Funciones de UI ---

    function updateLangUI() {
        sourceLangBtn.textContent = LANG_NAMES[sourceLang];
        targetLangBtn.textContent = LANG_NAMES[targetLang];
        inputText.placeholder = PLACEHOLDERS[sourceLang];
    }

    function showLoader(show) {
        loader.hidden = !show;
    }

    function showOutputBtns(show) {
        copyBtn.hidden = !show;
        speakOutputBtn.hidden = !show;
    }

    function setOutput(text) {
        if (!text) {
            outputText.innerHTML = '<span class="translator__placeholder">La traducción aparecerá aquí...</span>';
            showOutputBtns(false);
        } else {
            outputText.textContent = text;
            showOutputBtns(true);
        }
    }

    function autoResize() {
        inputText.style.height = 'auto';
        inputText.style.height = Math.max(140, inputText.scrollHeight) + 'px';
    }

    function updateCharCount() {
        charCount.textContent = inputText.value.length;
    }

    // --- Traducción ---

    function doTranslate() {
        var text = inputText.value.trim();
        if (!text) {
            setOutput('');
            detectedLangEl.hidden = true;
            return;
        }

        if (text === lastInput) return;
        lastInput = text;

        showLoader(true);

        Translator.translate(text, sourceLang, targetLang).then(function(result) {
            setOutput(result.translatedText);

            if (result.detectedLang) {
                var detected = result.detectedLang;
                if (LANG_NAMES[detected]) {
                    detectedLangName.textContent = LANG_NAMES[detected];
                    detectedLangEl.hidden = false;
                }
            }
        }).catch(function(err) {
            console.error('Translation error:', err);
            setOutput('Error: No se pudo traducir. Verifica tu conexión a internet.');
        }).finally(function() {
            showLoader(false);
        });
    }

    function scheduleTranslation() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(doTranslate, 400);
    }

    // --- Auto-detección ---

    function autoDetect(text) {
        var detected = Translator.detectLanguage(text);
        if (detected && detected !== sourceLang) {
            sourceLang = detected;
            targetLang = detected === 'pt' ? 'es' : 'pt';
            updateLangUI();
        }
    }

    // --- Eventos básicos ---

    inputText.addEventListener('input', function() {
        updateCharCount();
        autoResize();

        var text = inputText.value.trim();
        if (!text) {
            setOutput('');
            lastInput = '';
            detectedLangEl.hidden = true;
            return;
        }

        autoDetect(text);
        scheduleTranslation();
    });

    swapBtn.addEventListener('click', function() {
        var temp = sourceLang;
        sourceLang = targetLang;
        targetLang = temp;
        isSwapped = !isSwapped;
        swapBtn.classList.toggle('swapped', isSwapped);
        updateLangUI();

        var currentOutput = outputText.textContent;
        if (currentOutput && !outputText.querySelector('.translator__placeholder')) {
            inputText.value = currentOutput;
            lastInput = '';
            updateCharCount();
            autoResize();
            setOutput('');
            detectedLangEl.hidden = true;
            scheduleTranslation();
        }
    });

    clearBtn.addEventListener('click', function() {
        inputText.value = '';
        lastInput = '';
        setOutput('');
        updateCharCount();
        detectedLangEl.hidden = true;
        inputText.style.height = '140px';
        inputText.focus();
    });

    copyBtn.addEventListener('click', function() {
        var text = outputText.textContent;
        if (!text) return;

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function() {
                copyBtn.classList.add('copied');
                setTimeout(function() { copyBtn.classList.remove('copied'); }, 1500);
            }).catch(function(e) {
                console.error('Clipboard error:', e);
                fallbackCopy();
            });
        } else {
            fallbackCopy();
        }

        function fallbackCopy() {
            var range = document.createRange();
            range.selectNodeContents(outputText);
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
            document.execCommand('copy');
            sel.removeAllRanges();
            copyBtn.classList.add('copied');
            setTimeout(function() { copyBtn.classList.remove('copied'); }, 1500);
        }
    });

    // =============================================
    // RECONOCIMIENTO DE VOZ (Speech-to-Text)
    // =============================================

    var SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition || null;

    if (!SpeechRecognitionAPI) {
        console.warn('SpeechRecognition API no disponible');
        micBtn.style.display = 'none';
    }

    micBtn.addEventListener('click', function() {
        console.log('Mic button clicked. isRecording:', isRecording);

        if (!SpeechRecognitionAPI) {
            alert('Tu navegador no soporta reconocimiento de voz.\nPrueba con Google Chrome.');
            return;
        }

        if (isRecording) {
            console.log('Stopping recognition...');
            if (recognition) {
                try { recognition.stop(); } catch(e) { console.error(e); }
            }
            return;
        }

        console.log('Starting recognition for lang:', LANG_CODES_SPEECH[sourceLang]);

        var rec = new SpeechRecognitionAPI();
        rec.lang = LANG_CODES_SPEECH[sourceLang];
        rec.interimResults = true;
        rec.continuous = false;
        rec.maxAlternatives = 1;

        var textBefore = inputText.value;

        rec.onstart = function() {
            console.log('Recognition started');
            isRecording = true;
            recognition = rec;
            micBtn.classList.add('recording');
        };

        rec.onaudiostart = function() {
            console.log('Audio capture started');
        };

        rec.onresult = function(event) {
            console.log('Got result, results count:', event.results.length);
            var interim = '';
            var final = '';
            for (var i = 0; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    final += event.results[i][0].transcript;
                } else {
                    interim += event.results[i][0].transcript;
                }
            }
            console.log('Final:', final, 'Interim:', interim);
            inputText.value = textBefore + final + interim;
            updateCharCount();
            autoResize();
        };

        rec.onerror = function(event) {
            console.error('Recognition error:', event.error, event.message);
            isRecording = false;
            recognition = null;
            micBtn.classList.remove('recording');

            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                alert('Permiso de micrófono denegado.\nHabilítalo en la configuración del navegador.');
            } else if (event.error === 'no-speech') {
                // No se detectó voz, no mostrar error
            } else if (event.error !== 'aborted') {
                alert('Error de micrófono: ' + event.error);
            }
        };

        rec.onend = function() {
            console.log('Recognition ended');
            isRecording = false;
            recognition = null;
            micBtn.classList.remove('recording');

            var text = inputText.value.trim();
            if (text) {
                autoDetect(text);
                lastInput = '';
                scheduleTranslation();
            }
        };

        try {
            rec.start();
            console.log('rec.start() called successfully');
        } catch(e) {
            console.error('Failed to start recognition:', e);
            alert('No se pudo iniciar el micrófono:\n' + e.message);
            isRecording = false;
            recognition = null;
            micBtn.classList.remove('recording');
        }
    });

    // =============================================
    // SÍNTESIS DE VOZ (Text-to-Speech)
    // =============================================

    var synth = window.speechSynthesis || null;
    var voices = [];

    function loadVoices() {
        if (!synth) return;
        voices = synth.getVoices();
        console.log('Voices loaded:', voices.length);
    }

    if (synth) {
        loadVoices();
        // Chrome carga las voces de forma asíncrona
        if (synth.onvoiceschanged !== undefined) {
            synth.onvoiceschanged = loadVoices;
        }
        // Intentar de nuevo después de un delay
        setTimeout(loadVoices, 500);
        setTimeout(loadVoices, 2000);
    } else {
        console.warn('speechSynthesis no disponible');
        speakInputBtn.style.display = 'none';
        speakOutputBtn.style.display = 'none';
    }

    function findVoice(lang) {
        if (voices.length === 0) loadVoices();
        var langCode = LANG_CODES_SPEECH[lang] || lang;
        var prefix = lang === 'pt' ? 'pt' : 'es';

        // Buscar voz exacta primero
        var v = null;
        for (var i = 0; i < voices.length; i++) {
            if (voices[i].lang === langCode) { v = voices[i]; break; }
        }
        if (v) return v;

        // Buscar por prefijo
        for (var j = 0; j < voices.length; j++) {
            if (voices[j].lang.indexOf(prefix) === 0) { v = voices[j]; break; }
        }
        return v;
    }

    function speak(text, lang, btn) {
        console.log('speak() called. text length:', text.length, 'lang:', lang);
        console.log('synth available:', !!synth);

        if (!synth) {
            alert('Tu navegador no soporta síntesis de voz.');
            return;
        }

        if (!text || text.trim().length === 0) {
            console.log('No text to speak');
            return;
        }

        // IMPORTANTE: Cancelar cualquier reproducción previa
        synth.cancel();

        var utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = LANG_CODES_SPEECH[lang] || lang;
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;

        var voice = findVoice(lang);
        if (voice) {
            utterance.voice = voice;
            console.log('Using voice:', voice.name, voice.lang);
        } else {
            console.log('No specific voice found, using default for lang:', utterance.lang);
        }

        btn.classList.add('speaking');

        utterance.onstart = function() {
            console.log('TTS started speaking');
        };

        utterance.onend = function() {
            console.log('TTS finished speaking');
            btn.classList.remove('speaking');
            clearInterval(keepAlive);
        };

        utterance.onerror = function(e) {
            console.error('TTS error:', e.error);
            btn.classList.remove('speaking');
            clearInterval(keepAlive);
        };

        // Workaround para Chrome: pausa después de ~15s
        var keepAlive = setInterval(function() {
            if (synth.speaking) {
                synth.pause();
                synth.resume();
            } else {
                clearInterval(keepAlive);
            }
        }, 10000);

        synth.speak(utterance);
        console.log('synth.speak() called. speaking:', synth.speaking, 'pending:', synth.pending);
    }

    speakInputBtn.addEventListener('click', function() {
        console.log('Speak input clicked');
        var text = inputText.value.trim();
        if (!text) {
            alert('Escribe algo primero para poder escucharlo.');
            return;
        }
        speak(text, sourceLang, speakInputBtn);
    });

    speakOutputBtn.addEventListener('click', function() {
        console.log('Speak output clicked');
        var text = outputText.textContent;
        var placeholder = outputText.querySelector('.translator__placeholder');
        if (!text || placeholder) {
            return;
        }
        speak(text, targetLang, speakOutputBtn);
    });

    // --- Inicialización ---
    updateLangUI();
    updateCharCount();
    console.log('App initialized. SpeechRecognition:', !!SpeechRecognitionAPI, 'SpeechSynthesis:', !!synth);
})();
