/**
 * Toki - Lógica de UI principal
 */
(function() {
    'use strict';

    // DOM elements
    var inputText = document.getElementById('inputText');
    var outputText = document.getElementById('outputText');
    var sourceLangBtn = document.getElementById('sourceLangBtn');
    var targetLangBtn = document.getElementById('targetLangBtn');
    var sourceLangName = document.getElementById('sourceLangName');
    var targetLangName = document.getElementById('targetLangName');
    var sourceFlag = document.getElementById('sourceFlag');
    var targetFlag = document.getElementById('targetFlag');
    var swapBtn = document.getElementById('swapBtn');
    var clearBtn = document.getElementById('clearBtn');
    var copyBtn = document.getElementById('copyBtn');
    var micBtn = document.getElementById('micBtn');
    var speakInputBtn = document.getElementById('speakInputBtn');
    var speakOutputBtn = document.getElementById('speakOutputBtn');
    var loader = document.getElementById('loader');
    var charCount = document.getElementById('charCount');

    // Voice overlay
    var voiceOverlay = document.getElementById('voiceOverlay');
    var interimText = document.getElementById('interimText');
    var stopRecBtn = document.getElementById('stopRecBtn');

    // Language modal
    var langModal = document.getElementById('langModal');
    var modalBackdrop = document.getElementById('modalBackdrop');
    var modalTitle = document.getElementById('modalTitle');
    var modalClose = document.getElementById('modalClose');
    var langSearch = document.getElementById('langSearch');
    var langList = document.getElementById('langList');

    // Install
    var installBanner = document.getElementById('installBanner');
    var installBtn = document.getElementById('installBtn');
    var dismissInstall = document.getElementById('dismissInstall');

    // State
    var sourceLang = localStorage.getItem('toki_source') || 'es';
    var targetLang = localStorage.getItem('toki_target') || 'en';
    var debounceTimer = null;
    var lastInput = '';
    var isSwapped = false;
    var recognition = null;
    var isRecording = false;
    var selectingFor = 'source'; // 'source' or 'target'
    var deferredPrompt = null;

    // ========================
    // UI Updates
    // ========================

    function updateLangUI() {
        var src = getLang(sourceLang);
        var tgt = getLang(targetLang);
        if (src) {
            sourceLangName.textContent = src.name;
            sourceFlag.textContent = src.flag;
        }
        if (tgt) {
            targetLangName.textContent = tgt.name;
            targetFlag.textContent = tgt.flag;
        }
        localStorage.setItem('toki_source', sourceLang);
        localStorage.setItem('toki_target', targetLang);
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
        inputText.style.height = Math.max(120, inputText.scrollHeight) + 'px';
    }

    function updateCharCount() {
        charCount.textContent = inputText.value.length;
    }

    // ========================
    // Translation
    // ========================

    function doTranslate() {
        var text = inputText.value.trim();
        if (!text) {
            setOutput('');
            return;
        }
        if (text === lastInput) return;
        lastInput = text;

        showLoader(true);

        Translator.translate(text, sourceLang, targetLang)
            .then(function(result) {
                setOutput(result.translatedText);
            })
            .catch(function() {
                setOutput('Error: No se pudo traducir. Verifica tu conexión.');
            })
            .finally(function() {
                showLoader(false);
            });
    }

    function scheduleTranslation() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(doTranslate, 400);
    }

    // ========================
    // Input events
    // ========================

    inputText.addEventListener('input', function() {
        updateCharCount();
        autoResize();
        var text = inputText.value.trim();
        if (!text) {
            setOutput('');
            lastInput = '';
            return;
        }
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
            scheduleTranslation();
        }
    });

    clearBtn.addEventListener('click', function() {
        inputText.value = '';
        lastInput = '';
        setOutput('');
        updateCharCount();
        inputText.style.height = '120px';
        inputText.focus();
    });

    copyBtn.addEventListener('click', function() {
        var text = outputText.textContent;
        if (!text) return;

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function() {
                showCopied();
            }).catch(function() {
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
            showCopied();
        }

        function showCopied() {
            copyBtn.classList.add('copied');
            setTimeout(function() { copyBtn.classList.remove('copied'); }, 1500);
        }
    });

    // ========================
    // Language picker modal
    // ========================

    function openLangModal(forTarget) {
        selectingFor = forTarget;
        modalTitle.textContent = forTarget === 'source' ? 'Idioma de origen' : 'Idioma de destino';
        langSearch.value = '';
        renderLangList('');
        langModal.hidden = false;
        document.body.style.overflow = 'hidden';
        setTimeout(function() { langSearch.focus(); }, 100);
    }

    function closeLangModal() {
        langModal.hidden = true;
        document.body.style.overflow = '';
    }

    function renderLangList(filter) {
        var html = '';
        var currentCode = selectingFor === 'source' ? sourceLang : targetLang;
        var otherCode = selectingFor === 'source' ? targetLang : sourceLang;
        var filterLower = filter.toLowerCase();

        for (var i = 0; i < LANGUAGES.length; i++) {
            var lang = LANGUAGES[i];
            // Don't show the language already selected in the other slot
            if (lang.code === otherCode) continue;

            if (filterLower && lang.name.toLowerCase().indexOf(filterLower) === -1 && lang.code.indexOf(filterLower) === -1) {
                continue;
            }

            var active = lang.code === currentCode ? ' modal__item--active' : '';
            html += '<li class="modal__item' + active + '" data-code="' + lang.code + '">'
                + '<span class="modal__item-flag">' + lang.flag + '</span>'
                + '<span class="modal__item-name">' + lang.name + '</span>'
                + (active ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>' : '')
                + '</li>';
        }
        langList.innerHTML = html;
    }

    sourceLangBtn.addEventListener('click', function() { openLangModal('source'); });
    targetLangBtn.addEventListener('click', function() { openLangModal('target'); });
    modalClose.addEventListener('click', closeLangModal);
    modalBackdrop.addEventListener('click', closeLangModal);

    langSearch.addEventListener('input', function() {
        renderLangList(langSearch.value);
    });

    langList.addEventListener('click', function(e) {
        var item = e.target.closest('.modal__item');
        if (!item) return;
        var code = item.getAttribute('data-code');
        if (!code) return;

        if (selectingFor === 'source') {
            sourceLang = code;
        } else {
            targetLang = code;
        }
        updateLangUI();
        closeLangModal();

        // Re-translate if there's text
        if (inputText.value.trim()) {
            lastInput = '';
            scheduleTranslation();
        }
    });

    // Close modal on Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && !langModal.hidden) {
            closeLangModal();
        }
    });

    // ========================
    // Speech Recognition (Voice Input)
    // Each session is independent (continuous=false).
    // On session end, we auto-restart a NEW session.
    // The final result of each session is appended once.
    // ========================

    var SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition || null;
    var voiceStatus = document.getElementById('voiceStatus');
    var voiceTimer = document.getElementById('voiceTimer');
    var finalText = document.getElementById('finalText');
    var micRing = document.getElementById('micRing');
    var recTimerInterval = null;
    var recStartTime = 0;
    var stoppedByUser = false;
    var textBeforeRec = '';        // text in input before recording started
    var confirmedText = '';        // accumulated final text across all sessions
    var currentInterim = '';       // interim text from current session only
    var sessionHadFinal = false;   // did current session produce a final result?

    if (!SpeechRecognitionAPI) {
        micBtn.style.opacity = '0.3';
        micBtn.style.pointerEvents = 'none';
    }

    micBtn.addEventListener('click', function() {
        if (!SpeechRecognitionAPI) {
            alert('Tu navegador no soporta reconocimiento de voz.\nPrueba con Google Chrome.');
            return;
        }

        if (isRecording) {
            stopRecording();
            return;
        }

        startRecording();
    });

    function startRecording() {
        stoppedByUser = false;
        confirmedText = '';
        currentInterim = '';

        textBeforeRec = inputText.value;
        if (textBeforeRec && !textBeforeRec.endsWith(' ')) {
            textBeforeRec += ' ';
        }

        // Start timer
        recStartTime = Date.now();
        updateTimer();
        recTimerInterval = setInterval(updateTimer, 1000);

        // Reset overlay
        finalText.textContent = '';
        interimText.textContent = '';

        launchSession();
    }

    function launchSession() {
        var srcLang = getLang(sourceLang);
        var speechCode = srcLang ? srcLang.speech : sourceLang;

        var rec = new SpeechRecognitionAPI();
        rec.lang = speechCode;
        rec.interimResults = true;
        rec.continuous = false;   // KEY: single-utterance mode
        rec.maxAlternatives = 1;

        sessionHadFinal = false;
        currentInterim = '';

        rec.onstart = function() {
            isRecording = true;
            recognition = rec;
            micBtn.classList.add('recording');
            voiceOverlay.hidden = false;
            voiceStatus.textContent = 'Escuchando...';
            micRing.classList.add('active');
        };

        rec.onresult = function(event) {
            // In continuous=false mode there is only one result slot (index 0).
            // It starts as interim and eventually becomes isFinal.
            var result = event.results[0];
            var transcript = result[0].transcript;

            if (result.isFinal) {
                // This session's final answer — append to confirmed text
                sessionHadFinal = true;
                confirmedText += transcript + ' ';
                currentInterim = '';

                // Update displays
                finalText.textContent = confirmedText;
                interimText.textContent = '';
                inputText.value = textBeforeRec + confirmedText;
                updateCharCount();
                autoResize();

                // Translate immediately
                lastInput = '';
                scheduleTranslation();
            } else {
                // Interim — show but don't commit
                currentInterim = transcript;
                interimText.textContent = transcript;
                inputText.value = textBeforeRec + confirmedText + transcript;
                updateCharCount();
                autoResize();
            }

            // Visual pulse
            micRing.classList.add('pulse');
            setTimeout(function() { micRing.classList.remove('pulse'); }, 300);
        };

        rec.onerror = function(event) {
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                cleanupRecording();
                alert('Permiso de micrófono denegado.\nHabilítalo en la configuración del navegador.');
            } else if (event.error === 'no-speech') {
                voiceStatus.textContent = 'No te escucho... habla más fuerte';
                // Will auto-restart via onend
            } else if (event.error === 'network') {
                cleanupRecording();
                alert('Error de red. Verifica tu conexión.');
            }
            // 'aborted' = user stopped, handled by onend
        };

        rec.onend = function() {
            // Clean up interim text that wasn't finalized
            if (!sessionHadFinal && currentInterim) {
                // Discard the interim, restore to confirmed only
                currentInterim = '';
                interimText.textContent = '';
                inputText.value = textBeforeRec + confirmedText;
                updateCharCount();
                autoResize();
            }

            // Auto-restart a new session if user didn't stop
            if (!stoppedByUser) {
                try {
                    launchSession();
                    return;
                } catch(e) { /* fall through */ }
            }

            cleanupRecording();

            var text = inputText.value.trim();
            if (text) {
                lastInput = '';
                scheduleTranslation();
            }
        };

        try {
            rec.start();
        } catch(e) {
            alert('No se pudo iniciar el micrófono:\n' + e.message);
            cleanupRecording();
        }
    }

    function stopRecording() {
        stoppedByUser = true;
        if (recognition) {
            try { recognition.stop(); } catch(e) { /* ignore */ }
        }
        cleanupRecording();
    }

    function cleanupRecording() {
        isRecording = false;
        recognition = null;
        micBtn.classList.remove('recording');
        voiceOverlay.hidden = true;
        micRing.classList.remove('active', 'pulse');
        clearInterval(recTimerInterval);
        recTimerInterval = null;
    }

    function updateTimer() {
        var elapsed = Math.floor((Date.now() - recStartTime) / 1000);
        var min = Math.floor(elapsed / 60);
        var sec = elapsed % 60;
        voiceTimer.textContent = min + ':' + (sec < 10 ? '0' : '') + sec;
    }

    stopRecBtn.addEventListener('click', stopRecording);
    voiceOverlay.addEventListener('click', function(e) {
        if (e.target === voiceOverlay) stopRecording();
    });

    // ========================
    // Speech Synthesis (Text-to-Speech)
    // ========================

    var synth = window.speechSynthesis || null;
    var voices = [];

    function loadVoices() {
        if (!synth) return;
        voices = synth.getVoices();
    }

    if (synth) {
        loadVoices();
        if (synth.onvoiceschanged !== undefined) {
            synth.onvoiceschanged = loadVoices;
        }
        setTimeout(loadVoices, 500);
        setTimeout(loadVoices, 2000);
    } else {
        speakInputBtn.style.display = 'none';
        speakOutputBtn.style.display = 'none';
    }

    function findVoice(langCode) {
        if (voices.length === 0) loadVoices();
        var lang = getLang(langCode);
        var speechCode = lang ? lang.speech : langCode;
        var prefix = langCode;

        for (var i = 0; i < voices.length; i++) {
            if (voices[i].lang === speechCode) return voices[i];
        }
        for (var j = 0; j < voices.length; j++) {
            if (voices[j].lang.indexOf(prefix) === 0) return voices[j];
        }
        return null;
    }

    function speak(text, langCode, btn) {
        if (!synth || !text || !text.trim()) return;

        synth.cancel();

        var lang = getLang(langCode);
        var speechCode = lang ? lang.speech : langCode;

        var utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = speechCode;
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;

        var voice = findVoice(langCode);
        if (voice) utterance.voice = voice;

        btn.classList.add('speaking');

        utterance.onend = function() {
            btn.classList.remove('speaking');
            clearInterval(keepAlive);
        };

        utterance.onerror = function() {
            btn.classList.remove('speaking');
            clearInterval(keepAlive);
        };

        // Chrome workaround: pauses after ~15s
        var keepAlive = setInterval(function() {
            if (synth.speaking) {
                synth.pause();
                synth.resume();
            } else {
                clearInterval(keepAlive);
            }
        }, 10000);

        synth.speak(utterance);
    }

    speakInputBtn.addEventListener('click', function() {
        var text = inputText.value.trim();
        if (!text) return;
        speak(text, sourceLang, speakInputBtn);
    });

    speakOutputBtn.addEventListener('click', function() {
        var text = outputText.textContent;
        if (!text || outputText.querySelector('.translator__placeholder')) return;
        speak(text, targetLang, speakOutputBtn);
    });

    // ========================
    // PWA Install prompt
    // ========================

    window.addEventListener('beforeinstallprompt', function(e) {
        e.preventDefault();
        deferredPrompt = e;
        // Show install banner if not dismissed before
        if (!localStorage.getItem('toki_dismissed_install')) {
            installBanner.hidden = false;
        }
    });

    installBtn.addEventListener('click', function() {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(function() {
            deferredPrompt = null;
            installBanner.hidden = true;
        });
    });

    dismissInstall.addEventListener('click', function() {
        installBanner.hidden = true;
        localStorage.setItem('toki_dismissed_install', '1');
    });

    // ========================
    // iOS install instructions
    // ========================

    function isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
            (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    }

    function isInStandaloneMode() {
        return window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true;
    }

    // Show iOS install hint after a few seconds
    if (isIOS() && !isInStandaloneMode() && !localStorage.getItem('toki_ios_hint')) {
        setTimeout(function() {
            var hint = document.createElement('div');
            hint.className = 'ios-hint';
            hint.innerHTML = 'Para instalar: toca <strong>Compartir</strong> <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg> y luego <strong>"Agregar a pantalla de inicio"</strong>';
            hint.addEventListener('click', function() {
                hint.remove();
                localStorage.setItem('toki_ios_hint', '1');
            });
            document.body.appendChild(hint);
            setTimeout(function() { hint.remove(); }, 8000);
        }, 3000);
    }

    // ========================
    // Init
    // ========================

    updateLangUI();
    updateCharCount();
})();
