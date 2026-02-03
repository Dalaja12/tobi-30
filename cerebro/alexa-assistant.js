// Alexa Assistant - Micrófono SIEMPRE activo, puede interrumpir
class AlexaAssistant {
    constructor() {
        this.isActive = false; // Empezar apagado
        this.isListening = true; // Siempre escuchar cuando está activo
        this.isSpeaking = false;
        this.recognition = null;
        this.wakeWord = "alexa";
        this.currentUtterance = null;
        
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
            this.recognition.continuous = true; // ✅ ESCUCHA CONTINUA
            this.recognition.interimResults = false;
            this.recognition.lang = 'es-ES';
            this.recognition.maxAlternatives = 1;
            
            this.recognition.onstart = () => {
                console.log('🎤 Micrófono SIEMPRE activo...');
                this.showStatusIndicator('🎤 Escuchando...', true);
            };
            
            this.recognition.onresult = (event) => {
                // Tomar TODOS los resultados acumulados
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript.toLowerCase().trim();
                    console.log('Escuché (mientras habla):', transcript);
                    
                    // ✅ PROCESAR INMEDIATAMENTE si contiene "alexa" y estamos activos
                    if (this.isActive && this.isListening && transcript.includes(this.wakeWord)) {
                        console.log('✅ "Alexa" detectado DURANTE habla');
                        this.playBeep(800, 0.2);
                        
                        // Parar de hablar inmediatamente si está hablando
                        if (this.isSpeaking) {
                            this.stopSpeakingCompletely();
                        }
                        
                        // Procesar el comando
                        this.processAlexaCommand(transcript);
                        break; // Procesar solo el primero
                    }
                }
            };
            
            this.recognition.onerror = (event) => {
                console.log('Error reconocimiento:', event.error);
            };
            
