// Alexa Assistant - Versión MÍNIMA compatible con móviles
class AlexaAssistant {
    constructor() {
        this.isActive = false;
        this.isListening = true; // Siempre escuchar cuando está activo
        this.isSpeaking = false;
        this.recognition = null;
        this.wakeWord = "alexa";
        this.currentUtterance = null;
        this.isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        
        console.log('Dispositivo: ' + (this.isMobile ? 'Móvil' : 'PC'));
        
        this.toggleAlexa = this.toggleAlexa.bind(this);
        this.setupRecognition = this.setupRecognition.bind(this);
        
        // Esperar a que todo cargue
        setTimeout(() => this.initialize(), 100);
    }
    
    initialize() {
        console.log('Inicializando Alexa Assistant...');
        this.setupRecognition();
        this.setupButton();
    }
    
    setupRecognition() {
        // Verificar compatibilidad básica
        if (!('webkitSpeechRecognition' in window)) {
            console.warn('❌ Reconocimiento de voz no soportado');
            this.showStatusIndicator('Voz no soportada', false, true);
            return;
        }
        
        this.recognition = new webkitSpeechRecognition();
        
        // ⚠️ CONFIGURACIÓN CRÍTICA PARA MÓVILES
        if (this.isMobile) {
            // EN MÓVILES: configuración mínima y segura
            this.recognition.continuous = false; // ❗️ FALSE para móviles
            this.recognition.interimResults = false;
            this.recognition.lang = 'es-ES';
            this.recognition.maxAlternatives = 1;
        } else {
            // EN PC: configuración normal
            this.recognition.continuous = true;
            this.recognition.interimResults = false;
            this.recognition.lang = 'es-ES';
            this.recognition.maxAlternatives = 1;
        }
        
        this.recognition.onstart = () => {
            console.log('🎤 Reconocimiento iniciado');
            this.isListening = true;
            this.showStatusIndicator('🎤 Escuchando...', true);
            this.showListeningAnimation();
        };
        
        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.toLowerCase().trim();
            console.log('Escuché:', transcript);
            
            // ✅ Buscar "alexa" en el texto
            if (this.isActive && this.isListening && transcript.includes(this.wakeWord)) {
                console.log('✅ "Alexa" detectado');
                
                // Parar si está hablando
                if (this.isSpeaking) {
                    this.stopSpeakingCompletely();
                }
                
                // Procesar comando
                this.processAlexaCommand(transcript);
            }
        };
        
        this.recognition.onerror = (event) => {
            console.log('Error:', event.error);
            
            if (event.error === 'no-speech') {
                this.showStatusIndicator('No escuché nada', false, true);
            } else if (event.error === 'audio-capture') {
                this.showStatusIndicator('Error micrófono', false, true);
            }
            
            // EN MÓVILES: reiniciar con delay más largo
            if (this.isActive) {
                setTimeout(() => {
                    if (this.isActive && !this.isSpeaking) {
                        this.startListening();
                    }
                }, this.isMobile ? 3000 : 1000); // 3 segundos en móviles
            }
        };
        
