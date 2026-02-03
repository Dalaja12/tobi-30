// Alexa Assistant - Versión compatible con móviles (OPTIMIZACIÓN MÍNIMA)
class AlexaAssistant {
    constructor() {
        this.isActive = false;
        this.isListening = false;
        this.isSpeaking = false;
        this.recognition = null;
        this.wakeWord = "alexa";
        this.currentUtterance = null;
        this.isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        
        // Detectar si es dispositivo muy antiguo
        this.isOldDevice = this.checkIfOldDevice();
        
        this.toggleAlexa = this.toggleAlexa.bind(this);
        this.setupRecognition = this.setupRecognition.bind(this);
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
        
        // Inicializar inmediatamente pero con verificación
        this.initialize();
    }
    
    checkIfOldDevice() {
        // Verificar navegadores antiguos
        const ua = navigator.userAgent;
        const isOldAndroid = /Android [2-6]/.test(ua);
        const isOldIOS = /OS [5-9]_/.test(ua);
        const isOldChrome = /Chrome\/([1-5]|6[0-9])/.test(ua);
        
        return isOldAndroid || isOldIOS || isOldChrome;
    }
    
    initialize() {
        console.log('Inicializando Alexa Assistant - Móvil: ' + this.isMobile + ', Antiguo: ' + this.isOldDevice);
        
        // INTENTAR primero con método simple
        this.trySetupRecognition();
        this.setupButton();
        this.setupVisibilityListener();
    }
    
    trySetupRecognition() {
        try {
            this.setupRecognition();
        } catch (error) {
            console.error('Error inicializando reconocimiento:', error);
            
            // Intentar método alternativo para dispositivos antiguos
            if (this.isOldDevice) {
                this.setupFallbackRecognition();
            } else {
                this.showStatusIndicator('❌ Error inicial', false, true);
            }
        }
    }
    