            this.recognition.onend = () => {
                console.log('Reconocimiento terminado - REINICIANDO...');
                // ✅ SIEMPRE REINICIAR si está activo
                if (this.isActive && this.isListening) {
                    setTimeout(() => {
                        try {
                            this.recognition.start();
                            console.log('🔄 Micrófono reiniciado');
                        } catch (e) {
                            setTimeout(() => this.startListening(), 1000);
                        }
                    }, 100);
                }
            };
        }
    }
    
    // 🔊 SONIDOS
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
            this.isListening = true;
            
            alexaBtn.classList.add('active');
            alexaBtn.innerHTML = '<img src="img/decor/bed.png" alt="Alexa activa" class="alexa-icon">';
            
            this.startListening();
            this.showStatusIndicator('Di "Alexa"', false);
            console.log('✅ Alexa ACTIVADA - Micrófono SIEMPRE activo');
            
        } else {
            // DESACTIVAR
            this.isActive = false;
            this.isListening = false;
            
            alexaBtn.classList.remove('active');
            alexaBtn.innerHTML = '🤖';
            
            this.stopListening();
            this.hideStatusIndicator();
            this.stopSpeakingCompletely();
            console.log('⏸️ Alexa DESACTIVADA');
        }
    }
    
    processAlexaCommand(transcript) {
        console.log('Procesando:', transcript);
        
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
        
        console.log('Comando:', command);
        
        // ✅ COMANDOS DE DETENER - funcionan INMEDIATAMENTE
        if (this.isStopCommand(command)) {
            console.log('🚫 DETENER detectado');
            this.playBeep(400, 0.3);
            this.stopSpeakingCompletely();
            this.showStatusIndicator('🛑 Detenido', false, true);
            
            setTimeout(() => {
                if (this.isActive) {
                    this.showStatusIndicator('Di "Alexa"', false);
                }
            }, 1500);
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
                return true;
            }
        }
        return false;
    }
    
    stopSpeakingCompletely() {
        console.log('🔇 Callando INMEDIATAMENTE...');
        
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        
        // Detener animación de boca
        const mouth = document.getElementById('mouth');
        if (mouth) {
            mouth.classList.remove('surprised');
            mouth.classList.add('happy');
        }
        
        this.isSpeaking = false;
        this.currentUtterance = null;
    }
    
    processQuestion(question) {
        console.log('Procesando pregunta:', question);
        
        // 🔍 USAR TU SISTEMA
        this.searchForAlexa(question);
    }
    
    async searchForAlexa(query) {
        console.log('Buscando:', query);
        
        if (typeof getPredefinedResponse === 'function') {
            const predefinedResponse = getPredefinedResponse(query);
            
            if (predefinedResponse) {
                let responseText = '';
                
                if (typeof predefinedResponse === 'object' && predefinedResponse.action) {
                    responseText = predefinedResponse.text;
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
        
        if (typeof searchWeb === 'function') {
            await this.captureSearchWebResponse(query);
        } else {
            this.speakResponse('No pude encontrar información.');
        }
    }
    
    async captureSearchWebResponse(query) {
        return new Promise((resolve) => {
            const originalAddMessage = window.addMessage;
            const originalShowTypingIndicator = window.showTypingIndicator;
            
            let capturedResponse = '';
            let responseCaptured = false;
            
            window.addMessage = (text, sender) => {
                if (sender === 'bot' && !responseCaptured) {
                    const cleanText = this.removeEmojis(text);
                    
                    if (!cleanText.includes('Buscando') && 
                        !cleanText.includes('Cargando') &&
                        !cleanText.includes('Hola! Soy CyberPet') &&
                        cleanText.trim().length > 10) {
                        
                        capturedResponse = cleanText;
                        responseCaptured = true;
                        
                        this.speakResponse(capturedResponse);
                        
                        window.addMessage = originalAddMessage;
                        window.showTypingIndicator = originalShowTypingIndicator;
                        
                        resolve();
                        return;
                    }
                }
                
                if (originalAddMessage) {
                    originalAddMessage(text, sender);
                }
            };
            
            window.showTypingIndicator = () => {
                if (originalShowTypingIndicator) {
                    originalShowTypingIndicator();
                }
            };
            
            try {
                searchWeb(query);
                
                setTimeout(() => {
                    if (!responseCaptured) {
                        this.speakResponse('No encontré información.');
                    }
                    
                    window.addMessage = originalAddMessage;
                    window.showTypingIndicator = originalShowTypingIndicator;
                    resolve();
                }, 10000);
                
            } catch (error) {
                console.error('Error:', error);
                this.speakResponse('Hubo un error.');
                
                window.addMessage = originalAddMessage;
                window.showTypingIndicator = originalShowTypingIndicator;
                resolve();
            }
        });
    }
    
    removeEmojis(str) {
        return str.replace(/[\p{Extended_Pictographic}]/gu, '');
    }
    
    speakResponse(text) {
        console.log('Alexa hablando (micrófono sigue activo):', text.substring(0, 50) + '...');
        this.isSpeaking = true;
        
        const cleanText = this.removeEmojis(text);
        
        if (typeof speak === 'function') {
            // Interceptar la función speak para mantener micrófono activo
            this.interceptSpeechSynthesis();
            speak(cleanText);
            
        } else if (window.speechSynthesis) {
            this.speakWithContinuousListening(cleanText);
        }
    }
    
    interceptSpeechSynthesis() {
        const originalSpeak = window.speechSynthesis.speak;
        const self = this;
        
        window.speechSynthesis.speak = function(utterance) {
            self.currentUtterance = utterance;
            
            // Configurar eventos en el utterance
            utterance.onstart = function() {
                self.isSpeaking = true;
                console.log('🗣️ Alexa empezó a hablar (micrófono ACTIVO)');
                
                // ✅ ANIMACIÓN DE BOCA
                const mouth = document.getElementById('mouth');
                if (mouth) {
                    self.talkInterval = setInterval(() => {
                        mouth.classList.toggle('surprised');
                    }, 200);
                }
            };
            
            utterance.onend = function() {
                self.isSpeaking = false;
                console.log('✅ Alexa terminó de hablar');
                
                // ✅ DETENER ANIMACIÓN
                if (self.talkInterval) {
                    clearInterval(self.talkInterval);
                }
                
                const mouth = document.getElementById('mouth');
                if (mouth) {
                    mouth.classList.remove('surprised');
                    mouth.classList.add('happy');
                }
                
                // Restaurar función original
                window.speechSynthesis.speak = originalSpeak;
            };
            
            utterance.onerror = function(event) {
                console.error('Error al hablar:', event);
                self.isSpeaking = false;
                
                if (self.talkInterval) {
                    clearInterval(self.talkInterval);
                }
                
                const mouth = document.getElementById('mouth');
                if (mouth) {
                    mouth.classList.remove('surprised');
                    mouth.classList.add('happy');
                }
                
                window.speechSynthesis.speak = originalSpeak;
            };
            
            return originalSpeak.call(this, utterance);
        };
    }
    
    speakWithContinuousListening(text) {
        if (!window.speechSynthesis) return;
        
        // 🔉 BAJAR volumen temporalmente
        this.lowerMediaVolume();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        utterance.rate = 0.85;
        utterance.pitch = 0.9;
        
        this.currentUtterance = utterance;
        
        // 🎤 ANIMACIÓN DE BOCA
        this.talkInterval = null;
        const mouth = document.getElementById('mouth');
        
        utterance.onstart = () => {
            this.isSpeaking = true;
            console.log('🗣️ Alexa empezó a hablar (micrófono SIGUE ACTIVO)');
            
            if (mouth) {
                this.talkInterval = setInterval(() => {
                    mouth.classList.toggle('surprised');
                }, 200);
            }
            
            // ✅ IMPORTANTE: Asegurar que el micrófono siga activo
            if (!this.recognition || this.recognition.ended) {
                this.startListening();
            }
        };
        
        utterance.onend = () => {
            this.isSpeaking = false;
            console.log('✅ Alexa terminó de hablar - Micrófono LISTO para nuevo comando');
            
            if (this.talkInterval) {
                clearInterval(this.talkInterval);
            }
            
            if (mouth) {
                mouth.classList.remove('surprised');
                mouth.classList.add('happy');
            }
            
            // 🔉 RESTAURAR volumen
            this.restoreMediaVolume();
            
            // Mostrar que está lista
            if (this.isActive) {
                this.showStatusIndicator('Di "Alexa"', false);
            }
        };
        
        utterance.onerror = (event) => {
            console.error('Error:', event);
            this.isSpeaking = false;
            
            if (this.talkInterval) {
                clearInterval(this.talkInterval);
            }
            
            if (mouth) {
                mouth.classList.remove('surprised');
                mouth.classList.add('happy');
            }
            
            this.restoreMediaVolume();
            
            if (this.isActive) {
                this.showStatusIndicator('Di "Alexa"', false);
            }
        };
        
        window.speechSynthesis.speak(utterance);
    }
    
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
        if (this.recognition && this.isActive && this.isListening) {
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
            } catch (error) {}
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
        console.log('✅ Alexa Assistant listo - Micrófono SIEMPRE activo, puede interrumpir');
    }, 1000);
});
