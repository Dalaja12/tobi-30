// Alexa Assistant - Versión ULTRA compatible con móviles
class AlexaAssistant {
    constructor() {
        this.isActive = false;
        this.isListening = false;
        this.isSpeaking = false;
        this.recognition = null;
        this.wakeWord = "alexa";
        this.currentUtterance = null;
        this.isMobile = this.detectMobile();
        this.activationMode = this.isMobile ? 'button' : 'wakeword'; // Modos diferentes
        
        console.log('Dispositivo: ' + (this.isMobile ? 'Móvil' : 'PC'));
        console.log('Modo: ' + this.activationMode);
        
        this.toggleAlexa = this.toggleAlexa.bind(this);
        this.setupRecognition = this.setupRecognition.bind(this);
        this.handleButtonActivation = this.handleButtonActivation.bind(this);
        
        setTimeout(() => this.initialize(), 100);
    }
    
    detectMobile() {
        return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    initialize() {
        console.log('Inicializando Alexa Assistant...');
        this.setupRecognition();
        this.setupUI();
        this.setupEventListeners();
    }
    
    setupRecognition() {
        // Verificar compatibilidad
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            console.warn('❌ Reconocimiento de voz no soportado');
            this.showCompatibilityWarning();
            return;
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        // ⚠️ CONFIGURACIÓN ESPECÍFICA PARA MÓVILES
        if (this.isMobile) {
            // En móviles: modo simple y seguro
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.maxAlternatives = 1;
            this.recognition.lang = 'es-ES';
        } else {
            // En PC: modo avanzado
            this.recognition.continuous = true;
            this.recognition.interimResults = false;
            this.recognition.maxAlternatives = 1;
            this.recognition.lang = 'es-ES';
        }
        
        // Eventos comunes
        this.recognition.onstart = () => {
            console.log('🎤 Reconocimiento INICIADO');
            this.showStatusIndicator('🎤 Escuchando...', true);
            this.showListeningAnimation();
        };
        
        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.toLowerCase().trim();
            console.log('📝 Transcrito:', transcript);
            
            this.showStatusIndicator('✅ Procesando...', false);
            
            // Diferente procesamiento según el modo
            if (this.isMobile && this.activationMode === 'button') {
                // En móviles con botón: procesar directamente
                this.processMobileCommand(transcript);
            } else {
                // En PC o modo wakeword: buscar "alexa"
                if (transcript.includes(this.wakeWord)) {
                    this.playBeep(800, 0.2);
                    const command = this.extractCommand(transcript);
                    this.processAlexaCommand(command);
                }
            }
        };
        
        this.recognition.onerror = (event) => {
            console.error('❌ Error:', event.error);
            
            switch(event.error) {
                case 'not-allowed':
                case 'permission-denied':
                    this.showStatusIndicator('🎤 Permiso denegado', false, true);
                    this.showPermissionInstructions();
                    break;
                case 'no-speech':
                    this.showStatusIndicator('🎤 No escuché nada', false, true);
                    break;
                case 'audio-capture':
                    this.showStatusIndicator('🎤 Error micrófono', false, true);
                    break;
                default:
                    this.showStatusIndicator('❌ Error', false, true);
            }
            
            // Reiniciar después de error
            setTimeout(() => {
                if (this.isActive) {
                    this.cleanupRecognition();
                    this.setupRecognition();
                }
            }, 2000);
        };
        
        this.recognition.onend = () => {
            console.log('🔚 Reconocimiento FINALIZADO');
            
            if (this.isMobile) {
                // En móviles: limpiar y preparar para siguiente uso
                this.hideListeningAnimation();
                
                if (this.isActive && !this.isSpeaking) {
                    // Solo mantener activo si el usuario lo decidió
                    this.showStatusIndicator('Listo', false);
                } else {
                    this.showStatusIndicator('Inactivo', false, false);
                }
            } else {
                // En PC: reiniciar automáticamente
                if (this.isActive && !this.isSpeaking) {
                    setTimeout(() => {
                        try {
                            if (this.recognition) {
                                this.recognition.start();
                            }
                        } catch (e) {
                            console.log('Error reiniciando:', e);
                        }
                    }, 500);
                }
            }
        };
    }
    