    setupRecognition() {
        // VERIFICACIÓN MÁS ROBUSTA
        if (!window.webkitSpeechRecognition && !window.SpeechRecognition) {
            console.warn('Web Speech API no disponible');
            this.showStatusIndicator('❌ Voz no soportada', false, false);
            
            // Deshabilitar botón
            const alexaBtn = document.getElementById('alexaBtn');
            if (alexaBtn) {
                alexaBtn.disabled = true;
                alexaBtn.title = "Voz no soportada en este navegador";
            }
            return;
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        // CONFIGURACIÓN ORIGINAL TUYA (NO CAMBIADA)
        if (this.isMobile) {
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.maxAlternatives = 1;
            
            this.recognition.onspeechstart = () => {
                console.log('🎤 Habla detectada en móvil');
                this.showStatusIndicator('🎤 Escuchando...', true);
            };
        } else {
            this.recognition.continuous = true;
            this.recognition.interimResults = false;
            this.recognition.maxAlternatives = 1;
        }
        
        this.recognition.lang = 'es-ES';
        
        this.recognition.onstart = () => {
            console.log('🎤 Reconocimiento iniciado');
            this.showStatusIndicator('🎤 Escuchando...', true);
            this.isListening = true; // IMPORTANTE: Actualizar estado
        };
        
        this.recognition.onresult = (event) => {
            console.log('Resultado recibido');
            
            // Verificar que hay resultados
            if (!event.results || event.results.length === 0) {
                console.log('No hay resultados');
                return;
            }
            
            const transcript = event.results[0][0].transcript.toLowerCase().trim();
            console.log('Escuché:', transcript);
            
            if (this.isActive && transcript.includes(this.wakeWord)) {
                console.log('✅ "' + this.wakeWord + '" detectado');
                this.playBeep(800, 0.2);
                
                if (this.isSpeaking) {
                    this.stopSpeakingCompletely();
                }
                
                this.processAlexaCommand(transcript);
                
                if (this.isMobile) {
                    setTimeout(() => {
                        if (this.isActive) {
                            this.restartListening();
                        }
                    }, 1000);
                }
            } else if (this.isActive && !transcript.includes(this.wakeWord)) {
                console.log('No se detectó la palabra clave');
                this.showStatusIndicator('Di "' + this.wakeWord + '"', false);
            }
        };
        
        this.recognition.onerror = (event) => {
            console.log('Error reconocimiento:', event.error);
            
            // Manejar errores específicos de dispositivos móviles
            if (event.error === 'not-allowed') {
                console.log('Permiso denegado - solicitando...');
                this.showStatusIndicator('🎤 Permitir micrófono', false, true);
                
                // En móviles, pedir permiso de manera amigable
                if (this.isMobile) {
                    this.requestMobilePermission();
                }
            } else if (event.error === 'no-speech') {
                console.log('No se detectó voz');
                this.showStatusIndicator('Di "' + this.wakeWord + '"', false);
            } else if (event.error === 'audio-capture') {
                console.log('Error de micrófono');
                this.showStatusIndicator('🎤 Error micrófono', false, true);
            } else if (event.error === 'network') {
                console.log('Error de red');
                this.showStatusIndicator('🌐 Error de red', false, true);
            }
            
            // Reiniciar con cuidado
            if (this.isActive) {
                setTimeout(() => this.safeRestart(), 2000);
            }
        };
        
        this.recognition.onend = () => {
            console.log('Reconocimiento terminado');
            this.isListening = false; // Actualizar estado
            
            // COMPORTAMIENTO ORIGINAL (NO CAMBIADO)
            if (this.isMobile) {
                if (this.isActive && !this.isSpeaking) {
                    setTimeout(() => {
                        if (this.isActive && !this.isSpeaking) {
                            this.startListening();
                        }
                    }, 2000);
                }
            } else {
                if (this.isActive) {
                    setTimeout(() => {
                        try {
                            this.recognition.start();
                        } catch (e) {
                            setTimeout(() => this.startListening(), 1000);
                        }
                    }, 100);
                }
            }
        };
        
        console.log('Reconocimiento configurado exitosamente');
    }
    
    // Método de respaldo para dispositivos muy antiguos
    setupFallbackRecognition() {
        console.log('Usando método de respaldo para dispositivo antiguo');
        this.showStatusIndicator('🔧 Modo compatibilidad', false, false);
        
        // Simplemente mostrar mensaje y deshabilitar
        const alexaBtn = document.getElementById('alexaBtn');
        if (alexaBtn) {
            alexaBtn.onclick = () => {
                alert('El reconocimiento de voz no está disponible en tu dispositivo. Prueba con Chrome actualizado.');
            };
        }
    }
    
    requestMobilePermission() {
        // Método específico para móviles
        if (!this.isMobile) return;
        
        const permissionMsg = `
            Para usar Alexa en tu móvil:
            1. Toca "Permitir" cuando se te pida acceso al micrófono
            2. Asegúrate de tener conexión a Internet
            3. Usa audífonos para mejor calidad
        `;
        
        this.showStatusIndicator('👆 Permitir micrófono', false, true);
        
        // Solo mostrar alerta una vez
        if (!localStorage.getItem('alexaPermissionShown')) {
            setTimeout(() => {
                if (confirm('CyberPet necesita acceso al micrófono para escucharte. ¿Permitir?')) {
                    localStorage.setItem('alexaPermissionShown', 'true');
                    this.restartListening();
                }
            }, 1000);
        }
    }
    
    safeRestart() {
        if (!this.isActive || this.isSpeaking) return;
        
        console.log('Reinicio seguro');
        
        // Limpiar antes de reiniciar
        try {
            if (this.recognition) {
                this.recognition.abort();
            }
        } catch (e) {
            console.log('Error al limpiar:', e);
        }
        
        // Esperar y reiniciar
        setTimeout(() => {
            if (this.isActive) {
                this.startListening();
            }
        }, this.isMobile ? 3000 : 1000);
    }
    
    playBeep(freq, duration) {
        try {
            // Método MÁS SIMPLE para dispositivos antiguos
            if (this.isOldDevice) {
                // Solo usar Audio básico
                const audio = new Audio();
                audio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ';
                audio.volume = 0.1;
                audio.play().catch(e => console.log('Beep no reproducido'));
                return;
            }
            
            // Tu método original
            if (window.AudioContext || window.webkitAudioContext) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                const audioContext = new AudioContext();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = freq;
                oscillator.type = 'sine';
                gainNode.gain.value = 0.1;
                
                oscillator.start();
                oscillator.stop(audioContext.currentTime + duration);
                
                setTimeout(() => {
                    try {
                        audioContext.close();
                    } catch (e) {}
                }, duration * 2000);
            } else {
                const audio = new Audio();
                audio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ';
                audio.volume = 0.1;
                audio.play().catch(e => console.log('Error sonido:', e));
            }
        } catch (e) {
            console.log('No se pudo reproducir sonido:', e);
        }
    }
    