        this.recognition.onend = () => {
            console.log('Reconocimiento terminado');
            this.isListening = false;
            this.hideListeningAnimation();
            
            // ⚠️ COMPORTAMIENTO DIFERENTE PARA MÓVILES
            if (this.isMobile) {
                // EN MÓVILES: solo reiniciar si está activo y no hablando
                if (this.isActive && !this.isSpeaking) {
                    setTimeout(() => {
                        if (this.isActive && !this.isSpeaking) {
                            this.startListening();
                        }
                    }, 2000); // Delay de 2 segundos
                }
            } else {
                // EN PC: reiniciar automáticamente
                if (this.isActive && !this.isSpeaking) {
                    setTimeout(() => {
                        try {
                            this.recognition.start();
                        } catch (e) {
                            setTimeout(() => this.startListening(), 1000);
                        }
                    }, 500);
                }
            }
        };
    }
    
    // 🔊 SONIDO SIMPLE (compatible con móviles)
    playBeep(freq, duration) {
        try {
            // Método simple que funciona en todos lados
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
        } catch (e) {
            // Silencio si falla
        }
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
            console.log('✅ Alexa ACTIVADA');
            
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
        
        // ✅ COMANDOS DE DETENER
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
            'para', 'detente', 'cállate', 'callate', 'silencio', 'basta', 'alto',
            'cancela', 'cancelar', 'para ya', 'detén', 'quieto', 'deja de hablar'
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
        console.log('🔇 Callando...');
        
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        
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
        
        // 🔍 USAR TU SISTEMA EXISTENTE
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
        console.log('Alexa hablando:', text.substring(0, 50) + '...');
        this.isSpeaking = true;
        
        const cleanText = this.removeEmojis(text);
        
        if (typeof speak === 'function') {
            // Usar tu función speak existente
            speak(cleanText);
            
        } else if (window.speechSynthesis) {
            this.speakWithContinuousListening(cleanText);
        }
    }
    
    speakWithContinuousListening(text) {
        if (!window.speechSynthesis) return;
        
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        utterance.rate = 0.85;
        utterance.pitch = 0.9;
        
        this.currentUtterance = utterance;
        
        const mouth = document.getElementById('mouth');
        this.talkInterval = null;
        
        utterance.onstart = () => {
            this.isSpeaking = true;
            console.log('🗣️ Alexa empezó a hablar');
            
            if (mouth) {
                this.talkInterval = setInterval(() => {
                    mouth.classList.toggle('surprised');
                }, 200);
            }
        };
        
        utterance.onend = () => {
            this.isSpeaking = false;
            console.log('✅ Alexa terminó de hablar');
            
            if (this.talkInterval) {
                clearInterval(this.talkInterval);
            }
            
            if (mouth) {
                mouth.classList.remove('surprised');
                mouth.classList.add('happy');
            }
            
            // Mostrar que está lista
            if (this.isActive) {
                this.showStatusIndicator('Di "Alexa"', false);
                
                // EN MÓVILES: delay antes de reiniciar escucha
                if (this.isMobile) {
                    setTimeout(() => {
                        if (this.isActive && !this.isSpeaking) {
                            this.startListening();
                        }
                    }, 1000);
                } else {
                    this.startListening();
                }
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
            
            if (this.isActive) {
                this.showStatusIndicator('Di "Alexa"', false);
            }
        };
        
        window.speechSynthesis.speak(utterance);
    }
    
    startListening() {
        if (this.recognition && this.isActive && !this.isSpeaking) {
            try {
                this.recognition.start();
            } catch (error) {
                // EN MÓVILES: intentar de nuevo con delay
                setTimeout(() => {
                    if (this.isActive && !this.isSpeaking) {
                        this.startListening();
                    }
                }, this.isMobile ? 2000 : 1000);
            }
        }
    }
    
    stopListening() {
        if (this.recognition) {
            try {
                this.recognition.stop();
            } catch (error) {
                console.log('Error deteniendo:', error);
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
    
    showListeningAnimation() {
        const mouth = document.getElementById('mouth');
        if (mouth) {
            mouth.classList.add('listening');
        }
    }
    
    hideListeningAnimation() {
        const mouth = document.getElementById('mouth');
        if (mouth) {
            mouth.classList.remove('listening');
        }
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        try {
            const assistant = new AlexaAssistant();
            window.alexaAssistant = assistant;
            console.log('✅ Alexa Assistant listo para móviles');
        } catch (error) {
            console.error('Error inicializando Alexa:', error);
        }
    }, 1500);
});

// Estilos MÍNIMOS para móviles (se añaden automáticamente)
if (!document.querySelector('#alexa-compat-styles')) {
    const style = document.createElement('style');
    style.id = 'alexa-compat-styles';
    style.textContent = `
        /* Estilos para móviles */
        @media (max-width: 768px) {
            #alexaBtn.active {
                background: #ff3366 !important;
                box-shadow: 0 0 15px #ff3366 !important;
                animation: none !important; /* Desactivar animaciones en móviles */
            }
            
            .alexa-status {
                font-size: 12px !important;
                padding: 6px 8px !important;
            }
            
            .mouth.listening {
                animation: pulse 2s infinite !important;
                background: #0ff !important;
            }
            
            @keyframes pulse {
                0% { opacity: 0.5; }
                50% { opacity: 1; }
                100% { opacity: 0.5; }
            }
        }
        
        /* Desactivar efectos complejos en móviles */
        @media (max-width: 480px) {
            .alexa-pulse {
                display: none !important; /* Ocultar animaciones en móviles muy pequeños */
            }
        }
    `;
    document.head.appendChild(style);
}