    setupUI() {
        // Crear interfaz especial para móviles
        if (this.isMobile) {
            this.createMobileUI();
        }
        
        // Configurar botón principal
        const alexaBtn = document.getElementById('alexaBtn');
        if (alexaBtn) {
            alexaBtn.addEventListener('click', this.toggleAlexa);
            
            // Mejorar feedback táctil
            alexaBtn.addEventListener('touchstart', () => {
                alexaBtn.classList.add('touch-active');
            });
            
            alexaBtn.addEventListener('touchend', () => {
                setTimeout(() => {
                    alexaBtn.classList.remove('touch-active');
                }, 200);
            });
        }
    }
    
    createMobileUI() {
        // Crear botón flotante para móviles
        if (!document.getElementById('mobileAlexaBtn')) {
            const mobileBtn = document.createElement('button');
            mobileBtn.id = 'mobileAlexaBtn';
            mobileBtn.innerHTML = '🎤';
            mobileBtn.title = 'Pulsa y habla';
            mobileBtn.style.cssText = `
                position: fixed;
                bottom: 100px;
                right: 20px;
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border: none;
                color: white;
                font-size: 24px;
                cursor: pointer;
                z-index: 10000;
                box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s;
                user-select: none;
            `;
            
            document.body.appendChild(mobileBtn);
            
            // Eventos para el botón móvil
            mobileBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.handleButtonActivation(true);
                mobileBtn.style.transform = 'scale(0.9)';
                mobileBtn.style.background = 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)';
            });
            
            mobileBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.handleButtonActivation(false);
                mobileBtn.style.transform = 'scale(1)';
                mobileBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            });
            
            mobileBtn.addEventListener('click', () => {
                this.handleButtonActivation(true);
                setTimeout(() => this.handleButtonActivation(false), 100);
            });
        }
        
        // Crear overlay de escucha para móviles
        if (!document.getElementById('mobileListeningOverlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'mobileListeningOverlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: none;
                justify-content: center;
                align-items: center;
                flex-direction: column;
                z-index: 9999;
                color: white;
                font-family: 'Orbitron', sans-serif;
                font-size: 24px;
                text-align: center;
            `;
            overlay.innerHTML = `
                <div style="
                    width: 100px;
                    height: 100px;
                    border-radius: 50%;
                    background: rgba(0, 255, 255, 0.2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 20px;
                    animation: pulse 1.5s infinite;
                ">
                    <div style="
                        width: 60px;
                        height: 60px;
                        border-radius: 50%;
                        background: rgba(0, 255, 255, 0.5);
                    "></div>
                </div>
                <p>🎤 Habla ahora...</p>
                <p style="font-size: 16px; margin-top: 10px; color: #0ff;">Di "para" para cancelar</p>
            `;
            document.body.appendChild(overlay);
        }
    }
    
    setupEventListeners() {
        // Detectar orientación del dispositivo
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.adjustMobileUI(), 300);
        });
        
        // Pausar cuando la página no está visible
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isActive) {
                this.pauseAssistant();
            }
        });
        
        // Pausar cuando se pierde el foco
        window.addEventListener('blur', () => {
            if (this.isActive) {
                this.pauseAssistant();
            }
        });
        
        // Reanudar cuando se recupera el foco
        window.addEventListener('focus', () => {
            if (this.isActive && !this.isSpeaking) {
                setTimeout(() => this.resumeAssistant(), 1000);
            }
        });
    }
    
    handleButtonActivation(start) {
        if (!this.isActive) {
            this.showStatusIndicator('❌ Alexa no activada', false, true);
            return;
        }
        
        if (start) {
            console.log('📱 Botón pulsado - ESCUCHANDO');
            this.showMobileListeningUI();
            this.startListeningSession();
        } else {
            console.log('📱 Botón soltado - PROCESANDO');
            // El procesamiento se hace en onresult
        }
    }
    
    startListeningSession() {
        if (!this.recognition) {
            this.setupRecognition();
        }
        
        // Solicitar permisos explícitamente en móviles
        if (this.isMobile) {
            this.requestMicrophoneAccess().then(granted => {
                if (granted) {
                    this.startRecognition();
                }
            });
        } else {
            this.startRecognition();
        }
    }
    
    async requestMicrophoneAccess() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            return false;
        }
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            
            // Detener stream inmediatamente (solo necesitamos permisos)
            stream.getTracks().forEach(track => track.stop());
            return true;
            
        } catch (error) {
            console.error('Error permisos:', error);
            
            if (error.name === 'NotAllowedError') {
                this.showPermissionDialog();
            }
            
            return false;
        }
    }
    
    startRecognition() {
        try {
            if (this.recognition && !this.isSpeaking) {
                this.recognition.start();
            }
        } catch (error) {
            console.error('Error iniciando reconocimiento:', error);
            
            // Intentar recrear el reconocimiento
            setTimeout(() => {
                this.cleanupRecognition();
                this.setupRecognition();
                
                if (this.isActive) {
                    setTimeout(() => this.startRecognition(), 1000);
                }
            }, 1000);
        }
    }
    
    processMobileCommand(command) {
        console.log('📱 Comando móvil:', command);
        
        // Comandos de control inmediato
        if (this.isStopCommand(command)) {
            this.handleStopCommand();
            return;
        }
        
        // Comandos especiales para móviles
        if (command.includes('activar') || command.includes('encender')) {
            if (!this.isActive) {
                this.toggleAlexa();
                this.speakResponse('Alexa activada');
            }
            return;
        }
        
        if (command.includes('desactivar') || command.includes('apagar')) {
            if (this.isActive) {
                this.toggleAlexa();
            }
            return;
        }
        
        // Procesar como pregunta normal
        this.processAlexaCommand(command);
    }
    
    handleStopCommand() {
        this.playBeep(400, 0.3);
        this.stopSpeakingCompletely();
        this.hideMobileListeningUI();
        this.showStatusIndicator('🛑 Detenido', false, true);
        
        setTimeout(() => {
            if (this.isActive) {
                this.showStatusIndicator('Listo', false);
            }
        }, 1500);
    }
    
    processAlexaCommand(command) {
        console.log('Procesando comando:', command);
        
        if (!command) {
            this.speakResponse('¿En qué puedo ayudarte?');
            return;
        }
        
        this.showStatusIndicator('🤔 Buscando...', false);
        
        // Buscar respuesta
        this.searchForAlexa(command);
    }
    
    async searchForAlexa(query) {
        try {
            // Buscar respuesta predefinida
            if (typeof getPredefinedResponse === 'function') {
                const response = getPredefinedResponse(query);
                if (response) {
                    const responseText = typeof response === 'object' ? response.text : response;
                    this.speakResponse(responseText);
                    
                    if (typeof response === 'object' && response.action) {
                        setTimeout(() => response.action(), 1000);
                    }
                    return;
                }
            }
            
            // Usar búsqueda web si está disponible
            if (typeof searchWeb === 'function') {
                const answer = await this.captureWebSearch(query);
                if (answer) {
                    this.speakResponse(answer);
                } else {
                    this.speakResponse('No encontré información sobre eso.');
                }
            } else {
                this.speakResponse('No puedo buscar información ahora.');
            }
            
        } catch (error) {
            console.error('Error buscando:', error);
            this.speakResponse('Hubo un error al procesar tu pregunta.');
        }
    }
    
    async captureWebSearch(query) {
        return new Promise((resolve) => {
            let captured = false;
            const timeout = 8000; // 8 segundos máximo
            
            // Interceptar mensajes del bot
            const originalAddMessage = window.addMessage;
            
            window.addMessage = (text, sender) => {
                if (sender === 'bot' && !captured) {
                    const cleanText = this.cleanResponse(text);
                    if (cleanText && cleanText.length > 10) {
                        captured = true;
                        resolve(cleanText);
                    }
                }
                
                if (originalAddMessage) {
                    originalAddMessage(text, sender);
                }
            };
            
            // Ejecutar búsqueda
            try {
                searchWeb(query);
            } catch (error) {
                console.error('Error en búsqueda:', error);
                resolve(null);
            }
            
            // Timeout
            setTimeout(() => {
                if (!captured) {
                    window.addMessage = originalAddMessage;
                    resolve(null);
                }
            }, timeout);
        });
    }
    
    cleanResponse(text) {
        // Limpiar texto de respuesta
        return text
            .replace(/[\p{Extended_Pictographic}]/gu, '')
            .replace(/\[.*?\]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }
    
    extractCommand(transcript) {
        const index = transcript.indexOf(this.wakeWord);
        if (index !== -1) {
            return transcript.substring(index + this.wakeWord.length).trim();
        }
        return transcript;
    }
    
    speakResponse(text) {
        if (!window.speechSynthesis) {
            console.error('Síntesis de voz no disponible');
            return;
        }
        
        // Limpiar síntesis previa
        window.speechSynthesis.cancel();
        
        const cleanText = this.cleanResponse(text);
        if (!cleanText) return;
        
        this.isSpeaking = true;
        this.hideMobileListeningUI();
        
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'es-ES';
        utterance.rate = 0.85;
        utterance.pitch = 0.9;
        
        utterance.onstart = () => {
            console.log('🗣️ Empezó a hablar');
            this.showStatusIndicator('🗣️ Hablando...', false);
            this.showTalkingAnimation();
        };
        
        utterance.onend = () => {
            console.log('✅ Terminó de hablar');
            this.isSpeaking = false;
            this.hideTalkingAnimation();
            
            if (this.isActive) {
                this.showStatusIndicator('Listo', false);
                
                // En móviles, mostrar instrucción
                if (this.isMobile) {
                    this.showMobileReadyIndicator();
                }
            }
        };
        
        utterance.onerror = (event) => {
            console.error('Error hablando:', event);
            this.isSpeaking = false;
            this.hideTalkingAnimation();
            
            if (this.isActive) {
                this.showStatusIndicator('Error', false, true);
            }
        };
        
        window.speechSynthesis.speak(utterance);
    }
    
    // ===== MÉTODOS DE UI PARA MÓVILES =====
    
    showMobileListeningUI() {
        const overlay = document.getElementById('mobileListeningOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
            
            // Auto-ocultar después de 10 segundos
            setTimeout(() => {
                if (overlay.style.display === 'flex') {
                    this.hideMobileListeningUI();
                    this.showStatusIndicator('⏱️ Tiempo agotado', false, true);
                }
            }, 10000);
        }
    }
    
    hideMobileListeningUI() {
        const overlay = document.getElementById('mobileListeningOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }
    
    showMobileReadyIndicator() {
        if (this.isMobile && this.isActive) {
            const mobileBtn = document.getElementById('mobileAlexaBtn');
            if (mobileBtn) {
                mobileBtn.style.animation = 'pulse 2s infinite';
                setTimeout(() => {
                    mobileBtn.style.animation = '';
                }, 3000);
            }
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
    
    showTalkingAnimation() {
        const mouth = document.getElementById('mouth');
        if (mouth) {
            mouth.classList.add('talking');
            this.talkInterval = setInterval(() => {
                mouth.classList.toggle('surprised');
            }, 200);
        }
    }
    
    hideTalkingAnimation() {
        const mouth = document.getElementById('mouth');
        if (mouth) {
            mouth.classList.remove('talking', 'surprised');
            mouth.classList.add('happy');
        }
        
        if (this.talkInterval) {
            clearInterval(this.talkInterval);
        }
    }
    
    // ===== MÉTODOS DE CONTROL =====
    
    toggleAlexa() {
        const alexaBtn = document.getElementById('alexaBtn');
        
        if (!this.isActive) {
            // ACTIVAR
            this.isActive = true;
            alexaBtn.classList.add('active');
            alexaBtn.innerHTML = '🎤';
            
            console.log('✅ Alexa ACTIVADA');
            
            if (this.isMobile) {
                // En móviles: modo botón
                this.showStatusIndicator('📱 Pulsa y habla', false);
                this.showMobileInstructions();
                
                // Mostrar botón flotante
                const mobileBtn = document.getElementById('mobileAlexaBtn');
                if (mobileBtn) {
                    mobileBtn.style.display = 'flex';
                }
                
            } else {
                // En PC: modo wakeword
                this.showStatusIndicator('Di "Alexa"', false);
                this.startRecognition();
            }
            
        } else {
            // DESACTIVAR
            this.deactivate();
        }
    }
    
    deactivate() {
        this.isActive = false;
        this.isListening = false;
        
        const alexaBtn = document.getElementById('alexaBtn');
        alexaBtn.classList.remove('active');
        alexaBtn.innerHTML = '🤖';
        
        this.stopSpeakingCompletely();
        this.cleanupRecognition();
        this.hideMobileListeningUI();
        this.hideStatusIndicator();
        
        // Ocultar botón flotante en móviles
        if (this.isMobile) {
            const mobileBtn = document.getElementById('mobileAlexaBtn');
            if (mobileBtn) {
                mobileBtn.style.display = 'none';
            }
        }
        
        console.log('⏸️ Alexa DESACTIVADA');
    }
    
    pauseAssistant() {
        if (this.isActive) {
            console.log('⏸️ Asistente pausado');
            this.stopListening();
            this.showStatusIndicator('⏸️ Pausado', false);
        }
    }
    
    resumeAssistant() {
        if (this.isActive && !this.isSpeaking) {
            console.log('▶️ Asistente reanudado');
            
            if (this.isMobile) {
                this.showStatusIndicator('📱 Pulsa y habla', false);
            } else {
                this.showStatusIndicator('Di "Alexa"', false);
                this.startRecognition();
            }
        }
    }
    
    cleanupRecognition() {
        if (this.recognition) {
            try {
                this.recognition.stop();
                this.recognition = null;
            } catch (e) {
                console.log('Error limpiando reconocimiento:', e);
            }
        }
    }
    
    // ===== MÉTODOS DE UTILIDAD =====
    
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
            
            setTimeout(() => audioContext.close(), duration * 2000);
        } catch (e) {
            // Fallback silencioso
        }
    }
    
    isStopCommand(command) {
        const stopWords = ['para', 'detente', 'cállate', 'callate', 'silencio', 'basta', 'alto'];
        return stopWords.some(word => command.includes(word));
    }
    
    stopSpeakingCompletely() {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        this.hideTalkingAnimation();
        this.isSpeaking = false;
    }
    
    stopListening() {
        if (this.recognition) {
            try {
                this.recognition.stop();
            } catch (e) {
                console.log('Error deteniendo:', e);
            }
        }
    }
    
    showStatusIndicator(text, listening = false, error = false) {
        let container = document.getElementById('alexaStatusContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'alexaStatusContainer';
            container.style.cssText = `
                margin: 10px 0;
                padding: 8px 12px;
                border-radius: 8px;
                background: rgba(0, 0, 0, 0.5);
                border: 1px solid ${error ? '#f00' : '#0ff'};
                font-family: 'Orbitron', sans-serif;
                font-size: 14px;
                color: white;
                display: flex;
                align-items: center;
                gap: 10px;
                min-height: 40px;
            `;
            
            const statsPanel = document.getElementById('statsPanel');
            if (statsPanel) {
                statsPanel.appendChild(container);
            }
        }
        
        const color = error ? '#f00' : listening ? '#0ff' : '#0f0';
        const icon = listening ? '🎤' : error ? '❌' : '✅';
        
        container.innerHTML = `
            <div style="
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: ${color};
                ${listening ? 'animation: pulse 1s infinite;' : ''}
            "></div>
            <span>${icon} ${text}</span>
        `;
        container.style.display = 'flex';
    }
    
    hideStatusIndicator() {
        const container = document.getElementById('alexaStatusContainer');
        if (container) {
            container.style.display = 'none';
        }
    }
    
    showMobileInstructions() {
        if (this.isMobile) {
            const instructions = document.createElement('div');
            instructions.id = 'mobileInstructions';
            instructions.style.cssText = `
                position: fixed;
                bottom: 170px;
                right: 20px;
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 10px 15px;
                border-radius: 10px;
                font-family: 'Comic Neue', sans-serif;
                font-size: 12px;
                max-width: 200px;
                border: 2px solid #0ff;
                z-index: 9998;
                animation: fadeIn 0.5s;
            `;
            instructions.innerHTML = `
                <strong>📱 Modo móvil activado</strong><br>
                • Pulsa el botón naranja<br>
                • Habla tu pregunta<br>
                • Suelta para procesar<br>
                • Di "para" para cancelar
            `;
            document.body.appendChild(instructions);
            
            setTimeout(() => {
                if (instructions.parentNode) {
                    instructions.remove();
                }
            }, 5000);
        }
    }
    
    showPermissionDialog() {
        if (this.isMobile) {
            const dialog = document.createElement('div');
            dialog.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.95);
                color: white;
                padding: 20px;
                border-radius: 15px;
                border: 3px solid #f00;
                z-index: 10001;
                text-align: center;
                max-width: 80%;
                font-family: 'Comic Neue', sans-serif;
            `;
            dialog.innerHTML = `
                <h3 style="color: #f00">🎤 Permiso de micrófono</h3>
                <p>Para usar Alexa en móvil:</p>
                <ol style="text-align: left; margin: 15px 0;">
                    <li>Abre configuración del navegador</li>
                    <li>Ve a "Configuración del sitio"</li>
                    <li>Permite "Micrófono" para esta página</li>
                    <li>Recarga la página</li>
                </ol>
                <button onclick="this.parentNode.remove()" 
                        style="background: #f00; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                    Entendido
                </button>
            `;
            document.body.appendChild(dialog);
        }
    }
    
    showCompatibilityWarning() {
        const warning = document.createElement('div');
        warning.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(255, 0, 0, 0.9);
            color: white;
            padding: 15px;
            border-radius: 10px;
            z-index: 10000;
            text-align: center;
            max-width: 90%;
            font-family: 'Comic Neue', sans-serif;
        `;
        warning.innerHTML = `
            <strong>⚠️ Alexa no disponible</strong><br>
            Tu navegador no soporta reconocimiento de voz.<br>
            Prueba con <strong>Chrome</strong> o <strong>Edge</strong>.
        `;
        document.body.appendChild(warning);
        
        setTimeout(() => warning.remove(), 5000);
    }
    
    adjustMobileUI() {
        if (this.isMobile) {
            const mobileBtn = document.getElementById('mobileAlexaBtn');
            if (mobileBtn) {
                // Ajustar posición según orientación
                const isPortrait = window.innerHeight > window.innerWidth;
                mobileBtn.style.bottom = isPortrait ? '100px' : '30px';
                mobileBtn.style.right = isPortrait ? '20px' : '30px';
            }
        }
    }
}

// Inicialización segura
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        try {
            // Solo inicializar si hay botón Alexa
            if (document.getElementById('alexaBtn')) {
                window.alexaAssistant = new AlexaAssistant();
                console.log('🚀 Alexa Assistant listo');
            }
        } catch (error) {
            console.error('Error inicializando Alexa:', error);
        }
    }, 2000);
});

// Añadir estilos necesarios
if (!document.querySelector('#alexa-mobile-styles')) {
    const style = document.createElement('style');
    style.id = 'alexa-mobile-styles';
    style.textContent = `
        @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.8; }
            100% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        #alexaBtn.active {
            background: #ff3366 !important;
            box-shadow: 0 0 20px #ff3366 !important;
        }
        
        #alexaBtn.touch-active {
            transform: scale(0.9);
            transition: transform 0.1s;
        }
        
        /* Animaciones para la boca */
        .mouth.listening {
            animation: pulse 1.5s infinite;
            background: #0ff !important;
        }
        
        .mouth.talking {
            background: #ff0 !important;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            #alexaStatusContainer {
                font-size: 12px !important;
                padding: 6px 10px !important;
            }
            
            #mobileAlexaBtn {
                width: 50px !important;
                height: 50px !important;
                font-size: 20px !important;
            }
        }
        
        @media (max-width: 480px) {
            #mobileAlexaBtn {
                width: 45px !important;
                height: 45px !important;
                font-size: 18px !important;
                bottom: 80px !important;
                right: 15px !important;
            }
        }
    `;
    document.head.appendChild(style);
}