    setupButton() {
        const alexaBtn = document.getElementById('alexaBtn');
        if (!alexaBtn) {
            console.error('Botón Alexa no encontrado');
            return;
        }
        
        console.log('Configurando botón Alexa');
        
        // Limpiar eventos anteriores
        alexaBtn.removeEventListener('click', this.toggleAlexa);
        alexaBtn.addEventListener('click', this.toggleAlexa);
        
        // Añadir evento táctil con manejo mejorado
        alexaBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            alexaBtn.classList.add('touch-active');
            
            // En móviles, dar feedback inmediato
            if (this.isMobile) {
                alexaBtn.style.transform = 'scale(0.95)';
            }
        });
        
        alexaBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            alexaBtn.classList.remove('touch-active');
            
            if (this.isMobile) {
                alexaBtn.style.transform = 'scale(1)';
            }
        });
        
        // Feedback visual en clic
        alexaBtn.addEventListener('click', () => {
            if (this.isMobile) {
                alexaBtn.style.animation = 'pulse 0.3s';
                setTimeout(() => {
                    alexaBtn.style.animation = '';
                }, 300);
            }
        });
    }
    
    handleVisibilityChange() {
        if (document.hidden) {
            if (this.isActive) {
                console.log('Página oculta - pausando');
                this.stopListening();
            }
        } else {
            if (this.isActive) {
                console.log('Página visible - reanudando');
                setTimeout(() => this.restartListening(), 1000);
            }
        }
    }
    
    toggleAlexa() {
        console.log('toggleAlexa llamado - Estado actual:', this.isActive);
        
        const alexaBtn = document.getElementById('alexaBtn');
        if (!alexaBtn) {
            console.error('Botón no encontrado en toggle');
            return;
        }
        
        if (!this.isActive) {
            // ACTIVAR
            console.log('Activando Alexa...');
            
            this.isActive = true;
            this.isListening = true; // Asegurar que se marque como escuchando
            
            alexaBtn.classList.add('active');
            alexaBtn.innerHTML = '🎤';
            
            // Dar feedback inmediato
            this.showStatusIndicator('⏳ Iniciando...', false);
            
            // Iniciar con retardo para evitar bloqueos
            setTimeout(() => {
                this.startListening();
                this.showStatusIndicator('Di "Alexa"', false);
                console.log('✅ Alexa ACTIVADA');
            }, 500);
            
        } else {
            // DESACTIVAR
            console.log('Desactivando Alexa...');
            
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
    
    startListening() {
        console.log('startListening llamado - Estado:', {
            active: this.isActive,
            speaking: this.isSpeaking,
            recognition: !!this.recognition
        });
        
        if (!this.recognition) {
            console.error('Reconocimiento no inicializado');
            this.showStatusIndicator('❌ Error inicio', false, true);
            return;
        }
        
        if (!this.isActive || this.isSpeaking) {
            console.log('No se puede iniciar - condiciones:', {
                isActive: this.isActive,
                isSpeaking: this.isSpeaking
            });
            return;
        }
        
        try {
            console.log('Intentando iniciar reconocimiento...');
            
            if (this.isMobile) {
                // Método más seguro para móviles
                setTimeout(() => {
                    try {
                        this.recognition.start();
                        console.log('Reconocimiento iniciado en móvil');
                    } catch (error) {
                        console.error('Error al iniciar en móvil:', error);
                        this.handleStartError(error);
                    }
                }, 100);
            } else {
                this.recognition.start();
                console.log('Reconocimiento iniciado en PC');
            }
        } catch (error) {
            console.error('Error crítico al iniciar:', error);
            this.handleStartError(error);
        }
    }
    
    handleStartError(error) {
        console.error('Error en startListening:', error);
        
        // Mostrar mensaje amigable
        if (error.message && error.message.includes('already started')) {
            this.showStatusIndicator('🎤 Ya está escuchando', true);
        } else if (error.message && error.message.includes('permission')) {
            this.showStatusIndicator('🎤 Sin permisos', false, true);
            this.requestMobilePermission();
        } else {
            this.showStatusIndicator('❌ Error al escuchar', false, true);
        }
        
        // Intentar recuperación
        if (this.isActive) {
            setTimeout(() => {
                if (this.isActive && !this.isSpeaking) {
                    console.log('Reintentando startListening...');
                    this.startListening();
                }
            }, 3000);
        }
    }
    
    async requestMicrophonePermission() {
        // Método simplificado para móviles antiguos
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.log('API de medios no disponible');
            return false;
        }
        
        try {
            // Timeout corto para no bloquear
            const timeout = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('timeout')), 3000)
            );
            
            const permission = navigator.mediaDevices.getUserMedia({ 
                audio: true 
            }).then(stream => {
                stream.getTracks().forEach(track => track.stop());
                return true;
            });
            
            return await Promise.race([permission, timeout]);
            
        } catch (error) {
            console.error('Error permisos:', error);
            
            if (error.name === 'NotAllowedError') {
                this.showStatusIndicator('🎤 Permiso denegado', false, true);
                
                // En móviles, mostrar instrucciones
                if (this.isMobile && confirm('Para usar Alexa, por favor permite el acceso al micrófono en la configuración del navegador.')) {
                    // Intentar nuevamente
                    setTimeout(() => this.requestMicrophonePermission(), 2000);
                }
            }
            
            return false;
        }
    }
    
    stopListening() {
        console.log('stopListening llamado');
        
        if (this.recognition) {
            try {
                this.recognition.stop();
                console.log('Reconocimiento detenido');
            } catch (error) {
                console.log('Error deteniendo reconocimiento:', error);
                
                // Intentar abort si stop falla
                try {
                    this.recognition.abort();
                } catch (e) {
                    console.log('Error en abort:', e);
                }
            }
        }
        
        this.isListening = false;
    }
    
    restartListening() {
        console.log('restartListening llamado');
        
        if (!this.isActive || this.isSpeaking) return;
        
        this.stopListening();
        
        setTimeout(() => {
            if (this.isActive && !this.isSpeaking) {
                this.startListening();
            }
        }, this.isMobile ? 3000 : 1000);
    }
    
    // EL RESTO DEL CÓDIGO SE MANTIENE EXACTAMENTE IGUAL
    // Solo copiaré los nombres de los métodos para que veas que no cambian:
    
    processAlexaCommand(transcript) {
        // TU CÓDIGO ORIGINAL - NO CAMBIADO
        console.log('Procesando comando:', transcript);
        
        let command = '';
        const alexaIndex = transcript.indexOf(this.wakeWord);
        if (alexaIndex !== -1) {
            command = transcript.substring(alexaIndex + this.wakeWord.length).trim();
        }
        
        command = command.replace(/[.,!?]/g, '').trim();
        console.log('Comando limpio:', command);
        
        if (this.isStopCommand(command)) {
            console.log('🚫 Comando DETENER detectado');
            this.playBeep(400, 0.3);
            this.stopSpeakingCompletely();
            this.showStatusIndicator('🛑 Detenido', false, true);
            
            setTimeout(() => {
                if (this.isActive) {
                    this.showStatusIndicator('Di "Alexa"', false);
                    this.restartListening();
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
            'para ahora', 'detente ahora', 'cállate ya', 'no hables'
        ];
        
        return stopCommands.some(stopWord => 
            command === stopWord || command.startsWith(stopWord + ' ')
        );
    }
    
    stopSpeakingCompletely() {
        console.log('🔇 Deteniendo habla...');
        
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
        this.showStatusIndicator('🤔 Procesando...', false);
        this.searchForAlexa(question);
    }
    
    async searchForAlexa(query) {
        console.log('Buscando:', query);
        
        if (typeof getPredefinedResponse === 'function') {
            const response = getPredefinedResponse(query);
            if (response) {
                let responseText = '';
                
                if (typeof response === 'object' && response.action) {
                    responseText = response.text;
                    this.speakResponse(responseText);
                    
                    setTimeout(() => {
                        if (response.action) {
                            response.action();
                        }
                    }, 1000);
                } else {
                    responseText = response;
                    this.speakResponse(responseText);
                }
                return;
            }
        }
        
        if (typeof searchWeb === 'function') {
            try {
                await this.captureSearchWebResponse(query);
            } catch (error) {
                console.error('Error en búsqueda:', error);
                this.speakResponse('No pude encontrar información sobre eso.');
            }
        } else {
            this.speakResponse('Lo siento, no puedo buscar información en este momento.');
        }
    }
    
    async captureSearchWebResponse(query) {
        return new Promise((resolve) => {
            const originalAddMessage = window.addMessage;
            let responseCaptured = false;
            
            window.addMessage = (text, sender) => {
                if (sender === 'bot' && !responseCaptured) {
                    const cleanText = this.removeEmojis(text);
                    
                    if (cleanText.length > 10 && 
                        !cleanText.includes('Buscando') && 
                        !cleanText.includes('Cargando') &&
                        !cleanText.includes('Hola! Soy CyberPet')) {
                        
                        responseCaptured = true;
                        this.speakResponse(cleanText);
                        
                        window.addMessage = originalAddMessage;
                        resolve();
                        return;
                    }
                }
                
                if (originalAddMessage) {
                    originalAddMessage(text, sender);
                }
            };
            
            try {
                searchWeb(query);
                
                setTimeout(() => {
                    if (!responseCaptured) {
                        window.addMessage = originalAddMessage;
                        this.speakResponse('No encontré información sobre eso.');
                        resolve();
                    }
                }, 8000);
                
            } catch (error) {
                window.addMessage = originalAddMessage;
                this.speakResponse('Hubo un error al buscar.');
                resolve();
            }
        });
    }
    
    removeEmojis(str) {
        return str.replace(/[\p{Extended_Pictographic}]/gu, '').trim();
    }
    
    speakResponse(text) {
        console.log('Hablando:', text.substring(0, 50) + '...');
        
        if (!window.speechSynthesis) {
            console.error('Síntesis de voz no disponible');
            this.showStatusIndicator('🗣️ Voz no disponible', false, true);
            return;
        }
        
        this.isSpeaking = true;
        const cleanText = this.removeEmojis(text);
        
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'es-ES';
        utterance.rate = 0.85;
        utterance.pitch = 0.9;
        utterance.volume = 1.0;
        
        utterance.onstart = () => {
            console.log('🗣️ Empezó a hablar');
            this.showStatusIndicator('🗣️ Hablando...', false);
            
            const mouth = document.getElementById('mouth');
            if (mouth) {
                this.talkInterval = setInterval(() => {
                    mouth.classList.toggle('surprised');
                }, 200);
            }
            
            this.stopListening();
        };
        
        utterance.onend = () => {
            console.log('✅ Terminó de hablar');
            this.isSpeaking = false;
            
            if (this.talkInterval) {
                clearInterval(this.talkInterval);
            }
            
            const mouth = document.getElementById('mouth');
            if (mouth) {
                mouth.classList.remove('surprised');
                mouth.classList.add('happy');
            }
            
            if (this.isActive) {
                setTimeout(() => {
                    this.showStatusIndicator('Di "Alexa"', false);
                    this.restartListening();
                }, 500);
            }
        };
        
        utterance.onerror = (event) => {
            console.error('Error al hablar:', event);
            this.isSpeaking = false;
            
            if (this.talkInterval) {
                clearInterval(this.talkInterval);
            }
            
            const mouth = document.getElementById('mouth');
            if (mouth) {
                mouth.classList.remove('surprised');
                mouth.classList.add('happy');
            }
            
            if (this.isActive) {
                setTimeout(() => {
                    this.showStatusIndicator('Di "Alexa"', false);
                    this.restartListening();
                }, 1000);
            }
        };
        
        window.speechSynthesis.speak(utterance);
    }
    
    showStatusIndicator(text, isListening = false, isError = false) {
        let container = document.getElementById('alexaStatusContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'alexaStatusContainer';
            container.style.cssText = `
                margin: 10px 0;
                padding: 8px;
                border-radius: 8px;
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid var(--main-color, #0ff);
            `;
            
            const statsPanel = document.getElementById('statsPanel');
            if (statsPanel) {
                statsPanel.appendChild(container);
            }
        }
        
        let indicator = document.getElementById('alexaStatus');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'alexaStatus';
            indicator.className = 'alexa-status';
            indicator.style.cssText = `
                display: flex;
                align-items: center;
                gap: 10px;
                font-family: 'Orbitron', sans-serif;
                font-size: 14px;
            `;
            container.appendChild(indicator);
        }
        
        let pulse = '';
        if (isListening) {
            pulse = `<div style="width: 10px; height: 10px; background: #0ff; border-radius: 50%; animation: pulse 1s infinite;"></div>`;
        } else if (isError) {
            pulse = `<div style="width: 10px; height: 10px; background: #f00; border-radius: 50%;"></div>`;
        } else {
            pulse = `<div style="width: 10px; height: 10px; background: #0f0; border-radius: 50%;"></div>`;
        }
        
        indicator.innerHTML = pulse + `<span style="color: ${isError ? '#f00' : '#fff'}">${text}</span>`;
        container.style.display = 'block';
    }
    
    hideStatusIndicator() {
        const container = document.getElementById('alexaStatusContainer');
        if (container) {
            container.style.display = 'none';
        }
    }
    
    cleanup() {
        this.stopListening();
        this.stopSpeakingCompletely();
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
}

// Inicialización MEJORADA para dispositivos móviles
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM cargado - Inicializando Alexa Assistant');
    
    // Esperar un poco más en dispositivos móviles
    const delay = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? 2000 : 1500;
    
    setTimeout(() => {
        try {
            console.log('Creando instancia de AlexaAssistant...');
            const assistant = new AlexaAssistant();
            window.alexaAssistant = assistant;
            console.log('✅ Alexa Assistant inicializado');
            
            // Verificar que el botón funciona
            const alexaBtn = document.getElementById('alexaBtn');
            if (alexaBtn) {
                console.log('Botón Alexa encontrado y configurado');
                alexaBtn.style.cursor = 'pointer';
            }
            
            window.addEventListener('beforeunload', () => {
                if (assistant.cleanup) {
                    assistant.cleanup();
                }
            });
        } catch (error) {
            console.error('Error crítico inicializando Alexa:', error);
            
            // Mostrar mensaje de error amigable
            const alexaBtn = document.getElementById('alexaBtn');
            if (alexaBtn) {
                alexaBtn.onclick = () => {
                    alert('Error al iniciar Alexa. Por favor:\n1. Actualiza tu navegador\n2. Asegúrate de tener micrófono\n3. Prueba en Chrome o Edge');
                };
            }
        }
    }, delay);
});

