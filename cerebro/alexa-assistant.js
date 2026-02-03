// Alexa Assistant - Solo cambiamos showStatusIndicator y hideStatusIndicator
class AlexaAssistant {
    constructor() {
        this.isActive = false;
        this.isListeningForWakeWord = false;
        this.isSpeaking = false;
        this.recognition = null;
        this.wakeWord = "alexa";
        this.isProcessingCommand = false;
        this.currentUtterance = null;
        this.audioContext = null;
        this.originalVolume = 1;
        this.mediaElements = [];
        
        this.toggleAlexa = this.toggleAlexa.bind(this);
        this.setupRecognition = this.setupRecognition.bind(this);
        
        setTimeout(() => this.initialize(), 100);
    }
    
    initialize() {
        console.log('Inicializando Alexa Assistant...');
        this.initAudioContext();
        this.setupRecognition();
        this.setupButton();
    }
    
    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('✅ AudioContext inicializado para sonidos Alexa');
        } catch (error) {
            console.warn('⚠️ AudioContext no disponible:', error);
        }
    }
    
    // 🔊 SONIDO: Wake word detectado
    playWakeWordSound() {
        if (!this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.3);
            
            console.log('🔊 Sonido wake word');
        } catch (error) {
            console.warn('Error sonido wake word:', error);
        }
    }
    
    // 🔊 SONIDO: Comando detectado
    playCommandDetectedSound() {
        if (!this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = 1200;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.2);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.2);
            
            console.log('🔊 Sonido comando detectado');
        } catch (error) {
            console.warn('Error sonido comando:', error);
        }
    }
    
    // 🔊 SONIDO: Alexa está escuchando (después de wake word)
    playListeningSound() {
        if (!this.audioContext) return;
        
        try {
            // Doble tono ascendente
            for (let i = 0; i < 2; i++) {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.frequency.value = 600 + (i * 200);
                oscillator.type = 'sine';
                
                const startTime = this.audioContext.currentTime + (i * 0.1);
                
                gainNode.gain.setValueAtTime(0, startTime);
                gainNode.gain.linearRampToValueAtTime(0.1, startTime + 0.05);
                gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);
                
                oscillator.start(startTime);
                oscillator.stop(startTime + 0.2);
            }
            
            console.log('🔊 Sonido de escucha activado');
        } catch (error) {
            console.warn('Error sonido escucha:', error);
        }
    }
    
    // 🔊 SONIDO: Stop o cancelar
    playStopSound() {
        if (!this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = 400;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.4);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.4);
            
            console.log('🔊 Sonido de stop');
        } catch (error) {
            console.warn('Error sonido stop:', error);
        }
    }
    
    // 🔊 SONIDO: Esperando wake word (muy suave)
    playWaitingSound() {
        if (!this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = 500;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.1);
        } catch (error) {
            // Ignorar error
        }
    }
    
    // 🔉 BAJAR volumen de medios para escuchar mejor
    lowerVolumeForListening() {
        this.mediaElements = document.querySelectorAll('audio, video');
        this.originalVolume = 1;
        
        this.mediaElements.forEach(element => {
            if (!element.muted && element.volume > 0) {
                this.originalVolume = element.volume;
                element.volume = 0.2; // Bajar a 20%
            }
        });
        
        // También pausar síntesis de voz si está hablando
        if (window.speechSynthesis && window.speechSynthesis.speaking) {
            window.speechSynthesis.pause();
        }
    }
    
    // 🔊 RESTAURAR volumen original
    restoreVolume() {
        this.mediaElements.forEach(element => {
            element.volume = this.originalVolume;
        });
        
        // Reanudar síntesis de voz si estaba pausada
        if (window.speechSynthesis && window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
        }
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
                
                // 🔊 SONIDO: Indicar que está escuchando ACTIVAMENTE
                this.playListeningSound();
            };
            
            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript.toLowerCase().trim();
                console.log('Escuché:', transcript);
                
                // 🔊 SONIDO: Confirmación de que captó audio
                this.playCommandDetectedSound();
                
                if (this.isListeningForWakeWord) {
                    if (transcript.startsWith(this.wakeWord + ' ') || 
                        transcript === this.wakeWord ||
                        transcript.startsWith(this.wakeWord + ',') ||
                        transcript.startsWith(this.wakeWord + '.')) {
                        
                        console.log('✅ Alexa detectada');
                        // 🔊 SONIDO: Wake word detectado
                        this.playWakeWordSound();
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
                if (this.isActive && this.isListeningForWakeWord && !this.isProcessingCommand) {
                    setTimeout(() => this.startListening(), 500);
                }
            };
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
            this.restoreVolume(); // Restaurar volumen al desactivar
        }
    }
    
    processAlexaCommand(transcript) {
        console.log('Procesando comando Alexa:', transcript);
        this.isProcessingCommand = true;
        
        // 🔉 BAJAR VOLUMEN para escuchar mejor el comando
        this.lowerVolumeForListening();
        
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
            // 🔊 SONIDO: Stop
            this.playStopSound();
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
        
        // 🔊 RESTAURAR VOLUMEN después de stop
        this.restoreVolume();
        
        setTimeout(() => {
            this.showStatusIndicator('Di "Alexa" para activarme', false);
            this.isProcessingCommand = false;
        }, 1500);
        
        return;
    }
    
    stopSpeakingCompletely() {
        console.log('🔇 Callando completamente...');
        
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        
        if (typeof stopMouthAnimation === 'function') {
            stopMouthAnimation();
        } else if (typeof changeExpression === 'function') {
            changeExpression('neutral');
        }
        
        if (typeof stopVoice === 'function') {
            stopVoice();
        }
        
        const stopBtn = document.getElementById('stopBtn');
        if (stopBtn) {
            stopBtn.click();
        }
        
        this.isSpeaking = false;
        this.isProcessingCommand = false;
    }
    
    // MODIFICADA: Ahora muestra en el panel
    showVisualConfirmation(message) {
        // Mostrar directamente en el indicador del panel
        this.showStatusIndicator(message, false, true); // true = es mensaje de stop
    }
    
    processQuestion(question) {
        console.log('Procesando pregunta:', question);
        
        this.showInChat(question, true);
        
        const localResponse = this.searchInLocalFiles(question);
        
        if (localResponse) {
            this.showInChat(localResponse, false);
            this.speakResponse(localResponse);
        } else {
            this.searchWikipediaAndSpeak(question);
        }
    }
    
    searchInLocalFiles(question) {
        const lowerQuestion = question.toLowerCase();
        
        if (window.cyberpetResponses) {
            for (const key in window.cyberpetResponses) {
                if (lowerQuestion.includes(key.toLowerCase())) {
                    return window.cyberpetResponses[key];
                }
            }
        }
        
        if (window.espanolQuestions) {
            for (const q in window.espanolQuestions) {
                if (lowerQuestion.includes(q.toLowerCase())) {
                    return window.espanolQuestions[q];
                }
            }
        }
        
        if (window.matematicasQuestions) {
            for (const q in window.matematicasQuestions) {
                if (lowerQuestion.includes(q.toLowerCase())) {
                    return window.matematicasQuestions[q];
                }
            }
        }
        
        return null;
    }
    
    searchWikipediaAndSpeak(question) {
        this.showInChat('Buscando en Wikipedia...', false);
        
        if (typeof sendQuestion === 'function') {
            const input = document.getElementById('userInput');
            if (input) {
                const originalValue = input.value;
                input.value = question;
                
                this.setupResponseHook();
                sendQuestion();
                
                setTimeout(() => {
                    input.value = originalValue;
                }, 100);
            }
        }
    }
    
    setupResponseHook() {
        const chatContainer = document.getElementById('chatContainer');
        if (!chatContainer) return;
        
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.addedNodes.length) {
                    const lastMessage = chatContainer.lastElementChild;
                    if (lastMessage && lastMessage.classList.contains('bot-message')) {
                        const responseText = lastMessage.textContent;
                        
                        if (!responseText.includes('Buscando') && 
                            !responseText.includes('Cargando') &&
                            !responseText.includes('Hola! Soy CyberPet')) {
                            
                            this.speakResponse(responseText);
                            observer.disconnect();
                        }
                    }
                }
            }
        });
        
        observer.observe(chatContainer, { childList: true });
        setTimeout(() => observer.disconnect(), 15000);
    }
    
    speakResponse(text) {
        console.log('Alexa va a hablar:', text);
        this.isSpeaking = true;
        this.isProcessingCommand = true;
        
        // 🔊 RESTAURAR VOLUMEN antes de hablar
        this.restoreVolume();
        
        if (typeof speakResponse === 'function') {
            // Interceptar la función speakResponse para manejar interrupciones
            this.setupSpeechInterruption();
            speakResponse(text);
            
            setTimeout(() => {
                this.isSpeaking = false;
                this.isProcessingCommand = false;
                if (this.isActive) {
                    this.showStatusIndicator('Di "Alexa" para activarme', false);
                }
            }, text.length * 100 + 2000);
            
        } else if (document.getElementById('playBtn')) {
            const playBtn = document.getElementById('playBtn');
            if (playBtn && !playBtn.disabled) {
                playBtn.click();
            }
        }
    }
    
    setupSpeechInterruption() {
        // Guardar referencia a la función original
        const originalSpeak = window.speechSynthesis.speak;
        const self = this;
        
        // Sobrescribir temporalmente
        window.speechSynthesis.speak = function(utterance) {
            self.currentUtterance = utterance;
            
            // Configurar eventos para detectar interrupciones
            utterance.onstart = function() {
                console.log('Alexa empezó a hablar');
                self.isSpeaking = true;
                
                // Preparar para interrupciones: iniciar escucha después de 1 segundo
                setTimeout(() => {
                    if (self.isActive && self.isListeningForWakeWord) {
                        self.startListening();
                    }
                }, 1000);
            };
            
            utterance.onend = function() {
                console.log('Alexa terminó de hablar');
                self.isSpeaking = false;
                self.isProcessingCommand = false;
                
                // Restaurar función original
                window.speechSynthesis.speak = originalSpeak;
            };
            
            utterance.onerror = function(event) {
                console.log('Error al hablar:', event);
                self.isSpeaking = false;
                self.isProcessingCommand = false;
                window.speechSynthesis.speak = originalSpeak;
            };
            
            // Llamar a la función original
            return originalSpeak.call(this, utterance);
        };
    }
    
    startListening() {
        if (this.recognition && this.isActive && !this.isProcessingCommand) {
            try {
                this.recognition.start();
                
                // Pequeño sonido de espera (muy suave)
                setTimeout(() => {
                    if (this.isActive && this.isListeningForWakeWord && !this.isSpeaking) {
                        this.playWaitingSound();
                    }
                }, 300);
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
    
    // MODIFICADA: Ahora muestra en el panel
    showStatusIndicator(text, isListening = false, isStop = false) {
        // 1. Buscar o crear contenedor en el panel
        let container = document.getElementById('alexaStatusContainer');
        if (!container) {
            const statsPanel = document.getElementById('statsPanel');
            if (!statsPanel) return;
            
            container = document.createElement('div');
            container.id = 'alexaStatusContainer';
            
            // Insertar después del reloj
            const clock = statsPanel.querySelector('.cyber-clock-kids');
            if (clock) {
                clock.insertAdjacentElement('afterend', container);
            } else {
                statsPanel.insertBefore(container, statsPanel.firstChild);
            }
        }
        
        container.style.display = 'block';
        
        // 2. Crear o actualizar indicador
        let indicator = document.getElementById('alexaStatus');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'alexaStatus';
            indicator.className = 'alexa-status';
            container.appendChild(indicator);
        }
        
        // 3. Determinar qué mostrar
        if (isStop) {
            // Mensaje de detenido
            indicator.innerHTML = `<div class="alexa-pulse stop"></div><span style="color: #ff4444">${text}</span>`;
        } else if (isListening) {
            // Modo escucha
            indicator.innerHTML = `<div class="alexa-pulse listen"></div><span>${text}</span>`;
        } else {
            // Modo espera
            indicator.innerHTML = `<div class="alexa-pulse wake"></div><span>${text}</span>`;
        }
        
        indicator.style.display = 'flex';
    }
    
    // MODIFICADA: Ahora oculta del panel
    hideStatusIndicator() {
        const container = document.getElementById('alexaStatusContainer');
        if (container) {
            container.style.display = 'none';
        }
    }
    
    showInChat(message, isUser = false) {
        const chatContainer = document.getElementById('chatContainer');
        if (!chatContainer) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = isUser ? 'user-message message' : 'bot-message message';
        messageDiv.textContent = message;
        
        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const assistant = new AlexaAssistant();
        window.alexaAssistant = assistant;
        console.log('✅ Alexa Assistant listo - Indicador en panel - Con sonidos');
    }, 1000);
});
