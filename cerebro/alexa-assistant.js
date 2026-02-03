// Alexa Assistant - Usa tu sistema de animación de boca y quita emojis
class AlexaAssistant {
    constructor() {
        this.isActive = false;
        this.isListeningForWakeWord = false;
        this.isSpeaking = false;
        this.recognition = null;
        this.wakeWord = "alexa";
        
        this.toggleAlexa = this.toggleAlexa.bind(this);
        this.setupRecognition = this.setupRecognition.bind(this);
        
        setTimeout(() => this.initialize(), 100);
    }
    
    initialize() {
        console.log('Inicializando Alexa Assistant...');
        this.setupRecognition();
        this.setupButton();
    }
    
    setupRecognition() {
        if ('webkitSpeechRecognition' in window) {
            this.recognition = new webkitSpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'es-ES';
            this.recognition.maxAlternatives = 1;
            
            this.recognition.onstart = () => {
                console.log('🎤 Escuchando...');
                this.showStatusIndicator('Escuchando...', true);
                this.playBeep(600, 0.1); // 🔊 Sonido de escucha
            };
            
            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript.toLowerCase().trim();
                console.log('Escuché:', transcript);
                
                if (this.isListeningForWakeWord) {
                    if (transcript.startsWith(this.wakeWord + ' ') || 
                        transcript === this.wakeWord ||
                        transcript.startsWith(this.wakeWord + ',') ||
                        transcript.startsWith(this.wakeWord + '.')) {
                        
                        console.log('✅ Alexa detectada');
                        this.playBeep(800, 0.2); // 🔊 Sonido de wake word
                        this.processAlexaCommand(transcript);
                    }
                }
            };
            
            this.recognition.onerror = (event) => {
                if (event.error === 'no-speech') {
                    setTimeout(() => {
                        if (this.isActive && this.isListeningForWakeWord) {
                            this.startListening();
                        }
                    }, 1000);
                }
            };
            
            this.recognition.onend = () => {
                if (this.isActive && this.isListeningForWakeWord) {
                    setTimeout(() => this.startListening(), 500);
                }
            };
        }
    }
    
    // 🔊 SONIDOS SIMPLES
    playBeep(freq, duration) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = freq;
            oscillator.type = 'sine';
            gainNode.gain.value = 0.1;
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + duration);
        } catch (e) {}
    }
    
    setupButton() {
        const alexaBtn = document.getElementById('alexaBtn');
        if (alexaBtn) {
            alexaBtn.addEventListener('click', this.toggleAlexa);
        }
    }
    
    toggleAlexa() {
        const alexaBtn = document.getElementById('alexaBtn');
        
        if (!this.isActive) {
            // ACTIVAR
            this.isActive = true;
            this.isListeningForWakeWord = true;
            
            alexaBtn.classList.add('active');
            alexaBtn.innerHTML = '<img src="img/decor/bed.png" alt="Alexa activa" class="alexa-icon">';
            
            this.startListening();
            this.showStatusIndicator('Di "Alexa" para activarme', false);
            
        } else {
            // DESACTIVAR
            this.isActive = false;
            this.isListeningForWakeWord = false;
            
            alexaBtn.classList.remove('active');
            alexaBtn.innerHTML = '🤖';
            
            this.stopListening();
            this.hideStatusIndicator();
            this.stopSpeakingCompletely();
        }
    }
    
    processAlexaCommand(transcript) {
        console.log('Procesando comando Alexa:', transcript);
        
        let command = '';
        
        if (transcript === this.wakeWord) {
            command = '';
        } else if (transcript.startsWith(this.wakeWord + ' ')) {
            command = transcript.substring(this.wakeWord.length + 1).trim();
        } else if (transcript.startsWith(this.wakeWord + ',')) {
            command = transcript.substring(this.wakeWord.length + 1).trim();
        } else if (transcript.startsWith(this.wakeWord + '.')) {
            command = transcript.substring(this.wakeWord.length + 1).trim();
        }
        
        console.log('Comando extraído:', command);
        
        if (this.isStopCommand(command)) {
            console.log('🚫 COMANDO DE DETENER DETECTADO');
            this.playBeep(400, 0.3); // 🔊 Sonido de stop
            this.executeStopCommand();
            return;
        }
        
        if (!command) {
            this.speakResponse('¿Sí? ¿En qué puedo ayudarte?');
            return;
        }
        
        this.processQuestion(command);
    }
    
    isStopCommand(command) {
        const stopCommands = [
            'para', 'detente', 'cállate', 'callate', 'silencio', 'basta',
            'alto', 'cancela', 'cancelar', 'para ya', 'detén', 'quieto',
            'deja de hablar', 'calla', 'cierra el pico', 'basta ya',
            'para ahora', 'detente ahora', 'cállate ya', 'no hables',
            'calla ya', 'silencio por favor', 'deja de hablar ya'
        ];
        
        for (const stopWord of stopCommands) {
            if (command === stopWord || 
                command.startsWith(stopWord + ' ') ||
                command === stopWord + '.' ||
                command === stopWord + ',' ||
                command === stopWord + '!') {
                console.log('Palabra de detener encontrada:', stopWord);
                return true;
            }
        }
        
        return false;
    }
    
    executeStopCommand() {
        console.log('🚫 EJECUTANDO COMANDO DE DETENER');
        
        this.stopSpeakingCompletely();
        this.showVisualConfirmation('🛑 Detenido');
        
        setTimeout(() => {
            this.showStatusIndicator('Di "Alexa" para activarme', false);
        }, 1500);
        
        return;
    }
    
    stopSpeakingCompletely() {
        console.log('🔇 Callando completamente...');
        
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        
        // 🔇 Detener animación de boca usando tu sistema
        this.stopMouthAnimation();
        
        this.isSpeaking = false;
    }
    
    stopMouthAnimation() {
        const mouth = document.getElementById('mouth');
        if (mouth) {
            mouth.classList.remove('surprised');
            mouth.classList.add('happy');
        }
    }
    
    showVisualConfirmation(message) {
        this.showStatusIndicator(message, false, true);
    }
    
    processQuestion(question) {
        console.log('Alexa procesando pregunta:', question);
        
        // 🔍 USAR TU SISTEMA DE BÚSQUEDA COMPLETO
        this.searchForAlexa(question);
    }
    
    async searchForAlexa(query) {
        console.log('Alexa usando TU sistema searchWeb para:', query);
        
        // 🔍 PRIMERO: Usar getPredefinedResponse
        if (typeof getPredefinedResponse === 'function') {
            const predefinedResponse = getPredefinedResponse(query);
            
            if (predefinedResponse) {
                let responseText = '';
                
                if (typeof predefinedResponse === 'object' && predefinedResponse.action) {
                    responseText = predefinedResponse.text;
                    // Ejecutar acción después de hablar
                    this.speakResponse(responseText);
                    setTimeout(() => {
                        if (predefinedResponse.action) {
                            predefinedResponse.action();
                        }
                    }, 1000);
                } else {
                    responseText = predefinedResponse;
                    this.speakResponse(responseText);
                }
                return;
            }
        }
        
        // 🔍 SEGUNDO: Usar searchWeb
        if (typeof searchWeb === 'function') {
            // Crear un contenedor temporal para capturar la respuesta
            await this.captureSearchWebResponse(query);
        } else {
            // Fallback
            this.speakResponse('No pude encontrar información sobre eso.');
        }
    }
    
    async captureSearchWebResponse(query) {
        return new Promise((resolve) => {
            // Guardar funciones originales
            const originalAddMessage = window.addMessage;
            const originalShowTypingIndicator = window.showTypingIndicator;
            
            // 🔄 INTERCEPTAR LAS FUNCIONES DE TU CHAT
            let capturedResponse = '';
            let responseCaptured = false;
            
            // Interceptar addMessage para capturar respuestas
            window.addMessage = (text, sender) => {
                if (sender === 'bot' && !responseCaptured) {
                    // 🔤 QUITAR EMOJIS del texto
                    const cleanText = this.removeEmojis(text);
                    
                    if (!cleanText.includes('Buscando') && 
                        !cleanText.includes('Cargando') &&
                        !cleanText.includes('Hola! Soy CyberPet') &&
                        cleanText.trim().length > 10) {
                        
                        capturedResponse = cleanText;
                        responseCaptured = true;
                        
                        // Hablar la respuesta capturada (sin emojis)
                        this.speakResponse(capturedResponse);
                        
                        // Restaurar funciones originales
                        window.addMessage = originalAddMessage;
                        window.showTypingIndicator = originalShowTypingIndicator;
                        
                        resolve();
                        return;
                    }
                }
                
                // Si no es bot o es mensaje de búsqueda, usar función original
                if (originalAddMessage) {
                    originalAddMessage(text, sender);
                }
            };
            
            // Interceptar showTypingIndicator
            window.showTypingIndicator = () => {
                if (originalShowTypingIndicator) {
                    originalShowTypingIndicator();
                }
            };
            
            // Llamar a TU función searchWeb
            try {
                searchWeb(query);
                
                // Timeout de seguridad
                setTimeout(() => {
                    if (!responseCaptured) {
                        this.speakResponse('No encontré información sobre eso.');
                    }
                    
                    // Restaurar funciones
                    window.addMessage = originalAddMessage;
                    window.showTypingIndicator = originalShowTypingIndicator;
                    resolve();
                }, 10000);
                
            } catch (error) {
                console.error('Error en searchWeb:', error);
                this.speakResponse('Hubo un error al buscar la información.');
                
                // Restaurar funciones
                window.addMessage = originalAddMessage;
                window.showTypingIndicator = originalShowTypingIndicator;
                resolve();
            }
        });
    }
    
    // 🔤 FUNCIÓN PARA QUITAR EMOJIS (igual que tu función removeEmojis)
    removeEmojis(str) {
        return str.replace(/[\p{Extended_Pictographic}]/gu, '');
    }
    
    speakResponse(text) {
        console.log('Alexa va a hablar:', text);
        this.isSpeaking = true;
        
        // 🔤 QUITAR EMOJIS antes de hablar
        const cleanText = this.removeEmojis(text);
        
        // 🎤 USAR TU FUNCIÓN speak (la misma que llama playBtn)
        if (typeof speak === 'function') {
            // Llamar a TU función speak que ya maneja las animaciones de boca
            speak(cleanText);
            
            // Configurar para volver a escuchar cuando termine de hablar
            this.setupSpeechEndDetection();
            
        } else if (window.speechSynthesis) {
            // Si speak no existe, usar speakDirectly con animaciones
            this.speakDirectly(cleanText);
        }
    }
    
    setupSpeechEndDetection() {
        // Detectar cuando termine de hablar para volver a escuchar
        const checkSpeechEnd = setInterval(() => {
            if (!window.speechSynthesis.speaking && !this.isSpeaking) {
                clearInterval(checkSpeechEnd);
                
                this.isSpeaking = false;
                if (this.isActive) {
                    this.showStatusIndicator('Di "Alexa" para activarme', false);
                    this.startListening();
                }
            }
        }, 500);
    }
    
    speakDirectly(text) {
        if (!window.speechSynthesis) return;
        
        // 🔉 BAJAR volumen de otros medios
        this.lowerMediaVolume();
        
        // Crear utterance
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        utterance.rate = 0.85;
        utterance.pitch = 0.9;
        
        // 🎤 VARIABLE para controlar la animación de boca
        let talkInterval = null;
        const mouth = document.getElementById('mouth');
        
        utterance.onstart = () => {
            this.isSpeaking = true;
            
            // 🎤 INICIAR ANIMACIÓN DE BOCA (igual que tu código)
            if (mouth) {
                talkInterval = setInterval(() => {
                    mouth.classList.toggle('surprised');
                }, 200);
            }
        };
        
        utterance.onend = () => {
            this.isSpeaking = false;
            
            // 🎤 DETENER ANIMACIÓN DE BOCA
            if (talkInterval) {
                clearInterval(talkInterval);
                talkInterval = null;
            }
            
            if (mouth) {
                mouth.classList.remove('surprised');
                mouth.classList.add('happy');
            }
            
            // 🔉 RESTAURAR volumen
            this.restoreMediaVolume();
            
            if (this.isActive) {
                this.showStatusIndicator('Di "Alexa" para activarme', false);
                this.startListening();
            }
        };
        
        utterance.onerror = (event) => {
            console.error('Error al hablar:', event);
            this.isSpeaking = false;
            
            // 🎤 DETENER ANIMACIÓN DE BOCA en caso de error
            if (talkInterval) {
                clearInterval(talkInterval);
            }
            
            if (mouth) {
                mouth.classList.remove('surprised');
                mouth.classList.add('happy');
            }
            
            this.restoreMediaVolume();
            
            if (this.isActive) {
                this.showStatusIndicator('Di "Alexa" para activarme', false);
                this.startListening();
            }
        };
        
        window.speechSynthesis.speak(utterance);
    }
    
    // 🔉 Control de volumen simple
    lowerMediaVolume() {
        try {
            const audios = document.querySelectorAll('audio');
            audios.forEach(audio => {
                if (!audio.dataset.originalVol) {
                    audio.dataset.originalVol = audio.volume;
                }
                audio.volume = Math.max(0.1, audio.volume * 0.3);
            });
        } catch (e) {}
    }
    
    restoreMediaVolume() {
        try {
            const audios = document.querySelectorAll('audio');
            audios.forEach(audio => {
                if (audio.dataset.originalVol) {
                    audio.volume = parseFloat(audio.dataset.originalVol);
                    delete audio.dataset.originalVol;
                }
            });
        } catch (e) {}
    }
    
    startListening() {
        if (this.recognition && this.isActive && !this.isSpeaking) {
            try {
                this.recognition.start();
            } catch (error) {
                setTimeout(() => this.startListening(), 1000);
            }
        }
    }
    
    stopListening() {
        if (this.recognition) {
            try {
                this.recognition.stop();
            } catch (error) {
                // Ignorar error
            }
        }
    }
    
    showStatusIndicator(text, isListening = false, isStop = false) {
        let container = document.getElementById('alexaStatusContainer');
        if (!container) {
            const statsPanel = document.getElementById('statsPanel');
            if (!statsPanel) return;
            
            container = document.createElement('div');
            container.id = 'alexaStatusContainer';
            
            const clock = statsPanel.querySelector('.cyber-clock-kids');
            if (clock) {
                clock.insertAdjacentElement('afterend', container);
            } else {
                statsPanel.insertBefore(container, statsPanel.firstChild);
            }
        }
        
        container.style.display = 'block';
        
        let indicator = document.getElementById('alexaStatus');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'alexaStatus';
            indicator.className = 'alexa-status';
            container.appendChild(indicator);
        }
        
        if (isStop) {
            indicator.innerHTML = `<div class="alexa-pulse stop"></div><span style="color: #ff4444">${text}</span>`;
        } else if (isListening) {
            indicator.innerHTML = `<div class="alexa-pulse listen"></div><span>${text}</span>`;
        } else {
            indicator.innerHTML = `<div class="alexa-pulse wake"></div><span>${text}</span>`;
        }
        
        indicator.style.display = 'flex';
    }
    
    hideStatusIndicator() {
        const container = document.getElementById('alexaStatusContainer');
        if (container) {
            container.style.display = 'none';
        }
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const assistant = new AlexaAssistant();
        window.alexaAssistant = assistant;
        console.log('✅ Alexa Assistant listo - Con animación de boca y sin emojis');
    }, 1000);
});