// Añadir estilos CSS necesarios (IGUAL QUE ANTES)
if (!document.querySelector('#alexa-styles')) {
    const style = document.createElement('style');
    style.id = 'alexa-styles';
    style.textContent = `
        @keyframes pulse {
            0% { opacity: 0.5; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1.2); }
            100% { opacity: 0.5; transform: scale(0.8); }
        }
        
        #alexaBtn.active {
            background: #ff3366 !important;
            box-shadow: 0 0 20px #ff3366 !important;
            animation: pulse 2s infinite;
        }
        
        #alexaBtn.touch-active {
            transform: scale(0.9);
            transition: transform 0.1s;
        }
        
        .alexa-pulse {
            width: 10px;
            height: 10px;
            border-radius: 50%;
        }
        
        .alexa-pulse.listen {
            background: #0ff;
            animation: pulse 1s infinite;
        }
        
        .alexa-pulse.wake {
            background: #0f0;
        }
        
        .alexa-pulse.stop {
            background: #f00;
        }
        
        @media (max-width: 768px) {
            #alexaStatusContainer {
                font-size: 12px !important;
                padding: 6px !important;
                margin: 5px 0 !important;
            }
            
            #alexaBtn {
                min-width: 44px !important;
                min-height: 44px !important;
            }
        }
        
        /* Mejorar feedback táctil */
        #alexaBtn:active {
            transform: scale(0.95);
        }
    `;
    document.head.appendChild(style);
}

// Añadir polyfill básico si es necesario
if (!window.Promise) {
    console.warn('Promise no soportado - cargando polyfill');
    // Polyfill mínimo para dispositivos muy antiguos
    window.Promise = function() {
        console.log('Promise polyfill activado');
        return {
            then: function() { return this; },
            catch: function() { return this; }
        };
    };
}

