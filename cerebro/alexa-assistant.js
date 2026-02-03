// Alexa Assistant - Solo cambiamos showStatusIndicator y hideStatusIndicator
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
        
        if (typeof speakResponse === 'function') {
            speakResponse(text);
            
            setTimeout(() => {
                this.isSpeaking = false;
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
    
    startListening() {
        if (this.recognition && this.isActive) {
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
        console.log('✅ Alexa Assistant listo - Indicador en panel');
    }, 1000);
});
